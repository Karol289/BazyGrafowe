from typing import AsyncGenerator, NoReturn

import json
import os
import uvicorn

from openai import AsyncOpenAI

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from ChatsRoutes import chatsRouter
from models.CurrentModel import GetModel, SetModel
from models.OpenAiModel import OpenAiLLM

from ChatHistory.ChatHistory import ChatSession

os.environ.pop("SSL_CERT_FILE", None)
load_dotenv()


app = FastAPI()
app.include_router(chatsRouter)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # adres frontendu
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


history = ChatSession.GetNewestChat()
model = OpenAiLLM(history)
client = SetModel(newModel=model)


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
        
        
        
        if(message['type'] == "Prompt"):
            await handleChatMessage(message=message['message'], websocket=websocket)
        
        if(message['type'] == "Cypher"):
            await handleChatCypher(websocket)    
            
        if(message['type'] == "Describe"):
            await handleChatDecribe(websocket)    
        
        if(message['type'] == "loadChatLog"):
            await handleLoadChatLog(websocket)
        
        if(message['type'] == "save"):
            history.SaveAsJson()
 
 
    
   
async def handleChatDecribe(websocket: WebSocket):
    
    message = """
    Na podstawie podanego tekstu zaproponuj wezły, relacje i ich właściwości, które znajdą się w docelowej strukturze grafu.
    Ma to być ogólny opis typów wezłów i relacji jakie się znajdą w grafie, a nie opis poszczególnych elementów.
    Pogrupuj weżły na podstawie:
    - \"type\": typ obiektu (np. \"Zawór\", \"Zbiornik\", \"Hydrant\", \"Stacja pomp\"),
    Relacje (połączenia między elementami np. \"Rura\") pogrupuj po:
    - \"name\": nazwa relacji,

    Do tych pogrupowanych wezłów i relacji dodaj właściwości które wynikają z tekstu. 
    np. 
    Typ: Rura
    Dodatkowe włąściwości:
        -długość, średnica...
    
    Przedstaw te informacje w następujący sposób (węzły a potem relacje).
    Nagłówek (weżły albo relacje)
    Lista elementów wraz z ich opisanymi właściwościami.
    Bez żadnych komentarzy.
    """
    
    await handleChatMessage(message, websocket)
     
async def handleChatCypher(websocket: WebSocket):
    
    message = """
    Na podstawie podanego tekstu, wygeneruj strukturę grafu w formacie czystego JSON, **bez żadnego formatowania markdown ani dodatkowych opisów**.
    Dla każdego węzła (elementu sieci):
    - \"id\": unikalny numeryczny identyfikator obiektu, nadaj je samodzielnie (1,2,3,4...)
    - \"name\": nazwa obieku ukazująca zastosowanie obiektu
    - \"type\": typ obiektu (np. \"Zawór\", \"Zbiornik\", \"Hydrant\", \"Stacja pomp\"),

    Dla każdej relacji (połączenia między elementami), np. \"Rura\":
    - \"from\": id źródłowego elementu,
    - \"name\": nazwa relacji,
    - \"to\": id docelowego elementu,
    - dodatkowe pola, jeśli informacje są obecne w tekście, np. \"diameter\",\"length\".

    Odległości i rozmiary wyrażaj w metrach. Używaj tylko jednostek SI.
    Wygeneruj tylko i wyłącznie **JEDEN OBIEKT JSON** zawierający dwa klucze: `nodes` i `edges`.
    Bez żadnych komentarzy, bez markdowna.
    """
    
    message = """
    Na podstawie podanego tekstu, wygeneruj strukturę grafu w formacie czystego JSON, **bez żadnego formatowania markdown ani dodatkowych opisów**.
    Wykorzystaj uzgodniony wcześniej opis wezłów i relacji.
    Dla każdego węzła dodaj również:
    - \"id\": unikalny numeryczny identyfikator obiektu, nadaj je samodzielnie (1,2,3,4...)
    - \"name\": nazwa obieku ukazująca zastosowanie obiektu i pozwalająca odróżnić go od innych wezłów tego samego typu

    Dla każdej relacji dodaj również::
    - \"from\": id źródłowego elementu,
    - \"to\": id docelowego elementu,
    
    Pamiętaj o uwględnienu właściwości wcześniej uzgodnionych (np. typ)

    Odległości i rozmiary wyrażaj w metrach. Używaj tylko jednostek SI.
    Wygeneruj tylko i wyłącznie **JEDEN OBIEKT JSON** zawierający dwa klucze: `nodes` i `edges`.
    Bez żadnych komentarzy, bez markdowna.
    """
    
    await websocket.send_json({"role": "user", "message": message})
    
    await handleChatMessage(message, websocket)
                    


async def handleChatMessage(message, websocket: WebSocket):
    
    #history = GetModel().history
     
    #history.AddMessage(user="user", message=message['message'])
    sentAny: bool = False
    prev = ""
    full_text = ""
    async for full_text in GetModel().GetAiResponse(message):
        delta = full_text[len(prev):]
        prev = full_text
        await websocket.send_text(delta)
        sentAny = True
    if sentAny:
        #history.AddMessage(user="assistant", message=full_text)
        #history.SaveAsJson()
        await websocket.send_text("[END]")
       

async def handleLoadChatLog(websocket: WebSocket):
    
    chatLog = GetModel().history.GetMessages()
    
    for message in chatLog:
        await websocket.send_json(message)
        
    await websocket.send_text("[END]")
    
    
    


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level="debug",
        reload=True,
    )
    