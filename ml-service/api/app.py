import os
import sys
import threading
import datetime

# Add src directory to path so we can import predict module
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'))

from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import predict_price, get_encoder_classes, _load_artifacts
from lookup import get_states, get_districts, get_markets, get_commodities, get_price_range
from retrain import full_retrain, backup_current_artifacts

app = Flask(__name__)

# ── MongoDB availability flag ─────────────────────────────────
_mongo_available = False
try:
    from db import get_db, get_collection, ensure_indexes
    from db import CROP_PRICES, RETRAIN_HISTORY, DATASET_BACKUPS
    get_db()
    ensure_indexes()
    _mongo_available = True
    print("MongoDB connected and indexes ensured.")
except Exception as e:
    print(f"WARNING: MongoDB unavailable ({e}). Using file-based fallbacks.")

# ── Retraining state (in-memory for is_running; MongoDB for history) ──
_retrain_lock = threading.Lock()
_retrain_status = {
    "is_running": False,
    "last_run": None,
    "last_result": None,
}

# Load last retrain result from MongoDB on startup
if _mongo_available:
    try:
        _last = get_collection(RETRAIN_HISTORY).find_one(
            {}, {'_id': 0}, sort=[('timestamp', -1)]
        )
        if _last:
            # Convert datetime to ISO string for JSON serialization
            if isinstance(_last.get('timestamp'), datetime.datetime):
                _last['timestamp'] = _last['timestamp'].isoformat()
            _retrain_status["last_run"] = _last.get("timestamp")
            _retrain_status["last_result"] = _last
            print(f"Loaded last retrain result from MongoDB (ran: {_last.get('timestamp')})")
    except Exception as e:
        print(f"Warning: Could not load retrain history from MongoDB: {e}")

