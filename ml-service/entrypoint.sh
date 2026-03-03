#!/bin/bash
set -e

MODEL_FILE="/app/models/rf_model.pkl"
ENCODERS_FILE="/app/models/encoders.pkl"
DATA_FILE="/app/data/raw/crop_prices.csv"

# Fix volume permissions — Docker named volumes may be root-owned from
# a previous run, but training needs to write model files.
chown -R appuser:appgroup /app/data /app/models 2>/dev/null || true

# ── Step 1: Restore model from MongoDB if not on disk ─────────
# This is the key optimization for free-tier hosting (Render/Railway).
# Ephemeral filesystems lose model files on sleep/redeploy, but
# MongoDB persists them. This avoids expensive retraining on every wake.
if [ ! -f "$MODEL_FILE" ] || [ ! -f "$ENCODERS_FILE" ]; then
    echo "=== Model not on disk. Attempting restore from MongoDB... ==="
    gosu appuser python -c "
import sys; sys.path.insert(0, 'src')
try:
    from db import restore_all_artifacts
    ok = restore_all_artifacts()
    print('Model restore:', 'SUCCESS' if ok else 'NOT FOUND in MongoDB')
except Exception as e:
    print(f'Model restore failed: {e}')
" || echo "=== MongoDB restore skipped (not configured). ==="
fi

# ── Step 2: Fetch data if not present ─────────────────────────
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

# ── Step 3: Only train if no model exists (neither disk nor MongoDB had one)
if [ ! -f "$MODEL_FILE" ]; then
    echo "=== Model not found anywhere. Training initial model... ==="
    gosu appuser python src/train.py
    echo "=== Initial model trained. Saving to MongoDB for persistence... ==="
    gosu appuser python -c "
import sys; sys.path.insert(0, 'src')
try:
    from db import save_all_artifacts
    save_all_artifacts()
except Exception as e:
    print(f'Warning: Could not save model to MongoDB: {e}')
" || echo "=== MongoDB save skipped. ==="
else
    echo "=== Model exists. Skipping training. Use Admin Panel to retrain. ==="
fi

# Use $PORT if set by cloud platform (Render/Railway), else default to 5001
GUNICORN_PORT=${PORT:-5001}
echo "=== Starting Gunicorn on port ${GUNICORN_PORT} as appuser... ==="
exec gosu appuser gunicorn --bind 0.0.0.0:${GUNICORN_PORT} --workers 1 --threads 2 --timeout 300 --access-logfile - api.app:app
