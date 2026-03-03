FROM python:3.10-slim
WORKDIR /app

# Install Python dependencies from PyPI.
# (Pre-downloaded wheels in wheels/ are a Jenkins/offline optimization,
#  but cloud platforms like Render/Railway have internet during build.)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user for security + install gosu for privilege drop
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser \
    && apt-get update && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/*

COPY . .
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# Prevent matplotlib from trying to write to a missing home directory
ENV MPLCONFIGDIR=/tmp/matplotlib

# Ensure writable dirs for volumes (data/models are Docker named volumes)
RUN mkdir -p /app/data /app/models && chown -R appuser:appgroup /app

# NOTE: We do NOT set USER here. The entrypoint runs as root to fix
# volume permissions (named volumes may be root-owned), then starts
# gunicorn as the non-root appuser via gosu.
# PORT is set dynamically by Render/Railway; defaults to 5001.
EXPOSE ${PORT:-5001}
CMD ["bash", "entrypoint.sh"]