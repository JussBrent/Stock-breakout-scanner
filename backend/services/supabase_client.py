import os
from supabase import create_client, Client
from postgrest import AsyncPostgrestClient
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase environment variables")

# Singleton Supabase client instance
_supabase_client: Client = None

def get_supabase_client() -> Client:
    """Get or create Supabase client instance"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client

# Direct Postgrest client (lightweight, no realtime)
class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

    def table(self, name: str):
        """Return table interface."""
        return SupabaseTable(self.url, name, self.headers)


class SupabaseTable:
    def __init__(self, url: str, table: str, headers: dict):
        self.url = f"{url}/rest/v1/{table}"
        self.headers = headers

    def insert(self, data: list):
        """Insert rows (returns self for chaining)."""
        self._insert_data = data
        return self

    async def execute(self):
        """Execute the insert operation."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.url,
                json=self._insert_data,
                headers=self.headers,
            )
            if response.status_code not in [200, 201]:
                raise Exception(f"Insert failed: {response.text}")
            return response.json()


supabase = SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
