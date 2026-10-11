import os
import sys
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from data_loader import load_raw_dataset

router = APIRouter(prefix="/chat", tags=["Chatbot"])

# Load cleaned dataset into memory
DF = load_raw_dataset()

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    reply: str
    intent: str
    data: Optional[Dict[str, Any]] = None
    chart: Optional[Dict[str, Any]] = None
    suggestions: List[str] = []
    actions: List[Dict[str, str]] = []

def detect_intent(msg: str) -> str:
    """Classify user message into intent categories."""
    m = msg.lower()
    if any(w in m for w in ["predict", "what if", "simulate", "model", "forecast"]):
        return "PREDICTION"
    if any(w in m for w in ["go to", "open", "navigate", "take me to"]):
        return "NAVIGATION"
    if any(w in m for w in ["what time", "which hour", "when", "peak", "rush hour", "hour"]):
        return "TIME"
    if any(w in m for w in ["weather", "fog", "rain", "temperature", "visibility"]):
        return "WEATHER"
    if any(w in m for w in ["cause", "reason", "why", "driver", "overspeeding", "drunk"]):
        return "CAUSE"
    if any(w in m for w in ["compare", " vs ", "versus", "difference"]):
        return "COMPARISON"
    if any(w in m for w in ["top", "highest", "most", "worst", "rank"]):
        return "TOP_N"
    if any(w in m for w in ["what is", "define", "meaning"]):
        return "DEFINITION"
    if any(w in m for w in ["help", "what can you", "how to", "who are you", "hello", "hi"]):
        return "HELP"
    if any(w in m for w in ["how many", "count", "total", "number", "statistic", "fatalities"]):
        return "STATS"
    return "UNKNOWN"

def extract_city(msg: str) -> Optional[str]:
    """Find city mentioned in message."""
    cities = DF["city"].unique().tolist()
    m = msg.lower()
    for c in cities:
        if c.lower() in m:
            return c
    return None

def extract_state(msg: str) -> Optional[str]:
    """Find state mentioned in message."""
    states = DF["state"].unique().tolist()
    m = msg.lower()
    for s in states:
        if s.lower() in m:
            return s
    return None

