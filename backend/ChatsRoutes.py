
import json
import datetime
import os

from fastapi import APIRouter
from pydantic import BaseModel

from ChatHistory.ChatHistory import ChatSession
from models.CurrentModel import GetModel, SetModel




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
        # splitByDot = file.split(".")
        # if splitByDot[1] == "json":
        #     split = splitByDot[0].split("_")
        #     listOfIdAndNames.append({"id": split[0], "title": split[1]})
    
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
    
    
    
