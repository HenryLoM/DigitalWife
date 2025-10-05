import json
from pathlib import Path
from typing import Any
import tempfile
import os

DB_FILE = Path(__file__).parent / "db.json"


def read_db() -> dict[str, Any]:
    """Read the database from the JSON file."""
    try:
        if not DB_FILE.exists():
            return {}
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        # If file is corrupted or unreadable, return empty dict to avoid crashes.
        return {}


def write_db(data: dict) -> None:
    """Atomically write the database to the JSON file."""
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=str(DB_FILE.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        # Atomic replace
        os.replace(tmp_path, DB_FILE)
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
