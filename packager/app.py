import asyncio
import hashlib
import json
import os
import re
import secrets
import shutil
import stat
import tempfile
import uuid
import zipfile
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path

from fastapi import FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

# ---------------------------------------------------------------------------
# Configuration — all values can be overridden via environment variables
# ---------------------------------------------------------------------------

SENTINEL_TOOLS_PATH = Path(os.getenv("SENTINEL_TOOLS_PATH", "/opt/azure-sentinel/Tools/Create-Azure-Sentinel-Solution"))
MAX_ZIP_SIZE = int(os.getenv("MAX_ZIP_SIZE_MB", "50")) * 1024 * 1024
MAX_UNCOMPRESSED_SIZE = int(os.getenv("MAX_UNCOMPRESSED_SIZE_MB", "200")) * 1024 * 1024
MAX_ZIP_ENTRIES = int(os.getenv("MAX_ZIP_ENTRIES", "500"))
JOB_TTL_SECONDS = int(os.getenv("JOB_TTL_SECONDS", str(30 * 60)))
PROCESS_TIMEOUT_SECONDS = int(os.getenv("PROCESS_TIMEOUT_SECONDS", "120"))
MAX_QUEUED_JOBS = int(os.getenv("MAX_QUEUED_JOBS", "20"))
UUID_RE_PATTERN = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"

_UUID_RE = re.compile(UUID_RE_PATTERN)

# ---------------------------------------------------------------------------
# Job model
# ---------------------------------------------------------------------------


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Job:
    __slots__ = (
        "job_id", "token_hash", "status", "work_dir",
        "result_path", "result_filename", "error", "created_at",
    )

    def __init__(self, job_id: str, token_hash: str, work_dir: str):
        self.job_id = job_id
        self.token_hash = token_hash  # store hash, not the raw token
        self.status = JobStatus.QUEUED
        self.work_dir = work_dir
        self.result_path: str | None = None
        self.result_filename: str = "solution-package.zip"
        self.error: str | None = None
        self.created_at = datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# In-memory state
# ---------------------------------------------------------------------------

jobs: dict[str, Job] = {}
job_queue: asyncio.Queue[str] = asyncio.Queue()

# ---------------------------------------------------------------------------
# Token hashing — we never store the raw token in memory
# ---------------------------------------------------------------------------


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------


def _validate_job_id(job_id: str) -> None:
    """Reject job IDs that aren't valid UUIDs to prevent path games."""
    if not _UUID_RE.match(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")


def _verify_token(job_id: str, authorization: str | None) -> Job:
    _validate_job_id(job_id)
    job = jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Missing or invalid authorization")
    token = authorization[len("Bearer "):]
    if not secrets.compare_digest(_hash_token(token), job.token_hash):
        raise HTTPException(status_code=403, detail="Invalid token")
    return job


# ---------------------------------------------------------------------------
# ZIP validation
# ---------------------------------------------------------------------------


def _validate_zip(zip_path: str) -> None:
    """Validate ZIP structure, safety, and size constraints."""
    if not zipfile.is_zipfile(zip_path):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid ZIP")

    with zipfile.ZipFile(zip_path, "r") as zf:
        entries = zf.infolist()

        if len(entries) > MAX_ZIP_ENTRIES:
            raise HTTPException(
                status_code=400,
                detail=f"ZIP has too many entries ({len(entries)}; max {MAX_ZIP_ENTRIES})",
            )

        total_uncompressed = 0
        names: list[str] = []

        for info in entries:
            name = info.filename
            names.append(name)

            # Path traversal check
            if ".." in name or name.startswith("/") or name.startswith("\\"):
                raise HTTPException(
                    status_code=400,
                    detail=f"ZIP contains unsafe path: {name}",
                )

            # Reject symlinks
            if stat.S_ISLNK(info.external_attr >> 16):
                raise HTTPException(
                    status_code=400,
                    detail=f"ZIP contains symbolic link: {name}",
                )

            # Decompression bomb guard
            total_uncompressed += info.file_size
            if total_uncompressed > MAX_UNCOMPRESSED_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"ZIP uncompressed size exceeds limit ({MAX_UNCOMPRESSED_SIZE // (1024*1024)}MB)",
                )

        # Must contain Data/Solution_*.json and SolutionMetadata.json
        has_solution_data = any(
            "/Data/Solution_" in n and n.endswith(".json") for n in names
        )
        has_metadata = any(n.endswith("SolutionMetadata.json") for n in names)

        if not has_solution_data:
            raise HTTPException(
                status_code=400,
                detail="ZIP must contain a Data/Solution_<name>.json file",
            )
        if not has_metadata:
            raise HTTPException(
                status_code=400,
                detail="ZIP must contain a SolutionMetadata.json file",
            )


# ---------------------------------------------------------------------------
# Cleanup helpers
# ---------------------------------------------------------------------------


def _cleanup_job_files(job: Job) -> None:
    """Remove a job's working directory from disk."""
    if job.work_dir and os.path.exists(job.work_dir):
        shutil.rmtree(job.work_dir, ignore_errors=True)
    job.work_dir = ""
    job.result_path = None


