"""
backend/rag.py — Retrieval-augmented guidelines store (Pillar 1 vector + Pillar 3 RAG).

Seeds a small corpus of Bengaluru Traffic Police enforcement guidelines and
historic congestion advisories. Uses ChromaDB + sentence-transformers when
available; otherwise falls back to a deterministic keyword-overlap retriever so
the agent always has grounded sources to cite.
"""
from __future__ import annotations

import re

BTP_GUIDELINES = [
    "BTP-001 No-Parking Enforcement: Vehicles parked in marked No-Parking zones on arterial roads must be towed within 20 minutes during peak hours (08:00-10:00, 17:00-19:00).",
    "BTP-002 Heavy Vehicle Window: HGVs, tankers and trucks are barred from CBD arterial roads 07:00-11:00 and 16:00-21:00; violations carry the highest CIS multiplier (vehicle size 10).",
    "BTP-003 Junction Priority: Violations within 50m of a major junction (e.g. Silk Board, KR Puram, Marathahalli Bridge) double the CIS (junction factor 2.0) and take dispatch priority.",
    "BTP-004 Tow Fleet Staging: Stage tow units at the upstream approach of the highest-EPI junction; one officer 200m upstream to divert, one at the hotspot to coordinate.",
    "BTP-005 Emergency Corridor Rule: Any parking that obstructs a hospital corridor (St. John's, Manipal, Apollo, NIMHANS, Vydehi) is escalated to immediate tow regardless of CIS.",
    "BTP-006 Double-Parking Severity: Double parking carries severity 10; opposite-to-parked-vehicle 9; main-road parking 8; near-junction 8; bus-stop/school/hospital 7.",
    "BTP-007 Weekend Modulation: Time factor is reduced 30% on weekends; reassign patrol hours from morning peak to commercial/market zones midday.",
    "BTP-008 Signal Coordination: For sustained CIS spikes, request BBMP signal-phase extension (+15-20s green) on the parallel diversion route before towing begins.",
    "ADV-2023-Diwali: Historic data shows commercial-zone congestion rises ~40% in the two weeks before Diwali; pre-position extra tow units near Chickpet, Commercial Street, Jayanagar 4th Block.",
    "ADV-Monsoon: During monsoon, waterlogging at Silk Board and KR Puram compounds parking congestion; raise EPI weighting for these corridors 18:00-20:00.",
]

_TOKEN = re.compile(r"[a-z0-9]+")


def _tokens(s: str) -> set[str]:
    return set(_TOKEN.findall(s.lower()))


# ── Chroma (optional) ────────────────────────────────────────────────────────
_collection = None
_BACKEND = "keyword"


def _init_chroma():
    global _collection, _BACKEND
    try:
        import chromadb
        from chromadb.utils import embedding_functions

        client = chromadb.Client()
        ef = embedding_functions.DefaultEmbeddingFunction()  # all-MiniLM-L6-v2 (downloads once)
        col = client.get_or_create_collection("btp_guidelines", embedding_function=ef)
        if col.count() == 0:
            col.add(documents=BTP_GUIDELINES, ids=[f"g{i}" for i in range(len(BTP_GUIDELINES))])
        _collection = col
        _BACKEND = "chroma"
    except Exception as exc:  # noqa: BLE001
        print(f"[rag] ChromaDB unavailable ({exc}); using keyword retriever")
        _BACKEND = "keyword"


_init_chroma()


def retrieve(query: str, k: int = 3) -> list[str]:
    """Return the top-k guideline snippets relevant to `query`."""
    if _BACKEND == "chroma" and _collection is not None:
        try:
            res = _collection.query(query_texts=[query], n_results=k)
            docs = res.get("documents", [[]])
            return docs[0] if docs else []
        except Exception:  # noqa: BLE001
            pass
    # keyword overlap fallback
    q = _tokens(query)
    scored = sorted(BTP_GUIDELINES, key=lambda d: len(q & _tokens(d)), reverse=True)
    return [d for d in scored[:k] if len(q & _tokens(d)) > 0] or scored[:k]


def backend() -> str:
    return _BACKEND
