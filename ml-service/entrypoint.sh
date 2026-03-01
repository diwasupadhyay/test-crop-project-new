#!/bin/bash
set -e

MODEL_FILE="/app/models/rf_model.pkl"
DATA_FILE="/app/data/raw/crop_prices.csv"

# Fetch data if not present
if [ ! -f "$DATA_FILE" ]; then
    echo "=== Data not found. Fetching from data.gov.in... ==="
    python src/data_loader.py
else
    echo "=== Data already exists, skipping fetch. ==="
fi

# Train model if not present
if [ ! -f "$MODEL_FILE" ]; then
    echo "=== Model not found. Training... ==="
    python src/train.py
else
    echo "=== Model already exists, skipping training. ==="
fi

echo "=== Starting Flask API... ==="
exec python api/app.py
