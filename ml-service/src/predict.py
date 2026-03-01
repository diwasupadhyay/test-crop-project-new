import os
import numpy as np
import joblib

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


def predict_price(commodity, state, market, month, year, min_price, max_price):
    """
    Predict crop modal price using the trained RandomForest model.

    Args:
        commodity (str): Crop name, e.g. "Wheat"
        state (str): State name, e.g. "Punjab"
        market (str): Market/mandi name, e.g. "Ludhiana"
        month (int): Month of the year (1-12)
        year (int): Year, e.g. 2025
        min_price (float): Minimum price in INR per quintal
        max_price (float): Maximum price in INR per quintal

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

    # Calculate price_spread
    price_spread = float(max_price) - float(min_price)

    # Build feature array in the same order as training:
    # [commodity_enc, state_enc, market_enc, month, year, min_price, max_price, price_spread]
    features = np.array([[
        encoded_values['commodity'],
        encoded_values['state'],
        encoded_values['market'],
        int(month),
        int(year),
        float(min_price),
        float(max_price),
        price_spread
    ]])

    # Get predictions from all individual trees for confidence interval
    tree_predictions = np.array([
        tree.predict(features)[0] for tree in model.estimators_
    ])

    mean_prediction = np.mean(tree_predictions)
    std_prediction = np.std(tree_predictions)

    # 95% confidence interval
    lower = round(float(mean_prediction - 1.96 * std_prediction), 2)
    upper = round(float(mean_prediction + 1.96 * std_prediction), 2)

    return {
        "predicted_price": round(float(mean_prediction), 2),
        "confidence_interval": [lower, upper]
    }


if __name__ == "__main__":
    # Quick test
    result = predict_price(
        commodity="Wheat",
        state="Punjab",
        market="Ludhiana",
        month=3,
        year=2025,
        min_price=1800,
        max_price=2200
    )
    print("Prediction result:", result)
