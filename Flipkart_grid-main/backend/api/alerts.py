"""
backend/alerts.py — Active-alert anomaly detection (Pillar 6).

Two complementary detectors on per-station daily aggregates:
  • Rolling/global z-score on daily violation counts (always available).
  • IsolationForest on [count, avg_cis] (scikit-learn; optional, auto-skipped).

Returns a ranked "active alerts" feed the agent can fold into its context.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def _daily(df: pd.DataFrame) -> pd.DataFrame:
    d = df.dropna(subset=["created_datetime"]).copy()
    d["date"] = d["created_datetime"].dt.date
    g = (
        d.groupby(["police_station", "date"], observed=True)
        .agg(count=("cis", "size"), avg_cis=("cis", "mean"))
        .reset_index()
    )
    return g


def detect(df: pd.DataFrame, top: int = 8) -> list[dict]:
    """Return up to `top` active alerts, highest severity first."""
    daily = _daily(df)
    if daily.empty:
        return []

    alerts: list[dict] = []

    # ── z-score per station ──
    for stn, grp in daily.groupby("police_station", observed=True):
        if len(grp) < 3:
            continue
        mu, sigma = grp["count"].mean(), grp["count"].std()
        if not sigma or sigma < 1:
            continue
        g = grp.copy()
        g["z"] = (g["count"] - mu) / sigma
        worst = g.loc[g["z"].idxmax()]
        if worst["z"] > 2.0:
            alerts.append(
                {
                    "station": str(stn),
                    "date": str(worst["date"]),
                    "metric": "daily_count",
                    "value": int(worst["count"]),
                    "expected": round(float(mu), 1),
                    "z": round(float(worst["z"]), 2),
                    "avg_cis": round(float(worst["avg_cis"]), 1),
                    "severity": "critical" if worst["z"] > 3 else "high",
                    "method": "z-score",
                    "msg": f"{stn}: {int(worst['count'])} violations on {worst['date']} ({worst['z']:.1f}σ above its {mu:.0f} baseline)",
                }
            )

    # ── IsolationForest (optional) ──
    try:
        from sklearn.ensemble import IsolationForest

        feats = daily[["count", "avg_cis"]].to_numpy(dtype=float)
        if len(feats) >= 12:
            iso = IsolationForest(contamination=0.06, random_state=42)
            flags = iso.fit_predict(feats)
            scores = -iso.score_samples(feats)  # higher = more anomalous
            flagged_idx = np.where(flags == -1)[0]
            seen = {(a["station"], a["date"]) for a in alerts}
            for i in sorted(flagged_idx, key=lambda j: -scores[j]):
                r = daily.iloc[i]
                key = (str(r["police_station"]), str(r["date"]))
                if key in seen:
                    continue
                alerts.append(
                    {
                        "station": str(r["police_station"]),
                        "date": str(r["date"]),
                        "metric": "count+cis",
                        "value": int(r["count"]),
                        "expected": None,
                        "z": round(float(scores[i]), 2),
                        "avg_cis": round(float(r["avg_cis"]), 1),
                        "severity": "high",
                        "method": "isolation-forest",
                        "msg": f"{r['police_station']}: unusual count/CIS combination on {r['date']} (IF score {scores[i]:.2f})",
                    }
                )
    except Exception:  # noqa: BLE001
        pass

    sev_rank = {"critical": 0, "high": 1, "medium": 2}
    alerts.sort(key=lambda a: (sev_rank.get(a["severity"], 3), -a["z"]))
    return alerts[:top]
