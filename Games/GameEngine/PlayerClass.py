
class PlayerClass:
    """Basic class representing a player, tracks score, bet and name"""
    def __init__(self, name):
        """
        Name: The name of the player
        Score: The current Score the player has in the bank (not bet)
        Bet: the current Score the player has bet
        Gain: The amount of Score Gained from the previous playing phase (used for the biggest loser)
        """
        self.name = name
        self.score = 50
        self.bet = 0
        self.gain = 0
    def place_bet(self, amount: int):
        """Places the players bet"""
        if amount > self.score:
            return False
        self.score = self.score - amount
        self.bet = amount
        return True
    def payout(self, multiplier: float):
        """Put winnings in the bank"""
        self.gain = self.bet * multiplier
        self.score += self.gain
        self.bet = 0


