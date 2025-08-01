

import json
import datetime

class ChatSession:
    
    def __init__(self):
        
        self.time = datetime.datetime.now
        self.title = self.time
        self.history =  []
        
    def addMessage(self, user: str, message: str):

        self.history.append({"role": user, "content": message})
        
    def getHistory(self):
        
       return self.history
   
    def createHistory(self):
       
        with open(f'./History/{self.title}.json', 'w') as json_file: 
            json.dump(self.history, json_file, indent=4)
       
       
       
       
       
            
            
        
        