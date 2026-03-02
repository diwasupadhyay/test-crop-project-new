"""
Retrain module — fetches fresh data from the government API,
merges it with existing data (preserving history), backs up
previous artifacts, and triggers a full model retrain.

Uses MongoDB as the primary data store with CSV as fallback.
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

# MongoDB available flag — set on first attempt
_mongo_available = None


def _check_mongo():
    """Test if MongoDB is reachable. Result is cached."""
    global _mongo_available
    if _mongo_available is not None:
        return _mongo_available
    try:
        from db import get_db
        get_db()
        _mongo_available = True
    except Exception:
        _mongo_available = False
    return _mongo_available


def _timestamp():
    return datetime.datetime.now().strftime('%Y%m%d_%H%M%S')


def backup_current_artifacts():
    """Back up the current model, encoders and dataset before retraining."""
    ts = _timestamp()
    backup_path = os.path.join(BACKUP_DIR, ts)
    os.makedirs(backup_path, exist_ok=True)

    backed_up = []
    row_count = 0

    # Backup model
    if os.path.exists(MODEL_FILE):
        shutil.copy2(MODEL_FILE, os.path.join(backup_path, 'rf_model.pkl'))
        backed_up.append('rf_model.pkl')

    # Backup encoders
    if os.path.exists(ENCODERS_FILE):
        shutil.copy2(ENCODERS_FILE, os.path.join(backup_path, 'encoders.pkl'))
        backed_up.append('encoders.pkl')

    # Export current dataset to CSV backup
    if _check_mongo():
        try:
            from db import get_collection, CROP_PRICES, DATASET_BACKUPS
            col = get_collection(CROP_PRICES)
            data = list(col.find({}, {'_id': 0}))
            if data:
                df = pd.DataFrame(data)
                df.to_csv(os.path.join(backup_path, 'crop_prices.csv'), index=False)
                backed_up.append('crop_prices.csv')
                row_count = len(df)

            # Store backup metadata in MongoDB
            get_collection(DATASET_BACKUPS).insert_one({
                'timestamp': datetime.datetime.now(),
                'backup_name': ts,
                'backup_path': backup_path,
                'files': backed_up,
                'row_count': row_count,
            })
        except Exception as e:
            print(f"  Warning: MongoDB backup export failed: {e}")
            # Fall through to CSV fallback below

    # CSV fallback — copy existing file if not already backed up
    if 'crop_prices.csv' not in backed_up and os.path.exists(OUTPUT_FILE):
        shutil.copy2(OUTPUT_FILE, os.path.join(backup_path, 'crop_prices.csv'))
        backed_up.append('crop_prices.csv')

    print(f"Backup created at: {backup_path}")
    print(f"  Files backed up: {backed_up}")
    return backup_path, backed_up


def fetch_and_merge_data():
    """
    Fetch fresh records from data.gov.in, merge with existing data
    (deduplicating), and save the combined dataset.

    Uses MongoDB upsert for merge when available, CSV concat as fallback.

    Returns:
        dict with stats about old, new, and merged row counts.
    """
    if _check_mongo():
        return _fetch_and_merge_mongodb()
    else:
        return _fetch_and_merge_csv()


def _fetch_and_merge_mongodb():
    """MongoDB-based fetch and merge — upsert new records, dedup via unique index."""
    from db import get_collection, CROP_PRICES, normalize_record, ensure_indexes
    from pymongo import UpdateOne

    # Ensure indexes exist (idempotent)
    ensure_indexes()

    col = get_collection(CROP_PRICES)
    old_count = col.estimated_document_count()
    print(f"Existing dataset (MongoDB): {old_count} rows")

    # Fetch new records from government API
    print("\nFetching fresh data from data.gov.in ...")
    new_records = fetch_all_records()
    new_count = len(new_records)
    print(f"New records fetched: {new_count}")

    # Normalize and upsert into MongoDB — new data wins for existing keys
    ops = []
    for raw_record in new_records:
        record = normalize_record(raw_record)
        filter_key = {
            'state': record.get('state', ''),
            'district': record.get('district', ''),
            'market': record.get('market', ''),
            'commodity': record.get('commodity', ''),
            'variety': record.get('variety', ''),
            'arrival_date': record.get('arrival_date', ''),
        }
        ops.append(UpdateOne(filter_key, {'$set': record}, upsert=True))

    upserted = 0
    modified = 0
    if ops:
        result = col.bulk_write(ops, ordered=False)
        upserted = result.upserted_count
        modified = result.modified_count
        print(f"  Upserted: {upserted} new, {modified} updated")

    merged_count = col.estimated_document_count()
    print(f"Total dataset after merge: {merged_count} rows")

    return {
        "old_rows": old_count,
        "new_rows_fetched": new_count,
        "upserted": upserted,
        "updated": modified,
        "merged_rows": merged_count,
    }


def _fetch_and_merge_csv():
    """CSV-based fetch and merge — fallback when MongoDB is unavailable."""
    old_count = 0
    if os.path.exists(OUTPUT_FILE):
        existing_df = pd.read_csv(OUTPUT_FILE)
        old_count = len(existing_df)
        print(f"Existing dataset (CSV): {old_count} rows")
    else:
        existing_df = pd.DataFrame()
        print("No existing dataset found — will create a fresh one.")

    # Fetch new records
    print("\nFetching fresh data from data.gov.in ...")
    new_records = fetch_all_records()
    new_df = pd.DataFrame(new_records)
    new_count = len(new_df)
    print(f"New records fetched: {new_count}")

    # Merge (concat + dedup)
    if not existing_df.empty:
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
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
    start_time = datetime.datetime.now()

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

    summary["duration_seconds"] = round(
        (datetime.datetime.now() - start_time).total_seconds(), 1
    )

    return summary


if __name__ == "__main__":
    result = full_retrain()
    print("\n\nFinal Summary:")
    for step in result["steps"]:
        print(f"  {step['step']}: {step['status']}")
