export default class CrashGame {
    constructor() {
        // These are your persistent local states for this game
        this.score = 0;
        this.phase = "waiting";
        this.seed = null;
    }

    handleSocketEvent(envelope) {
        const { type, payload } = envelope;
        
        console.log(`Crash logic running for: ${type}`);

        switch (type) {
            case "GAME_START":
                // Updating the class variables
                this.score = payload.starting_score;
                this.phase = "betting";
                console.log(`Game started! Initial score: ${this.score}`);
                break;

            case "PHASE_CHANGE":
                this.phase = payload.phase;
                if (this.phase === "betting"){
                    console.log("In betting phase")
                    //Ask for input, make the HTTP call to place a bet on send Can only send 1 bet no take backs
                }
                else if (this.phase === "playing"){
                    this.seed = payload.seed
                    console.log(`In Playing phase ${this.seed}`)
                    const countdown = payload.seconds
                    //Call some function to do the countdown and start the rocket
                }
                else if (this.phase === "blast_off"){
                    console.log("In Blast Off Phase")
                    //End Countdown, start rocket animation, add in cash out option, on cash out http call to server
                }
                break;

            case "MULTIPLIER_UPDATE":
                this.multiplier = payload.multiplier;
                break;
        }
    }

    handleInput(input) {
        // You can access class state here easily!
        console.log(`User took action while in phase: ${this.phase}`);
        // ... logic
    }
}