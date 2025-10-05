import threading
import atexit
import webview
from uvicorn import Config, Server
from backend.main import app

# Server settings
HOST = "127.0.0.1"
PORT = 8000

# Global container for the Uvicorn server
_uvicorn_server: Server | None = None


def run_uvicorn() -> None:
    """Start Uvicorn server for the FastAPI app in a background thread."""
    global _uvicorn_server
    config = Config(app=app, host=HOST, port=PORT, log_level="info")
    _uvicorn_server = Server(config=config)
    _uvicorn_server.run()  # Blocks until shutdown is requested


def stop_uvicorn() -> None:
    """Request Uvicorn server shutdown if it is running."""
    if _uvicorn_server:
        _uvicorn_server.should_exit = True


# Stop Uvicorn when the interpreter exits
atexit.register(stop_uvicorn)

# Start Uvicorn in a background thread
threading.Thread(target=run_uvicorn, daemon=True).start()

# Create the PyWebview window
window = webview.create_window(
    title="DigitalWife",
    url=f"http://{HOST}:{PORT}/",
    width=1200,
    height=800,
    resizable=True,
)

try:
    webview.start()
finally:
    stop_uvicorn()
    print("Uvicorn server stopped.")
