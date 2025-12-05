import json
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ChatHistory.ChatSession import ChatSession
from models.CurrentModel import GetModel
from Epanet.network import createNetwork


from Epanet.settingsManager import get_current_settings, update_current_settings, EpanetSettings

epanetRouter = APIRouter(prefix="/epanet", tags=["epanet"])
chatsPath = "backend/Data/Networks"

class CreateNetworkRequest(BaseModel):
    title: str
    graphAlgoritm: str 
    useMappedModel: bool = False

@epanetRouter.get("/options", response_model=EpanetSettings)
async def get_epanet_options():
    return get_current_settings()

@epanetRouter.put("/options")
async def update_epanet_options(settings: EpanetSettings):
    update_current_settings(settings)
    return {"message": "Ustawienia Epanet zostały zaktualizowane", "current": settings}


@epanetRouter.post("/create")
async def create(networkCreate: CreateNetworkRequest):
    try:
        if networkCreate.useMappedModel:
            networkJson = GetModel().history.GetMappedModel()
        else:
            networkJson = GetModel().history.GetNodesAndEdges()

        network = createNetwork(networkCreate.title, networkJson, networkCreate.graphAlgoritm)

        os.makedirs(chatsPath, exist_ok=True)
        
        output_path = os.path.join(chatsPath, f"{networkCreate.title}.inp")
        network.write(output_path)
        
        return {"status": "success", "path": output_path}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))