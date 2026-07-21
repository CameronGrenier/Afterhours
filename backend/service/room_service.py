import secrets
import time

from GameRoom import GameRoom
from service.session_registry import session_registry
from service.session_service import (
    clear_room_membership,
    delete_session,
    get_session_by_username_and_room_code,
    get_session_id,
    set_room_membership,
    verify_host,
    verify_session_in_room,
)


class RoomService:

    def __init__(self):
        self.sio = None
        self.active_rooms = {}

    def attach_sio(self, sio):
        self.sio = sio

    def _room_exists(self, code):
        return code in self.active_rooms

    def _get_room(self, code):
        return self.active_rooms.get(code)

    def _delete_room_if_empty(self, code):
        room = self.active_rooms.get(code)
        if room is not None and len(room.players) == 0:
            del self.active_rooms[code]
            return True
        return False

    def _sio_ready(self):
        if self.sio is None:
            raise RuntimeError("Socket.IO server has not been attached to RoomService")

    def generate_room_code(self):
        characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
        return "".join(secrets.choice(characters) for _ in range(4))

    async def get_room_status(self, request):
        code = request.code
        username = request.username

        if not self._room_exists(code):
            return {
                "status": "codeError",
                "message": "Room code does not exist, must not be in a valid room",
            }

        room = self.active_rooms[code]
        status = room.check_for_player(username)
        if status == "Success":
            return {
                "status": "success",
                "message": f"{username} is in room {code} with {room.players}",
            }

        return {"status": "userError", "message": "Room exists but the player is not in the room"}

    async def create_room(self, request, session_id):
        self._sio_ready()
        username = request.username
        sid = request.sid

        if not sid:
            return {"status": "userError", "message": "Socket ID is required to create a room"}

        while True:
            code = self.generate_room_code()
            if not self._room_exists(code):
                room = GameRoom(code, self.sio)
                room.add_player(username)

                await self.sio.enter_room(sid, code)
                session_registry.bind(sid=sid, username=username, room_code=code)

                self.active_rooms[code] = room
                set_room_membership(session_id, username, code, "host")
                return {
                    "status": "success",
                    "Room Code": code,
                    "Server Time": time.time(),
                }

    async def join_room(self, request, session_id):
        self._sio_ready()
        code = request.code
        username = request.username
        sid = request.sid

        if not sid:
            return {"status": "userError", "message": "Socket ID is required to join a room"}

        if not self._room_exists(code):
            return {"status": "codeError", "message": "Room code does not exist"}

        room = self._get_room(code)
        status = room.add_player(username)
        if status != "Success":
            return {"status": "nameConflict"}

        await self.sio.enter_room(sid, code)
        session_registry.bind(sid=sid, username=username, room_code=code)

        await self.sio.emit(
            "player_joined",
            {"all_players": room.players, "username": username},
            room=code,
        )

        set_room_membership(session_id, username, code, "player")
        return {
            "status": "success",
            "Room Code": code,
            "Server Time": time.time(),
        }

    async def leave_room(self, request, session_id):
        self._sio_ready()
        code = request.code
        username = request.username
        sid = request.sid

        if not sid:
            return {"status": "userError", "message": "Socket ID is required to leave a room"}

        room = self._get_room(code)
        if room is None:
            return {"status": "codeError"}

        status = room.remove_player(username)
        if status != "Success":
            return {"status": "error", "message": "Unable to remove player from the room"}

        await self.sio.leave_room(sid, code)
        session_registry.remove(sid)

        if not self._delete_room_if_empty(code):
            await self.sio.emit(
                "player_left",
                {"all_players": room.players, "username": username},
                room=code,
            )

        clear_room_membership(session_id)

        return {
            "status": "success",
            "message": f"{username} has been successfully removed from room {code}",
        }

    async def kick_player(self, request, session_id):
        self._sio_ready()
        code = request.code
        actor_sid = request.sid
        target_username = request.targetUsername

        session, error = verify_host(session_id, code)

        # ensure user is the host
        if error is not None:
            return error

        room = self._get_room(code)
        if room is None:
            return {"status": "codeError", "message": "Room code does not exist"}

        actor_username = session_registry.get_username(actor_sid)
        if actor_username is None:
            return {"status": "userError", "message": "Actor SID not recognized"}

        if session_registry.get_room(actor_sid) != code:
            return {"status": "userError", "message": "Requester is not in this room"}

        if actor_username != room.host:
            return {"status": "forbidden", "message": "Only the host can kick players"}

        if target_username == room.host:
            return {"status": "forbidden", "message": "You cannot kick the host"}

        if target_username not in room.players:
            return {"status": "userError", "message": "Target player is not in this room"}

        target_sid = session_registry.find_sid(room_code=code, username=target_username)
        if target_sid is None:
            return {"status": "userError", "message": "Target SID not found"}

        status = room.remove_player(target_username)
        if status != "Success":
            return {"status": "error", "message": "Could not remove player from room"}

        await self.sio.leave_room(target_sid, code)
        session_registry.remove(target_sid)

        await self.sio.emit(
            "player_left",
            {"all_players": room.players, "username": target_username},
            room=code,
        )
        await self.sio.emit(
            "kicked",
            {"code": code, "message": f"You were kicked from room {code}"},
            room=target_sid,
        )

        self._delete_room_if_empty(code)
        kicked_session_id = get_session_by_username_and_room_code(request.targetUsername, request.code)
        clear_room_membership(kicked_session_id)

        return {
            "status": "success",
            "message": f"{target_username} was kicked from room {code}",
        }

    async def select_game(self, request, session_id):
        print("Selecting game: ", request.game_id)
        self._sio_ready()
        code = request.code
        room = self._get_room(code)

        #session, error = verify_host(session_id, code)

        # ensure user is the host
        # if error:
        #     return error

        if room is None:
            return {"status": "codeError", "message": f"Game room {code} does not exist"}

        selected_game = room.set_game(request.game_id)
        print("Sending lobby update: ", selected_game.value)
        await self.sio.emit("lobby_update", {"game": selected_game.value}, room=code)
        return {
            "status": "success",
            "message": f"Game for room {code} is {room.game.value}",
            "game": room.game.value,
        }

    async def start_game(self, request, session_id):
        code = request.code
        room = self._get_room(code)

        #session, error = verify_host(session_id, code)

        # ensure user is the host
        #if error:
        #    return error
        print("Starting room: ", room)
        if room is None:
            return {"status": "codeError", "message": "Room not found"}

        status = await room.start_game()
        if status == "Error":
            return {"status": "error", "message": "not enough players to start the selected game"}

        return {"status": "success"}

    async def handle_http_game_event(self, request, session_id):
        code = request.code

        session, error = verify_session_in_room(session_id, code)
        if error:
            return error

        room = self._get_room(code)
        if room is None:
            return {"status": "codeError", "message": "Room with that code does not exist"}

        verified_username = session["username"]

        success, message, local_payload, _global_payload = await room.handle_event(
            verified_username,
            request.event_type,
            request.data,
        )

        if success:
            return {"status": "success", "message": message, "data": local_payload}

        return {"status": "error", "message": message}

    async def handle_disconnect(self, sid):
        self._sio_ready()
        room_code = session_registry.get_room(sid)
        username = session_registry.get_username(sid)

        session_id = get_session_by_username_and_room_code(username, room_code)
        delete_session(session_id)

        if room_code is None or username is None:
            return

        room = self._get_room(room_code)
        session_registry.remove(sid)
        if room is None:
            return

        status = room.remove_player(username)
        if status != "Success":
            return

        if self._delete_room_if_empty(room_code):
            return

        await self.sio.emit(
            "player_left",
            {"username": username, "all_players": room.players},
            room=room_code,
        )

    async def handle_game_action(self, sid, payload):
        print("Recieved action")
        self._sio_ready()
        room_code = session_registry.get_room(sid)
        print("Room code for sid", sid, "is", room_code)
        if room_code is None:
            return {"status": "userError", "message": "Socket is not currently in a room"}

        username = session_registry.get_username(sid)
        room = self._get_room(room_code)
        if room is None:
            return {"status": "codeError", "message": "Room not found"}

        success, message, local_data, broadcast_data = await room.handle_event(
            username=username,
            event_type=payload.get("event_type"),
            data=payload.get("data"),
        )
        if not success:
            return {"status": "error", "message": message}

        await self.sio.emit(
            "game_update",
            {
                "type": "PLAYER_ACTION",
                "payload": {
                    "player": username,
                    "action": payload.get("event_type"),
                    "details": broadcast_data,
                },
            },
            room=room_code,
        )
        return {"status": "success", "data": local_data}


room_service = RoomService()
