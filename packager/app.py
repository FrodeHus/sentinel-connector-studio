import asyncio
import glob
import json
import os
import secrets
import shutil
import tempfile
import uuid
import zipfile
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse

app = FastAPI(title="Sentinel Solution Packager")

SENTINEL_TOOLS_PATH = Path("/opt/azure-sentinel/Tools/Create-Azure-Sentinel-Solution")
MAX_ZIP_SIZE = 50 * 1024 * 1024  # 50 MB
JOB_TTL_SECONDS = 30 * 60  # 30 minutes
PROCESS_TIMEOUT_SECONDS = 120


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Job:
    def __init__(self, job_id: str, token: str, work_dir: str):
        self.job_id = job_id
        self.token = token
        self.status = JobStatus.QUEUED
        self.work_dir = work_dir
        self.result_path: str | None = None
        self.error: str | None = None
        self.created_at = datetime.now(timezone.utc)


# In-memory job store
jobs: dict[str, Job] = {}
job_queue: asyncio.Queue[str] = asyncio.Queue()


def _verify_token(job_id: str, authorization: str | None) -> Job:
    job = jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Missing or invalid authorization")
    token = authorization[len("Bearer "):]
    if not secrets.compare_digest(token, job.token):
        raise HTTPException(status_code=403, detail="Invalid token")
    return job


def _validate_zip(zip_path: str) -> None:
    """Validate ZIP structure and safety."""
    if not zipfile.is_zipfile(zip_path):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid ZIP")

    with zipfile.ZipFile(zip_path, "r") as zf:
        names = zf.namelist()

        # Path traversal check
        for name in names:
            if ".." in name or name.startswith("/"):
                raise HTTPException(
                    status_code=400,
                    detail=f"ZIP contains unsafe path: {name}",
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


async def _process_job(job: Job) -> None:
    """Run createSolutionV3.ps1 on the job's extracted ZIP."""
    job.status = JobStatus.RUNNING
    work_dir = Path(job.work_dir)

    try:
        zip_path = work_dir / "input.zip"

        # Extract ZIP
        extract_dir = work_dir / "extracted"
        extract_dir.mkdir()
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_dir)

        # Detect solution root folder (first directory in the ZIP)
        entries = list(extract_dir.iterdir())
        if len(entries) == 1 and entries[0].is_dir():
            solution_root = entries[0]
        else:
            solution_root = extract_dir
        solution_name = solution_root.name

        # Find the Solution_*.json data file
        data_dir = solution_root / "Data"
        if not data_dir.exists():
            raise RuntimeError("Data/ directory not found in extracted ZIP")

        solution_data_files = list(data_dir.glob("Solution_*.json"))
        if not solution_data_files:
            raise RuntimeError("No Solution_*.json found in Data/")

        # Set up working area mirroring Azure-Sentinel/Solutions/<name>/
        solutions_base = work_dir / "Solutions"
        solution_work_dir = solutions_base / solution_name
        shutil.copytree(solution_root, solution_work_dir)

        # Rewrite BasePath in Solution_*.json to point to container path
        work_data_dir = solution_work_dir / "Data"
        for sol_file in work_data_dir.glob("Solution_*.json"):
            with open(sol_file, "r") as f:
                sol_data = json.load(f)
            sol_data["BasePath"] = str(solutions_base / solution_name)
            with open(sol_file, "w") as f:
                json.dump(sol_data, f, indent=2)

        # Run createSolutionV3.ps1 using execFile-style (no shell)
        script_path = SENTINEL_TOOLS_PATH / "V3" / "createSolutionV3.ps1"

        proc = await asyncio.create_subprocess_exec(
            "pwsh", "-NoProfile", "-NonInteractive", "-File",
            str(script_path),
            "-SolutionDataFolderPath", str(work_data_dir),
            "-VersionMode", "local",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(SENTINEL_TOOLS_PATH / "V3"),
        )
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(), timeout=PROCESS_TIMEOUT_SECONDS
        )

        if proc.returncode != 0:
            output = (stdout.decode() + "\n" + stderr.decode()).strip()
            raise RuntimeError(f"PowerShell script failed (exit {proc.returncode}):\n{output}")

        # Find output files
        package_dir = solution_work_dir / "Package"
        main_template = package_dir / "mainTemplate.json"
        create_ui = package_dir / "createUiDefinition.json"

        if not main_template.exists():
            # Try searching more broadly
            found = glob.glob(str(work_dir / "**" / "mainTemplate.json"), recursive=True)
            if found:
                main_template = Path(found[0])
                create_ui = main_template.parent / "createUiDefinition.json"

        if not main_template.exists():
            stdout_text = stdout.decode().strip()
            raise RuntimeError(
                f"mainTemplate.json not found after packaging.\nScript output:\n{stdout_text}"
            )

        # Create result ZIP
        result_zip_path = work_dir / "result.zip"
        with zipfile.ZipFile(result_zip_path, "w", zipfile.ZIP_DEFLATED) as result_zip:
            result_zip.write(main_template, "mainTemplate.json")
            if create_ui.exists():
                result_zip.write(create_ui, "createUiDefinition.json")

        job.result_path = str(result_zip_path)
        job.status = JobStatus.COMPLETED

    except asyncio.TimeoutError:
        job.status = JobStatus.FAILED
        job.error = f"Job timed out after {PROCESS_TIMEOUT_SECONDS}s"
    except Exception as e:
        job.status = JobStatus.FAILED
        job.error = str(e)


async def _worker() -> None:
    """Single background worker that processes jobs sequentially."""
    while True:
        job_id = await job_queue.get()
        job = jobs.get(job_id)
        if job is None:
            continue
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
            job = jobs.pop(jid, None)
            if job and os.path.exists(job.work_dir):
                shutil.rmtree(job.work_dir, ignore_errors=True)


@app.on_event("startup")
async def startup() -> None:
    asyncio.create_task(_worker())
    asyncio.create_task(_cleanup_expired_jobs())


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/jobs", status_code=202)
async def create_job(file: UploadFile = File(...)) -> dict:
    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_ZIP_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_ZIP_SIZE // (1024*1024)}MB)")

    # Write to temp dir
    work_dir = tempfile.mkdtemp(prefix="packager-")
    zip_path = os.path.join(work_dir, "input.zip")
    with open(zip_path, "wb") as f:
        f.write(contents)

    # Validate ZIP structure
    try:
        _validate_zip(zip_path)
    except HTTPException:
        shutil.rmtree(work_dir, ignore_errors=True)
        raise

    job_id = str(uuid.uuid4())
    token = secrets.token_urlsafe(32)
    job = Job(job_id=job_id, token=token, work_dir=work_dir)
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
        filename="deployable-template.zip",
    )
