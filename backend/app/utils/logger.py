"""
Shared logging configuration.
Import `logger` anywhere instead of calling logging.getLogger() repeatedly.
"""

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger("heartpredict")