# Dynamic CORS — defaults to Express server origin; override via ALLOWED_ORIGINS env var
_allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, origins=[o.strip() for o in _allowed_origins])

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
    required_fields = ['commodity', 'state', 'market', 'month', 'year']
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
    except (ValueError, TypeError) as e:
        return jsonify({
            "error": f"Invalid numeric value: {str(e)}",
            "status": "error"
        }), 400

    if not (1 <= month <= 12):
        return jsonify({"error": "month must be between 1 and 12", "status": "error"}), 400

    result = predict_price(
        commodity=str(data['commodity']),
        state=str(data['state']),
        market=str(data['market']),
        month=month,
        year=year
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


# ── Cascading Dropdown Endpoints ──────────────────────────

@app.route('/states', methods=['GET'])
def states():
    """Return sorted list of all states in the dataset."""
    try:
        return jsonify({"states": get_states()}), 200
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route('/districts', methods=['GET'])
def districts():
    """Return districts for a given state. Query param: ?state=..."""
    state = request.args.get('state', '').strip()
    if not state:
        return jsonify({"error": "Missing 'state' query parameter", "status": "error"}), 400
    try:
        return jsonify({"districts": get_districts(state)}), 200
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route('/markets-by-district', methods=['GET'])
def markets_by_district():
    """Return markets for a given district. Query param: ?district=..."""
    district = request.args.get('district', '').strip()
    if not district:
        return jsonify({"error": "Missing 'district' query parameter", "status": "error"}), 400
    try:
        return jsonify({"markets": get_markets(district)}), 200
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route('/commodities-by-market', methods=['GET'])
def commodities_by_market():
    """Return commodities for a given market. Query param: ?market=..."""
    market = request.args.get('market', '').strip()
    if not market:
        return jsonify({"error": "Missing 'market' query parameter", "status": "error"}), 400
    try:
        return jsonify({"commodities": get_commodities(market)}), 200
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route('/price-range', methods=['GET'])
def price_range():
    """Return typical price range for a commodity. Query param: ?commodity=..."""
    commodity = request.args.get('commodity', '').strip()
    if not commodity:
        return jsonify({"error": "Missing 'commodity' query parameter", "status": "error"}), 400
    try:
        ranges = get_price_range(commodity)
        if not ranges:
            return jsonify({"error": f"No data for commodity: {commodity}", "status": "error"}), 404
        return jsonify({"price_range": ranges, "status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model_loaded": _model_loaded
    }), 200


# ── Admin Retrain Endpoints ──────────────────────────────────

def _run_retrain():
    """Background worker that runs the full retrain pipeline."""
    global _model_loaded
    try:
        summary = full_retrain()
        now = datetime.datetime.now()
        summary["timestamp"] = now.isoformat()

        with _retrain_lock:
            _retrain_status["last_result"] = summary
            _retrain_status["last_run"] = summary["timestamp"]

        # Persist retrain result in MongoDB
        if _mongo_available:
            try:
                doc = {**summary, "timestamp": now}
                get_collection(RETRAIN_HISTORY).insert_one(doc)
                print("Retrain result saved to MongoDB.")
            except Exception as db_err:
                print(f"Warning: Failed to save retrain result to MongoDB: {db_err}")

        # Reload model artifacts so new predictions use the fresh model
        from predict import _load_artifacts as _reload
        import predict as predict_module
        predict_module._model = None
        predict_module._encoders = None
        _reload()
        _model_loaded = True

        # Also reload lookup cache
        import lookup as lookup_module
        lookup_module._lookup_data = None

        print("Retrain complete — model and lookup cache reloaded.")
    except Exception as e:
        error_result = {
            "error": str(e),
            "timestamp": datetime.datetime.now().isoformat(),
            "steps": [{"step": "retrain", "status": "failed", "error": str(e)}]
        }
        with _retrain_lock:
            _retrain_status["last_result"] = error_result

        # Persist failure in MongoDB too
        if _mongo_available:
            try:
                doc = {**error_result, "timestamp": datetime.datetime.now()}
                get_collection(RETRAIN_HISTORY).insert_one(doc)
            except Exception:
                pass

        print(f"Retrain failed: {e}")
    finally:
        with _retrain_lock:
            _retrain_status["is_running"] = False


@app.route('/admin/retrain', methods=['POST'])
def trigger_retrain():
    """
    Trigger a full retrain pipeline (fetch new data → merge → retrain).
    Runs in a background thread. Returns immediately with 202 Accepted.
    """
    with _retrain_lock:
        if _retrain_status["is_running"]:
            return jsonify({
                "error": "A retrain job is already running. Please wait.",
                "status": "error"
            }), 409
        _retrain_status["is_running"] = True

    thread = threading.Thread(target=_run_retrain, daemon=True)
    thread.start()

    return jsonify({
        "message": "Retrain pipeline started. Check /admin/retrain/status for progress.",
        "status": "accepted"
    }), 202


@app.route('/admin/retrain/status', methods=['GET'])
def retrain_status():
    """Return current retrain status and most recent result."""
    with _retrain_lock:
        return jsonify({
            "is_running": _retrain_status["is_running"],
            "last_run": _retrain_status["last_run"],
            "last_result": _retrain_status["last_result"],
            "status": "success"
        }), 200


@app.route('/admin/retrain/history', methods=['GET'])
def retrain_history():
    """Return the last N retrain results from MongoDB."""
    if _mongo_available:
        try:
            cursor = get_collection(RETRAIN_HISTORY).find(
                {}, {'_id': 0}
            ).sort('timestamp', -1).limit(20)
            history = []
            for doc in cursor:
                # Convert datetime to ISO string for JSON
                if isinstance(doc.get('timestamp'), datetime.datetime):
                    doc['timestamp'] = doc['timestamp'].isoformat()
                history.append(doc)
            return jsonify({"history": history, "status": "success"}), 200
        except Exception as e:
            return jsonify({"error": str(e), "status": "error"}), 500
    else:
        # Fallback: return in-memory last result only
        with _retrain_lock:
            last = _retrain_status.get("last_result")
            return jsonify({
                "history": [last] if last else [],
                "status": "success"
            }), 200


@app.route('/admin/data/stats', methods=['GET'])
def data_stats():
    """Return basic stats about the current dataset from MongoDB."""
    if _mongo_available:
        try:
            col = get_collection(CROP_PRICES)
            total = col.estimated_document_count()
            if total == 0:
                return jsonify({"error": "No dataset found", "status": "error"}), 404

            # Aggregation for unique counts and date range
            pipeline = [
                {"$group": {
                    "_id": None,
                    "states": {"$addToSet": "$state"},
                    "commodities": {"$addToSet": "$commodity"},
                    "markets": {"$addToSet": "$market"},
                    "min_date": {"$min": "$arrival_date"},
                    "max_date": {"$max": "$arrival_date"},
                }}
            ]
            agg = list(col.aggregate(pipeline))
            if agg:
                r = agg[0]
                stats = {
                    "total_rows": total,
                    "states": len(r.get("states", [])),
                    "commodities": len(r.get("commodities", [])),
                    "markets": len(r.get("markets", [])),
                    "storage": "mongodb",
                    "date_range": {
                        "min": r.get("min_date", "unknown"),
                        "max": r.get("max_date", "unknown"),
                    },
                }
            else:
                stats = {"total_rows": total, "storage": "mongodb"}

            return jsonify({"stats": stats, "status": "success"}), 200
        except Exception as e:
            return jsonify({"error": str(e), "status": "error"}), 500

    # ── CSV fallback ──────────────────────────────────────────
    import pandas as pd
    data_file = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                             '..', 'data', 'raw', 'crop_prices.csv')
    if not os.path.exists(data_file):
        return jsonify({"error": "No dataset found", "status": "error"}), 404

    try:
        df = pd.read_csv(data_file)
        stats = {
            "total_rows": len(df),
            "columns": list(df.columns),
            "states": int(df['state'].nunique()) if 'state' in df.columns else 0,
            "commodities": int(df['commodity'].nunique()) if 'commodity' in df.columns else 0,
            "markets": int(df['market'].nunique()) if 'market' in df.columns else 0,
            "storage": "csv",
            "file_size_mb": round(os.path.getsize(data_file) / (1024 * 1024), 2),
        }
        if 'arrival_date' in df.columns:
            dates = pd.to_datetime(df['arrival_date'], format='mixed', dayfirst=True, errors='coerce').dropna()
            if not dates.empty:
                stats["date_range"] = {
                    "min": str(dates.min().date()),
                    "max": str(dates.max().date()),
                }
        return jsonify({"stats": stats, "status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route('/admin/backups', methods=['GET'])
def list_backups():
    """List available backups (MongoDB primary, filesystem fallback)."""
    backups = []

    # Try MongoDB first
    if _mongo_available:
        try:
            cursor = get_collection(DATASET_BACKUPS).find(
                {}, {'_id': 0}
            ).sort('timestamp', -1).limit(50)
            for doc in cursor:
                if isinstance(doc.get('timestamp'), datetime.datetime):
                    doc['timestamp'] = doc['timestamp'].isoformat()
                backups.append(doc)
            if backups:
                return jsonify({"backups": backups, "status": "success"}), 200
        except Exception as e:
            print(f"Warning: MongoDB backup query failed: {e}")

    # Filesystem fallback
    backup_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                              '..', 'data', 'backups')
    if not os.path.exists(backup_dir):
        return jsonify({"backups": [], "status": "success"}), 200

    for name in sorted(os.listdir(backup_dir), reverse=True):
        path = os.path.join(backup_dir, name)
        if os.path.isdir(path):
            files = os.listdir(path)
            backups.append({
                "backup_name": name,
                "files": files,
                "timestamp": name,
            })

    return jsonify({"backups": backups, "status": "success"}), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found", "status": "error"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error", "status": "error"}), 500


# Gunicorn imports this module directly (api.app:app).
# Keep this block only as a dev fallback — production uses gunicorn via entrypoint.sh
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
