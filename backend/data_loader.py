import os
import pandas as pd
import numpy as np

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "indian_roads_dataset.csv")
PARQUET_PATH = os.path.join(os.path.dirname(__file__), "data", "processed_accidents.parquet")

def load_raw_dataset() -> pd.DataFrame:
    """Loads raw dataset from CSV or cached Parquet."""
    if os.path.exists(PARQUET_PATH):
        try:
            return pd.read_parquet(PARQUET_PATH)
        except Exception:
            pass
    
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")
    
    df = pd.read_csv(DATA_PATH)
    df = clean_dataset(df)
    try:
        df.to_parquet(PARQUET_PATH, index=False)
    except Exception as e:
        print(f"Warning: Could not save parquet cache: {e}")
    return df

def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Cleans missing values, formats data types, and computes derived metrics."""
    df = df.copy()
    
    # Fill missing values
    df['weather'] = df['weather'].fillna('clear').str.lower().str.strip()
    df['road_type'] = df['road_type'].fillna('urban').str.lower().str.strip()
    df['traffic_density'] = df['traffic_density'].fillna('medium').str.lower().str.strip()
    df['cause'] = df['cause'].fillna('unknown').str.lower().str.strip()
    df['accident_severity'] = df['accident_severity'].fillna('minor').str.lower().str.strip()
    df['festival'] = df['festival'].fillna('None')
    
    # Ensure numeric types
    numeric_cols = ['latitude', 'longitude', 'hour', 'lanes', 'traffic_signal',
                    'visibility_numeric', 'temperature', 'vehicles_involved',
                    'casualties', 'is_weekend', 'is_peak_hour', 'risk_score']
    
    # Map visibility if text
    if 'visibility' in df.columns and df['visibility'].dtype == 'object':
        vis_map = {'low': 1, 'medium': 2, 'high': 3}
        df['visibility_num'] = df['visibility'].str.lower().map(vis_map).fillna(2)
    else:
        df['visibility_num'] = df.get('visibility', 2)
        
    df['hour'] = pd.to_numeric(df['hour'], errors='coerce').fillna(12).astype(int)
    df['lanes'] = pd.to_numeric(df['lanes'], errors='coerce').fillna(2).astype(int)
    df['casualties'] = pd.to_numeric(df['casualties'], errors='coerce').fillna(0).astype(int)
    df['vehicles_involved'] = pd.to_numeric(df['vehicles_involved'], errors='coerce').fillna(1).astype(int)
    df['risk_score'] = pd.to_numeric(df['risk_score'], errors='coerce').fillna(0.5)

    # Derived fields
    df['severity_score'] = df['accident_severity'].map({'minor': 1, 'major': 2, 'fatal': 3}).fillna(1)
    
    return df

if __name__ == "__main__":
    df = load_raw_dataset()
    print(f"Dataset successfully loaded! Shape: {df.shape}")
    print(df.head())
