from fastapi import APIRouter

from schemas.rooms import GameEvent, KickPlayerData, RoomData, RoomGameRequest
from service.room_service import room_service

router = APIRouter()


@router.post("/room_status")
async def room_status(request: RoomData):
    return await room_service.get_room_status(request)


@router.post("/create_room")
async def create_room(request: RoomData):
    return await room_service.create_room(request)


@router.post("/join_room")
async def join_room(request: RoomData):
    return await room_service.join_room(request)


@router.post("/leave_room")
async def leave_room(request: RoomData):
    return await room_service.leave_room(request)


@router.post("/kick_player")
async def kick_player(request: KickPlayerData):
    return await room_service.kick_player(request)


@router.post("/select_game")
async def select_game(request: RoomGameRequest):
    return await room_service.select_game(request)


@router.post("/start_game")
async def start_game(request: RoomGameRequest):
    return await room_service.start_game(request)


@router.post("/game_event")
async def game_event(request: GameEvent):
    return await room_service.handle_http_game_event(request)
