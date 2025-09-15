
import os
import json

propmtsPath = "backend/Data/Prompts"

class Prompts:
    
    @classmethod
    def GetNames(cls):
        try:
            return [os.path.splitext(filename)[0] for filename in os.listdir(propmtsPath)]
        except:
            return []
         
    @classmethod
    def GetSelected(cls, name):
        
        for filename in os.listdir(propmtsPath):
            if os.path.splitext(filename)[0] == name:
                with open(f"{propmtsPath}/{filename}", "r", encoding="utf-8") as f:
                    return json.load(f)
                
        return None
    
    @classmethod
    def NewPrompt(cls, filename, prompt):
        
        dict = {
            "prompt": prompt
        }
        
        with open(f"{propmtsPath}/{filename}.json", "w", encoding="utf-8") as f:
            json.dump(dict, f, indent=4, ensure_ascii=False)
        
                    
            
            

