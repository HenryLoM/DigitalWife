"""Backend package initializer."""

from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent))

__all__ = ["main", "db_utils"]
