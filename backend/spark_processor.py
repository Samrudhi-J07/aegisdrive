import time
import os
import json
import pandas as pd
from data_loader import DATA_PATH, load_raw_dataset

def run_pyspark_pipeline():
    """Executes PySpark or Pandas Big Data pipeline and returns performance analytics."""
    start_time = time.time()
    spark_available = False
    analytics_result = {}
    
    try:
        from pyspark.sql import SparkSession
        from pyspark.sql import functions as F
        
        spark = SparkSession.builder \
            .appName("RoadAccidentBigDataAnalysis") \
            .master("local[*]") \
            .config("spark.driver.memory", "2g") \
            .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
            .getOrCreate()
            
        spark.sparkContext.setLogLevel("WARN")
        
        # Read dataset into PySpark DataFrame
        df_spark = spark.read.csv(DATA_PATH, header=True, inferSchema=True)
        total_records = df_spark.count()
        
        # PySpark Aggregation 1: State & City Summary
        city_metrics = df_spark.groupBy("state", "city").agg(
            F.count("accident_id").alias("total_accidents"),
            F.sum("casualties").alias("total_casualties"),
            F.avg("risk_score").alias("avg_risk_score"),
            F.sum(F.when(F.col("accident_severity") == "fatal", 1).otherwise(0)).alias("fatal_count")
        ).orderBy(F.col("total_accidents").desc()).limit(15).toPandas().to_dict(orient="records")
        
        # PySpark Aggregation 2: Hourly Peak Trend
        hourly_metrics = df_spark.groupBy("hour").agg(
            F.count("accident_id").alias("accidents"),
            F.avg("risk_score").alias("avg_risk")
        ).orderBy("hour").toPandas().to_dict(orient="records")
        
        # PySpark Aggregation 3: Weather & Road Matrix
        weather_metrics = df_spark.groupBy("weather", "accident_severity").agg(
            F.count("accident_id").alias("count")
        ).toPandas().to_dict(orient="records")
        
        execution_time = time.time() - start_time
        spark_available = True
        spark.stop()
        
        analytics_result = {
            "engine": "PySpark 3.5 (Distributed Spark Engine)",
            "status": "Success",
            "spark_active": True,
            "total_records_processed": total_records,
            "execution_time_seconds": round(execution_time, 4),
            "throughput_records_per_sec": round(total_records / max(execution_time, 0.001), 2),
            "city_metrics": city_metrics,
            "hourly_metrics": hourly_metrics,
            "weather_metrics": weather_metrics
        }
        
    except Exception as e:
        print(f"PySpark not active or failed, running high-performance Pandas/DuckDB engine: {e}")
        # Fallback high-speed Pandas execution
        df = load_raw_dataset()
        total_records = len(df)
        
        city_metrics = df.groupby(["state", "city"]).agg(
            total_accidents=("accident_id", "count"),
            total_casualties=("casualties", "sum"),
            avg_risk_score=("risk_score", "mean"),
            fatal_count=("accident_severity", lambda s: (s == "fatal").sum())
        ).reset_index().sort_values("total_accidents", ascending=False).head(15).to_dict(orient="records")
        
        hourly_metrics = df.groupby("hour").agg(
            accidents=("accident_id", "count"),
            avg_risk=("risk_score", "mean")
        ).reset_index().sort_values("hour").to_dict(orient="records")
        
        weather_metrics = df.groupby(["weather", "accident_severity"]).agg(
            count=("accident_id", "count")
        ).reset_index().to_dict(orient="records")
        
        execution_time = time.time() - start_time
        
        analytics_result = {
            "engine": "Pandas / Vectorized In-Memory Engine (PySpark Fallback)",
            "status": "Success",
            "spark_active": False,
            "fallback_reason": str(e),
            "total_records_processed": total_records,
            "execution_time_seconds": round(execution_time, 4),
            "throughput_records_per_sec": round(total_records / max(execution_time, 0.001), 2),
            "city_metrics": city_metrics,
            "hourly_metrics": hourly_metrics,
            "weather_metrics": weather_metrics
        }
        
    return analytics_result

if __name__ == "__main__":
    res = run_pyspark_pipeline()
    print(json.dumps(res, indent=2))
