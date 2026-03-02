"""
Lookup module — provides cascading dropdown data from the raw CSV.
State → District → Market → Commodity relationships.
Loaded once at startup and cached in memory.
"""
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, '..', 'data', 'raw', 'crop_prices.csv')

_lookup_data = None


def _load_lookup():
    """Load crop data and build lookup dictionaries. Cached after first call."""
    global _lookup_data
    if _lookup_data is not None:
        return _lookup_data

    # ── Load data: MongoDB primary, CSV fallback ──────────────
    df = None
    try:
        from db import get_collection, CROP_PRICES
        col = get_collection(CROP_PRICES)
        data = list(col.find({}, {'_id': 0}))
        if data:
            df = pd.DataFrame(data)
            print(f"Lookup: loaded {len(df)} records from MongoDB")
    except Exception as e:
        print(f"Lookup: MongoDB failed ({e}), falling back to CSV")

    if df is None or df.empty:
        if not os.path.exists(DATA_FILE):
            raise FileNotFoundError(
                f"No data available in MongoDB or CSV ({DATA_FILE}). "
                "Run data_loader.py or init_data.py first."
            )
        df = pd.read_csv(DATA_FILE)
        print(f"Lookup: loaded {len(df)} records from CSV")

    # Convert prices to numeric
    df['min_price'] = pd.to_numeric(df['min_price'], errors='coerce')
    df['max_price'] = pd.to_numeric(df['max_price'], errors='coerce')
    df['modal_price'] = pd.to_numeric(df['modal_price'], errors='coerce')

    # Build hierarchical lookups
    states = sorted(df['state'].dropna().unique().tolist())

    state_to_districts = {}
    for state in states:
        districts = sorted(df[df['state'] == state]['district'].dropna().unique().tolist())
        state_to_districts[state] = districts

    district_to_markets = {}
    for district in df['district'].dropna().unique():
        markets = sorted(df[df['district'] == district]['market'].dropna().unique().tolist())
        district_to_markets[district] = markets

    market_to_commodities = {}
    for market in df['market'].dropna().unique():
        commodities = sorted(df[df['market'] == market]['commodity'].dropna().unique().tolist())
        market_to_commodities[market] = commodities

    # Price ranges per commodity (for smart defaults on min/max price)
    commodity_price_ranges = {}
    for commodity in df['commodity'].dropna().unique():
        subset = df[df['commodity'] == commodity]
        commodity_price_ranges[commodity] = {
            "typical_min": round(float(subset['min_price'].median()), 2),
            "typical_max": round(float(subset['max_price'].median()), 2),
            "typical_modal": round(float(subset['modal_price'].median()), 2),
        }

    _lookup_data = {
        "states": states,
        "state_to_districts": state_to_districts,
        "district_to_markets": district_to_markets,
        "market_to_commodities": market_to_commodities,
        "commodity_price_ranges": commodity_price_ranges,
    }
    return _lookup_data


def get_states():
    """Return sorted list of all states."""
    return _load_lookup()["states"]


def get_districts(state):
    """Return sorted list of districts for a given state."""
    data = _load_lookup()
    return data["state_to_districts"].get(state, [])


def get_markets(district):
    """Return sorted list of markets for a given district."""
    data = _load_lookup()
    return data["district_to_markets"].get(district, [])


def get_commodities(market):
    """Return sorted list of commodities available in a given market."""
    data = _load_lookup()
    return data["market_to_commodities"].get(market, [])


def get_price_range(commodity):
    """Return typical price range for a commodity."""
    data = _load_lookup()
    return data["commodity_price_ranges"].get(commodity, {})
