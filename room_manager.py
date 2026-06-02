import json
import string
import socketio
import secrets
from pydantic import BaseModel
from typing import Optional, Any, Dict
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from GameRoom import GameRoom

app = FastAPI()
sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
active_rooms = {} #Used for tracking what rooms currently exist
sid_to_rooms = {} #Used for tracking what SID is in what room
sid_to_username = {} #Used for tracking what SID is which player. Used to remove players from rooms on disconnect
socket_app = socketio.ASGIApp(sio, app)
# Enable CORS so your Javascript (running on a different port/domain) can talk to this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your actual website domain
    allow_methods=["*"],
    allow_headers=["*"],
)
#Helper Functions
def generate_room_code():
    characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789" #almost a million possible rooms at one time with a 4 digit code with these chars.
    code = ""
    for i in range(4):
        code += secrets.choice(characters) #Randomly grab from the above characters to make a code
    return code


#HTTP Requests:
"""General Errors:
userError: username given is not in a room
codeError: room code given does not exist
error: generic error, one of the above did not happen
"""
class RoomData(BaseModel):
    """username: The Users Name....
    code: The room code the user is talking about
    sid: The socket id of the user"""
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

@app.get("/status")
def get_status():
    return {"status": "success", "message": "Python server is running"}

@app.post("/room_status")
def get_room_status(request: RoomData):
    code = request.code
    username = request.username
    if code not in active_rooms:
        return {"status": "codeError", "message": "Room code does not exist, must not be in a valid room"}
    else:
        room = active_rooms[code]
        status = room.check_for_player(username)
        if status == "Success":
            return {"status": "success", "message": f"{username} is in room {code} with {active_rooms[code].players}"} #Return all users in this room
        else:
            return {"status": "userError", "message": "Room Exists but the player is not in the room"}

@app.post("/create_room")
async def make_room(request: RoomData):
    username = request.username
    sid = request.sid
    while True:
        code = generate_room_code()
        if code not in active_rooms:
            room = GameRoom(code, sio) #Create the room and add the host to it
            room.add_player(username)
            await sio.enter_room(sid, code)
            sid_to_rooms[sid] = code  # Track what SIO is in what room {just code no need for the whole object)
            sid_to_username[sid] = username
            active_rooms[code] = room #Add it to the servers memory
            print(active_rooms)
            return {"status": "success", "Room Code": code}

@app.post("/join_room")
async def join_room(request: RoomData):
    print(f"Join request received for: {request.username}, SID: {request.sid}")
    code = request.code
    username = request.username
    sid = request.sid
    if code not in active_rooms:
        return {"status": "codeError", "message": "Room code does not exist"}
    status = active_rooms[code].add_player(username)
    if status == "Success":
        #Take the sid of the user and add it to this rooms socket channel
        await sio.enter_room(sid, code)
        sid_to_rooms[sid] = code #Track what SIO is in what room {just code no need for the whole object)
        sid_to_username[sid] = username
        #Announce to the rooom (including the current player) that they have joined
        await sio.emit('player_joined',{'all_players': active_rooms[code].players, 'username':username}, room=code)
        return {"status": "success", "Room Code": code} #Important to pass the code back, the front end should remember the code
    else:
        return {"status": "nameConflict"}
@app.post("/select_game")
def select_game(request: RoomGameRequest):
    code = request.code
    game_id = request.game_id
    if code in active_rooms:
        room = active_rooms[code]
        room.set_game(game_id)
        return {"status":"success", "message": f"Game for room {code} is {room.game}"}
    return{"status": "error", "message": f"Game room {code} does not exist"}
@app.post("/start_game")
async def start_game(request: RoomGameRequest):
    code = request.code
    room = active_rooms[code]
    if not room:
        return {"status": "error", "message": "Room not found"}
    status = await room.start_game()
    if status == "Error":
        return {"status": "error, not enough players to start the selected game"}
    return {"status": "success"}
@app.post("/game_event")
async def handle_event(request:GameEvent):
    username = request.username
    code = request.code
    event_type = request.event_type
    data = request.data
    if code in active_rooms:
        room = active_rooms[code]
        await room.handle_event(username, event_type, data)
        return {"status":"Success Game action completed"}
    else:
        return {"status":"codeError", "message":"Room with that code does not exist"}

#Web Socket Events:

@app.post("/leave_room")
async def leave_room(request: RoomData):
    """This is a combo of a HTTP Post (request to leave room)
    and a socket call (alert all players someone has left the room)
    Joining a lobby needs to have the same effect."""
    code = request.code
    username = request.username
    sid = request.sid
    if code in active_rooms:
        game_room = active_rooms[code]
        status = game_room.remove_player(username)
        print(f"Leave request received for: {request.username}, SID: {request.sid}")
        if status == "Success":
            # Remove the player from the socket communication room
            await sio.leave_room(sid, code)
            #Announce the player has left and give a new players list to all clients in this room.
            if game_room.state == "Empty": #If the room is empty then lets clean it up and remove it.
                del active_rooms[code]
            else: #Other players in the room to talk too.
                await sio.emit('player_left',{'all_players': active_rooms[code].players, 'username':username}, room=code)
            return {"status": "success", "message": f"{username} has been successfully removed from room {code}"}
        else:
            return {"status": "error, for some reason unable to remove player from the room."}
    else:
        return{"status":"codeError"}

@sio.event
async def connect(sid, environ):
    print(f"Socket connected with {sid}")

@sio.event
async def disconnect(sid):
    if sid in sid_to_rooms:
        room_code = sid_to_rooms[sid]
        active_rooms[room_code].remove_player(sid)
        await sio.emit('player_left',{'all_players': active_rooms[room_code].players})
        del sid_to_rooms[sid] #Remove it from the data structure

@sio.event
async def join_game_socket(sid,data):
    code = data["code"]
    print(f"Socket {sid} joined the room {code}")

#run this with: uvicorn filename:app --reload