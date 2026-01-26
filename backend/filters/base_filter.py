from typing import Dict
from config import settings


class BaseFilter:
    """
    Base filtering system for stock screening.
    Applies fundamental and technical filters.
    """

    def __init__(self):
        self.min_price = settings.MIN_PRICE
        self.max_price = settings.MAX_PRICE
        self.min_volume = settings.MIN_AVG_VOLUME
        self.min_market_cap = settings.MIN_MARKET_CAP
        self.min_adr = settings.MIN_ADR_PERCENT
        self.max_atr = settings.MAX_ATR_PERCENT

    def passes_price_filter(self, price: float) -> bool:
        """Check if price is within acceptable range."""
        return self.min_price <= price <= self.max_price

    def passes_volume_filter(self, avg_volume: float) -> bool:
        """Check if average volume meets minimum."""
        return avg_volume >= self.min_volume

    def passes_market_cap_filter(self, market_cap: float | None) -> bool:
        """Check if market cap meets minimum."""
        if market_cap is None:
            return False
        return market_cap >= self.min_market_cap

    def passes_adr_filter(self, adr_pct: float) -> bool:
        """Check if ADR% meets minimum (movement potential)."""
        return adr_pct >= self.min_adr

    def passes_atr_filter(self, atr_pct: float) -> bool:
        """Check if ATR% is not too high (risk management)."""
        return atr_pct <= self.max_atr

    def passes_all_filters(self, data: Dict) -> bool:
        """
        Check if stock passes all filters.

        Args:
            data: Dictionary with keys:
                - current_price
                - avg_volume
                - market_cap (optional)
                - adr_percent
                - atr_percent (optional)

        Returns:
            True if passes all applicable filters
        """
        checks = [
            self.passes_price_filter(data.get("current_price", 0)),
            self.passes_volume_filter(data.get("avg_volume", 0)),
            self.passes_adr_filter(data.get("adr_percent", 0))
        ]

        # Optional filters
        if "market_cap" in data and data["market_cap"] is not None:
            checks.append(self.passes_market_cap_filter(data["market_cap"]))

        if "atr_percent" in data:
            checks.append(self.passes_atr_filter(data["atr_percent"]))

        return all(checks)

    def get_filter_score(self, data: Dict) -> int:
        """
        Calculate overall filter score (0-100).
        Higher score = better candidate.

        Args:
            data: Dictionary with stock data

        Returns:
            Score from 0-100
        """
        score = 0

        # Price score (20 points)
        price = data.get("current_price", 0)
        if 20 <= price <= 500:  # Sweet spot
            score += 20
        elif 10 <= price < 20 or 500 < price <= 1000:
            score += 15
        elif self.passes_price_filter(price):
            score += 10

        # Volume score (20 points)
        volume = data.get("avg_volume", 0)
        if volume >= 5_000_000:
            score += 20
        elif volume >= 2_000_000:
            score += 15
        elif volume >= 1_000_000:
            score += 10

        # Market cap score (20 points)
        mcap = data.get("market_cap")
        if mcap and mcap >= 10_000_000_000:  # $10B+
            score += 20
        elif mcap and mcap >= 2_000_000_000:  # $2B+
            score += 15
        elif mcap and mcap >= 500_000_000:  # $500M+
            score += 10

        # ADR score (20 points)
        adr = data.get("adr_percent", 0)
        if 3 <= adr <= 6:  # Ideal range
            score += 20
        elif 2 <= adr < 3 or 6 < adr <= 8:
            score += 15
        elif adr >= 2:
            score += 10

        # ATR score (20 points) - lower is better for risk
        atr = data.get("atr_percent", 0)
        if atr <= 3:
            score += 20
        elif atr <= 5:
            score += 15
        elif atr <= 8:
            score += 10
        elif atr <= self.max_atr:
            score += 5

        return score

    def get_filter_details(self, data: Dict) -> Dict:
        """
        Get detailed filter results.

        Returns:
            Dictionary with filter results and scores
        """
        return {
            "passes_all": self.passes_all_filters(data),
            "filter_score": self.get_filter_score(data),
            "individual_filters": {
                "price": {
                    "passed": self.passes_price_filter(data.get("current_price", 0)),
                    "value": data.get("current_price", 0),
                    "range": f"${self.min_price}-${self.max_price}"
                },
                "volume": {
                    "passed": self.passes_volume_filter(data.get("avg_volume", 0)),
                    "value": data.get("avg_volume", 0),
                    "minimum": self.min_volume
                },
                "market_cap": {
                    "passed": self.passes_market_cap_filter(data.get("market_cap")),
                    "value": data.get("market_cap"),
                    "minimum": self.min_market_cap
                },
                "adr": {
                    "passed": self.passes_adr_filter(data.get("adr_percent", 0)),
                    "value": data.get("adr_percent", 0),
                    "minimum": self.min_adr
                }
            }
        }
