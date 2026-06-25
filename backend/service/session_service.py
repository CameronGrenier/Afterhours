from fastapi import Request
import secrets

COOKIE_NAME = "ah_session"
SESSIONS = {}

def get_session_id(request: Request):
    return request.cookies.get(COOKIE_NAME)

def get_session_by_username_and_room_code(username, room_code):
    for session_id, session in SESSIONS.items():
        if session.get("username") == username and session.get("room_code") == room_code:
            return session_id

    return None

def delete_session(session_id):
    if session_id is None:
        return None
    return SESSIONS.pop(session_id, None)

def create_session():
    session_id = secrets.token_urlsafe(32)
    SESSIONS[session_id] = {
        "username": None,
        "room_code": None,
        "role": None,
        "current_id": None,
    }
    return session_id

def get_session(request: Request):
    session_id = get_session_id(request)
    if not session_id:
        return None
    return SESSIONS.get(session_id)

def update_session(session_id, **fields):
    session = SESSIONS.get(session_id)
    if session is None:
        return None

    session.update(fields)
    return session

def set_room_membership(session_id, username, room_code, role):
    session = SESSIONS.get(session_id)
    if session is None:
        return None

    session["username"] = username
    session["room_code"] = room_code
    session["role"] = role
    return session


def verify_session_in_room(session_id, room_code):
    session = SESSIONS.get(session_id)

    if session is None:
        return None, {"status": "unauthorized", "message": "No valid session"}

    if session.get("room_code") != room_code:
        return None, {"status": "forbidden", "message": "You are not in this room"}

    return session, None

def verify_host(session_id, room_code):
    session, error = verify_session_in_room(session_id, room_code)
    if error:
        return None, error

    if session.get("role") != "host":
        return None, {"status": "forbidden", "message": "Only the host can preform this action"}

    return session, None

def clear_room_membership(session_id):
    session = SESSIONS.get(session_id)

    if session is None:
        return None

    session["username"] = None
    session["room_code"] = None
    session["role"] = None

    return session


    
