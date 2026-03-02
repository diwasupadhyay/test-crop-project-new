"""
Bootstrap data into MongoDB.

Called by entrypoint.sh before model training to ensure crop price
data exists in MongoDB. Logic:

  1. If MongoDB already has crop price data → do nothing
  2. Else if a local CSV exists → migrate it into MongoDB
  3. Else → fetch fresh data from data.gov.in and store in MongoDB
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import get_collection, ensure_indexes, CROP_PRICES


def init_data():
    """Ensure crop price data exists in MongoDB. Returns record count."""
    # Create indexes first (idempotent)
    ensure_indexes()

    col = get_collection(CROP_PRICES)
    count = col.estimated_document_count()

    if count > 0:
        print(f"MongoDB already has {count} crop price records. Skipping data init.")
        return count

    # ── Try importing from existing CSV (migration path) ──────
    csv_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'raw', 'crop_prices.csv'
    )

    if os.path.exists(csv_path):
        import pandas as pd
        from pymongo.errors import BulkWriteError

        print(f"Migrating existing CSV ({csv_path}) to MongoDB...")
        df = pd.read_csv(csv_path)
        records = df.to_dict('records')

        if records:
            try:
                col.insert_many(records, ordered=False)
                print(f"  Migrated {len(records)} records to MongoDB.")
            except BulkWriteError as e:
                inserted = e.details.get('nInserted', 0)
                print(f"  Migrated {inserted} records ({len(records) - inserted} duplicates skipped).")

        return col.estimated_document_count()

    # ── Fetch fresh data from API ─────────────────────────────
    print("No existing data found. Fetching from data.gov.in...")
    from data_loader import fetch_all_records
    from pymongo.errors import BulkWriteError

    records = fetch_all_records()
    if records:
        try:
            col.insert_many(records, ordered=False)
            print(f"  Stored {len(records)} records in MongoDB.")
        except BulkWriteError as e:
            inserted = e.details.get('nInserted', 0)
            print(f"  Stored {inserted} records ({len(records) - inserted} duplicates skipped).")

    return col.estimated_document_count()


if __name__ == '__main__':
    total = init_data()
    print(f"\nData initialization complete. Total records in MongoDB: {total}")
