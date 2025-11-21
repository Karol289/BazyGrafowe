
from abc import ABC, abstractmethod
from typing import AsyncGenerator
from ChatHistory.ChatHistory import ChatSession

class ModelBase(ABC):
    
    def __init__(self, chatSession: ChatSession, model: str):
        self.history = chatSession
        self.model = model
    
    @abstractmethod
    async def GetAiResponse(self, message) -> AsyncGenerator[str, None]:
        yield ""
    
    @staticmethod
    @abstractmethod
    async def getAvaibleModels():
        return []
    
    def SetTemperature(self, temp):
        self.temperature = temp
        
    def SetTopK(self, top_k):
        self.top_k = top_k
        
    def SetTopP(self, top_p):
        self.top_p = top_p
        
        
    def GetKwargs(self):
        
        kwargs = {}
        
        temperature = getattr(self, 'temperature', None)
        top_k = getattr(self, 'top_k', None)
        top_p = getattr(self, 'top_p', None)
        
        if temperature is not None:
            kwargs['temperature'] = temperature
        if top_k is not None:
            kwargs['top_k'] = top_k
        if top_p is not None:
            kwargs['top_p'] = top_p
            
        return kwargs
        