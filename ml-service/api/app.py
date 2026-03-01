import os
import sys

# Add src directory to path so we can import predict module
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'))

from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import predict_price, get_encoder_classes, _load_artifacts

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# Pre-load model and encoders at startup
_model_loaded = False
try:
    _load_artifacts()
    _model_loaded = True
    print("Model and encoders loaded successfully at startup.")
except FileNotFoundError as e:
    print(f"WARNING: {e}")
    print("The /predict endpoint will not work until you run train.py.")


@app.route('/predict', methods=['POST'])
def predict():
    """Predict crop price from input features."""
    if not _model_loaded:
        return jsonify({
            "error": "Model not loaded. Run train.py first to generate model files.",
            "status": "error"
        }), 503

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON", "status": "error"}), 400

    # Validate required fields
    required_fields = ['commodity', 'state', 'market', 'month', 'year', 'min_price', 'max_price']
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({
            "error": f"Missing required fields: {missing}",
            "status": "error"
        }), 400

    # Type validation
    try:
        month = int(data['month'])
        year = int(data['year'])
        min_price = float(data['min_price'])
        max_price = float(data['max_price'])
    except (ValueError, TypeError) as e:
        return jsonify({
            "error": f"Invalid numeric value: {str(e)}",
            "status": "error"
        }), 400

    if not (1 <= month <= 12):
        return jsonify({"error": "month must be between 1 and 12", "status": "error"}), 400

    if min_price < 0 or max_price < 0:
        return jsonify({"error": "Prices must be non-negative", "status": "error"}), 400

    if min_price > max_price:
        return jsonify({"error": "min_price cannot be greater than max_price", "status": "error"}), 400

    result = predict_price(
        commodity=str(data['commodity']),
        state=str(data['state']),
        market=str(data['market']),
        month=month,
        year=year,
        min_price=min_price,
        max_price=max_price
    )

    if "error" in result:
        return jsonify({"error": result["error"], "status": "error"}), 400

    result["unit"] = "INR per quintal"
    result["status"] = "success"
    return jsonify(result), 200


@app.route('/commodities', methods=['GET'])
def commodities():
    """Return list of known commodities from the trained encoder."""
    if not _model_loaded:
        return jsonify({"error": "Model not loaded", "status": "error"}), 503
    try:
        classes = get_encoder_classes('commodity')
        return jsonify({"commodities": classes}), 200
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route('/markets', methods=['GET'])
def markets():
    """Return list of known markets from the trained encoder."""
    if not _model_loaded:
        return jsonify({"error": "Model not loaded", "status": "error"}), 503
    try:
        classes = get_encoder_classes('market')
        return jsonify({"markets": classes}), 200
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model_loaded": _model_loaded
    }), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found", "status": "error"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error", "status": "error"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
