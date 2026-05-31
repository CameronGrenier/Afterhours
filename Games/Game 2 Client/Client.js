let userName = "" //Global variable for the username
let roomCode = "" //Global variable for the entered room code
const SERVER_BASE = 'http://127.0.0.1:8000' //Global URL for the server. LocalHost
const readline = require('readline').promises;
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

async function startProgram() {


    let userInput = "";
    while (true) {
        //console.clear()
        await fetchServerStatus();
        console.log(`--- Main Menu ---\nUsername: ${userName}\nRoomID: ${roomCode}`);
        userInput = await rl.question('[1] Join a room\n[2] Create a room\n[3] Exit\nEnter your command Number: ');
        console.log(`You typed: ${userInput}`);
        if (userInput === "3"){
            break
        }
        switch(userInput) {
            case "1":
                await checkUsername()
                roomCode = await rl.question('Enter the room code you want to join: ');
                console.log("Joining a room...")
                const status = await postData('/join_room', {code: `${roomCode}`, username: `${userName}`})
                break;
            case "2":
                await checkUsername()
                console.log("Creating a room...")
                const response = await postData('/create_room',{username: `${userName}`})
                console.log("Reply from Server: ", response)
                roomCode = response['Room Code'] //Pull out the room code from the newly created room
                break;
            default:
                console.log("Invalid option, try again.")
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
    rl.close();
    console.log("Program finished");
}

startProgram();
