"""
MongoDB connection manager for the ML service.

Provides shared access to the crop-predictor database and defines
collection names used across the application.
"""

import os
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
    db[CROP_PRICES].create_index(
        [('state', ASCENDING), ('district', ASCENDING), ('market', ASCENDING),
         ('commodity', ASCENDING), ('variety', ASCENDING), ('arrival_date', ASCENDING)],
        unique=True, name='dedup_idx', background=True
    )
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


def close():
    """Close the MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
