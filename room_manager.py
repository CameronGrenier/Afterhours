import string
import socketio
import secrets
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from GameRoom import GameRoom

app = FastAPI()
sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
socket_app = socketio.ASGIApp(sio, app)
# Enable CORS so your Javascript (running on a different port/domain) can talk to this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your actual website domain
    allow_methods=["*"],
    allow_headers=["*"],
)

#Socket Events
@sio.event
async def connect(sid, environ):
    print(f"Socket connected with {sid}")

@sio.event
async def join_game_socket(sid,data):
    code = data["code"]
    sio.enter_room(sid, code)

#Helper Functions
def generate_room_code():
    characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789" #almost a million possible rooms at one time with a 4 digit code with these chars.
    code = ""
    for i in range(4):
        code += secrets.choice(characters) #Randomly grab from the above characters to make a code
    return code


#HTTP Requests:

@app.get("/status")
def get_status():
    return {"status": "success", "message": "Python server is running"}

@app.post("/room_status")
def get_room_status(username: str, code: str):
    if code not in active_rooms:
        return {"status": "success", "message": "Room code does not exist, must not be in a valid room"}
    else:
        room = active_rooms[code]
        status = room.check_for_player(username)
        if status == "Success":
            return {"status": "success", "message": "Room Exists and this player is in the room"}
        else:
            return {"status": "success", "message": "Room Exists but the player is not in the room"}



active_rooms = {}
@app.post("/create_room")
def make_room(username: str):
    while True:
        code = generate_room_code()
        if code not in active_rooms:
            room = GameRoom(code) #Create the room and add the host to it
            room.add_player(username)
            active_rooms[code] = room #Add it to the servers memory
            return {"status": "success", "Room Code": code}

@app.post("/join_room")
def join_room(username: str, code: str):
    if code not in active_rooms:
        return {"status": "error", "message": "Room code does not exist"}
    status = active_rooms[code].add_player(username)
    if status == "Success":
        return {"status": "success", "Room Code": code} #Important to pass the code back, the front end should remember the code
    else:
        return {"status": "error, player name is already in use"}

@app.post("/select_game")
def select_game(game_id: str, code: str):
    if code in active_rooms:
        room = active_rooms[code]
        room.set_game(game_id)

@app.post("/leave_room")
def leave_room(username: str, code: str):
    if code in active_rooms:
        status = active_rooms[code].remove_player(username)
        if status == "Success":
            return {"status": "success"}
        else:
            return {"status": "error, for some reason unable to remove player from the room."}

@app.post("/start_game")
def start_game(game_name: str, code: str):
    room = active_rooms.get(code)
    if not room:
        return {"status": "error", "message": "Room not found"}
    status = room.start_game()
    if status == "Error":
        return {"status": "error, not enough players to start the selected game"}
    return {"status": "success"}
#run this with: uvicorn filename:app --reload