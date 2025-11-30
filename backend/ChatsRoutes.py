
import json
import datetime
import os

from fastapi import APIRouter
from pydantic import BaseModel

from ChatHistory.ChatSession import ChatSession
from models.CurrentModel import GetModel, SetModel
from ChatHistory.Mapping import Mapping
from ChatHistory.Property import Property, ConstProperty, CopyProperty, RandomProperty

from typing import List, Literal, Union, Optional

chatsRouter = APIRouter(prefix="/chats", tags=["chats"])


chatsPath = "backend/Data/Chats"


class ChatList(BaseModel):
    chats: list
    current: str

@chatsRouter.get("/getChatNames")
async def getChatNames():
    listOfIdNamesAndDates = []
    for file in os.listdir(chatsPath):
        with open(f"{chatsPath}/{file}", "r", encoding="utf-8") as f:
            data = json.load(f)
            listOfIdNamesAndDates.append(
                {
                    "id": data["id"],
                    "title": data["title"],
                    "date": data["creationDate"]
                }
            )
    
    listOfIdAndNames = [
        {"id": d["id"], "title": d["title"]}
        for d in sorted(listOfIdNamesAndDates, key=lambda x: datetime.datetime.strptime(x["date"], "%d.%m.%Y,%H:%M:%S"), reverse=True)
    ]
    
    id = GetModel().history.id
    
    return ChatList(chats = listOfIdAndNames, current = str(id))

    
    

class ChatCreate(BaseModel):
    title: str  
    
    
@chatsRouter.post("/addNewChat")
async def addNewChat(newChatCommand: ChatCreate):
    
    newChat = ChatSession.CreateNewChat(newChatCommand.title)
    
   # GetModel().history = newChat
    
    newChat.SaveAsJson()
    
    
class SelectChat(BaseModel):
    id: int
    
@chatsRouter.put("/selectChat")
async def selectChat(selectChatCommand: SelectChat):
    
    GetModel().history = ChatSession.GetExisitingChat(id=selectChatCommand.id)
    
    
@chatsRouter.put("/deleteChat")
async def deleteChat(selectChatCommand: SelectChat):
    
    ChatSession.DeleteChat(id=selectChatCommand.id)
    
    

@chatsRouter.get("/getMappers")
async def getMappers():
    
    return GetModel().history.GetMappers()



class PropertyParam(BaseModel):
    type: Literal["copy", "const", "random"] 
    targetProperty: str
    sourceProperty: Optional[str] = None 
    value: Optional[str] = None          


class OutputNodeModel(BaseModel):
    tempId: str
    primaryNode: bool = False 
    properties: List[PropertyParam]


class OutputEdgeModel(BaseModel):
    tempFrom: str
    tempTo: str
    properties: List[PropertyParam]


class AddMapping(BaseModel):
    Name: str
    From: str
    outputNodes: List[OutputNodeModel]
    outputEdges: List[OutputEdgeModel]

def create_property_object(prop_data: PropertyParam):
    if prop_data.type == "copy":
        return CopyProperty(prop_data.type, prop_data.targetProperty, prop_data.sourceProperty)
    elif prop_data.type == "const":
        return ConstProperty(prop_data.type, prop_data.targetProperty, prop_data.value)
    elif prop_data.type == "random":
        return RandomProperty(prop_data.type, prop_data.targetProperty)
    return None

@chatsRouter.post("/addMapping")
async def addMapping(mappingData: AddMapping):
    
    history = GetModel().history
    
    history.mappers = [
        m for m in history.GetMappers() 
        if str(m.get('sourceNode')) != mappingData.From
    ]
    
    mapper = Mapping(mappingData.Name, mappingData.From)
    
    for node in mappingData.outputNodes:
        props_objects = []
        for prop in node.properties:
            p_obj = create_property_object(prop)
            if p_obj:
                props_objects.append(p_obj)
        
        mapper.AddNode(node.tempId, node.primaryNode, props_objects)
        
    for edge in mappingData.outputEdges:
        props_objects = []
        for prop in edge.properties:
            p_obj = create_property_object(prop)
            if p_obj:
                props_objects.append(p_obj)
                
        mapper.AddEdge(edge.tempFrom, edge.tempTo, props_objects)
        
    history.AddMapper(mapper)
    history.SaveAsJson()
    
    return {"status": "success", "message": f"Mapping for '{mappingData.From}' saved successfully."}
        
        
        