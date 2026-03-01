import os
import sys
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import joblib

# Add parent src directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from preprocessing import preprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, '..', 'models')
MODEL_FILE = os.path.join(MODELS_DIR, 'rf_model.pkl')
IMPORTANCE_FILE = os.path.join(MODELS_DIR, 'feature_importance.png')

FEATURE_NAMES = ['commodity_enc', 'state_enc', 'market_enc',
                 'month_sin', 'month_cos', 'year',
                 'commodity_avg_price']


def train_model():
    """Train RandomForest model with hyperparameter tuning."""
    print("=" * 60)
    print("CROP PRICE PREDICTION — MODEL TRAINING")
    print("=" * 60)

    # Get preprocessed data
    X, y = preprocess()

    # 80/20 train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\nTrain set: {X_train.shape[0]} samples")
    print(f"Test set:  {X_test.shape[0]} samples")

    # Define hyperparameter grid
    param_grid = {
        "n_estimators": [100, 200, 300],
        "max_depth": [10, 20, 30, None],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4]
    }

    # RandomizedSearchCV
    print("\nStarting RandomizedSearchCV (n_iter=20, cv=5)...")
    rf = RandomForestRegressor(random_state=42)
    search = RandomizedSearchCV(
        estimator=rf,
        param_distributions=param_grid,
        n_iter=20,
        cv=5,
        scoring="r2",
        n_jobs=-1,
        random_state=42,
        verbose=1
    )
    search.fit(X_train, y_train)

    # Best model
    best_model = search.best_estimator_
    print(f"\nBest Parameters: {search.best_params_}")

    # Evaluate on test set
    y_pred = best_model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)

    print("\n" + "=" * 60)
    print("MODEL EVALUATION RESULTS")
    print("=" * 60)
    print(f"  R² Score: {r2:.4f}")
    print(f"  RMSE:     {rmse:.2f}")
    print(f"  MAE:      {mae:.2f}")

    if r2 < 0.75:
        print("\n⚠ WARNING: Model accuracy below threshold, consider more data")

    # Save model
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(best_model, MODEL_FILE)
    print(f"\nModel saved to: {MODEL_FILE}")

    # Feature importance chart
    importances = best_model.feature_importances_
    indices = np.argsort(importances)[::-1]

    plt.figure(figsize=(10, 6))
    plt.title("Feature Importance — RandomForest Crop Price Model")
    plt.bar(range(len(importances)), importances[indices], align="center", color="#2196F3")
    plt.xticks(range(len(importances)), [FEATURE_NAMES[i] for i in indices], rotation=45, ha='right')
    plt.ylabel("Importance")
    plt.xlabel("Feature")
    plt.tight_layout()
    plt.savefig(IMPORTANCE_FILE, dpi=150)
    plt.close()
    print(f"Feature importance chart saved to: {IMPORTANCE_FILE}")

    # Print feature importances
    print("\nFeature Importances:")
    for i in indices:
        print(f"  {FEATURE_NAMES[i]:>20s}: {importances[i]:.4f}")

    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)

    return best_model


if __name__ == "__main__":
    train_model()
