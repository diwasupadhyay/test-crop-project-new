"""
MongoDB connection manager for the ML service.

Provides shared access to the crop-predictor database and defines
collection names used across the application.
"""

import os
import math
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
