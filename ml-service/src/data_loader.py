import os
import sys
import requests
import pandas as pd
from dotenv import load_dotenv

# Load environment variables from .env file
# Support both running from ml-service/ and from ml-service/src/
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(env_path)

API_KEY = os.getenv("DATA_GOV_API_KEY")
BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
LIMIT = 1000
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'raw')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'crop_prices.csv')


def fetch_all_records():
    """Fetch all records from data.gov.in Agmarknet API with pagination."""
    if not API_KEY:
        print("ERROR: DATA_GOV_API_KEY not found in environment variables.")
        print("Make sure ml-service/.env exists with DATA_GOV_API_KEY=<your_key>")
        sys.exit(1)

    all_records = []
    offset = 0

    print(f"Starting data fetch from data.gov.in API...")
    print(f"Base URL: {BASE_URL}")
    print(f"Page size (limit): {LIMIT}")
    print("-" * 60)

    while True:
        params = {
            "api-key": API_KEY,
            "format": "json",
            "limit": LIMIT,
            "offset": offset
        }

        try:
            response = requests.get(BASE_URL, params=params, timeout=60)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"ERROR: API request failed at offset {offset}: {e}")
            if len(all_records) > 0:
                print(f"Saving {len(all_records)} records fetched so far...")
                break
            else:
                sys.exit(1)

        data = response.json()
        records = data.get("records", [])
        total_available = data.get("total", 0)
        count = len(records)

        print(f"  Offset {offset:>6}: fetched {count} records (total available: {total_available})")

        if count == 0:
            break

        all_records.extend(records)

        if count < LIMIT:
            print(f"  Last page reached (got {count} < {LIMIT})")
            break

        offset += LIMIT

    print("-" * 60)
    print(f"Total records fetched: {len(all_records)}")

    if len(all_records) == 0:
        print("ERROR: No records fetched. Check API key and internet connection.")
        sys.exit(1)

    return all_records


def save_to_csv(records):
    """Convert records to DataFrame and save as CSV."""
    df = pd.DataFrame(records)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df.to_csv(OUTPUT_FILE, index=False)

    print(f"\nDataFrame shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print(f"\nFirst 3 rows:")
    print(df.head(3).to_string())
    print(f"\nData saved to: {OUTPUT_FILE}")

    return df


def save_to_mongodb(records):
    """Store fetched records in MongoDB crop_prices collection via upsert."""
    from db import get_collection, CROP_PRICES
    from pymongo import UpdateOne

    col = get_collection(CROP_PRICES)

    # Upsert each record — new data wins for existing keys
    ops = []
    for record in records:
        filter_key = {
            'state': record.get('state'),
            'district': record.get('district'),
            'market': record.get('market'),
            'commodity': record.get('commodity'),
            'variety': record.get('variety'),
            'arrival_date': record.get('arrival_date'),
        }
        ops.append(UpdateOne(filter_key, {'$set': record}, upsert=True))

    if ops:
        result = col.bulk_write(ops, ordered=False)
        print(f"\nMongoDB upsert: {result.upserted_count} inserted, "
              f"{result.modified_count} updated, "
              f"{result.matched_count} matched")

    total = col.estimated_document_count()
    print(f"Total records in MongoDB: {total}")
    return total


if __name__ == "__main__":
    records = fetch_all_records()

    # Save to CSV (local backup / backward compatibility)
    df = save_to_csv(records)

    # Save to MongoDB (primary store)
    try:
        save_to_mongodb(records)
    except Exception as e:
        print(f"WARNING: MongoDB save failed: {e}")
        print("Data is still saved to CSV.")
