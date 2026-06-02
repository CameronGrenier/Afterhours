let userName = "" //Global variable for the username
let roomCode = "" //Global variable for the entered room code
const SERVER_BASE = 'http://127.0.0.1:8000' //Global URL for the server. LocalHost
const readline = require('readline').promises;
const {io} = require("socket.io-client");
const socket = io(SERVER_BASE); //Start a web socket on this client
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
}); //Readline code for asking user input


async function fetchServerStatus() {
    try {
        const response = await fetch('http://127.0.0.1:8000/status');
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        console.log("Server message:", data.message);
    } catch (error) {
        console.error("Failed to connect to server:", error);
    }
}
async function checkUsername() {
    if (userName === "") {
        userName = await rl.question('Please enter your desired userName ');
    }
    console.log(`You typed: ${userName}`);
}

async function postData(endpoint = '', data = {}){
    const response = await fetch(`${SERVER_BASE}${endpoint}`,
        {method : 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    return response.json()
}
function startLobbyListeners(){
    //This function starts client listening for players joining and leaving
    socket.on("player_joined", (data) => {
        console.log(`[Lobby Alert]: ${data.username} has joined the room. These players: ${data.all_players} are in the room`);
    });
    socket.on("player_left", (data) => {
        console.log(`\n[Lobby Alert]: ${data.username} has left the room. These players ${data.all_players} remain.`);
    });
}

async function startProgram() {
    let userInput = "";
    startLobbyListeners()
    while (true) {
        //console.clear()
        await fetchServerStatus();
        console.log(`--- Main Menu ---\nUsername: ${userName}\nRoomID: ${roomCode}`);
        userInput = await rl.question('[1] Join a room\n[2] Create a room\n[3] Get room satus\n[4] Leave Room\n[5] Exit\nEnter your command Number: ');
        console.log(`You typed: ${userInput}`);
        if (userInput === "5"){
            break
        }
        switch(userInput) {
            case "1":
                await checkUsername()
                const temp_roomCode = await rl.question('Enter the room code you want to join: ');
                console.log("Joining a room...")
                const status = await postData('/join_room', {code: `${temp_roomCode}`, username: `${userName}`, sid: `${socket.id}`})
                console.log("Reply from server: ", status)
                if (status['status'] === "success"){
                    roomCode = status['Room Code'] //Remember the room code in memory
                }
                else if (status['status'] === "nameConflict"){
                    console.log("Name is taken in this current room, please change your user name and try again")
                    userName = "" //Reset username to make the user pick a new one
                }
                break;
            case "2":
                await checkUsername()
                console.log("Creating a room...")
                const response = await postData('/create_room',{username: `${userName}`, sid: `${socket.id}` })
                console.log("Reply from Server: ", response)
                roomCode = response['Room Code'] //Pull out the room code from the newly created room
                break;
            case "3":
                if (roomCode !== "" && userName !== ""){
                    const response = await postData('/room_status', {code: `${roomCode}`, username: `${userName}`})
                    console.log("Reply from server: ", response)
                }
                break;
            case "4":
                if (roomCode !== "" && userName !== "") {
                    const response = await postData('/leave_room', {code: `${roomCode}`, username: `${userName}`, sid:`${socket.id}`});
                }
                else{
                    console.log("You Don't seem to be in a room to leave.")
                }
                break;

            default:
                console.log("Invalid option, try again.")

        }
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
    rl.close();
    console.log("Program finished");
}

socket.on("connect", () => {
    //Important verification to ensure the user socket can talk with the server socket.
    console.log("Connected to server with Socket ID: ", socket.id)
    startProgram();
})
