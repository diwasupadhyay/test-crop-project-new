"""
MongoDB connection manager for the ML service.

Provides shared access to the crop-predictor database and defines
collection names used across the application.  Also handles persistent
model artifact storage via GridFS so trained models survive ephemeral
filesystem resets (e.g. Render / Railway free-tier sleep cycles).
"""

import os
import math
import datetime
from pymongo import MongoClient, ASCENDING, DESCENDING
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(env_path)

MONGODB_URI = os.getenv('MONGODB_URI')

# ── Collection names ──────────────────────────────────────────
CROP_PRICES = 'crop_prices'
RETRAIN_HISTORY = 'retrain_history'
DATASET_BACKUPS = 'dataset_backups'

_client = None
_db = None


def get_db():
    """Return the MongoDB database instance (lazy-initialized, cached)."""
    global _client, _db
    if _db is not None:
        return _db

    if not MONGODB_URI:
        raise RuntimeError(
            "MONGODB_URI not set. Add it to ml-service/.env or pass as environment variable."
        )

    _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    _db = _client.get_default_database()

    # Verify connection
    _client.admin.command('ping')
    print(f"Connected to MongoDB: {_db.name}")
    return _db


def get_collection(name):
    """Return a MongoDB collection by name."""
    return get_db()[name]


def ensure_indexes():
    """Create necessary indexes for efficient queries and deduplication."""
    db = get_db()

    # Crop prices — compound unique index for dedup
    # If creation fails due to existing duplicates, clean up first and retry
    try:
        db[CROP_PRICES].create_index(
            [('state', ASCENDING), ('district', ASCENDING), ('market', ASCENDING),
             ('commodity', ASCENDING), ('variety', ASCENDING), ('arrival_date', ASCENDING)],
            unique=True, name='dedup_idx', background=True
        )
    except Exception as e:
        if 'duplicate' in str(e).lower() or 'dup key' in str(e).lower():
            print(f"Unique index creation failed (duplicates exist). Cleaning up...")
            removed = deduplicate_collection()
            print(f"Cleaned {removed} duplicates. Retrying index creation...")
            # Drop the partially-created index if it exists
            try:
                db[CROP_PRICES].drop_index('dedup_idx')
            except Exception:
                pass
            db[CROP_PRICES].create_index(
                [('state', ASCENDING), ('district', ASCENDING), ('market', ASCENDING),
                 ('commodity', ASCENDING), ('variety', ASCENDING), ('arrival_date', ASCENDING)],
                unique=True, name='dedup_idx', background=True
            )
        else:
            raise
    # Single-field indexes for cascading lookups
    db[CROP_PRICES].create_index('state', name='state_idx', background=True)
    db[CROP_PRICES].create_index('district', name='district_idx', background=True)
    db[CROP_PRICES].create_index('market', name='market_idx', background=True)
    db[CROP_PRICES].create_index('commodity', name='commodity_idx', background=True)

    # Retrain history — descending timestamp for "latest first"
    db[RETRAIN_HISTORY].create_index(
        [('timestamp', DESCENDING)], name='ts_idx', background=True
    )

    # Dataset backups — descending timestamp
    db[DATASET_BACKUPS].create_index(
        [('timestamp', DESCENDING)], name='ts_idx', background=True
    )

    print("MongoDB indexes ensured.")


def normalize_record(record):
    """Normalize a record for consistent storage in MongoDB.

    Fixes the root cause of data duplication:
    - pandas reads empty CSV cells as float NaN
    - API returns the same fields as empty string ""
    - MongoDB treats NaN != "", so upsert filter doesn't match → duplicates

    This function ensures all values are clean, comparable types.
    """
    normalized = {}
    for key, value in record.items():
        if key == '_id':
            continue  # Skip MongoDB internal field
        if value is None:
            normalized[key] = ''
        elif isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
            normalized[key] = ''
        elif isinstance(value, str):
            normalized[key] = value.strip()
        else:
            normalized[key] = value
    return normalized


