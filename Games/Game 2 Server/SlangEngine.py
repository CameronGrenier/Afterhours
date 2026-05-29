from enum import Enum
from PlayerClass import PlayerClass

class Phases(Enum):
    BETTING = 0
    PLAYING = 1

class SlangEngine:
    MINIMUM_PLAYERS = 2
    slang_players = []
    def __init__(self, players):
        print("Starting Game Logic")
        global slang_players
        for player in players:
            slang_players.append(PlayerClass(player))

    def handle_action(self):

    def update_scores(self):
        """End of round update the scores for each player based on when they got out"""
        print("Updating scores per player")

    def place_bet(self):
        """Take in a players information """
        print("User has placed a bet")

    def generate_seed(self):
        """When all players have placed a bet generate a seed"""