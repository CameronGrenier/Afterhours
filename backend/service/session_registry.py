class SessionRegistry:

    def __init__(self):
        self.sid_to_rooms = {}
        self.sid_to_username = {}

    def bind(self, sid, username, room_code):
        self.sid_to_rooms[sid] = room_code
        self.sid_to_username[sid] = username

    def get_room(self, sid):
        return self.sid_to_rooms.get(sid)

    def get_username(self, sid):
        return self.sid_to_username.get(sid)

    def remove(self, sid):
        room_code = self.sid_to_rooms.pop(sid, None)
        username = self.sid_to_username.pop(sid, None)
        return room_code, username

    def find_sid(self, room_code, username):
        for sid, candidate_username in self.sid_to_username.items():
            if candidate_username == username and self.sid_to_rooms.get(sid) == room_code:
                return sid
        return None


session_registry = SessionRegistry()
