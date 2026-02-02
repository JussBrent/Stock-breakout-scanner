import os
from postgrest import AsyncPostgrestClient
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase environment variables")

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
        self._insert_data = None
        self._update_data = None
        self._delete_mode = False
        self._select_fields = "*"
        self._filters = []
        self._order_by = None
        self._limit_val = None

    def insert(self, data: list):
        """Insert rows (returns self for chaining)."""
        self._insert_data = data
        return self

    def update(self, data: dict):
        """Update rows (returns self for chaining)."""
        self._update_data = data
        return self

    def delete(self):
        """Delete rows (returns self for chaining)."""
        self._delete_mode = True
        return self

    def select(self, fields: str = "*"):
        """Select specific fields."""
        self._select_fields = fields
        return self

    def eq(self, column: str, value):
        """Equal filter."""
        self._filters.append(f"{column}=eq.{value}")
        return self

    def gte(self, column: str, value):
        """Greater than or equal filter."""
        self._filters.append(f"{column}=gte.{value}")
        return self

    def lte(self, column: str, value):
        """Less than or equal filter."""
        self._filters.append(f"{column}=lte.{value}")
        return self

    def order(self, column: str, desc: bool = False):
        """Order results."""
        direction = "desc" if desc else "asc"
        self._order_by = f"{column}.{direction}"
        return self

    def limit(self, n: int):
        """Limit results."""
        self._limit_val = n
        return self

    async def execute(self):
        """Execute the query (INSERT, UPDATE, DELETE, or SELECT)."""
        async with httpx.AsyncClient() as client:
            # INSERT operation
            if self._insert_data is not None:
                response = await client.post(
                    self.url,
                    json=self._insert_data,
                    headers=self.headers,
                )
                if response.status_code not in [200, 201]:
                    raise Exception(f"Insert failed: {response.text}")
                return response.json()

            # UPDATE operation
            if self._update_data is not None:
                # Build query string with filters
                params = {}
                for filter_str in self._filters:
                    parts = filter_str.split("=", 1)
                    if len(parts) == 2:
                        params[parts[0]] = parts[1]

                response = await client.patch(
                    self.url,
                    json=self._update_data,
                    params=params,
                    headers=self.headers,
                )
                if response.status_code not in [200, 204]:
                    raise Exception(f"Update failed: {response.text}")
                return response.json() if response.status_code == 200 else []

            # DELETE operation
            if self._delete_mode:
                # Build query string with filters
                params = {}
                for filter_str in self._filters:
                    parts = filter_str.split("=", 1)
                    if len(parts) == 2:
                        params[parts[0]] = parts[1]

                if not params:
                    raise Exception("DELETE requires filters to prevent accidental full table deletion")

                response = await client.delete(
                    self.url,
                    params=params,
                    headers=self.headers,
                )
                if response.status_code not in [200, 204]:
                    raise Exception(f"Delete failed: {response.text}")
                return []

            # SELECT operation
            params = {"select": self._select_fields}

            # Apply filters
            for filter_str in self._filters:
                parts = filter_str.split("=", 1)
                if len(parts) == 2:
                    params[parts[0]] = parts[1]

            # Apply ordering
            if self._order_by:
                params["order"] = self._order_by

            # Apply limit
            if self._limit_val:
                params["limit"] = self._limit_val

            response = await client.get(
                self.url,
                params=params,
                headers=self.headers,
            )

            if response.status_code != 200:
                raise Exception(f"Select failed: {response.text}")

            return response.json()


supabase = SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
