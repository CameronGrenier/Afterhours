from enum import Enum
from PlayerClass import PlayerClass
import random
#games should pivot from HTTP requests to Websocket data. This works great as all users will be synced up.
class Phases(Enum):
    BETTING = 0
    PLAYING = 1

"""Overall Gameplay:

Test loading and unloading different game engines -> should be fast.

UDP/TCP on the web sockets?

Web sockets use individual ports????

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



class SlangEngine:
    MINIMUM_PLAYERS = 2
    slang_players = []
    current_round = 0
    seed = None
    final_round = 5 #can easily make this customizable by the host
    def __init__(self, players):
        print("Starting Game Logic")
        for player in players:
            self.slang_players.append(PlayerClass(player))

    def handle_action(self, ):
        print("handle some action")
    def update_scores(self):
        """End of round update the scores for each player based on when they got out"""
        print("Updating scores per player")

    def place_bet(self):
        """Take in a players information """
        print("User has placed a bet")

    def generate_seed(self):
        """Generate a seed when placing a bet"""
        length = random.randint(1, 10)
        numbers = list(range(1,10000)) #Numbers between 1 and 9999
        weights = [1 / (i**1.5) for i in numbers]
        self.seed = [0] + random.choices(numbers, weights=weights, k=length - 1)

    def  get_multiplier_at_time(self, time_elapsed):
        """Each step takes 2 seconds to change between, we can use the timestamp to get the multiplier the user got"""
        step_duration = 2
        index = int(time_elapsed//step_duration) #Find the point the user cashed out
        if index >= len(self.seed) - 1: #End of seed Crash
            return 0
        start_val = self.seed[index]
        end_val = self.seed[index+1]

        #Calculate how far into the step we were, this is the float of the multiplier
        progress = (time_elapsed % step_duration) / step_duration
        multiplier = start_val + (end_val - start_val) * progress
        return multiplier

