import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, r2_score, mean_squared_error
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestRegressor
from data_loader import load_raw_dataset

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURE_COLS = [
    'hour', 'is_weekend', 'lanes', 'traffic_signal', 'visibility_num',
    'temperature', 'vehicles_involved', 'casualties', 'is_peak_hour',
    'weather_encoded', 'road_type_encoded', 'traffic_density_encoded', 'cause_encoded'
]

def train_ml_models():
    """Trains severity classifier and risk regressor, exports model artifacts & metrics."""
    df = load_raw_dataset()
    
    # Encoders map
    encoders = {}
    cat_cols = ['weather', 'road_type', 'traffic_density', 'cause']
    for col in cat_cols:
        le = LabelEncoder()
        df[col + '_encoded'] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
        
    # Severity label encoding (minor=0, major=1, fatal=2)
    sev_map = {'minor': 0, 'major': 1, 'fatal': 2}
    df['severity_target'] = df['accident_severity'].map(sev_map).fillna(0).astype(int)
    
    X = df[FEATURE_COLS]
    y_sev = df['severity_target']
    y_risk = df['risk_score']
    
    X_train, X_test, y_sev_train, y_sev_test, y_risk_train, y_risk_test = train_test_split(
        X, y_sev, y_risk, test_size=0.2, random_state=42, stratify=y_sev
    )
    
    # 1. Train Severity Classifier (XGBoost)
    clf = XGBClassifier(
        n_estimators=120,
        max_depth=6,
        learning_rate=0.08,
        random_state=42,
        eval_metric='mlogloss'
    )
    clf.fit(X_train, y_sev_train)
    
    y_sev_pred = clf.predict(X_test)
    y_sev_proba = clf.predict_proba(X_test).tolist()
    
    acc = accuracy_score(y_sev_test, y_sev_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_sev_test, y_sev_pred, average='weighted')
    cm = confusion_matrix(y_sev_test, y_sev_pred).tolist()
    
    feat_imp = pd.DataFrame({
        'feature': FEATURE_COLS,
        'importance': clf.feature_importances_
    }).sort_values('importance', ascending=False).to_dict(orient='records')
    
    # 2. Train Risk Regressor (RandomForest / GradientBoosting)
    reg = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    reg.fit(X_train, y_risk_train)
    y_risk_pred = reg.predict(X_test)
    r2 = r2_score(y_risk_test, y_risk_pred)
    rmse = np.sqrt(mean_squared_error(y_risk_test, y_risk_pred))
    
    # Save Model Artifacts
    joblib.dump(clf, os.path.join(MODELS_DIR, "severity_model.pkl"))
    joblib.dump(reg, os.path.join(MODELS_DIR, "risk_model.pkl"))
    joblib.dump(encoders, os.path.join(MODELS_DIR, "encoders.pkl"))
    
    metrics = {
        "severity_model": {
            "name": "XGBoost Multi-Class Classifier",
            "target": "accident_severity (minor, major, fatal)",
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "confusion_matrix": cm,
            "classes": ["minor", "major", "fatal"],
            "feature_importances": feat_imp
        },
        "risk_model": {
            "name": "Random Forest Risk Score Regressor",
            "target": "risk_score (0.0 to 1.0)",
            "r2_score": round(float(r2), 4),
            "rmse": round(float(rmse), 4)
        }
    }
    
    with open(os.path.join(MODELS_DIR, "metrics.json"), "w") as f:
        import json
        json.dump(metrics, f, indent=2)
        
    print("ML Pipeline execution completed! Artifacts saved to backend/models/")
    return metrics

def predict_accident_severity(input_data: dict):
    """Predicts severity for custom input features."""
    clf_path = os.path.join(MODELS_DIR, "severity_model.pkl")
    reg_path = os.path.join(MODELS_DIR, "risk_model.pkl")
    enc_path = os.path.join(MODELS_DIR, "encoders.pkl")
    
    if not (os.path.exists(clf_path) and os.path.exists(enc_path)):
        train_ml_models()
        
    clf = joblib.load(clf_path)
    reg = joblib.load(reg_path)
    encoders = joblib.load(enc_path)
    
    weather_enc = encoders['weather'].transform([input_data.get('weather', 'clear').lower()])[0] if input_data.get('weather', 'clear').lower() in encoders['weather'].classes_ else 0
    road_enc = encoders['road_type'].transform([input_data.get('road_type', 'urban').lower()])[0] if input_data.get('road_type', 'urban').lower() in encoders['road_type'].classes_ else 0
    traffic_enc = encoders['traffic_density'].transform([input_data.get('traffic_density', 'medium').lower()])[0] if input_data.get('traffic_density', 'medium').lower() in encoders['traffic_density'].classes_ else 0
    cause_enc = encoders['cause'].transform([input_data.get('cause', 'distraction').lower()])[0] if input_data.get('cause', 'distraction').lower() in encoders['cause'].classes_ else 0
    
    feature_row = [
        int(input_data.get('hour', 14)),
        int(input_data.get('is_weekend', 0)),
        int(input_data.get('lanes', 3)),
        int(input_data.get('traffic_signal', 1)),
        int(input_data.get('visibility_num', 2)),
        float(input_data.get('temperature', 28.0)),
        int(input_data.get('vehicles_involved', 2)),
        int(input_data.get('casualties', 1)),
        int(input_data.get('is_peak_hour', 0)),
        weather_enc,
        road_enc,
        traffic_enc,
        cause_enc
    ]
    
    X_sample = pd.DataFrame([feature_row], columns=FEATURE_COLS)
    
    probs = clf.predict_proba(X_sample)[0]
    pred_class_idx = int(np.argmax(probs))
    class_names = ["minor", "major", "fatal"]
    pred_label = class_names[pred_class_idx]
    
    predicted_risk = float(reg.predict(X_sample)[0])
    predicted_risk = max(0.0, min(1.0, predicted_risk))
    
    return {
        "predicted_severity": pred_label,
        "confidence": round(float(probs[pred_class_idx]), 4),
        "probabilities": {
            "minor": round(float(probs[0]), 4),
            "major": round(float(probs[1]), 4),
            "fatal": round(float(probs[2]), 4)
        },
        "predicted_risk_score": round(predicted_risk, 4),
        "risk_category": "High Risk" if predicted_risk > 0.6 else ("Moderate Risk" if predicted_risk > 0.35 else "Low Risk")
    }

if __name__ == "__main__":
    train_ml_models()
    sample = {
        "hour": 22, "is_weekend": 1, "lanes": 2, "traffic_signal": 0,
        "visibility_num": 1, "temperature": 18.0, "vehicles_involved": 3,
        "casualties": 2, "is_peak_hour": 1, "weather": "fog",
        "road_type": "highway", "traffic_density": "high", "cause": "overspeeding"
    }
    print("Sample Prediction:", predict_accident_severity(sample))
