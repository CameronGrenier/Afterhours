"""
Afterhours backend tests.

To run:
  docker compose exec backend pytest test_backend.py -v
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import pytest
from fastapi.testclient import TestClient

from main import create_http_app
from service.room_service import room_service
from service.session_service import SESSIONS, COOKIE_NAME
from service.session_registry import session_registry
from Games.Game2.GameEngine.CrashOutEngine import CrashOutEngine, Phases
from Games.Game1.GameEngine.slangengine import SlangEngine


class FakeSio:
    # Stand-in for the Socket.IO server

    def __init__(self):
        self.emitted = []  # list of (event_name, payload, room)

    async def emit(self, event, data=None, room=None, **kwargs):
        self.emitted.append((event, data, room))

    async def enter_room(self, sid, room):
        pass

    async def leave_room(self, sid, room):
        pass


@pytest.fixture(autouse=True)
def fresh_state():
    """Wipe the in-memory 'database' before every test, and hand back the FakeSio."""
    fake = FakeSio()
    room_service.attach_sio(fake)

    SESSIONS.clear()
    room_service.active_rooms.clear()
    session_registry.sid_to_rooms.clear()
    session_registry.sid_to_username.clear()

    # CrashOutEngine keeps some state on the class itself, so we reset that too.
    CrashOutEngine.active_players = {}
    CrashOutEngine.current_round = 0
    CrashOutEngine.phase = Phases.BETTING

    return fake


@pytest.fixture
def client():
    with TestClient(create_http_app()) as c:
        yield c


@pytest.fixture
def client2():
    # A second client = a second browser, but the same in-memory backend, for second player test.
    with TestClient(create_http_app()) as c:
        yield c


def host_a_room(c, username="alice"):
    """Make a session + create a room. Returns the room code; c is now the host."""
    c.get("/session")
    resp = c.post("/create_room", json={"username": username, "sid": f"sid-{username}"})
    return resp.json()["Room Code"]


def join_a_room(c, code, username="bob"):
    """Make a fresh session on c and join an existing room."""
    c.get("/session")
    return c.post("/join_room", json={"username": username, "code": code, "sid": f"sid-{username}"})


# one test per route

def test_status(client):
    r = client.get("/status")
    assert r.status_code == 200
    assert r.json()["status"] == "success"


def test_session(client):
    r = client.get("/session")
    assert r.json() == {"status": "success", "has_session": True}
    assert client.cookies.get(COOKIE_NAME) in SESSIONS


def test_create_room(client):
    code = host_a_room(client, "alice")
    assert len(code) == 4
    room = room_service.active_rooms[code]
    assert room.players == ["alice"]
    assert room.host == "alice"


def test_room_status(client):
    code = host_a_room(client, "alice")
    found = client.post("/room_status", json={"username": "alice", "code": code})
    missing = client.post("/room_status", json={"username": "alice", "code": "ZZZZ"})
    assert found.json()["status"] == "success"
    assert missing.json()["status"] == "codeError"


def test_join_room(client, client2, fresh_state):
    code = host_a_room(client, "alice")
    r = join_a_room(client2, code, "bob")
    assert r.json()["status"] == "success"
    assert room_service.active_rooms[code].players == ["alice", "bob"]
    assert ("player_joined", {"all_players": ["alice", "bob"], "username": "bob"}, code) in fresh_state.emitted


def test_join_room_rejects_duplicate_name(client, client2):
    code = host_a_room(client, "alice")
    r = join_a_room(client2, code, "alice")
    assert r.json()["status"] == "nameConflict"


def test_leave_room(client):
    code = host_a_room(client, "alice")
    r = client.post("/leave_room", json={"username": "alice", "code": code, "sid": "sid-alice"})
    assert r.json()["status"] == "success"
    assert code not in room_service.active_rooms


def test_kick_player_is_host_only(client, client2):
    code = host_a_room(client, "alice")
    join_a_room(client2, code, "bob")
    denied = client2.post("/kick_player", json={"sid": "sid-bob", "code": code, "targetUsername": "alice"})
    assert denied.json()["status"] == "forbidden"
    ok = client.post("/kick_player", json={"sid": "sid-alice", "code": code, "targetUsername": "bob"})
    assert ok.json()["status"] == "success"
    assert room_service.active_rooms[code].players == ["alice"]


def test_select_game_is_host_only(client, client2):
    code = host_a_room(client, "alice")
    join_a_room(client2, code, "bob")
    denied = client2.post("/select_game", json={"code": code, "game_id": "Crash Out"})
    assert denied.json()["status"] == "forbidden"
    ok = client.post("/select_game", json={"code": code, "game_id": "Crash Out"})
    assert ok.json()["game"] == "Crash Out"


def test_start_game(client):
    code = host_a_room(client, "alice")
    r = client.post("/start_game", json={"code": code})
    assert r.json()["status"] == "success"
    assert room_service.active_rooms[code].active_engine is not None


def test_slang_requires_two_players(client, client2):
    code = host_a_room(client, "alice")
    room = room_service.active_rooms[code]
    room.set_game("Slang")

    first_attempt = client.post("/start_game", json={"code": code})
    assert first_attempt.json()["status"] == "error"
    assert "not enough players" in first_attempt.json()["message"].lower()
    assert room.active_engine is None

    join_a_room(client2, code, "bob")
    second_attempt = client.post("/start_game", json={"code": code})
    assert second_attempt.json()["status"] == "success"
    assert room.active_engine is not None


def test_start_game_is_idempotent_when_game_already_running(client, client2):
    code = host_a_room(client, "alice")
    room = room_service.active_rooms[code]
    room.set_game("Slang")
    join_a_room(client2, code, "bob")

    first_attempt = client.post("/start_game", json={"code": code})
    assert first_attempt.json()["status"] == "success"

    second_attempt = client.post("/start_game", json={"code": code})
    assert second_attempt.json()["status"] == "success"
    assert room.active_engine is not None


def test_slang_engine_removes_players_without_error():
    engine = SlangEngine(players=["alice", "bob"], sio=FakeSio(), room="ABC1")

    engine.remove_player("bob")

    assert "bob" not in engine.game_players
    assert "alice" in engine.game_players


def test_slang_engine_adds_players_without_error():
    engine = SlangEngine(players=["alice"], sio=FakeSio(), room="ABC1")

    engine.add_player("bob")

    assert "bob" in engine.game_players
    assert engine.turn_order == ["alice", "bob"]


def test_place_bet_over_http(client):
    code = host_a_room(client, "alice")
    client.post("/start_game", json={"code": code})
    r = client.post("/game_event", json={
        "username": "alice",
        "code": code,
        "event_type": "place_bet",
        "data": {"bet": 10},
    })
    assert r.json()["status"] == "success"
    assert r.json()["data"] == {"score": 40, "bet": 10}
