export default class CrashGame {
    constructor(onSendAction, onPhaseChange) {
        // These are your persistent local states for this game
        this.score = 0;
        this.phase = "waiting";
        this.seed = null;
        this.onSendAction = onSendAction
        this.onPhaseChange = onPhaseChange
    }

    get_timestamp(){
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    handleInputEvent(input){
        console.log(`Client Game Engine is processing ${input.type}`);
        switch (input.type) {
            case 'place_bet':
                if (this.phase === 'betting') {
                    console.log(`>> Placing bet of ${input.amount}`);
                    this.onSendAction("place_bet", {"bet":input.amount})
                } else {
                    console.log(">> Can't bet right now!");
                }
                break;

            case 'cash_out':
                if (this.phase === 'playing') {
                    console.log(">> Cashing out!");
                    const cur_time = Date.now()
                    const multiplier = 2
                    this.onSendAction("cash_out", {"cashout_time":cur_time, "multiplier":multiplier})
                } else {
                    console.log(">> Nothing to cash out!");
                }
                break;
        }
    }
    // A global variable to keep track of the game state
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
                    console.log(`${this.get_timestamp()} In betting phase`)
                    this.onPhaseChange(this.phase)
                    //Ask for input, make the HTTP call to place a bet on send Can only send 1 bet no take backs
                }
                else if (this.phase === "playing"){
                    this.seed = payload.seed
                    this.countdown = payload.seconds
                    console.log(`${this.get_timestamp()} In Playing phase ${this.seed} ${this.countdown}`)
                    this.onPhaseChange(this.phase)
                    //Call some function to do the countdown and start the rocket
                }
                else if (this.phase === "blast_off"){
                    console.log(`${this.get_timestamp()} In Blast Off Phase`)
                    this.onPhaseChange(this.phase)
                    //End Countdown, start rocket animation, add in cash out option, on cash out http call to server
                }
                break;
        }
    }

    handleInput(input) {
        // You can access class state here easily!
        console.log(`User took action while in phase: ${this.phase}`);
        // ... logic
    }
}