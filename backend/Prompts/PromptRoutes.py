
from pydantic import BaseModel
from fastapi import APIRouter
from Prompts.Prompt import Prompts

propmtRouter = APIRouter(prefix= "/prompts", tags = ["/promts"])


@propmtRouter.get("/getNames")
def getPropmts():
    return Prompts.GetNames()




@propmtRouter.get("/getSelected")
def getSelectedPropmt(promptName: str):
    prompt = Prompts.GetSelected(promptName)
    if prompt is not None:
        return prompt
    return {"prompt": ""}
        
        
class NewPrompt(BaseModel):
    name: str
    prompt: str

@propmtRouter.post("/new")
def newPrompt(newPrompt: NewPrompt):
    
    try:
        Prompts.NewPrompt(newPrompt.name, prompt=newPrompt.prompt)
    except:
        pass