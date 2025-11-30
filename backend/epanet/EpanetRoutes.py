
import json
import datetime
import os

from fastapi import APIRouter
from pydantic import BaseModel

from ChatHistory.ChatSession import ChatSession
from models.CurrentModel import GetModel, SetModel
from models.CurrentModel import GetModel
from Epanet.network import createNetwork



epanetRouter = APIRouter(prefix="/epanet", tags=["epanet"])


chatsPath = "backend/Data/Networks"


class CreateNetwork(BaseModel):
    title: str
    graphAlgoritm: str # kamada_kawai, spring, circle

@epanetRouter.post("/create")
async def create(networkCreate: CreateNetwork):
    

    networkJson = GetModel().history.GetNodesAndEdges()

    network = createNetwork(networkCreate.title, networkJson, networkCreate.graphAlgoritm)

    network.write(chatsPath + "/" + str(networkCreate.title) + ".inp")

    
    

