FROM python:3.10-slim
WORKDIR /app

# Copy pre-downloaded wheels and install (offline first, online fallback for any missing)
COPY wheels/ /tmp/wheels/
COPY requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/tmp/wheels/ -r requirements.txt 2>/dev/null \
    || pip install --no-cache-dir --find-links=/tmp/wheels/ -r requirements.txt; \
    rm -rf /tmp/wheels/

# Create non-root user for security + install gosu for privilege drop
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser \
    && apt-get update && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/*

COPY . .
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# Model version — passed by Jenkins as the git commit hash.
# When code changes, the new hash triggers retraining inside entrypoint.sh.
ARG MODEL_VERSION=dev
ENV MODEL_VERSION=${MODEL_VERSION}

# Prevent matplotlib from trying to write to a missing home directory
ENV MPLCONFIGDIR=/tmp/matplotlib

# Ensure writable dirs for volumes (data/models are Docker named volumes)
RUN mkdir -p /app/data /app/models && chown -R appuser:appgroup /app

# NOTE: We do NOT set USER here. The entrypoint runs as root to fix
# volume permissions (named volumes may be root-owned), then starts
# gunicorn as the non-root appuser via gunicorn's --user flag.
EXPOSE 5001
CMD ["bash", "entrypoint.sh"]