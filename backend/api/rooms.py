from fastapi import APIRouter, Request

from schemas.rooms import GameEvent, KickPlayerData, RoomData, RoomGameRequest
from service.room_service import room_service
from service.session_service import get_session_id

router = APIRouter()


@router.post("/room_status")
async def room_status(request: RoomData):
    return await room_service.get_room_status(request)


@router.post("/create_room")
async def create_room(http_request: Request, request: RoomData):
    session_id = get_session_id(http_request)
    return await room_service.create_room(request, session_id)


@router.post("/join_room")
async def join_room(http_request: Request, request: RoomData):
    session_id = get_session_id(http_request)
    return await room_service.join_room(request, session_id)


@router.post("/leave_room")
async def leave_room(http_request: Request, request: RoomData):
    session_id = get_session_id(http_request)
    return await room_service.leave_room(request, session_id)


@router.post("/kick_player")
async def kick_player(http_request: Request, request: KickPlayerData):
    session_id = get_session_id(http_request)
    return await room_service.kick_player(request, session_id)


@router.post("/select_game")
async def select_game(http_request: Request, body: RoomGameRequest):
    session_id = get_session_id(http_request)
    return await room_service.select_game(body, session_id)


@router.post("/start_game")
async def start_game(http_request: Request, request: RoomGameRequest):
    session_id = get_session_id(http_request)
    return await room_service.start_game(request, session_id)


@router.post("/game_event")
async def game_event(http_request: Request, request: GameEvent):
    session_id = get_session_id(http_request)
    return await room_service.handle_http_game_event(request, session_id)