@router.post("/message", response_model=ChatResponse)
def chat(payload: ChatMessage):
    msg = payload.message.strip()
    intent = detect_intent(msg)
    city = extract_city(msg)
    state = extract_state(msg)

    # 1. STATS INTENT
    if intent == "STATS":
        if city:
            sub = DF[DF["city"] == city]
            fatal_count = int((sub['accident_severity'] == 'fatal').sum())
            return ChatResponse(
                reply=f"**{city}** recorded **{len(sub):,} accidents** with "
                      f"**{int(sub['casualties'].sum()):,} casualties** and "
                      f"**{fatal_count:,} fatalities**. "
                      f"Average hotspot risk score: **{(sub['risk_score'].mean() * 100):.1f}/100**.",
                intent=intent,
                data={"city": city, "total": len(sub), "fatal": fatal_count},
                suggestions=[
                    f"What causes accidents in {city}?",
                    f"Compare {city} vs Delhi",
                    f"Show {city} on map",
                ],
                actions=[{"label": f"View {city} on Map", "route": "map"}],
            )
        elif state:
            sub = DF[DF["state"] == state]
            fatal_count = int((sub['accident_severity'] == 'fatal').sum())
            return ChatResponse(
                reply=f"In **{state}**, there are **{len(sub):,} recorded accidents**, "
                      f"**{int(sub['casualties'].sum()):,} casualties**, and "
                      f"**{fatal_count:,} fatal crashes** (Fatality rate: {(fatal_count/len(sub)*100):.1f}%).",
                intent=intent,
                data={"state": state, "total": len(sub)},
                suggestions=[f"Top cities in {state}", f"Compare {state} vs Maharashtra"],
                actions=[{"label": "Explore Map", "route": "map"}],
            )
        else:
            top_state = DF['state'].value_counts().idxmax()
            return ChatResponse(
                reply=f"Across India, the platform analyzes **{len(DF):,} accidents** with "
                      f"**{int(DF['casualties'].sum()):,} total casualties** and "
                      f"**{int((DF['accident_severity'] == 'fatal').sum()):,} fatalities**. "
                      f"Highest incident state: **{top_state}**.",
                intent=intent,
                suggestions=["Top 5 cities by accidents", "Which hour has most crashes?", "How does fog affect severity?"],
                actions=[{"label": "View Full Dashboard", "route": "dashboard"}],
            )

    # 2. TOP_N INTENT
    if intent == "TOP_N":
        match = re.search(r"top\s+(\d+)", msg.lower())
        n = int(match.group(1)) if match else 5
        n = min(max(n, 3), 10)
        
        if "fatal" in msg.lower():
            top = (DF[DF["accident_severity"] == "fatal"]
                   .groupby("city").size()
                   .sort_values(ascending=False).head(n))
            reply = f"Top {n} cities by **fatal accidents**:\n\n" + \
                    "\n".join(f"{i+1}. **{c}** — {v:,} fatal crashes" 
                              for i, (c, v) in enumerate(top.items()))
            chart = {
                "type": "bar",
                "data": [{"name": c, "value": int(v)} for c, v in top.items()]
            }
        else:
            top = DF.groupby("city").size().sort_values(ascending=False).head(n)
            reply = f"Top {n} cities by **total accident volume**:\n\n" + \
                    "\n".join(f"{i+1}. **{c}** — {v:,} accidents" 
                              for i, (c, v) in enumerate(top.items()))
            chart = {
                "type": "bar",
                "data": [{"name": c, "value": int(v)} for c, v in top.items()]
            }
        
        return ChatResponse(
            reply=reply,
            intent=intent,
            chart=chart,
            suggestions=["Show top cities on map", "What time has the most accidents?", "Compare Delhi vs Mumbai"],
            actions=[{"label": "View on Map", "route": "map"}],
        )

    # 3. TIME INTENT
    if intent == "TIME":
        hourly = DF.groupby("hour").size()
        peak = int(hourly.idxmax())
        peak_volume = int(hourly.max())
        rush_pct = float(hourly.loc[16:20].sum() / len(DF) * 100) if 16 in hourly.index else 25.0
        
        return ChatResponse(
            reply=f"🕒 **Peak crash hour: {peak}:00** with **{peak_volume:,} accidents**.\n\n"
                  f"Evening rush hours (**16:00–20:00**) account for **{rush_pct:.1f}%** of all collisions. "
                  f"Traffic density and reduced visibility compound risk during these intervals.",
            intent=intent,
            chart={
                "type": "area",
                "data": [{"name": f"{h}:00", "value": int(c)} for h, c in hourly.items()]
            },
            suggestions=["Compare weekends vs weekdays", "How does weather affect risk?", "Test in Simulator"],
            actions=[{"label": "Open Policy Simulator", "route": "simulator"}],
        )

    # 4. WEATHER INTENT
    if intent == "WEATHER":
        weather_stats = (DF.groupby("weather")
                         .agg(total=("accident_id", "count"),
                              fatal=("accident_severity", lambda s: (s == "fatal").sum()),
                              avg_risk=("risk_score", "mean")))
        fog_row = weather_stats.loc["fog"] if "fog" in weather_stats.index else None
        clear_row = weather_stats.loc["clear"] if "clear" in weather_stats.index else None
        
        lift_str = "1.8× higher"
        if fog_row is not None and clear_row is not None and clear_row["fatal"] > 0:
            lift = (fog_row["fatal"] / fog_row["total"]) / (clear_row["fatal"] / clear_row["total"])
            lift_str = f"{lift:.1f}× higher"
            
        return ChatResponse(
            reply=f"🌦️ **Fog & Low Visibility are the deadliest environmental hazards.**\n\n"
                  f"Accidents in fog show a fatality rate **{lift_str}** than clear conditions. "
                  f"Average hotspot risk index rises to **{(weather_stats['avg_risk'].max() * 100):.1f}/100** during dense fog and severe rainfall.",
            intent=intent,
            chart={
                "type": "bar",
                "data": [{"name": k.title(), "value": int(v["fatal"])} for k, v in weather_stats.iterrows()]
            },
            suggestions=["What causes the most fatal accidents?", "Predict severity for fog + highway", "Show map hotspots"],
            actions=[{"label": "Simulate Weather in What-If", "route": "simulator"}],
        )

    # 5. CAUSE INTENT
    if intent == "CAUSE":
        cause_stats = (DF.groupby("cause")
                       .agg(total=("accident_id", "count"),
                            fatalities=("accident_severity", lambda s: (s == "fatal").sum())))
        cause_stats["fatality_rate"] = (cause_stats["fatalities"] / cause_stats["total"] * 100).round(1)
        worst_cause = cause_stats["fatality_rate"].idxmax()
        most_common = cause_stats["total"].idxmax()
        
        return ChatResponse(
            reply=f"🚗 **Primary Crash Drivers**:\n\n"
                  f"• **Most Frequent**: **{most_common.title()}** ({cause_stats.loc[most_common, 'total']:,} incidents)\n"
                  f"• **Deadliest Per Crash**: **{worst_cause.title()}** with a **{cause_stats.loc[worst_cause, 'fatality_rate']}%** fatality rate.\n\n"
                  f"Driver distraction from smartphone use and nighttime overspeeding remain top targets for enforcement.",
            intent=intent,
            chart={
                "type": "bar",
                "data": [{"name": c.title(), "value": int(v["total"])} for c, v in cause_stats.iterrows()]
            },
            suggestions=["Predict severity for drunk driving", "Compare causes in Mumbai", "View ML Metrics"],
            actions=[{"label": "Test ML Predictor", "route": "predict"}],
        )

    # 6. COMPARISON INTENT
    if intent == "COMPARISON":
        cities = [c for c in DF["city"].unique() if c.lower() in msg.lower()]
        if len(cities) >= 2:
            a, b = cities[0], cities[1]
            da, db = DF[DF["city"] == a], DF[DF["city"] == b]
            return ChatResponse(
                reply=f"⚖️ **Comparison: {a} vs {b}**\n\n"
                      f"• **Total Accidents**: {len(da):,} vs {len(db):,}\n"
                      f"• **Fatal Crashes**: {(da['accident_severity'] == 'fatal').sum():,} vs {(db['accident_severity'] == 'fatal').sum():,}\n"
                      f"• **Total Casualties**: {int(da['casualties'].sum()):,} vs {int(db['casualties'].sum()):,}\n"
                      f"• **Avg Risk Index**: {(da['risk_score'].mean() * 100):.1f}/100 vs {(db['risk_score'].mean() * 100):.1f}/100",
                intent=intent,
                chart={
                    "type": "bar",
                    "data": [
                        {"name": f"{a} Total", "value": len(da)},
                        {"name": f"{b} Total", "value": len(db)},
                        {"name": f"{a} Fatal", "value": int((da['accident_severity'] == 'fatal').sum())},
                        {"name": f"{b} Fatal", "value": int((db['accident_severity'] == 'fatal').sum())}
                    ]
                },
                suggestions=[f"Show {a} on map", f"Show {b} on map", "Top 5 cities by fatalities"],
                actions=[{"label": "View Both on Map", "route": "map"}],
            )
        else:
            return ChatResponse(
                reply="Which two cities would you like to compare? For example, try:\n\n"
                      "• *'Compare Delhi vs Mumbai'*\n"
                      "• *'Compare Bangalore vs Pune'*",
                intent=intent,
                suggestions=["Compare Delhi vs Mumbai", "Compare Bangalore vs Hyderabad", "Top 5 cities by accidents"],
            )

    # 7. PREDICTION INTENT
    if intent == "PREDICTION":
        return ChatResponse(
            reply="🧠 **AI Predictive Inference Available!**\n\n"
                  "You can use our trained **XGBoost Multi-Class Classifier** and **RandomForest Risk Regressor** "
                  "to forecast crash severity and probability scores under custom environmental variables.\n\n"
                  "Would you like to open the **ML Predictor** or test parameters in the **What-If Simulator**?",
            intent=intent,
            actions=[
                {"label": "Open ML Predictor", "route": "predict"},
                {"label": "Open Policy Simulator", "route": "simulator"}
            ],
            suggestions=["Predict for fog + highway + drunk", "What causes fatal accidents?", "View model evaluation metrics"],
        )

    # 8. NAVIGATION INTENT
    if intent == "NAVIGATION":
        routes = {
            "map": ("Hotspot Map", "map"),
            "hotspot": ("Hotspot Map", "map"),
            "predict": ("ML Predictor", "predict"),
            "prediction": ("ML Predictor", "predict"),
            "simulator": ("What-If Simulator", "simulator"),
            "what if": ("What-If Simulator", "simulator"),
            "policy": ("What-If Simulator", "simulator"),
            "spark": ("Big Data (Spark)", "bigdata"),
            "big data": ("Big Data (Spark)", "bigdata"),
            "metric": ("Model Evaluation", "metrics"),
            "evaluation": ("Model Evaluation", "metrics"),
            "upload": ("Upload & Analyze", "upload"),
            "dashboard": ("Dashboard Overview", "dashboard"),
        }
        for kw, (title, target_route) in routes.items():
            if kw in msg.lower():
                return ChatResponse(
                    reply=f"Navigating to the **{title}** view for you right now.",
                    intent=intent,
                    actions=[{"label": f"Go to {title}", "route": target_route}],
                )

    # 9. DEFINITION INTENT
    if intent == "DEFINITION":
        if "risk" in msg.lower():
            return ChatResponse(
                reply="📐 **Hotspot Risk Score**: A 0.0 to 1.0 (or 0–100) normalized index synthesized from "
                      "weather adversity, lighting/visibility limits, traffic congestion levels, speed differentials, "
                      "and historical casualty density. Higher numbers indicate elevated hazard zones.",
                intent=intent,
                suggestions=["What time has highest risk?", "How does fog affect risk?", "View ML Metrics"],
            )
        if "severity" in msg.lower():
            return ChatResponse(
                reply="🚨 **Accident Severity Tiers**:\n\n"
                      "• **Fatal**: Resulted in 1 or more fatalities on scene.\n"
                      "• **Major**: Resulted in severe physical injury requiring hospitalization or structural write-off.\n"
                      "• **Minor**: Superficial damage or non-hospitalized injuries.",
                intent=intent,
                suggestions=["What causes fatal accidents?", "Predict severity"],
            )
        return ChatResponse(
            reply="I can explain terms such as **Risk Score**, **Accident Severity**, **Peak Hours**, and **Feature Importance**.",
            intent=intent,
            suggestions=["What is risk score?", "What is accident severity?"],
        )

    # 10. HELP / GREETING INTENT
    if intent == "HELP":
        return ChatResponse(
            reply="👋 I'm **Aegis AI**, your offline road accident intelligence assistant! Here is what I can do for you:\n\n"
                  "• 📊 **Query Statistics**: *'How many accidents in Mumbai?'*\n"
                  "• ⚖️ **Compare Regions**: *'Compare Delhi vs Mumbai'*\n"
                  "• 🏆 **Rankings**: *'Top 5 cities by fatal crashes'*\n"
                  "• 🕒 **Temporal Insights**: *'What time has the most accidents?'*\n"
                  "• 🌦️ **Weather Hazards**: *'How does fog affect severity?'*\n"
                  "• 🚗 **Crash Drivers**: *'What causes the most fatal crashes?'*\n"
                  "• 🧠 **Navigate to ML Tools**: *'Take me to predictor'*\n\n"
                  "Ask me anything or tap one of the suggestions below!",
            intent=intent,
            suggestions=[
                "How many accidents in Mumbai?",
                "Top 5 cities by fatal accidents",
                "What time has the most accidents?",
                "How does fog affect severity?"
            ],
            actions=[{"label": "Explore Hotspots", "route": "map"}],
        )

    # Fallback response
    return ChatResponse(
        reply="I didn't quite catch that, but I can help you analyze the dataset! Try asking:\n\n"
              "• *'How many accidents in Delhi?'*\n"
              "• *'Top 5 cities by fatal accidents'*\n"
              "• *'What time has the most crashes?'*\n"
              "• *'How does fog impact severity?'*",
        intent="UNKNOWN",
        suggestions=[
            "How many accidents in Mumbai?",
            "Top 5 cities by fatal accidents",
            "What causes fatal accidents?",
            "Take me to the map"
        ],
    )
