
import json
import datetime
import os

from fastapi import APIRouter
from pydantic import BaseModel

from ChatHistory.ChatHistory import ChatSession
from models.CurrentModel import GetModel, SetModel
from models.CurrentModel import GetModel
from epanet.network import createNetwork



epanetRouter = APIRouter(prefix="/epanet", tags=["epanet"])


chatsPath = "backend/Data/Networks"


class CreateNetwork(BaseModel):
    title: str

@epanetRouter.post("/create")
async def create(networkCreate: CreateNetwork):
    

    networkJson = GetModel().history.GetNodesAndEdges()

    network = createNetwork(networkCreate.title, networkJson)

    network.write(chatsPath + "/" + str(networkCreate.title) + ".inp")

    
    

