from slowapi import Limiter
from slowapi.util import get_remote_address

# Global rate limiter for API protection
limiter = Limiter(key_func=get_remote_address, default_limits=["80/minute"])