def _remove_job(job_id: str) -> None:
    """Remove a job entirely — files + memory."""
    job = jobs.pop(job_id, None)
    if job:
        _cleanup_job_files(job)


# ---------------------------------------------------------------------------
# Job processing
# ---------------------------------------------------------------------------


async def _process_job(job: Job) -> None:
    """Run createSolutionV3.ps1 on the job's extracted ZIP.

    The script expects the working tree to contain a ``Solutions/<name>/``
    directory.  It looks for the literal substring ``Solutions`` inside the
    ``BasePath`` value from ``Data/Solution_*.json`` and derives the
    repository root from that.  We therefore place the extracted content
    under ``<work_dir>/Solutions/<name>/`` and rewrite ``BasePath``
    accordingly.
    """
    job.status = JobStatus.RUNNING
    work_dir = Path(job.work_dir)

    try:
        zip_path = work_dir / "input.zip"

        # Extract ZIP
        extract_dir = work_dir / "extracted"
        extract_dir.mkdir(mode=0o700)
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_dir)

        # Remove the input ZIP immediately — no longer needed
        zip_path.unlink(missing_ok=True)

        # Detect solution root folder (first directory in the ZIP)
        entries = list(extract_dir.iterdir())
        if len(entries) == 1 and entries[0].is_dir():
            solution_root = entries[0]
        else:
            solution_root = extract_dir
        solution_name = solution_root.name

        # Validate Data/ exists and has a Solution_*.json
        data_dir = solution_root / "Data"
        if not data_dir.exists():
            raise RuntimeError("Data/ directory not found in extracted ZIP")

        solution_data_files = list(data_dir.glob("Solution_*.json"))
        if not solution_data_files:
            raise RuntimeError("No Solution_*.json found in Data/")

        # ------------------------------------------------------------------
        # Build the directory tree that createSolutionV3.ps1 expects.
        #
        # The script parses BasePath looking for the substring "Solutions"
        # and uses its position to derive a "repository base path".  It
        # then dot-sources helper scripts at:
        #   <repo_base>/Tools/Create-Azure-Sentinel-Solution/common/commonFunctions.ps1
        #   <repo_base>/Tools/Create-Azure-Sentinel-Solution/common/get-ccp-details.ps1
        #   <repo_base>/.script/package-automation/catalogAPI.ps1
        #
        # We mirror this layout inside the work dir:
        #   <work_dir>/Solutions/<solution_name>/   ← solution content
        #   <work_dir>/Tools/...                    ← symlink to /opt/azure-sentinel/Tools
        #   <work_dir>/.script/...                  ← symlink to /opt/azure-sentinel/.script
        # ------------------------------------------------------------------
        solutions_base = work_dir / "Solutions"
        solution_work_dir = solutions_base / solution_name
        shutil.copytree(solution_root, solution_work_dir)

        # Clean up extracted dir now that we've copied into the layout
        shutil.rmtree(extract_dir, ignore_errors=True)

        # Symlink repo directories so the script can resolve its helper
        # scripts relative to the derived repository base path.
        REPO_ROOT = SENTINEL_TOOLS_PATH.parent.parent  # /opt/azure-sentinel
        (work_dir / "Tools").symlink_to(REPO_ROOT / "Tools")
        (work_dir / ".script").symlink_to(REPO_ROOT / ".script")

        # The packaging script calls git (e.g. for metadata). Initialize a
        # minimal git repo so those calls don't fail.
        git_proc = await asyncio.create_subprocess_exec(
            "git", "init", "-q",
            cwd=str(work_dir),
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        await git_proc.wait()

        # Pre-create the Package output directory
        (solution_work_dir / "Package").mkdir(exist_ok=True)

        # Rewrite BasePath in Solution_*.json to the container path
        work_data_dir = solution_work_dir / "Data"
        for sol_file in work_data_dir.glob("Solution_*.json"):
            with open(sol_file, "r") as f:
                sol_data = json.load(f)
            sol_data["BasePath"] = str(solution_work_dir)
            with open(sol_file, "w") as f:
                json.dump(sol_data, f, indent=2)

        # ------------------------------------------------------------------
        # Run createSolutionV3.ps1
        # ------------------------------------------------------------------
        script_path = SENTINEL_TOOLS_PATH / "V3" / "createSolutionV3.ps1"

        proc = await asyncio.create_subprocess_exec(
            "pwsh", "-NoProfile", "-NonInteractive", "-File",
            str(script_path),
            "-SolutionDataFolderPath", str(work_data_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(work_dir),
        )
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(), timeout=PROCESS_TIMEOUT_SECONDS
        )

        if proc.returncode != 0:
            output = (stdout.decode() + "\n" + stderr.decode()).strip()
            raise RuntimeError(f"PowerShell script failed (exit {proc.returncode}):\n{output}")

        # ------------------------------------------------------------------
        # Verify packaging produced mainTemplate.json
        # ------------------------------------------------------------------
        package_dir = solution_work_dir / "Package"
        main_template = package_dir / "mainTemplate.json"

        if not main_template.exists():
            # Fallback: search the entire work tree
            for mt in work_dir.rglob("mainTemplate.json"):
                main_template = mt
                break

        if not main_template.exists():
            stdout_text = stdout.decode().strip()
            raise RuntimeError(
                f"mainTemplate.json not found after packaging.\nScript output:\n{stdout_text}"
            )

        # ------------------------------------------------------------------
        # Bundle the entire solution directory (including Package/) as ZIP
        # ------------------------------------------------------------------
        result_zip_path = work_dir / "result.zip"
        with zipfile.ZipFile(result_zip_path, "w", zipfile.ZIP_DEFLATED) as result_zip:
            for file_path in solution_work_dir.rglob("*"):
                if file_path.is_file():
                    arcname = str(file_path.relative_to(solutions_base))
                    result_zip.write(file_path, arcname)

        # Clean up the large working tree; keep only result.zip
        shutil.rmtree(solutions_base, ignore_errors=True)

        job.result_path = str(result_zip_path)
        job.result_filename = f"{solution_name}.zip"
        job.status = JobStatus.COMPLETED

    except asyncio.TimeoutError:
        job.status = JobStatus.FAILED
        job.error = f"Job timed out after {PROCESS_TIMEOUT_SECONDS}s"
    except Exception as e:
        job.status = JobStatus.FAILED
        job.error = str(e)


# ---------------------------------------------------------------------------
# Background tasks
# ---------------------------------------------------------------------------


async def _worker() -> None:
    """Single background worker that processes jobs sequentially."""
    while True:
        job_id = await job_queue.get()
        job = jobs.get(job_id)
        if job is not None:
            await _process_job(job)
        job_queue.task_done()


async def _cleanup_expired_jobs() -> None:
    """Periodically remove expired jobs and their files."""
    while True:
        await asyncio.sleep(60)
        now = datetime.now(timezone.utc)
        expired = [
            jid for jid, j in jobs.items()
            if (now - j.created_at).total_seconds() > JOB_TTL_SECONDS
        ]
        for jid in expired:
            _remove_job(jid)


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(_app: FastAPI):
    worker_task = asyncio.create_task(_worker())
    cleanup_task = asyncio.create_task(_cleanup_expired_jobs())
    yield
    worker_task.cancel()
    cleanup_task.cancel()
    # Clean up all remaining jobs on shutdown
    for jid in list(jobs.keys()):
        _remove_job(jid)


app = FastAPI(title="Sentinel Solution Packager", lifespan=lifespan)

# ---------------------------------------------------------------------------
# Security middleware — add common security headers
# ---------------------------------------------------------------------------


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Content-Security-Policy"] = "default-src 'none'"
    return response


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/jobs", status_code=202)
async def create_job(file: UploadFile = File(...)) -> dict:
    # Rate-limit: reject if too many jobs already queued
    if job_queue.qsize() >= MAX_QUEUED_JOBS:
        raise HTTPException(status_code=503, detail="Too many jobs queued; try again later")

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_ZIP_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large (max {MAX_ZIP_SIZE // (1024*1024)}MB)",
        )

    # Write to temp dir with restrictive permissions
    work_dir = tempfile.mkdtemp(prefix="packager-")
    os.chmod(work_dir, 0o700)
    zip_path = os.path.join(work_dir, "input.zip")
    with open(
        os.open(zip_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "wb"
    ) as f:
        f.write(contents)

    # Validate ZIP structure
    try:
        _validate_zip(zip_path)
    except HTTPException:
        shutil.rmtree(work_dir, ignore_errors=True)
        raise

    job_id = str(uuid.uuid4())
    token = secrets.token_urlsafe(32)
    job = Job(job_id=job_id, token_hash=_hash_token(token), work_dir=work_dir)
    jobs[job_id] = job

    await job_queue.put(job_id)

    return {"job_id": job_id, "token": token, "status": job.status.value}


@app.get("/jobs/{job_id}")
async def get_job_status(
    job_id: str,
    authorization: str | None = Header(default=None),
) -> dict:
    job = _verify_token(job_id, authorization)
    response: dict = {
        "job_id": job.job_id,
        "status": job.status.value,
        "created_at": job.created_at.isoformat(),
    }
    if job.error:
        response["error"] = job.error
    return response


@app.get("/jobs/{job_id}/result")
async def get_job_result(
    job_id: str,
    authorization: str | None = Header(default=None),
) -> FileResponse:
    job = _verify_token(job_id, authorization)

    if job.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=409,
            detail=f"Job is not completed (status: {job.status.value})",
        )

    if not job.result_path or not os.path.exists(job.result_path):
        raise HTTPException(status_code=404, detail="Result file not found")

    return FileResponse(
        path=job.result_path,
        media_type="application/zip",
        filename=job.result_filename,
        background=BackgroundTask(_remove_job, job_id),
    )
