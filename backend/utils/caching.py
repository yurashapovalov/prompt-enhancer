from typing import Dict, Any, TypeVar, Generic, Callable, Awaitable, Optional
import time
import hashlib
import functools
import logging
from ..config.settings import settings

# Logger for cache operations
logger = logging.getLogger("cache")

T = TypeVar('T')

class Cache(Generic[T]):
    """
    Simple in-memory cache with TTL
    """
    def __init__(self, ttl: int = settings.CACHE_TTL):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl

    def get(self, key: str) -> Optional[T]:
        """
        Get value from cache if it exists and is not expired
        """
        if key in self.cache:
            cache_data = self.cache[key]
            if time.time() - cache_data["timestamp"] < self.ttl:
                logger.debug(f"Cache hit for key: {key}")
                return cache_data["data"]
            else:
                logger.debug(f"Cache expired for key: {key}")
        else:
            logger.debug(f"Cache miss for key: {key}")
        return None

    def set(self, key: str, data: T) -> None:
        """
        Set value in cache with current timestamp
        """
        self.cache[key] = {
            "data": data,
            "timestamp": time.time()
        }
        logger.debug(f"Cache set for key: {key}")

    def clear(self) -> None:
        """
        Clear all cache
        """
        self.cache.clear()
        logger.debug("Cache cleared")

    def remove_expired(self) -> None:
        """
        Remove all expired cache entries
        """
        current_time = time.time()
        keys_to_remove = [
            key for key, data in self.cache.items()
            if current_time - data["timestamp"] >= self.ttl
        ]
        for key in keys_to_remove:
            del self.cache[key]

        if keys_to_remove:
            logger.debug(f"Removed {len(keys_to_remove)} expired cache entries")

def cached(cache: Cache, key_func: Optional[Callable] = None):
    """
    Decorator for caching function results

    Args:
        cache: Cache instance to use
        key_func: Function to generate cache key from function arguments
                  If None, a hash of the arguments will be used
    """
    def decorator(func: Callable[..., Awaitable[T]]):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default to hash of arguments
                args_str = str(args) + str(kwargs)
                cache_key = hashlib.md5(args_str.encode()).hexdigest()

            # Check cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result)
            return result
        return wrapper
    return decorator

# Create global cache instances
response_cache = Cache[Any](ttl=settings.CACHE_TTL)
