
import json
import datetime
import os

from fastapi import APIRouter
from pydantic import BaseModel

from ChatHistory.ChatHistory import ChatSession
from models.CurrentModel import GetModel, SetModel
from models.OpenAiModel import OpenAiLLM
from models.OllamaModel import OllamaModel



modelRouter = APIRouter(prefix="/model", tags=["models"])

class ModelParams(BaseModel):
    type: str = "OpenAi"   #OpenAi Ollama
    model: str | None = None
    temperature:  float | None = None
    top_p: float | None = None
    top_k: int | None = None
    
    

@modelRouter.get("/current")
def getCurrent():
    currentModel = GetModel()
    typ = ""
    
    if isinstance(currentModel, OpenAiLLM):
        typ = "OpenAi"
    elif isinstance(currentModel, OllamaModel):
        typ = "Ollama"
    
    
    return ModelParams(
        type=typ, 
        model=currentModel.model, 
        temperature=getattr(currentModel, 'temperature', None),
        top_k=getattr(currentModel, 'top_k', None), 
        top_p=getattr(currentModel, 'top_p', None))
    


#returns list of strings (models)
@modelRouter.post("/getAvaible")
async def getAvaibleModels(params: ModelParams):
    
    if str.lower(params.type) == "openai":
        return await OpenAiLLM.getAvaibleModels()
    elif str.lower(params.type) == "ollama":
        return await OllamaModel.getAvaibleModels()
    
    return []
    
        
    

def setModelByTypeAndModel(type, model):
    
    history = GetModel().history
    
    try:
        if str.lower(type) == "openai":
            SetModel(OpenAiLLM(history, model))
            return True
        elif str.lower(type) == "ollama":
            SetModel(OllamaModel(history, model))
            return True
    except:
        return False   
    return False

        
    

@modelRouter.post("/update")
def updateModel(params: ModelParams):

    if not setModelByTypeAndModel(params.type, params.model):
        return
    
    currentModel = GetModel()
    
    if params.temperature is not None:
        currentModel.SetTemperature(params.temperature)
        
    if params.top_p is not None:
        currentModel.SetTopP(params.top_p)
        
    if params.top_k is not None:
        currentModel.SetTopK(params.top_k)

    