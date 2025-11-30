
from models.ModelBase import ModelBase
from typing import AsyncGenerator
from ChatHistory.ChatSession import ChatSession

import ollama

class OllamaModel(ModelBase):
    
    def __init__(self, chatSession: ChatSession, model: str = "gemma3:12b"):
        
        super().__init__(chatSession, model)
        
        self.client = ollama.AsyncClient()
    
    async def GetAiResponse(self, message) -> AsyncGenerator[str, None]:
        """
        Ollama Response
        """
        self.history.AddMessage("user", message)
        
        kwargs = self.GetKwargs()

        response = await self.client.chat(
            model=self.model,
            messages=self.history.GetMessages(),
            stream=True,
            **kwargs
        )

        all_content = ""
        async for chunk in response:
            content = chunk['message']['content']
            if content:
                all_content += content
                yield all_content 
                
        self.history.AddMessage("assistant", all_content)
        self.history.SaveAsJson()
    
    @staticmethod
    async def getAvaibleModels():
        # Użyj 'await' przed wywołaniem metody 'list()' klienta asynchronicznego
        modelList = await ollama.AsyncClient().list()

        # Metoda .list() zwraca słownik, więc wywołujemy .get() na nim
        available_names = [
                # Odwołujemy się do atrybutu .model obiektu
                model_object.model 
                for model_object in modelList.get('models', [])
            ]  

        return available_names