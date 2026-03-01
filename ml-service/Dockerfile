FROM python:3.10-slim
WORKDIR /app

# Copy pre-downloaded wheels and install (offline first, online fallback for any missing)
COPY wheels/ /tmp/wheels/
COPY requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/tmp/wheels/ -r requirements.txt 2>/dev/null \
    || pip install --no-cache-dir --find-links=/tmp/wheels/ -r requirements.txt; \
    rm -rf /tmp/wheels/

# Create non-root user for security
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

COPY . .
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# Model version — passed by Jenkins as the git commit hash.
# When code changes, the new hash triggers retraining inside entrypoint.sh.
ARG MODEL_VERSION=dev
ENV MODEL_VERSION=${MODEL_VERSION}

# Ensure writable dirs for volumes (data/models are Docker named volumes)
RUN mkdir -p /app/data /app/models && chown -R appuser:appgroup /app

USER appuser
EXPOSE 5001
CMD ["bash", "entrypoint.sh"]