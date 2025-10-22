
from models.ModelBase import ModelBase


model : ModelBase
isSet : bool = False


def SetModel(newModel: ModelBase):
    global model, isSet
    model = newModel
    isSet = True
    
def GetModel() -> ModelBase:
    global model, isSet
    if(isSet):
        return model
    
    raise AttributeError("LLM nie został zainicjalizowany (None)")
