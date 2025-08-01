from typing import AsyncGenerator, NoReturn

import json
import os
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from openai import AsyncOpenAI

from ChatHistory.ChatHistory import ChatSession

os.environ.pop("SSL_CERT_FILE", None)

load_dotenv()

app = FastAPI()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# with open('E:\\HDISED\\Projekt2\\BazyGrafowe\\backend\\index.html') as f:
#     html = f.read()

history = ChatSession()
history.addMessage(
    user="system", 
    message= "You are an expert assistant specialized in generating and analyzing graph databases"
        "derived from textual data. Your task is to help users create, and interpret"
        "graph-based representations of information extracted from texts")


async def get_ai_response(messages) -> AsyncGenerator[str, None]:
    """
    OpenAI Response
    """
    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        stream=True
        
    )

    all_content = ""
    async for chunk in response:
        content = chunk.choices[0].delta.content
        if content:
            all_content += content
            yield all_content

# @app.get("/")
# async def web_app() -> HTMLResponse:
#     """
#     Web App
#     """
#     return HTMLResponse(html)



@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> NoReturn:
    """
    Websocket for AI responses
    
    """
    print("Hello")
    await websocket.accept()
    while True:
        raw_message = await websocket.receive_text()
        
        try:
            message = json.loads(raw_message)
        except: 
            print("Error while loading json")
            continue
        
        if(message['type'] == "message"):
            await handleChatMessage(message=message, websocket=websocket)
            
        if(message['type'] == "save"):
            history.createHistory()
 
                


async def handleChatMessage(message, websocket):
            history.addMessage(user="user", message=message['message'])

            sentAny: bool = False
            prev = ""
            full_text = ""

            async for full_text in get_ai_response(history.getHistory()):
                delta = full_text[len(prev):]
                prev = full_text
                await websocket.send_text(delta)
                sentAny = True

            if sentAny:

                history.addMessage(user="assistant", message=full_text)
                await websocket.send_text("[END]")
        

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level="debug",
        reload=True,
    )
    