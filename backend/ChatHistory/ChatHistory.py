

import json
import datetime
import os

chatsPath = "backend/Data/Chats"

class ChatSession:
    
    def __init__(self, id, title, creationDateTime = "placeholder", history = [], nodes = [], edges = []):
        self.id = id
        if creationDateTime == "placeholder":
            self.creationDateTime = datetime.datetime.now().strftime("%d.%m.%Y,%H:%M:%S")
        else:
            self.creationDateTime = creationDateTime
        
        self.title = title
        self.history =  history
        
        self.nodes = nodes
        self.edges = edges
    
    @classmethod
    def CreateNewChat(cls, title) -> "ChatSession":
        
        id = 0
        
        for filename in os.listdir(chatsPath):
            file_path = os.path.join(chatsPath, filename)
            if os.path.isfile(file_path):  
                fileId = filename.split("_")[0]
                try:
                    id = max(int(fileId), id)
                except:
                    print("An wrong file in chats" + filename)

        id = id + 1

        newChatSession = ChatSession(id, title)
        
        newChatSession.AddMessage("system", cls.GetSystemPrompt())
        
        return newChatSession
    

        
    @classmethod
    def GetSystemPrompt(cls):
        return ("You are an expert assistant specialized in generating graph databases" +
        "derived from textual data. Your task is to help users create" +
        "graph-based representations of information extracted from texts")
        
            
    @classmethod
    def GetExisitingChat(cls, id)->"ChatSession":
        
        for file in os.listdir(chatsPath):
            if file.split("_")[0] == str(id):
                with open(f"{chatsPath}/{file}", "r", encoding="utf-8") as f:
                    data = json.load(f)
                    #id not equal ?                    
                    id = data['id']
                    title = data['title']
                    date = data['creationDate']
                    messages = data["messages"]
                    nodes = data['nodes']
                    edges = data['edges']
                    
                    return ChatSession(id, title, date, messages, nodes, edges)
        
        raise FileNotFoundError 
         
         
    @classmethod
    def GetNewestChat(cls):
        id = -1
        for file in os.listdir(chatsPath):
            readId = file.split("_")[0]
            id = max(int(readId), id)
            
        if id == -1:
            return cls.CreateNewChat("NewChat")
        
        return cls.GetExisitingChat(id)

    @classmethod
    def DeleteChat(cls, id):
        for file in os.listdir(chatsPath):
            if file.split("_")[0] == str(id):
                os.remove(f"{chatsPath}/{file}")
                return
    
              
    def SaveAsJson(self):
        dict = {
            "id":  self.id,
            "title": self.title,
            "creationDate": self.creationDateTime,
            "messages": self.history,
            "nodes": self.nodes,
            "edges": self.edges
        }
        
        with open(f"{chatsPath}/{self.id}_{self.title}.json", "w", encoding="utf-8") as f:
            json.dump(dict, f, indent=4, ensure_ascii=False)
            
    def GetMessages(self):
        return self.history

    def AddMessage(self, user: str, message: str):

        self.history.append({"role": user, "content": message})
        
    def SetNodes(self, nodes: str):
        
        j = json.loads(nodes)
        self.nodes = j['nodes']
        
        self.SaveAsJson()
        
    def SetEdges(self, edges: str):
        
        j = json.loads(edges)
        self.edges = j['edges']
        
        self.SaveAsJson()
        
    def GetNodesAndEdges(self) -> dict: 
        
        return{
            "nodes": self.nodes,
            "edges": self.edges
        }
        
        

        
        
   
   

#Tests
   
# a = ChatSession.CreateNewChat("title")
# a.AddMessage("me", "aaaaa")
# a.AddMessage("me", "aaaasda423aa")
# a.AddMessage("me", "31231aaaaa")
# a.SaveAsJson()
# a.AddMessage("me", "messa")
# a.AddMessage("me", "wici")   
# a.SaveAsJson()    

# b = ChatSession.GetExisitingChat(1)
# b.AddMessage("newMe", "ulala")  
# b.SaveAsJson() 


            
        
        