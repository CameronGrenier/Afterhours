let userName = "Alec" //Global variable for the username
let roomCode = "" //Global variable for the entered room code
const SERVER_BASE = 'http://127.0.0.1:8000' //Global URL for the server. LocalHost
const readline = require('readline').promises;
const {io} = require("socket.io-client");
const socket = io(SERVER_BASE); //Start a web socket on this client
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
}); //Readline code for asking user input

async function postData(endpoint = '', data = {}){
    const response = await fetch(`${SERVER_BASE}${endpoint}`,
        {method : 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    return response.json()
}

async function create_room(){
    console.log("Creating a room...")
    const response = await postData('/create_room',{username: `${userName}`, sid: `${socket.id}` })
    console.log("Reply from Server: ", response)
    roomCode = response['Room Code'] //Pull out the room code from the newly created room
    socket.on("game_update", (data) => {
        console.log(`Got a new game update ${data}`);
    });
}

async function startProgram() {
    let userInput = "";
    //startLobbyListeners()
    while (true) {
        //console.clear()
        console.log(`--- Main Menu ---\nUsername: ${userName}\nRoomID: ${roomCode}`);
        userInput = await rl.question('[1] Pick a game\n[2] Start Game\n[3] Exit\nEnter your command Number: ');
        console.log(`You typed: ${userInput}`);
        if (userInput === "3") {
            break
        }
        switch (userInput) {
            case "1":
                const response = await postData('/select_game', {code: `${roomCode}`, game_id: `Crash Out`})
                if (response['status'] === "success"){
                    console.log(`${response['message']}` )
                }
                break;
            case "2":
                const start_status = await postData('/start_game', {code: `${roomCode}`})
                break;
        }
    }
}

async function clientGameloop(){
    const bet = await rl.question('Enter the ammount of money you would like to bet ');
    let bet_status = ""
    while (bet_status !== "success"){ //Keep asking for bet until the user get's it right
        const response = await postData('/game_event', {username:`${userName}`, code: `${roomCode}`, event_type: 'place_bet', data: {'bet': bet}})
        bet_status = response['status']
    }


}

async function main(){
    socket.on("connect", () => {
    //Important verification to ensure the user socket can talk with the server socket.
    console.log("Connected to server with Socket ID: ", socket.id)
    create_room();
    startProgram();
})
}

main()
