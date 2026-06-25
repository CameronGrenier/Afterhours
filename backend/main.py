from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from api.rooms import router as rooms_router
from service.room_service import room_service
from sockets.handlers import register_socket_handlers

sio = socketio.AsyncServer(
    cors_allowed_origins="*",
    async_mode="asgi",
)

def create_http_app() -> FastAPI:
    app = FastAPI(title="Afterhours Backend")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(rooms_router)

    @app.get("/status")
    async def status():
        return {"status": "success", "message": "Python server is running"}

    return app


room_service.attach_sio(sio)
fastapi_app = create_http_app()
register_socket_handlers(sio, room_service)

# This is the single ASGI entrypoint uvicorn should boot
app = socketio.ASGIApp(sio, fastapi_app)
socket_app = app
