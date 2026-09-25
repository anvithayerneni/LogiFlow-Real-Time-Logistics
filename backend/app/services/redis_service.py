import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.logging import logger


class RedisService:
    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None
        self._in_memory_store: Dict[str, str] = {}
        self._is_connected = False

    async def connect(self) -> None:
        """Connects to Redis server if available."""
        if not settings.REDIS_ENABLED:
            logger.info("Redis disabled via config. Using in-memory fallback store.")
            return

        try:
            self._redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2.0,
            )
            await self._redis.ping()
            self._is_connected = True
            logger.info(f"Connected to Redis at {settings.REDIS_URL}")
        except Exception as e:
            logger.warning(
                f"Could not connect to Redis ({str(e)}). Using high-performance in-memory cache."
            )
            self._is_connected = False

    async def close(self) -> None:
        if self._redis and self._is_connected:
            await self._redis.close()
            self._is_connected = False

    async def set_driver_location(
        self,
        driver_id: str,
        latitude: float,
        longitude: float,
        delivery_id: Optional[str] = None,
        speed: Optional[float] = None,
        heading: Optional[float] = None,
    ) -> None:
        """Updates driver's latest geospatial position and metadata."""
        data = {
            "driver_id": driver_id,
            "latitude": latitude,
            "longitude": longitude,
            "delivery_id": delivery_id or "",
            "speed": speed or 0.0,
            "heading": heading or 0.0,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        val_str = json.dumps(data)
        key = f"driver:{driver_id}:location"

        if self._is_connected and self._redis:
            try:
                await self._redis.set(key, val_str, ex=3600)  # 1 hr TTL
                # Also index active driver
                await self._redis.sadd("active_driver_ids", driver_id)
            except Exception as e:
                logger.error(f"Redis set_driver_location failed: {str(e)}")
                self._in_memory_store[key] = val_str
        else:
            self._in_memory_store[key] = val_str

    async def get_driver_location(self, driver_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves driver's latest cached location."""
        key = f"driver:{driver_id}:location"
        if self._is_connected and self._redis:
            try:
                raw = await self._redis.get(key)
                if raw:
                    return json.loads(raw)
            except Exception as e:
                logger.error(f"Redis get_driver_location error: {str(e)}")

        raw_mem = self._in_memory_store.get(key)
        return json.loads(raw_mem) if raw_mem else None

    async def cache_set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        val_str = json.dumps(value)
        if self._is_connected and self._redis:
            try:
                await self._redis.set(key, val_str, ex=ttl_seconds)
                return
            except Exception:
                pass
        self._in_memory_store[key] = val_str

    async def cache_get(self, key: str) -> Optional[Any]:
        if self._is_connected and self._redis:
            try:
                raw = await self._redis.get(key)
                if raw:
                    return json.loads(raw)
            except Exception:
                pass
        raw_mem = self._in_memory_store.get(key)
        return json.loads(raw_mem) if raw_mem else None


redis_service = RedisService()
