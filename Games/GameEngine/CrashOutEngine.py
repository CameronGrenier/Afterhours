from enum import Enum
from typing import Dict, Any
import asyncio
import time
from Games.GameEngine.PlayerClass import PlayerClass
import random
#games should pivot from HTTP requests to Websocket data. This works great as all users will be synced up.
class Phases(Enum):
    BETTING = 0
    PLAYING = 1

"""Overall Gameplay:

Test loading and unloading different game engines -> should be fast.

UDP/TCP on the web sockets?

Web sockets use individual ports????

AWS, get everyone access

Web hosting (hosting on AWS (?), GitHub hosting)

Server broadcasts to the players the current phases of the game. The game starts with one of these broadcasts announcing:

Betting has started

The server uses the room manager to get a talley of how many players need to bet, if 6 bets need to be place we hold until all 6 place a bet
    Note later there needs to be a ~15-20 second timeout to keep the game rolling, anyone who doesn't place a bet should trigger a check to see if they are still connected to the game.
    If they arn't in the lobby anymore then kick them out and the server should stop broadcasting to them

Then the server generates a seed, this seed is broadcasted to all connected players. The seed can be any length from 1 - 10. The seed is random numbers between 1-10000 with 10000 being rare
and 1 being common. All seeds start with 0

Example seed:
0, 10, 5, 25, 1, 100
(Start 0x -> 10x -> 5x -> 25x -> 1x -> 100 Crash)

The server then broadcasts a sync countdown with the goal of having all players start at the exact same time.

The Clients do the transitions between indexes of the seed, each index gets a 2 second linear transition 
    {Add in exponenial scaling for more exciting gameplay}
    
The server and the client both use the same transition function, (linear or exponential), this way the clients pass a multiplier and a timestamp to the server when they pull out.
This information is then verified, We check the timestamp to check the seed on the server, if it is within some range, ex +- 0.5 we trust the client. If it isn't we can blame lag or
catch potential cheating. Regardless we just change the multiplier to whatever the server sees. <- Testing required to verify this feels 
"""


class CrashOutEngine:
    step_duration = 2
    starting_score = 50
    MINIMUM_PLAYERS = 1
    betting_timeout = 3
    slang_players = {}
    current_round = 0
    game_task = None
    phase = Phases.BETTING #Start in the betting phase of the game
    seed = None
    final_round = 5 #can easily make this customizable by the host
    def __init__(self, players, sio, room):
        print("Starting Game Logic")
        for player in players:
            self.slang_players[player] = PlayerClass(player) #Create a dictionary of player objects to quicky edit their data
        self.sio = sio #Used for socket communicaion
        self.room = room

    async def start(self):
        print("Starting game loop")
        #Tell everyone their starting scores
        await self.sio.emit('game_update', {
            'type': 'START_GAME',
            'payload': {
                'game': 'Games.CRASH',
                'starting_score': self.starting_score,
            }
        }, room=self.room)
        self.game_task = asyncio.create_task(self.run_game_loop()) #Start the game loop

    async def run_game_loop(self):
        for i in range(self.final_round):
            await self.start_betting()

    async def handle_event(self, username:str, event_type:str, data: Dict[str, Any]):
        print("handle some action")
        user = self.slang_players[username] #Grab the user
        if event_type == "place_bet" and self.phase == Phases.BETTING:
            #If the bet is valid and can be made
            print(data['bet'])
            if user.place_bet(amount = data['bet']):
                #Return the updated score - bet and the bet placed to the user
                print("User Placed Bet")
                return True, "New bet has been placed", {'score':user.score, 'bet':data['bet']}, {'score':user.score, 'bet':data['bet']}
            else:
                return False,"Bet was unable to be placed", None, None
        elif event_type == "cash_out" and self.phase == Phases.PLAYING:
            cashout_time = data['cashout_time']
            client_multiplier = data['multiplier']
            server_multiplier = self.get_multiplier_at_time(cashout_time)
            #Should be off of time, not multiplier, but I will leave this for now
            if client_multiplier - server_multiplier <= 0.5 or server_multiplier - client_multiplier <= 0.5:
                multiplier = client_multiplier
                user.payout(multiplier)
            else:
                multiplier = server_multiplier
                user.payout(multiplier)
            #Success cash out, tell everyone what multiplier they cased out which, and what their new total score is
            return True, "User has cashed out", {'multiplier':multiplier, 'score':user.score, 'gain':user.gain}, {'multiplier':multiplier, 'score':user.score}
        else:
            return False, f"Unrecognized event type {event_type} was sent to the server", {}, {}

    async def start_betting(self):
        self.current_round += 1
        print(f"Current Round {self.current_round} Betting Phase")
        await self.sio.emit('game_update', {
            'type': 'PHASE_CHANGE',
            'payload': {
                'phase': 'betting',
                'seconds': self.betting_timeout,
            }
        }, room=self.room)
        await asyncio.sleep(self.betting_timeout)
        self.phase = Phases.PLAYING
        print("Changing to playing phase")
        await self.playing_phase()

    async def playing_phase(self):
        self.generate_seed()
        await self.sio.emit('game_update', {
            'type': 'PHASE_CHANGE',
            'payload': {
                'phase': 'playing',
                'seed': self.seed,
                'seconds': 5
            }
        }, room=self.room)
        await asyncio.sleep(5) #Sleep for a 5 second countdown
        await self.sio.emit('game_update', {
            'type': 'PHASE_CHANGE',
            'payload': {
                'phase': 'blast_off',
                'start_time': time.time(),
            }
        }, room=self.room)
        await asyncio.sleep(len(self.seed) * self.step_duration)
        self.phase = Phases.BETTING

    def generate_seed(self):
        length = random.randint(1, 10)
        # Start with 0
        seed = [1]
        current_value = 0
        for _ in range(length - 1):
            # Determine the "jump" to the next number.
            #Add an index offset to keep it in a upward trend
            offset = _ * 5
            current_value += offset
            jump = random.randint(1, 40)
            # Add the jump to the current total
            current_value += jump
            # Add a random "wiggle" allow it to be negative by the offset
            wiggle = random.randint((-20 * (offset//4)), 30)
            next_val = max(1, current_value + wiggle)  # max(1, ...) keeps it positive
            seed.append(next_val)
        self.seed = seed

    def  get_multiplier_at_time(self, blastoff_time):
        """Each step takes 2 seconds to change between, we can use the timestamp to get the multiplier the user got"""
        time_elapsed = max(0, time.time() - blastoff_time) #Ensure no negatives with max
        index = int(time_elapsed//self.step_duration) #Find the point the user cashed out
        if index >= len(self.seed) - 1: #End of seed Crash
            return 0
        start_val = self.seed[index]
        end_val = self.seed[index+1]

        #Calculate how far into the step we were, this is the float of the multiplier
        progress = (time_elapsed % self.step_duration) / self.step_duration
        multiplier = start_val + (end_val - start_val) * progress
        return multiplier

