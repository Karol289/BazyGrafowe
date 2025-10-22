
from abc import ABC, abstractmethod
from typing import AsyncGenerator
from ChatHistory.ChatHistory import ChatSession

class ModelBase(ABC):
    
    def __init__(self, chatSession: ChatSession):
        self.history = chatSession
    
    @abstractmethod
    async def GetAiResponse(self, message) -> AsyncGenerator[str, None]:
        yield ""
    