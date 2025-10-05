from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from typing import Dict, Any
from db_utils import read_db, write_db

app = FastAPI()

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
frontend_path = os.path.join(BASE_DIR, "frontend")
favicon_path = os.path.join(BASE_DIR, "favicon.ico")

# Serve frontend static files
app.mount("/frontend", StaticFiles(directory=frontend_path), name="frontend")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/data")
def get_data() -> Dict[str, Any]:
    """Fetch all data from the database."""
    return read_db()

@app.post("/api/data")
def save_data(data: Dict[str, Any]) -> Dict[str, bool]:
    """Save the entire data to the database."""
    write_db(data)
    return {"success": True}

@app.patch("/api/data/{field}")
def update_field(field: str, value: Any = Body(...)):
    """Update a specific field in the database."""
    db = read_db() or {}
    db[field] = value
    write_db(db)
    return {"success": True, "updated": {field: db[field]}}

@app.get("/")
async def root() -> FileResponse:
    """Serve the homepage."""
    return FileResponse(os.path.join(frontend_path, "pages", "homepage.html"))

@app.get("/favicon.ico")
async def favicon() -> FileResponse:
    """Serve the favicon."""
    return FileResponse(favicon_path)
