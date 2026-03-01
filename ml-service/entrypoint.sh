#!/bin/bash
set -e

MODEL_FILE="/app/models/rf_model.pkl"
DATA_FILE="/app/data/raw/crop_prices.csv"
VERSION_FILE="/app/models/.model_version"

# MODEL_VERSION is baked into the image at build time (see Dockerfile ARG).
# When the code changes, Jenkins passes a new version (e.g. git commit hash),
# which triggers a retrain even if a model already exists in the volume.
CURRENT_VERSION="${MODEL_VERSION:-unknown}"

# Check if retraining is needed
NEED_RETRAIN=false
if [ ! -f "$MODEL_FILE" ]; then
    echo "=== Model not found. Will train. ==="
    NEED_RETRAIN=true
elif [ ! -f "$VERSION_FILE" ]; then
    echo "=== No version stamp found. Will retrain to match current code. ==="
    NEED_RETRAIN=true
elif [ "$(cat $VERSION_FILE)" != "$CURRENT_VERSION" ]; then
    echo "=== Code version changed ($(cat $VERSION_FILE) -> $CURRENT_VERSION). Will retrain. ==="
    NEED_RETRAIN=true
else
    echo "=== Model is up-to-date (version: $CURRENT_VERSION). Skipping training. ==="
fi

# Fetch data if not present
if [ ! -f "$DATA_FILE" ]; then
    echo "=== Data not found. Fetching from data.gov.in... ==="
    python src/data_loader.py
else
    echo "=== Data already exists, skipping fetch. ==="
fi

# Train model if needed
if [ "$NEED_RETRAIN" = true ]; then
    echo "=== Training model... ==="
    python src/train.py
    echo "$CURRENT_VERSION" > "$VERSION_FILE"
    echo "=== Model trained and version stamped: $CURRENT_VERSION ==="
fi

echo "=== Starting Gunicorn (production WSGI server)... ==="
exec gunicorn --bind 0.0.0.0:5001 --workers 2 --timeout 120 --access-logfile - api.app:app
