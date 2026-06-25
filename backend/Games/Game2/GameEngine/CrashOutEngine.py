from enum import Enum
from typing import Dict, Any
import asyncio
import time
from Games.Game2.GameEngine.PlayerClass import PlayerClass
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
    betting_timeout = 8
    active_players: dict[str, PlayerClass] = {}
    current_round = 0
    game_task = None
    blastoff_time = 0
    phase = Phases.BETTING #Start in the betting phase of the game
    seed = None
    final_round = 5 #can easily make this customizable by the host
    def __init__(self, players, sio, room):
        """
         Initializes the stateful game container for a specific room instance.

         :param players: A list of unique string usernames present in the lobby.
         :param sio: The AsyncServer socket instance passed down from RoomManager.
         :param room: The unique string room code used for broadcasting data fields.
         """
        print(f"[Engine] Spin-up sequence initiated for Room: {room}")
        for player in players:
            # Create a dictionary of player objects to quicky edit their data
            self.active_players[player] = PlayerClass(player)
        self.sio = sio #Used for socket communicaion
        self.room = room

    async def start(self):
        print("Starting game loop")
        #Tell everyone their starting scores
        await self.sio.emit('game_update', {
            'type': 'START_GAME',
            'payload': {
                'game': 'Crash Out',
                'starting_score': self.starting_score,
            }
        }, room=self.room)
        self.game_task = asyncio.create_task(self.run_game_loop()) #Start the game loop

    async def run_game_loop(self):
        for i in range(self.final_round):
            await self.start_betting()
        await self.sio.emit('game_update', {
            'type': 'END_GAME',
            'payload': {
            }
        }, room=self.room)


    async def handle_event(self, username:str, event_type:str, data: Dict[str, Any]):
        print("handle some action")
        user = self.active_players[username] #Grab the user
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
            current_server_time = time.time()
            print(f"Current server time: {current_server_time} Client Time: {data['cashout_time']}")
            if abs(current_server_time - data['cashout_time'] >= 2):
                return False, "Latency is too high to verify cashout", None, None
            cashout_time = data['cashout_time']
            client_multiplier = data['multiplier']
            server_multiplier = self.get_multiplier_at_time(cashout_time)
            if abs(server_multiplier - client_multiplier) <= 0.5:
                multiplier = client_multiplier
            else:
                multiplier = server_multiplier
            user.payout(multiplier)
            #Success cash out, tell everyone what multiplier they cased out which, and what their new total score is
            return True, "User has cashed out", {'multiplier':multiplier, 'score':user.score, 'gain':user.gain}, {'multiplier':multiplier, 'score':user.score}
        elif event_type == "get_score":
            return True, "User has been given their score",{'score':user.score},{}
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
        self.blastoff_time = time.time() + 5
        await self.sio.emit('game_update', {
            'type': 'PHASE_CHANGE',
            'payload': {
                'phase': 'playing',
                'seed': self.seed,
                'start_time': self.blastoff_time,
                'step_inverval': self.step_duration
            }
        }, room=self.room)
        await asyncio.sleep(5) #Sleep for a 5 second countdown
        await self.sio.emit('game_update', {
            'type': 'PHASE_CHANGE',
            'payload': {
                'phase': 'blast_off',
            }
        }, room=self.room)
        await asyncio.sleep(len(self.seed) * self.step_duration)
        await self.cleanup_round()
        await asyncio.sleep(1) #Sleep to allow for scoreboard before we bet again
        self.phase = Phases.BETTING

    async def get_scoreboard(self):
        #Sort players by their gain
        sorted_players = sorted(
            self.active_players.values(),
            key=lambda p: p.gain,
            reverse=True
        )
        worst_gain = sorted_players[-1].gain
        biggest_loosers = []
        for player in reversed(sorted_players):
            #Flip the list from worst to best gain
            print(worst_gain, player.gain)
            if player.gain == worst_gain:
                #If the players gain is or tied with the worst gain add them to the biggest loosers
                biggest_loosers.append(player.name)
            else:
                break #Stop looping we're better than the worst now
        return biggest_loosers

    async def cleanup_round(self):
        """Reset gains, revive broke players, send punishments"""
        biggest_loosers = await self.get_scoreboard()
        #If punishments are sent the client should not tell the biggest looser to take a shot
        #Biggest loosers will always be those who have lost everything. Making them take another shot is pointless
        punishment = False
        #After the scoreboard is fetched, reset the gains of each player
        for player in self.active_players:
            this_player = self.active_players[player]
            this_player.gain = 0
            if this_player.score == 0:
                #If someone has lost everything, let them back into the game
                punishment = True
                this_player.score = 10
                await self.sio.emit('game_update', {
                    'type': 'PHASE_CHANGE',
                    'payload': {
                        'phase': 'player_punishment',
                        'name': this_player.name,
                    }
                }, room=self.room)
                await asyncio.sleep(1)
                #Here is where voting could take place to let the person back into the game

            print("Biggest Loosers: ", biggest_loosers)
            await self.sio.emit('game_update', {
                'type': 'PHASE_CHANGE',
                'payload': {
                    'phase': 'update_score',
                    'punishment': punishment,
                    'biggest_loosers': biggest_loosers,
                }
            }, room=self.room)

    def generate_seed(self):
        #The longer the seed the higher the multipliers, This promotes comebacks as the game progresses
        length = random.randint(1, (6 + self.current_round))
        # Start with 0
        seed = [1]
        current_value = 0
        for _ in range(length - 1):
            # Determine the "jump" to the next number.
            #Add an index offset to keep it in a upward trend
            offset = _ * (0 + self.current_round)
            current_value += offset
            #Make values larger as rounds go on, allows for surprise comebacks.
            jump = random.randint(1, (1 * self.current_round))
            # Add the jump to the current total
            current_value += jump
            # Add a random "wiggle" allow it to be negative by the offset
            wiggle = random.randint((-10 * (offset//4)), (1 * self.current_round))
            next_val = max(1, current_value + wiggle)  # max(1, ...) keeps it positive
            seed.append(next_val)
        self.seed = seed

    def get_multiplier_at_time(self, cashout_time):
        # Use the cashout_time from the client, not time.time()
        time_elapsed = max(0, cashout_time - self.blastoff_time)
        index = int(time_elapsed // self.step_duration)
        if index >= len(self.seed) - 1:
            return 0
        start_val = self.seed[index]
        end_val = self.seed[index + 1]
        progress = (time_elapsed % self.step_duration) / self.step_duration
        multiplier = start_val + (end_val - start_val) * progress
        return multiplier

