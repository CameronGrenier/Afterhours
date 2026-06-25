import CrashGame from "./CrashGameClass.js";
let userName = "Alec" //Global variable for the username
let roomCode = "" //Global variable for the entered room code
let serverTimeOffset = null
let multiplier = 0
let crashOut = false
const SERVER_BASE = 'http://127.0.0.1:8000' //Global URL for the server. LocalHost
import rlPromise from 'node:readline/promises';
import readline from 'node:readline';
import { io } from "socket.io-client";
const socket = io(SERVER_BASE); //Start a web socket on this client
const rl = rlPromise.createInterface({
    input: process.stdin,
    output: process.stdout
}); //Readline code for asking user input
let waitingForInput = false
let playing = false
let activeGameID = null; //This is the select game, only changed when recieved back from the server
let activeGame = null;
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
    serverTimeOffset = response["Server Time"] - (Date.now() / 1000)
    roomCode = response['Room Code'] //Pull out the room code from the newly created room
     socket.on("lobby_update", (data) => {
         activeGameID = data.game
         console.log(`For this lobby game has changed to: ${activeGameID}`)
    });
}
function onSendAction(event_type, payload) {
    // Return a Promise so we can "await" the result later
    return new Promise((resolve, reject) => {
        socket.emit('game_action', {
            event_type: event_type,
            data: payload
        }, (response) => {
            // Check if the response exists and has a success status
            if (response && response.status === 'success') {
                console.log("Server accepted action:", response);
                resolve(response); // Send the data back to the 'await' caller
            } else {
                console.error("Server rejected action:", response?.message || "Unknown error");
                reject(response || "Error"); // Trigger the 'catch' block
            }
        });
    });
}

async function onPhaseChange(phase){
    if (phase === 'betting') {
        console.log(`**Available to bet: $${activeGame.score}**`)
        const input = await rl.question(">> Betting is open! Type 'bet <amount>': ");
        // Send that input back to the engine
        activeGame.handleInputEvent({ type: 'place_bet', amount: parseInt(input.split(' ')[1]) });
    }
    else if (phase === 'playing'){
        runSyncCountdown(activeGame.countdown)
    }
    else if (phase === 'blast_off'){
        startRocket(getServerTime())
    }
    else if (phase === 'game_over'){
        playing = false
        activeGame = null
        disableInput()
    }
}
function runSyncCountdown(targetStartTime) {
    const interval = setInterval(() => {
        const now = getServerTime(); // Use our synchronized clock
        const remaining = targetStartTime - now;

        if (remaining <= 0) {
            clearInterval(interval);
            process.stdout.write("\r\x1b[K>> Blast off! 🚀\n");
        } else {
            // Display remaining time, formatted to 1 decimal place
            process.stdout.write(`\r\x1b[K>> Game starting in ${remaining.toFixed(1)}s...`);
        }
    }, 100); // 100ms interval for a smoother countdown
}
function getServerTime() {
    return (Date.now() / 1000) + serverTimeOffset;
}
const handleInput = (key) => {
    if (key.toLowerCase() === 'c') {
        activeGame.handleInputEvent({ type: 'cash_out', multiplier: multiplier });
        crashOut = true;
    }
    if (key === '\u0003') { process.exit(); }
};

function enableInput() {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', handleInput); // Use the named function
}

function disableInput() {
    process.stdin.removeListener('data', handleInput);
    process.stdin.setRawMode(false);
    // Don't pause! Just drain the buffer.
    while (process.stdin.read() !== null) {
    }
}
function getMultiplierAtTime(blastOffTime) {
    const step_duration = activeGame.step_duration
    const seed = activeGame.seed
    console.log(`poop: ${seed} ${step_duration}`)
    const timeElapsed = Math.max(0, getServerTime() - blastOffTime);
    const index = Math.floor(timeElapsed / step_duration);

    if (index >= seed.length - 1) return 0; // Crashed!

    const startVal = seed[index];
    const endVal = seed[index + 1];
    const progress = (timeElapsed % step_duration) / step_duration;

    return startVal + (endVal - startVal) * progress;
}

function startRocket(blastOffTime) {
    crashOut = false
    enableInput(); // Turn on the "c" listener

    const interval = setInterval(() => {
        multiplier = getMultiplierAtTime(blastOffTime);
        // Update the line dynamically
        process.stdout.write(`\r\x1b[K>> Multiplier: ${multiplier.toFixed(2)}x | Press 'c' to cash out!`);

        if (crashOut === true || multiplier <= 0) {
            process.stdout.write(crashOut ? "\n>> Cashed out! ✅\n Waiting for betting phase to begin..." : "\n>> BUSTED! 💥\n");
            clearInterval(interval);
            disableInput(); // <--- USE THE HELPER
        }

    }, 100); // 100ms updates for smooth display
}
async function startProgram() {
    await create_room()
    let userInput = "";
    //startLobbyListeners()
    while (true) {
        if(playing === false){
            //console.clear()
            console.log(`--- Main Menu ---\nUsername: ${userName}\nRoomID: ${roomCode}`);
            userInput = await rl.question('[1] Pick a game\n[2] Start Game\n[3] Exit\nEnter your command Number: ');
            console.log(`You typed: ${userInput}`);
            if (userInput === "3") {
                process.exit()
            }
            switch (userInput) {
                case "1":
                    const response = await postData('/select_game', {code: `${roomCode}`, game_id: `Crash Out`})
                    if (response['status'] === "success") {
                        console.log(`${response['message']}`)
                    }
                    break;
                case "2":
                    const start_status = await postData('/start_game', {code: `${roomCode}`})
                    console.log("active Game ID: ", activeGameID)
                    if (activeGameID === "Crash Out") {
                        socket.on("game_update", async (data) => {
                            console.log(`Got a new game update ${data}`);
                            await activeGame.handleSocketEvent(data)
                        });
                        activeGame = new CrashGame(onSendAction, onPhaseChange, userName, roomCode, serverTimeOffset)
                        playing = true
                        break;
                    }
            }
        }
        else{
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}

async function main(){
    socket.on("connect", (data) => {
    //Important verification to ensure the user socket can talk with the server socket.
    console.log(`Connected to server with Socket ID: ${socket.id}`);
    startProgram();
})
}

main()
