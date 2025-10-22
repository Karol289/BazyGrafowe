
from models.ModelBase import ModelBase
from typing import AsyncGenerator
from ChatHistory.ChatHistory import ChatSession

import ollama

class OllamaModel(ModelBase):
    
    def __init__(self, chatSession: ChatSession, model: str = "gemma3:12b"):
        
        super().__init__(chatSession)
        
        self.model = model
        self.client = ollama.AsyncClient()
    
    async def GetAiResponse(self, message) -> AsyncGenerator[str, None]:
        """
        Ollama Response
        """
        self.history.AddMessage("user", message)
        

        response = await self.client.chat(
            model=self.model,
            messages=self.history.GetMessages(),
            stream=True
        )

        all_content = ""
        async for chunk in response:
            content = chunk['message']['content']
            if content:
                all_content += content
                yield all_content 
                
        self.history.AddMessage("assistant", all_content)
        self.history.SaveAsJson()