from typing import List, Literal
from pydantic import BaseModel


class Candle(BaseModel):
    t: int  # unix ms
    o: float
    h: float
    l: float
    c: float
    v: float


class ScanResult(BaseModel):
    symbol: str
    price: float

    trigger_price: float  # breakout level
    distance_pct: float  # how close to trigger

    adr_pct_14: float  # average daily range %

    ema21: float
    ema50: float
    ema200: float

    avg_vol_50: float
    market_cap: float | None = None

    setup_type: Literal["FLAT_TOP", "WEDGE", "FLAG", "BASE", "UNKNOWN"]
    breakout_score: int

    notes: List[str]  # "tight range", "vol contraction", etc.
