export default class CrashGame {
    constructor(onSendAction, onPhaseChange) {
        // These are your persistent local states for this game
        this.score = 0;
        this.phase = "waiting";
        this.seed = null;
        this.step_duration = 0;
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

    async handleInputEvent(input){
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
                if (this.phase === 'blast_off') {
                    console.log(`>> Cashing out! ${input.multiplier}`);
                    const cur_time = Date.now()
                    const cashData = await this.onSendAction("cash_out", {"cashout_time":cur_time, "multiplier":input.multiplier})
                    console.log('cashData: ',cashData)
                    this.score = cashData.score
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
            case "START_GAME":
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
                    this.countdown = payload.start_time
                    this.step_duration = payload.step_inverval
                    console.log(`${this.get_timestamp()} In Playing phase ${this.seed}`)
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