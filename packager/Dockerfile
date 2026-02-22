FROM mcr.microsoft.com/powershell:7.4-ubuntu-22.04

# Install Python 3 and pip
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip git && \
    rm -rf /var/lib/apt/lists/*

# Install PowerShell YAML module
RUN pwsh -Command "Install-Module -Name powershell-yaml -Force -Scope AllUsers"

# Sparse-clone only the packaging tool from Azure-Sentinel
# Pinned to a specific commit for stability
ARG SENTINEL_COMMIT=5d1f5a8eb67910b6f144a99bbf60984d15e36514
RUN git clone --no-checkout --filter=blob:none \
        https://github.com/Azure/Azure-Sentinel.git /opt/azure-sentinel && \
    cd /opt/azure-sentinel && \
    git sparse-checkout init --cone && \
    git sparse-checkout set Tools/Create-Azure-Sentinel-Solution && \
    git checkout ${SENTINEL_COMMIT} && \
    rm -rf .git

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY app.py .

# Create non-root user
RUN useradd --create-home --shell /bin/bash packager && \
    chown -R packager:packager /app /opt/azure-sentinel
USER packager

EXPOSE 8081

CMD ["python3", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8081"]
