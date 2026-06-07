export default class CrashGame {
    constructor(onSendAction, onPhaseChange, userName, roomCode, serverTimeOffset) {
        // These are your persistent local states for this game
        this.score = null;
        this.phase = "waiting";
        this.seed = null;
        this.step_duration = 0;
        this.onSendAction = onSendAction
        this.onPhaseChange = onPhaseChange
        this.userName = userName
        this.roomCode = roomCode
        this.timeOffset = serverTimeOffset
    }

    get_timestamp(){
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    async postData(data = {}){
    const response = await fetch(`http://127.0.0.1:8000/game_event`,
        {method : 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    return response.json()
}

    async handleInputEvent(input){
        console.log(`Client Game Engine is processing ${input.type}`);
        switch (input.type) {
            case 'place_bet':
                if (this.phase === 'betting') {
                    console.log(`>> Placing bet of ${input.amount}`);
                    const betData = await this.onSendAction("place_bet", {"bet":input.amount})
                    console.log('cashData: ',betData)
                    this.score = betData['data'].score
                } else {
                    console.log(">> Can't bet right now!");
                }
                break;
            case 'cash_out':
                if (this.phase === 'blast_off') {
                    console.log(`>> Cashing out! ${input.multiplier}`);
                    const cur_time = Date.now()
                    const cashData = await this.onSendAction("cash_out", {"cashout_time":((cur_time / 1000) + this.timeOffset), "multiplier":input.multiplier})
                    console.log('cashData: ',cashData)
                    this.score = cashData['data'].score
                } else {
                    console.log(">> Nothing to cash out!");
                }
                break;
        }
    }
    // A global variable to keep track of the game state
    async handleSocketEvent(envelope) {
        const { type, payload } = envelope;

        //console.log(`\nCrash logic running for: ${type}`);

        switch (type) {
            case "START_GAME":
                // Updating the class variables
                this.score = payload.starting_score;
                console.log(`Game started! Initial score: ${this.score}`);
                break;
            case "PHASE_CHANGE":
                this.phase = payload.phase;
                if (this.phase === "betting"){
                    if(this.score === null){
                        const response = await this.postData({'username':this.userName,'code':this.roomCode,'event_type':'get_score','data':{}})
                        console.log("Asked server for score got back", response);
                        if(response['status'] === "success"){
                            console.log("Asked server for score got back", response);
                            this.score = response['data'].score
                        }
                    }
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
            case "END_GAME":
                this.phase = "game_over"
                this.onPhaseChange(this.phase)
                break;
            case "PLAYER_ACTION":
                if(payload.player !== this.userName){
                    //Only print data that isn't mine
                    console.log(`\n${payload.player} did a ${payload.action}`)
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