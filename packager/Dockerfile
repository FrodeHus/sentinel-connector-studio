FROM ubuntu:22.04

ARG TARGETARCH
ARG PWSH_VERSION=7.4.13

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 python3-pip git ca-certificates wget libicu70 && \
    rm -rf /var/lib/apt/lists/*

# Install PowerShell from GitHub releases (supports amd64 and arm64)
RUN case "$TARGETARCH" in \
        arm64) PWSH_ARCH="arm64" ;; \
        *)     PWSH_ARCH="x64" ;; \
    esac && \
    wget -q "https://github.com/PowerShell/PowerShell/releases/download/v${PWSH_VERSION}/powershell-${PWSH_VERSION}-linux-${PWSH_ARCH}.tar.gz" \
        -O /tmp/pwsh.tar.gz && \
    mkdir -p /opt/microsoft/powershell/7 && \
    tar zxf /tmp/pwsh.tar.gz -C /opt/microsoft/powershell/7 && \
    rm /tmp/pwsh.tar.gz && \
    chmod +x /opt/microsoft/powershell/7/pwsh && \
    ln -s /opt/microsoft/powershell/7/pwsh /usr/bin/pwsh

# Install PowerShell YAML module
RUN pwsh -Command "Install-Module -Name powershell-yaml -Force -Scope AllUsers"

# Sparse-clone only the packaging tool from Azure-Sentinel.
# Uses --depth=1 on master for a shallow, reliable fetch, then
# removes .git so the image is pinned to whatever master was at
# build time. Rebuild the image to pick up script updates.
RUN git clone --depth=1 --filter=blob:none --sparse \
        https://github.com/Azure/Azure-Sentinel.git /opt/azure-sentinel && \
    cd /opt/azure-sentinel && \
    git sparse-checkout set Tools/Create-Azure-Sentinel-Solution .script/package-automation && \
    rm -rf .git && \
    rm -rf /var/lib/apt/lists/*

# Make sentinel tools read-only at runtime
RUN chmod -R a-w /opt/azure-sentinel

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY app.py .

# Create non-root user with explicit UID for reproducibility
RUN useradd --create-home --shell /usr/sbin/nologin --uid 1001 packager && \
    chown -R packager:packager /app

USER packager

EXPOSE 8081

CMD ["python3", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8081", "--log-level", "warning"]
