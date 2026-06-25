import os

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import socketio

from api.rooms import router as rooms_router
from service.session_service import (
    COOKIE_NAME,
    SESSIONS,
    create_session,
    get_session_id,
)
from service.room_service import room_service
from sockets.handlers import register_socket_handlers

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false")
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")


sio = socketio.AsyncServer(
    cors_allowed_origins=[FRONTEND_ORIGIN],
    async_mode="asgi",
)

def create_http_app() -> FastAPI:
    app = FastAPI(title="Afterhours Backend")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[FRONTEND_ORIGIN],
        allow_credentials = True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(rooms_router)

    @app.get("/status")
    async def status():
        return {"status": "success", "message": "Python server is running"}

    @app.get("/session")
    async def session(request: Request, response: Response):
        session_id = get_session_id(request)
        if session_id is None or session_id not in SESSIONS:
            session_id = create_session()
            response.set_cookie(
                key = COOKIE_NAME,
                value = session_id,
                httponly = True,
                secure = False, #dev only
                samesite = "lax",
            )

        return {"status": "success", "has_session": True}

    return app


room_service.attach_sio(sio)
fastapi_app = create_http_app()
register_socket_handlers(sio, room_service)

# This is the single ASGI entrypoint uvicorn should boot
app = socketio.ASGIApp(sio, fastapi_app)
socket_app = app
