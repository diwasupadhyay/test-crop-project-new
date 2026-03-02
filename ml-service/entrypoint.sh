#!/bin/bash
set -e

MODEL_FILE="/app/models/rf_model.pkl"
DATA_FILE="/app/data/raw/crop_prices.csv"

# Fix volume permissions — Docker named volumes may be root-owned from
# a previous run, but training needs to write model files.
chown -R appuser:appgroup /app/data /app/models 2>/dev/null || true

# Fetch data if not present
if [ ! -f "$DATA_FILE" ]; then
    echo "=== Data not found locally. Checking MongoDB / fetching... ==="
    gosu appuser python src/init_data.py || {
        echo "=== MongoDB init failed. Falling back to API fetch... ==="
        gosu appuser python src/data_loader.py
    }
else
    echo "=== Local data exists. Syncing to MongoDB if needed... ==="
    gosu appuser python src/init_data.py || echo "=== MongoDB sync skipped (not configured). ==="
fi

# Only train if no model exists at all. Use the Admin Panel retrain button for updates.
if [ ! -f "$MODEL_FILE" ]; then
    echo "=== Model not found. Training initial model... ==="
    gosu appuser python src/train.py
    echo "=== Initial model trained. ==="
else
    echo "=== Model exists. Skipping training. Use Admin Panel to retrain. ==="
fi

echo "=== Starting Gunicorn (production WSGI server) as appuser... ==="
exec gosu appuser gunicorn --bind 0.0.0.0:5001 --workers 1 --threads 2 --timeout 120 --access-logfile - api.app:app
