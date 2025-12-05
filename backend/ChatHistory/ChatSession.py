

import json
import datetime
import os
import random

from ChatHistory.Mapping import Mapping

chatsPath = "backend/Data/Chats"

class ChatSession:
    
    def __init__(self, id, title, creationDateTime = "placeholder", history = [], nodes = [], edges = [], mappers=None, mappedModel = None):
        self.id = id
        if creationDateTime == "placeholder":
            self.creationDateTime = datetime.datetime.now().strftime("%d.%m.%Y,%H:%M:%S")
        else:
            self.creationDateTime = creationDateTime
        
        self.title = title
        self.history =  history
        
        self.nodes = nodes
        self.edges = edges
        
        self.mappers = mappers if mappers is not None else []
        self.mappedModel = mappedModel if mappedModel is not None else {"nodes": [], "edges": []}
    
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
                    mappers = data.get('mappers', [])
                    mappedModel = data.get("mappedModel", {})
                    
                    return ChatSession(id, title, date, messages, nodes, edges, mappers, mappedModel)
        
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
            "edges": self.edges,
            "mappers": self.mappers,
            "mappedModel": self.mappedModel
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
        
    def AddMapper(self, mapper: Mapping):
        
        self.mappers.append(mapper.GetJson())
    
    def GetMappers(self):
        
        return self.mappers
    
    
    def GetMappedModel(self):
        return self.mappedModel
    
    def GenerateMappedModel(self):
        
        nodes = []
        edges = [
            e.copy() for e in self.edges
        ]
        
        for node in self.nodes:
        
            map = next((m for m in self.GetMappers() if m["sourceNode"] == node["label"]), None)
        
            if map is not None:
                nodesEdges = self.transformNode(node, map, edges)
                nodes += nodesEdges["oNodes"]
                edges += nodesEdges["oEdges"]
            else:
                nodes.append(node)
                    
        self.mappedModel = {"nodes": nodes, "edges" : edges}
            
    def transformNode(self, node, map, edges):
        outputNodes = []
        outputEdges = []
        
        for oNode in map["outputNodes"]:
        
            n = {}
            n["tempid"] = oNode["tempid"]
            n["primarynode"] = oNode["primarynode"]
            
            for property in oNode["properties"]:
                
                value = 0
                
                if(property["type"] == "copy"):
                    value = node[property["sourceProperty"]]
                elif(property["type"] == "const"):
                    value = property["value"]
                elif(property["type"] == "random"):
                    value = random.randint(10000, 100000)

                n[property["targetProperty"]] = value
                
            outputNodes.append(n)

        for oEdge in map["outputEdges"]:
            
            e = {}
            
            e["from"] = next((x for x in outputNodes if x["tempid"] == oEdge["tempfrom"]))["Id"]
            e["to"] = next((x for x in outputNodes if x["tempid"] == oEdge["tempto"]))["Id"]
            
            for property in oEdge["properties"]:
                
                value = 0
                
                if(property["type"] == "copy"):
                    value = node[property["sourceProperty"]]
                elif(property["type"] == "const"):
                    value = property["value"]
                elif(property["type"] == "random"):
                    value = random.randint(10000, 100000)

                e[property["targetProperty"]] = value
                
            outputEdges.append(e)
        
        #UpdateEdges
        primaryNode = next(x for x in outputNodes if x["primarynode"] == True)
        
        for ed in edges:
            if ed["label"] == "PIPE":
                if ed["from"] == node["Id"]:
                    ed["from"] = primaryNode["Id"]
                elif ed["to"] == node["Id"]:
                    ed["to"] = primaryNode["Id"]
        
        for n in outputNodes:
            del n['tempid']
            del n['primarynode']
        
        return {"oNodes" : outputNodes, "oEdges": outputEdges}
            
            
            
            
            
            
        
                     
            
            
        
        

        

                    
                    
                    
                