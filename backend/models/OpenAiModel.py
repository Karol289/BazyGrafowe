

from openai import AsyncOpenAI
from typing import AsyncGenerator, NoReturn
from models.ModelBase import ModelBase

from ChatHistory.ChatHistory import ChatSession
import os



class OpenAiLLM(ModelBase):
    
    def __init__(self, chatSession: ChatSession, model: str = "gpt-3.5-turbo"):
        
        super().__init__(chatSession)
        
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = model
        
       
    async def GetAiResponse(self, message) -> AsyncGenerator[str, None]:
        """
        OpenAI Response
        """
        self.history.AddMessage("user", message)
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=self.history.GetMessages(),
            stream=True
        )

        all_content = ""
        async for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                all_content += content
                yield all_content 
                
        self.history.AddMessage("assistant", all_content)
        self.history.SaveAsJson()
  
    def getAvaibleModels():
        return ["gpt-3.5-turbo"]              
        
        