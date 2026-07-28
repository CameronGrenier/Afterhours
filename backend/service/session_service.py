from fastapi import Request
import secrets

COOKIE_NAME = "ah_session"
SESSIONS = {}

def get_session_id(request: Request):
    session_id = request.cookies.get(COOKIE_NAME)
    print(
        f"[session] get_session_id: cookie '{COOKIE_NAME}'="
        f"{(session_id[:8] + '...') if session_id else None} | "
        f"all_cookies={list(request.cookies.keys())} | "
        f"origin={request.headers.get('origin')} | host={request.headers.get('host')}"
    )
    return session_id

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
        print(
            f"[session] set_room_membership FAILED: session_id="
            f"{(session_id[:8] + '...') if session_id else None} not in SESSIONS "
            f"(known_ids={[s[:8] + '...' for s in SESSIONS.keys()]}) | "
            f"tried role={role} user={username} room={room_code}"
        )
        return None

    session["username"] = username
    session["room_code"] = room_code
    session["role"] = role
    print(
        f"[session] set_room_membership OK: session_id={session_id[:8]}... "
        f"-> role={role} user={username} room={room_code}"
    )
    return session


def verify_session_in_room(session_id, room_code):
    session = SESSIONS.get(session_id)

    if session is None:
        print(
            f"[session] verify_session_in_room FAIL (no session): session_id="
            f"{(session_id[:8] + '...') if session_id else None} | "
            f"known_ids={[s[:8] + '...' for s in SESSIONS.keys()]}"
        )
        return None, {"status": "unauthorized", "message": "No valid session"}

    if session.get("room_code") != room_code:
        print(
            f"[session] verify_session_in_room FAIL (room mismatch): "
            f"session.room_code={session.get('room_code')} != requested={room_code} | "
            f"session={session}"
        )
        return None, {"status": "forbidden", "message": "You are not in this room"}

    return session, None

def verify_host(session_id, room_code):
    session, error = verify_session_in_room(session_id, room_code)
    if error:
        return None, error

    if session.get("role") != "host":
        print(
            f"[session] verify_host FAIL (not host): session_id={session_id[:8]}... "
            f"role={session.get('role')} room={room_code} | session={session}"
        )
        return None, {"status": "forbidden", "message": "Only the host can preform this action"}

    print(f"[session] verify_host OK: session_id={session_id[:8]}... room={room_code}")
    return session, None

def clear_room_membership(session_id):
    session = SESSIONS.get(session_id)

    if session is None:
        return None

    session["username"] = None
    session["room_code"] = None
    session["role"] = None

    return session


    
