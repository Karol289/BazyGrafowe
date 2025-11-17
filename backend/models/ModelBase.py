
from abc import ABC, abstractmethod
from typing import AsyncGenerator
from ChatHistory.ChatHistory import ChatSession

class ModelBase(ABC):
    
    def __init__(self, chatSession: ChatSession):
        self.history = chatSession
    
    @abstractmethod
    async def GetAiResponse(self, message) -> AsyncGenerator[str, None]:
        yield ""
    
    @abstractmethod
    def getAvaibleModels():
        return []
    
    def SetTemperature(self, temp):
        self.temperature = temp
        
    def SetTopK(self, top_k):
        self.top_k = top_k
        
    def SetTopP(self, top_p):
        self.top_p = top_p