import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, '..', 'data', 'raw', 'crop_prices.csv')
MODELS_DIR = os.path.join(BASE_DIR, '..', 'models')
ENCODERS_FILE = os.path.join(MODELS_DIR, 'encoders.pkl')


def preprocess():
    """Load raw data, clean, encode, remove outliers, and return features and target."""

    # ── Load data: MongoDB primary, CSV fallback ──────────────
    df = None
    try:
        from db import get_collection, CROP_PRICES
        col = get_collection(CROP_PRICES)
        data = list(col.find({}, {'_id': 0}))
        if data:
            df = pd.DataFrame(data)
            print(f"Loaded {len(df)} records from MongoDB")
    except Exception as e:
        print(f"MongoDB read failed: {e}")

    if df is None or df.empty:
        print(f"Falling back to CSV: {DATA_FILE}")
        df = pd.read_csv(DATA_FILE)

    print(f"Raw data shape: {df.shape}")

    # Convert price columns to numeric
    df['modal_price'] = pd.to_numeric(df['modal_price'], errors='coerce')
    df['min_price'] = pd.to_numeric(df['min_price'], errors='coerce')
    df['max_price'] = pd.to_numeric(df['max_price'], errors='coerce')

    # Drop rows where modal_price is null or 0
    initial_count = len(df)
    df = df.dropna(subset=['modal_price'])
    df = df[df['modal_price'] != 0]
    print(f"Dropped {initial_count - len(df)} rows with null/zero modal_price. Remaining: {len(df)}")

    # Parse arrival_date and extract month, year
    df['arrival_date'] = pd.to_datetime(df['arrival_date'], format='mixed', dayfirst=True)
    df['month'] = df['arrival_date'].dt.month.astype(int)
    df['year'] = df['arrival_date'].dt.year.astype(int)

    # Drop rows with NaN in critical columns
    required_cols = ['commodity', 'state', 'district', 'market', 'variety',
                     'min_price', 'max_price', 'modal_price', 'month', 'year']
    df = df.dropna(subset=required_cols)
    print(f"After dropping NaN in required columns: {len(df)} rows")

    # LabelEncode categorical columns
    encoders = {}
    categorical_cols = ['commodity', 'state', 'district', 'market', 'variety']

    for col in categorical_cols:
        le = LabelEncoder()
        df[col + '_enc'] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
        print(f"  Encoded '{col}': {len(le.classes_)} unique values")

    # Remove outliers using IQR on modal_price
    Q1 = df['modal_price'].quantile(0.25)
    Q3 = df['modal_price'].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    before_outlier = len(df)
    df = df[(df['modal_price'] >= lower_bound) & (df['modal_price'] <= upper_bound)]
    print(f"Removed {before_outlier - len(df)} outlier rows (IQR method). Remaining: {len(df)}")
    print(f"  Price range kept: [{lower_bound:.2f}, {upper_bound:.2f}]")

    # ── Cyclical month encoding (captures seasonality properly) ──
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)

    # ── Historical average price per commodity (gives model price-level context) ──
    commodity_avg = df.groupby('commodity')['modal_price'].mean()
    commodity_avg_map = commodity_avg.to_dict()
    df['commodity_avg_price'] = df['commodity'].map(commodity_avg_map)
    print(f"  Computed commodity_avg_price for {len(commodity_avg_map)} commodities")

    # Build feature matrix and target
    # NOTE: min_price, max_price, price_spread REMOVED — they are data leakage
    # (recorded simultaneously with modal_price, making month/year features irrelevant)
    feature_columns = ['commodity_enc', 'state_enc', 'market_enc',
                       'month_sin', 'month_cos', 'year',
                       'commodity_avg_price']
    X = df[feature_columns].values.astype(np.float64)
    y = df['modal_price'].values.astype(np.float64)

    print(f"\nFinal feature matrix X shape: {X.shape}")
    print(f"Target y shape: {y.shape}")
    print(f"Feature columns: {feature_columns}")

    # Save encoders + auxiliary data
    encoders['_commodity_avg_price'] = commodity_avg_map
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(encoders, ENCODERS_FILE)
    print(f"\nEncoders saved to: {ENCODERS_FILE}")

    return X, y


if __name__ == "__main__":
    X, y = preprocess()
    print(f"\nPreprocessing complete. X: {X.shape}, y: {y.shape}")
