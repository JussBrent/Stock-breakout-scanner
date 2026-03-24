"""
SnapTrade brokerage integration service.
Handles account linking, portfolio data, trade execution, and trade history.
"""
import logging
from typing import Optional
from snaptrade_client import SnapTrade
from config import settings

logger = logging.getLogger(__name__)

_client: Optional[SnapTrade] = None


def get_snaptrade_client() -> SnapTrade:
    """Get or create SnapTrade client singleton."""
    global _client
    if _client is None:
        if not settings.SNAPTRADE_CLIENT_ID or not settings.SNAPTRADE_CONSUMER_KEY:
            raise ValueError("SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY must be set")
        _client = SnapTrade(
            consumer_key=settings.SNAPTRADE_CONSUMER_KEY,
            client_id=settings.SNAPTRADE_CLIENT_ID,
        )
    return _client


class SnapTradeService:
    def __init__(self):
        self.client = get_snaptrade_client()

    # ── User Registration ──────────────────────────────────────────────
    async def register_user(self, user_id: str):
        """Register a user with SnapTrade (call once per user)."""
        try:
            response = self.client.authentication.register_snap_trade_user(
                user_id=user_id,
            )
            logger.info(f"SnapTrade user registered: {user_id}")
            return response.body
        except Exception as e:
            # User may already be registered
            if "already registered" in str(e).lower() or "exists" in str(e).lower():
                logger.info(f"SnapTrade user already registered: {user_id}")
                return {"userId": user_id}
            logger.error(f"SnapTrade register failed: {e}")
            raise

    async def delete_user(self, user_id: str):
        """Remove a user from SnapTrade."""
        try:
            response = self.client.authentication.delete_snap_trade_user(
                user_id=user_id,
            )
            return response.body
        except Exception as e:
            logger.error(f"SnapTrade delete user failed: {e}")
            raise

    # ── Connection / Linking ───────────────────────────────────────────
    async def get_login_redirect_url(self, user_id: str, user_secret: str):
        """
        Generate a redirect URL so the user can link their brokerage
        account through SnapTrade Connect.
        """
        try:
            response = self.client.authentication.login_snap_trade_user(
                user_id=user_id,
                user_secret=user_secret,
            )
            return response.body
        except Exception as e:
            logger.error(f"SnapTrade login redirect failed: {e}")
            raise

    # ── Accounts ───────────────────────────────────────────────────────
    async def list_accounts(self, user_id: str, user_secret: str):
        """List all linked brokerage accounts for a user."""
        try:
            response = self.client.account_information.list_user_accounts(
                user_id=user_id,
                user_secret=user_secret,
            )
            return response.body
        except Exception as e:
            logger.error(f"SnapTrade list accounts failed: {e}")
            raise

    async def get_account_balances(self, user_id: str, user_secret: str, account_id: str):
        """Get balances for a specific account."""
        try:
            response = self.client.account_information.get_user_account_balance(
                user_id=user_id,
                user_secret=user_secret,
                account_id=account_id,
            )
            return response.body
        except Exception as e:
            logger.error(f"SnapTrade get balances failed: {e}")
            raise

    # ── Portfolio / Holdings ───────────────────────────────────────────
    async def get_holdings(self, user_id: str, user_secret: str, account_id: str):
        """Get all positions/holdings for an account."""
        try:
            response = self.client.account_information.get_user_holdings(
                user_id=user_id,
                user_secret=user_secret,
                account_id=account_id,
            )
            return response.body
        except Exception as e:
            logger.error(f"SnapTrade get holdings failed: {e}")
            raise

    async def get_all_holdings(self, user_id: str, user_secret: str):
        """Get holdings across all linked accounts."""
        try:
            accounts = await self.list_accounts(user_id, user_secret)
            all_holdings = []
            for account in accounts:
                account_id = account.get("id") or account.get("accountId")
                if account_id:
                    raw = await self.get_holdings(user_id, user_secret, str(account_id))
                    # raw is {"account": {...}, "positions": [...]}
                    positions = raw.get("positions", []) if isinstance(raw, dict) else []
                    all_holdings.append({
                        "account": account,
                        "holdings": positions,
                    })
            return all_holdings
        except Exception as e:
            logger.error(f"SnapTrade get all holdings failed: {e}")
            raise

    # ── Trade Execution ────────────────────────────────────────────────
    async def place_order(
        self,
        user_id: str,
        user_secret: str,
        account_id: str,
        symbol: str,
        action: str,  # "BUY" or "SELL"
        order_type: str,  # "Market", "Limit", "StopLimit", "StopLoss"
        quantity: float,
        price: Optional[float] = None,
        stop_price: Optional[float] = None,
        time_in_force: str = "Day",
    ):
        """Place a trade order."""
        try:
            # Build order params
            order_params = {
                "user_id": user_id,
                "user_secret": user_secret,
                "account_id": account_id,
                "action": action,
                "order_type": order_type,
                "time_in_force": time_in_force,
                "universal_symbol_id": symbol,
            }

            if quantity:
                order_params["units"] = quantity
            if price and order_type in ("Limit", "StopLimit"):
                order_params["price"] = price
            if stop_price and order_type in ("StopLimit", "StopLoss"):
                order_params["stop"] = stop_price

            response = self.client.trading.place_force_order(**order_params)
            logger.info(f"Order placed: {action} {quantity} {symbol}")
            return response.body
        except Exception as e:
            logger.error(f"SnapTrade place order failed: {e}")
            raise

    async def get_order_impact(
        self,
        user_id: str,
        user_secret: str,
        account_id: str,
        symbol: str,
        action: str,
        order_type: str,
        quantity: float,
        price: Optional[float] = None,
    ):
        """Preview order impact before placing."""
        try:
            params = {
                "user_id": user_id,
                "user_secret": user_secret,
                "account_id": account_id,
                "action": action,
                "order_type": order_type,
                "time_in_force": "Day",
                "universal_symbol_id": symbol,
            }
            if quantity:
                params["units"] = quantity
            if price:
                params["price"] = price

            response = self.client.trading.get_order_impact(**params)
            return response.body
        except Exception as e:
            logger.error(f"SnapTrade order impact failed: {e}")
            raise

    # ── Trade History / Activities ─────────────────────────────────────
    async def get_activities(
        self,
        user_id: str,
        user_secret: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        account_id: Optional[str] = None,
    ):
        """Get trade/activity history."""
        try:
            params = {
                "user_id": user_id,
                "user_secret": user_secret,
            }
            if start_date:
                params["start_date"] = start_date
            if end_date:
                params["end_date"] = end_date
            if account_id:
                params["accounts"] = account_id

            response = self.client.transactions_and_reporting.get_activities(**params)
            return response.body
        except Exception as e:
            logger.error(f"SnapTrade get activities failed: {e}")
            raise

    # ── Supported Brokerages ───────────────────────────────────────────
    async def list_brokerages(self):
        """List all supported brokerages."""
        try:
            response = self.client.connections.list_brokerage_authorizations()
            return response.body
        except Exception as e:
            logger.error(f"SnapTrade list brokerages failed: {e}")
            raise

    # ── Symbol Search ──────────────────────────────────────────────────
    async def search_symbols(self, query: str):
        """Search for a symbol in SnapTrade's universal symbol database."""
        try:
            response = self.client.reference_data.get_symbols(
                substring=query,
            )
            return response.body
        except Exception as e:
            logger.error(f"SnapTrade symbol search failed: {e}")
            raise
