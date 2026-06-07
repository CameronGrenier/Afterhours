import CrashGame from "./CrashGameClass.js";
import rlPromise from 'node:readline/promises';
import { io } from "socket.io-client";

// --- Global Variables ---
let userName = "";
let roomCode = "";
let serverTimeOffset = null;
let multiplier = 0;
let crashOut = false;
let playing = false;
let activeGameID = null;
let activeGame = null;
let menuAbortController = null; // Used to cancel pending menu inputs

const SERVER_BASE = 'http://127.0.0.1:8000';

// --- Initialize Socket & Readline ---
const socket = io(SERVER_BASE);
const rl = rlPromise.createInterface({
    input: process.stdin,
    output: process.stdout
});

// --- HTTP Helper Functions ---
async function postData(endpoint = '', data = {}) {
    try {
        const response = await fetch(`${SERVER_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error(`Error posting to ${endpoint}:`, error);
        return { status: "error", message: "Network connection failed." };
    }
}

async function fetchServerStatus() {
    try {
        const response = await fetch(`${SERVER_BASE}/status`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log("Server status:", data.message);
    } catch (error) {
        console.error("Failed to connect to server:", error);
    }
}

async function checkUsername() {
    while (!userName || userName.trim() === "") {
        userName = await rl.question('Please enter your desired username: ');
    }
}

// --- Socket Event Listeners ---
function startLobbyListeners() {
    socket.on("player_joined", (data) => {
        console.log(`\n[Lobby Alert]: ${data.username} has joined the room. Players present: ${data.all_players}`);
    });

    socket.on("player_left", (data) => {
        console.log(`\n[Lobby Alert]: ${data.username} has left the room. Remaining players: ${data.all_players}`);
    });

    socket.on("lobby_update", (data) => {
        activeGameID = data.game;
        console.log(`\n[Lobby Update]: Selected game has changed to: ${activeGameID}`);
    });

    socket.on("game_update", async (data) => {
        if (data && data.type === 'START_GAME') {
            const chosenGame = data.payload?.game;

            if (chosenGame === "Crash Out" || chosenGame === "Games.CRASH") {
                if (!playing) {
                    console.log(`\n>> Game is starting! Initializing "${chosenGame}" loop...`);

                    // CRITICAL FIX: Forcefully abort the menu's pending rl.question prompt
                    if (menuAbortController) {
                        menuAbortController.abort();
                    }

                    activeGame = new CrashGame(onSendAction, onPhaseChange, userName, roomCode, serverTimeOffset);
                    playing = true;
                }
            }
        }

        if (playing && activeGame) {
            await activeGame.handleSocketEvent(data);
        }
    });
}

function onSendAction(event_type, payload) {
    return new Promise((resolve, reject) => {
        socket.emit('game_action', {
            event_type: event_type,
            data: payload
        }, (response) => {
            if (response && response.status === 'success') {
                console.log("Server accepted action:", response);
                resolve(response);
            } else {
                const errMsg = response?.message || "Unknown error";
                console.error(`\n[Game Warning] Server rejected action: ${errMsg}`);
                resolve({
                    status: 'error',
                    message: errMsg,
                    data: {
                        score: activeGame ? activeGame.score : 0,
                        bet: 0
                    }
                });
            }
        });
    });
}

async function onPhaseChange(phase) {
    if (phase === 'betting') {
        console.log(`\n**Available to bet: $${activeGame.score}**`);
        const input = await rl.question(">> Betting is open! Type 'bet <amount>': ");
        activeGame.handleInputEvent({ type: 'place_bet', amount: parseInt(input.split(' ')[1]) });
    }
    else if (phase === 'playing') {
        runSyncCountdown(activeGame.countdown);
    }
    else if (phase === 'blast_off') {
        startRocket(getServerTime());
    }
    else if (phase === 'game_over') {
        playing = false;
        activeGame = null;
        disableInput();
    }
}

// --- Synchronized Timing Helpers ---
function getServerTime() {
    return (Date.now() / 1000) + (serverTimeOffset || 0);
}

function runSyncCountdown(targetStartTime) {
    const interval = setInterval(() => {
        const now = getServerTime();
        const remaining = targetStartTime - now;

        if (remaining <= 0) {
            clearInterval(interval);
            process.stdout.write("\r\x1b[K>> Blast off! 🚀\n");
        } else {
            process.stdout.write(`\r\x1b[K>> Game starting in ${remaining.toFixed(1)}s...`);
        }
    }, 100);
}

// --- Dynamic Raw Keyboard Inputs ---
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
    process.stdin.on('data', handleInput);
}

function disableInput() {
    process.stdin.removeListener('data', handleInput);
    process.stdin.setRawMode(false);
    while (process.stdin.read() !== null) {}
}

function getMultiplierAtTime(blastOffTime) {
    const step_duration = activeGame.step_duration;
    const seed = activeGame.seed;
    const timeElapsed = Math.max(0, getServerTime() - blastOffTime);
    const index = Math.floor(timeElapsed / step_duration);

    if (index >= seed.length - 1) return 0;

    const startVal = seed[index];
    const endVal = seed[index + 1];
    const progress = (timeElapsed % step_duration) / step_duration;

    return startVal + (endVal - startVal) * progress;
}

function startRocket(blastOffTime) {
    crashOut = false;
    enableInput();

    const interval = setInterval(() => {
        multiplier = getMultiplierAtTime(blastOffTime);
        process.stdout.write(`\r\x1b[K>> Multiplier: ${multiplier.toFixed(2)}x | Press 'c' to cash out!`);

        if (crashOut === true || multiplier <= 0) {
            process.stdout.write(crashOut ? "\n>> Cashed out! ✅\n Waiting for betting phase to begin...\n" : "\n>> BUSTED! 💥\n");
            clearInterval(interval);
            disableInput();
        }
    }, 100);
}

// --- Main Program Engine ---
async function startProgram() {
    let userInput = "";
    startLobbyListeners();

    while (true) {
        if (playing) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
        }

        console.log(`\n--- Main Menu ---`);
        console.log(`Username: ${userName || "[Not Set]"}`);
        console.log(`Room ID: ${roomCode || "[Not in a Room]"}`);
        await fetchServerStatus();

        // Create a fresh abort signal for this menu interaction loop iteration
        menuAbortController = new AbortController();

        try {
            if (roomCode === "") {
                console.log('\n[1] Join a room\n[2] Create a room\n[3] Exit');
                userInput = await rl.question('Enter your command Number: ', { signal: menuAbortController.signal });

                if (userInput === "3") break;

                switch (userInput) {
                    case "1":
                        await checkUsername();
                        const temp_roomCode = await rl.question('Enter the room code you want to join: ');
                        console.log("Joining room...");
                        const joinStatus = await postData('/join_room', { code: temp_roomCode, username: userName, sid: socket.id });
                        console.log("Reply from server: ", joinStatus);

                        if (joinStatus['status'] === "success") {
                            roomCode = joinStatus['Room Code'];
                            serverTimeOffset = joinStatus["Server Time"] ? (joinStatus["Server Time"] - (Date.now() / 1000)) : 0;
                        } else if (joinStatus['status'] === "nameConflict") {
                            console.log("Name is taken in this current room, please try a different username.");
                            userName = "";
                        }
                        break;

                    case "2":
                        await checkUsername();
                        console.log("Creating a room...");
                        const createResponse = await postData('/create_room', { username: userName, sid: socket.id });
                        console.log("Reply from Server: ", createResponse);

                        roomCode = createResponse['Room Code'];
                        serverTimeOffset = createResponse["Server Time"] - (Date.now() / 1000);
                        break;

                    default:
                        console.log("Invalid option, try again.");
                }
            }
            else {
                console.log('\n[1] Pick/Select Game\n[2] Start Game\n[3] Get Room Status\n[4] Leave Room\n[5] Exit Client');
                userInput = await rl.question('Enter your command Number: ', { signal: menuAbortController.signal });

                if (userInput === "5") break;

                switch (userInput) {
                    case "1":
                        const gameResponse = await postData('/select_game', { code: roomCode, game_id: 'Crash Out' });
                        if (gameResponse['status'] === "success") {
                            console.log(`${gameResponse['message']}`);
                        }
                        break;

                    case "2":
                        console.log("Sending start command to server...");
                        await postData('/start_game', { code: roomCode });
                        break;

                    case "3":
                        const statusResponse = await postData('/room_status', { code: roomCode, username: userName });
                        console.log("Reply from server: ", statusResponse);
                        break;

                    case "4":
                        console.log("Leaving room...");
                        await postData('/leave_room', { code: roomCode, username: userName, sid: socket.id });
                        roomCode = "";
                        break;

                    default:
                        console.log("Invalid option, try again.");
                }
            }
        } catch (err) {
            // If the question was intentionally aborted because the game started, catch it here silently
            if (err.name === 'AbortError') {
                // Yield control to the game loop check at the top of the while-loop
                continue;
            }
            throw err; // Forward actual errors
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    rl.close();
    console.log("Program finished.");
    process.exit();
}

async function main() {
    socket.on("connect", () => {
        console.log(`Connected to server with Socket ID: ${socket.id}`);
        startProgram();
    });
}

main();