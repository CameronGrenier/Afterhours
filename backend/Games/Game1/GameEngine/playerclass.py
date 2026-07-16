class SlangPlayer:

    def __init__(self,name):
        self.name = name
        self.fails = 0
        self.confirmed = False
        self.eliminated = False

    def life_lost(self):
        self.fails += 1
 
        
