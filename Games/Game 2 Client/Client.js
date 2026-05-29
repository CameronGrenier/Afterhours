// A modular function to talk to your backend
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

// Call it
fetchServerStatus();