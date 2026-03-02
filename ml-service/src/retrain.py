"""
Retrain module — fetches fresh data from the government API,
merges it with existing data (preserving history), backs up
previous artifacts, and triggers a full model retrain.
"""

import os
import sys
import shutil
import datetime
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_loader import fetch_all_records, OUTPUT_FILE, OUTPUT_DIR
from preprocessing import preprocess
from train import train_model, MODEL_FILE, MODELS_DIR

BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'backups')
ENCODERS_FILE = os.path.join(MODELS_DIR, 'encoders.pkl')


def _timestamp():
    return datetime.datetime.now().strftime('%Y%m%d_%H%M%S')


def backup_current_artifacts():
    """Back up the current model, encoders and dataset before retraining."""
    ts = _timestamp()
    backup_path = os.path.join(BACKUP_DIR, ts)
    os.makedirs(backup_path, exist_ok=True)

    backed_up = []

    # Backup model
    if os.path.exists(MODEL_FILE):
        dest = os.path.join(backup_path, 'rf_model.pkl')
        shutil.copy2(MODEL_FILE, dest)
        backed_up.append('rf_model.pkl')

    # Backup encoders
    if os.path.exists(ENCODERS_FILE):
        dest = os.path.join(backup_path, 'encoders.pkl')
        shutil.copy2(ENCODERS_FILE, dest)
        backed_up.append('encoders.pkl')

    # Backup dataset
    if os.path.exists(OUTPUT_FILE):
        dest = os.path.join(backup_path, 'crop_prices.csv')
        shutil.copy2(OUTPUT_FILE, dest)
        backed_up.append('crop_prices.csv')

    print(f"Backup created at: {backup_path}")
    print(f"  Files backed up: {backed_up}")
    return backup_path, backed_up


def fetch_and_merge_data():
    """
    Fetch fresh records from data.gov.in, merge with existing CSV
    (deduplicating), and save the combined dataset.

    Returns:
        dict with stats about old, new, and merged row counts.
    """
    # Load existing data if present
    old_count = 0
    if os.path.exists(OUTPUT_FILE):
        existing_df = pd.read_csv(OUTPUT_FILE)
        old_count = len(existing_df)
        print(f"Existing dataset: {old_count} rows")
    else:
        existing_df = pd.DataFrame()
        print("No existing dataset found — will create a fresh one.")

    # Fetch new records from government API
    print("\nFetching fresh data from data.gov.in ...")
    new_records = fetch_all_records()
    new_df = pd.DataFrame(new_records)
    new_count = len(new_df)
    print(f"New records fetched: {new_count}")

    # Merge (concat + dedup)
    if not existing_df.empty:
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
        # Deduplicate on key columns if they exist
        dedup_cols = [c for c in ['state', 'district', 'market', 'commodity',
                                   'variety', 'arrival_date', 'modal_price']
                      if c in combined_df.columns]
        if dedup_cols:
            before_dedup = len(combined_df)
            combined_df = combined_df.drop_duplicates(subset=dedup_cols, keep='last')
            dupes_removed = before_dedup - len(combined_df)
            print(f"Duplicates removed: {dupes_removed}")
        else:
            dupes_removed = 0
    else:
        combined_df = new_df
        dupes_removed = 0

    merged_count = len(combined_df)

    # Save merged dataset
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    combined_df.to_csv(OUTPUT_FILE, index=False)
    print(f"Merged dataset saved: {merged_count} rows → {OUTPUT_FILE}")

    return {
        "old_rows": old_count,
        "new_rows_fetched": new_count,
        "duplicates_removed": dupes_removed,
        "merged_rows": merged_count,
    }


def full_retrain():
    """
    End-to-end retrain pipeline:
      1. Backup existing artifacts
      2. Fetch new data and merge with existing
      3. Preprocess + train new model

    Returns a summary dict.
    """
    summary = {"steps": []}

    # Step 1 — backup
    print("\n" + "=" * 60)
    print("STEP 1: BACKUP EXISTING ARTIFACTS")
    print("=" * 60)
    try:
        backup_path, backed_up = backup_current_artifacts()
        summary["backup"] = {"path": backup_path, "files": backed_up}
        summary["steps"].append({"step": "backup", "status": "success"})
    except Exception as e:
        summary["steps"].append({"step": "backup", "status": "failed", "error": str(e)})
        print(f"Backup failed: {e}")
        # Non-fatal — continue

    # Step 2 — fetch & merge
    print("\n" + "=" * 60)
    print("STEP 2: FETCH NEW DATA & MERGE")
    print("=" * 60)
    try:
        merge_stats = fetch_and_merge_data()
        summary["data"] = merge_stats
        summary["steps"].append({"step": "fetch_merge", "status": "success"})
    except Exception as e:
        summary["steps"].append({"step": "fetch_merge", "status": "failed", "error": str(e)})
        print(f"Data fetch/merge failed: {e}")
        return summary  # Can't continue without data

    # Step 3 — retrain
    print("\n" + "=" * 60)
    print("STEP 3: RETRAIN MODEL")
    print("=" * 60)
    try:
        train_model()
        summary["steps"].append({"step": "train", "status": "success"})
    except Exception as e:
        summary["steps"].append({"step": "train", "status": "failed", "error": str(e)})
        print(f"Training failed: {e}")

    return summary


if __name__ == "__main__":
    result = full_retrain()
    print("\n\nFinal Summary:")
    for step in result["steps"]:
        print(f"  {step['step']}: {step['status']}")
