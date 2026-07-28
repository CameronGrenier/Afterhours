from typing import Any, Dict, Optional

from pydantic import BaseModel


class RoomData(BaseModel):
    username: str
    code: Optional[str] = None
    sid: Optional[str] = None


class GameEvent(BaseModel):
    username: str
    code: str
    event_type: str
    data: Dict[str, Any]


class RoomGameRequest(BaseModel):
    code: str
    game_id: Optional[str] = None
    # Socket id of the caller, used to verify the host by connection identity.
    sid: Optional[str] = None


class KickPlayerData(BaseModel):
    sid: str
    code: str
    targetUsername: str
