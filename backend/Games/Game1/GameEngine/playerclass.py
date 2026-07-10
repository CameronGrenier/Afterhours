class SlangPlayer:

    def __init__(self,name):
        self.name = name
        self.fails = 0
        self.confirmed = False
        self.eliminated = False
    
    def player_ready(self):
        self.confirmed = True
    
    def life_lost(self):
        self.fails += 1
    
    def player_eliminated(self):
        return self.fails >= lives_total
        
