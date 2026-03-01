import os
import sys
import numpy as np
import joblib

# Ensure src directory is on path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from seasonal import adjust_prediction, get_seasonal_factor, get_year_trend_factor

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, '..', 'models', 'rf_model.pkl')
ENCODERS_FILE = os.path.join(BASE_DIR, '..', 'models', 'encoders.pkl')

# Cache loaded model and encoders to avoid re-reading from disk on every call
_model = None
_encoders = None


def _load_artifacts():
    """Load model and encoders from disk, caching them in module-level variables."""
    global _model, _encoders
    if _model is None:
        if not os.path.exists(MODEL_FILE):
            raise FileNotFoundError(f"Model file not found: {MODEL_FILE}. Run train.py first.")
        _model = joblib.load(MODEL_FILE)
    if _encoders is None:
        if not os.path.exists(ENCODERS_FILE):
            raise FileNotFoundError(f"Encoders file not found: {ENCODERS_FILE}. Run train.py first.")
        _encoders = joblib.load(ENCODERS_FILE)
    return _model, _encoders


def get_encoder_classes(column_name):
    """Return the list of known classes for a given encoder column."""
    _, encoders = _load_artifacts()
    if column_name not in encoders:
        raise ValueError(f"No encoder found for column: {column_name}")
    return list(encoders[column_name].classes_)


def predict_price(commodity, state, market, month, year):
    """
    Predict crop modal price using the trained RandomForest model.

    Args:
        commodity (str): Crop name, e.g. "Wheat"
        state (str): State name, e.g. "Punjab"
        market (str): Market/mandi name, e.g. "Ludhiana"
        month (int): Month of the year (1-12)
        year (int): Year, e.g. 2025

    Returns:
        dict: {"predicted_price": float, "confidence_interval": [lower, upper]}
              or {"error": str} if input is invalid
    """
    model, encoders = _load_artifacts()

    # Encode categorical inputs — handle unseen labels gracefully
    encoded_values = {}
    for col_name, value in [('commodity', commodity), ('state', state), ('market', market)]:
        le = encoders[col_name]
        known_classes = list(le.classes_)
        if value not in known_classes:
            return {
                "error": f"Unknown {col_name}: '{value}'. "
                         f"Known values: {known_classes[:20]}"
                         f"{'...' if len(known_classes) > 20 else ''}"
            }
        encoded_values[col_name] = le.transform([value])[0]

    # Cyclical month encoding (matches training preprocessing)
    month_sin = np.sin(2 * np.pi * int(month) / 12)
    month_cos = np.cos(2 * np.pi * int(month) / 12)

    # Historical average price for this commodity
    commodity_avg_map = encoders.get('_commodity_avg_price', {})
    commodity_avg_price = commodity_avg_map.get(commodity, 0.0)

    # Build feature array in the same order as training:
    # [commodity_enc, state_enc, market_enc, month_sin, month_cos, year,
    #  commodity_avg_price]
    features = np.array([[
        encoded_values['commodity'],
        encoded_values['state'],
        encoded_values['market'],
        month_sin,
        month_cos,
        int(year),
        commodity_avg_price
    ]])

    # Get predictions from all individual trees for confidence interval
    tree_predictions = np.array([
        tree.predict(features)[0] for tree in model.estimators_
    ])

    mean_prediction = np.mean(tree_predictions)
    std_prediction = np.std(tree_predictions)

    # Apply seasonal and year-trend adjustments
    # The base model was trained on single-month data (March 2026), so it cannot
    # learn temporal patterns. The seasonal module applies known agricultural
    # price patterns to make month/year inputs meaningful.
    adjusted_mean = adjust_prediction(mean_prediction, commodity, int(month), int(year))
    adjusted_lower = adjust_prediction(
        float(mean_prediction - 1.96 * std_prediction), commodity, int(month), int(year)
    )
    adjusted_upper = adjust_prediction(
        float(mean_prediction + 1.96 * std_prediction), commodity, int(month), int(year)
    )

    # Include seasonal info in response
    seasonal_factor = get_seasonal_factor(commodity, int(month))
    year_trend = get_year_trend_factor(int(year))

    return {
        "predicted_price": round(float(adjusted_mean), 2),
        "confidence_interval": [round(adjusted_lower, 2), round(adjusted_upper, 2)],
        "seasonal_factor": round(seasonal_factor, 4),
        "year_trend_factor": round(year_trend, 4)
    }


if __name__ == "__main__":
    # Quick test — compare predictions across different months and years
    print("=== Monthly variation (same year) ===")
    for m in [1, 3, 6, 9, 12]:
        result = predict_price(
            commodity="Pumpkin",
            state="Madhya Pradesh",
            market="Badwani(F&V) APMC",
            month=m,
            year=2026,
        )
        if "error" in result:
            print(f"Month {m:2d}: ERROR — {result['error'][:60]}")
        else:
            print(f"Month {m:2d}: ₹{result['predicted_price']:>8.2f}  (seasonal={result['seasonal_factor']}, trend={result['year_trend_factor']})")

    print("\n=== Yearly variation (same month) ===")
    for y in [2025, 2026, 2027, 2028]:
        result = predict_price(
            commodity="Pumpkin",
            state="Madhya Pradesh",
            market="Badwani(F&V) APMC",
            month=6,
            year=y,
        )
        if "error" in result:
            print(f"Year {y}: ERROR — {result['error'][:60]}")
        else:
            print(f"Year {y}: ₹{result['predicted_price']:>8.2f}  (seasonal={result['seasonal_factor']}, trend={result['year_trend_factor']})")
