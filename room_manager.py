import string
import socketio
import secrets
from pydantic import BaseModel
from typing import Optional
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from GameRoom import GameRoom

app = FastAPI()
sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
active_rooms = {} #Used for tracking what rooms currently exist
sid_to_rooms = {} #Used for tracking what SID is in what room
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
def make_room(request: RoomData):
    username = request.username
    while True:
        code = generate_room_code()
        if code not in active_rooms:
            room = GameRoom(code) #Create the room and add the host to it
            room.add_player(username)
            active_rooms[code] = room #Add it to the servers memory
            print(active_rooms)
            return {"status": "success", "Room Code": code}

@app.post("/join_room")
async def join_room(request: RoomData):
    code = request.code
    username = request.username
    sid = request.sid
    if code not in active_rooms:
        return {"status": "codeError", "message": "Room code does not exist"}
    status = active_rooms[code].add_player(username)
    if status == "Success":
        #Take the sid of the user and add it to this rooms socket channel
        sio.enter_room(sid, code)
        sid_to_rooms[sid] = code #Track what SIO is in what room {just code no need for the whole object)
        #Announce to the rooom (including the current player) that they have joined
        await sio.emit('player_joined',{'all_players': active_rooms[code].players}, room=code)
        return {"status": "success", "Room Code": code} #Important to pass the code back, the front end should remember the code
    else:
        return {"status": "nameConflict"}

@app.post("/select_game")
def select_game(game_id: str, code: str):
    if code in active_rooms:
        room = active_rooms[code]
        room.set_game(game_id)



@app.post("/start_game")
def start_game(game_name: str, code: str):
    room = active_rooms.get(code)
    if not room:
        return {"status": "error", "message": "Room not found"}
    status = room.start_game()
    if status == "Error":
        return {"status": "error, not enough players to start the selected game"}
    return {"status": "success"}

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
        status = active_rooms[code].remove_player(username)
        if status == "Success":
            # Remove the player from the socket communication room
            sio.leave_room(sid, code)
            #Announce the player has left and give a new players list to all clients in this room.
            await sio.emit('player_left',{'all_players': active_rooms[code].players})
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
        await sio.emit('player_left',{'all_players': active_rooms[room_code].players})
        del sid_to_rooms[sid] #Remove it from the data structure

@sio.event
async def join_game_socket(sid,data):
    code = data["code"]
    print(f"Socket {sid} joined the room {code}")

#run this with: uvicorn filename:app --reload