def deduplicate_collection():
    """Remove duplicate records from crop_prices, keeping the latest.

    Run this once to clean up data that was inserted before normalize_record
    was in place.
    """
    col = get_collection(CROP_PRICES)

    pipeline = [
        {"$group": {
            "_id": {
                "state": "$state",
                "district": "$district",
                "market": "$market",
                "commodity": "$commodity",
                "variety": "$variety",
                "arrival_date": "$arrival_date"
            },
            "count": {"$sum": 1},
            "ids": {"$push": "$_id"},
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]

    duplicates = list(col.aggregate(pipeline, allowDiskUse=True))

    if not duplicates:
        print("No duplicate records found.")
        return 0

    ids_to_delete = []
    for group in duplicates:
        ids = group["ids"]
        ids_to_delete.extend(ids[1:])  # Keep first, delete rest

    if ids_to_delete:
        result = col.delete_many({"_id": {"$in": ids_to_delete}})
        print(f"Removed {result.deleted_count} duplicate records.")
        return result.deleted_count

    return 0


def close():
    """Close the MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None


# ── Persistent model artifact storage (GridFS) ───────────────
#
# Naming convention in GridFS:
#   "rf_model.pkl"     → currently active model
#   "rf_model.pkl.bak" → previous (backup) model
#   "encoders.pkl"     → currently active encoders
#   "encoders.pkl.bak" → previous (backup) encoders
#
# On every save: current → .bak (overwrite old .bak), new → current.
# So at most 2 copies exist per artifact (active + 1 backup).

MODEL_ARTIFACTS = 'model_artifacts'     # metadata collection


def _gridfs():
    """Return a GridFS handle for the model_files bucket."""
    import gridfs
    return gridfs.GridFS(get_db(), collection='model_files')


def _delete_gridfs_file(fs, filename):
    """Delete ALL GridFS files with the given filename."""
    for existing in fs.find({'filename': filename}):
        fs.delete(existing._id)


def save_model_to_mongo(file_path, artifact_name=None):
    """
    Save a model artifact to MongoDB GridFS with backup rotation.

    - Promotes the current active artifact → .bak  (overwriting any old .bak)
    - Saves the new file as the active artifact
    - Result: exactly 1 active + 1 backup per artifact name

    Args:
        file_path: Local path to the artifact file
        artifact_name: Name to store under (defaults to filename)
    Returns:
        True if saved successfully, False otherwise.
    """
    if not os.path.exists(file_path):
        print(f"  [model-store] File not found, skipping: {file_path}")
        return False

    fs = _gridfs()
    name = artifact_name or os.path.basename(file_path)
    bak_name = name + '.bak'

    # Step 1: Delete old backup
    _delete_gridfs_file(fs, bak_name)

    # Step 2: Rename current active → .bak (read → write → delete)
    current = fs.find_one({'filename': name}, sort=[('uploadDate', DESCENDING)])
    if current is not None:
        data = current.read()
        fs.put(data, filename=bak_name, uploaded_at=datetime.datetime.now(),
               note='backup — previous active model')
        _delete_gridfs_file(fs, name)
        print(f"  [model-store] Moved '{name}' → '{bak_name}' (backup)")

    # Step 3: Upload new active artifact
    with open(file_path, 'rb') as f:
        fs.put(f, filename=name, uploaded_at=datetime.datetime.now())

    size_kb = os.path.getsize(file_path) / 1024
    print(f"  [model-store] Saved '{name}' to MongoDB ({size_kb:.1f} KB)")
    return True


def restore_model_from_mongo(file_path, artifact_name=None):
    """
    Restore the active model artifact from MongoDB GridFS to local disk.
    Falls back to the .bak version if the active one is missing/corrupt.

    Returns True if restored, False otherwise.
    """
    fs = _gridfs()
    name = artifact_name or os.path.basename(file_path)

    # Try active first, then backup
    for try_name in [name, name + '.bak']:
        try:
            grid_file = fs.find_one({'filename': try_name},
                                     sort=[('uploadDate', DESCENDING)])
            if grid_file is None:
                continue

            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'wb') as f:
                f.write(grid_file.read())

            size_kb = os.path.getsize(file_path) / 1024
            label = "active" if try_name == name else "backup"
            print(f"  [model-store] Restored '{name}' from MongoDB "
                  f"({label}, {size_kb:.1f} KB)")
            return True
        except Exception as e:
            print(f"  [model-store] Failed to restore '{try_name}': {e}")

    print(f"  [model-store] '{name}' not found in MongoDB (active or backup)")
    return False


def save_all_artifacts():
    """Save all model artifacts (model + encoders) to MongoDB with backup rotation."""
    from train import MODEL_FILE
    from preprocessing import ENCODERS_FILE

    saved = 0
    for path in [MODEL_FILE, ENCODERS_FILE]:
        try:
            if save_model_to_mongo(path):
                saved += 1
        except Exception as e:
            print(f"  [model-store] Error saving {path}: {e}")
    print(f"  [model-store] {saved} artifact(s) saved (each has 1 active + 1 backup max)")
    return saved


def restore_all_artifacts():
    """
    Restore all model artifacts from MongoDB to local disk.
    Returns True if the model file was successfully restored.
    """
    from train import MODEL_FILE
    from preprocessing import ENCODERS_FILE

    model_ok = False
    for path in [MODEL_FILE, ENCODERS_FILE]:
        try:
            result = restore_model_from_mongo(path)
            if path == MODEL_FILE:
                model_ok = result
        except Exception as e:
            print(f"  [model-store] Error restoring {path}: {e}")
    return model_ok


def cleanup_old_retrain_history(keep=20):
    """Delete retrain history entries beyond the most recent `keep` entries."""
    try:
        col = get_collection(RETRAIN_HISTORY)
        total = col.estimated_document_count()
        if total <= keep:
            return 0
        # Find the timestamp of the keep-th newest entry
        cutoff_doc = col.find({}, {'timestamp': 1}).sort('timestamp', DESCENDING).skip(keep).limit(1)
        cutoff_list = list(cutoff_doc)
        if not cutoff_list:
            return 0
        cutoff_ts = cutoff_list[0]['timestamp']
        result = col.delete_many({'timestamp': {'$lt': cutoff_ts}})
        print(f"  [cleanup] Removed {result.deleted_count} old retrain history entries")
        return result.deleted_count
    except Exception as e:
        print(f"  [cleanup] History cleanup failed: {e}")
        return 0


def cleanup_old_backup_metadata(keep=10):
    """Delete dataset backup metadata entries beyond the most recent `keep`."""
    try:
        col = get_collection(DATASET_BACKUPS)
        total = col.estimated_document_count()
        if total <= keep:
            return 0
        cutoff_doc = col.find({}, {'timestamp': 1}).sort('timestamp', DESCENDING).skip(keep).limit(1)
        cutoff_list = list(cutoff_doc)
        if not cutoff_list:
            return 0
        cutoff_ts = cutoff_list[0]['timestamp']
        result = col.delete_many({'timestamp': {'$lt': cutoff_ts}})
        print(f"  [cleanup] Removed {result.deleted_count} old backup metadata entries")
        return result.deleted_count
    except Exception as e:
        print(f"  [cleanup] Backup metadata cleanup failed: {e}")
        return 0
