from typing import AsyncGenerator, NoReturn

import json
import os
import uvicorn


from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from ChatsRoutes import chatsRouter
from DBRoutes import databaseRouter
from Prompts.PromptRoutes import propmtRouter

from models.CurrentModel import GetModel, SetModel
from models.OpenAiModel import OpenAiLLM
from models.OllamaModel import OllamaModel
from models.ModelBase import ModelBase

from ChatHistory.ChatHistory import ChatSession

os.environ.pop("SSL_CERT_FILE", None)
load_dotenv()


app = FastAPI()
app.include_router(chatsRouter)
app.include_router(databaseRouter)
app.include_router(propmtRouter)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # adres frontendu
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


history = ChatSession.GetNewestChat()
model : ModelBase = OpenAiLLM(history)
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
            await handleChatMessage(message=message , websocket=websocket)
        
        if(message['type'] == "Cypher"):
            await handleChatCypher(websocket)    
            
        if(message['type'] == "Describe"):
            await handleChatDecribe(websocket)    
            
        if(message['type'] == "Extra"):
            await handleExtras(message = message, websocket= websocket)   
        
        if(message['type'] == "loadChatLog"):
            await handleLoadChatLog(websocket)
 
#  extra -> typ extra

async def handleExtras(message, websocket: WebSocket):
    if message['extra'] == "SaveToDB":
        pass
            
    
   
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
     
     
#---------------

# Cut off after the first complete JSON object (matching braces)
#Wycina Json z tekstu 
#Patrzy na pierwszy { i aż się zamknie }
def cut_after_json(text):
    brace_count = 0
    start = None
    for i, c in enumerate(text):
        if c == '{':
            if start is None:
                start = i
            brace_count += 1
        elif c == '}':
            brace_count -= 1
            if brace_count == 0 and start is not None:
                return text[:i+1]
    return text  # fallback if not matched

def strip_markdown(text):
    text = text.strip()
    text_lines = text.splitlines()

    if not text_lines:
        return text # Zwróć pusty tekst, jeśli nic nie ma

    start_index = 0
    end_index = len(text_lines) # Domyślnie bierzemy wszystko

    # Sprawdź, czy pierwsza linia to znacznik
    if text_lines[0].strip().startswith('```'):
        start_index = 1 # Jeśli tak, zacznij od następnej

    # Sprawdź, czy ostatnia linia to znacznik
    if text_lines[-1].strip().startswith('```'):
        end_index = -1 # Jeśli tak, bierzemy wszystko PRZED nią

    # Zwróć pocięty tekst
    # Musimy obsłużyć przypadek, gdy end_index to -1
    if end_index == -1:
        return '\n'.join(text_lines[start_index:-1])
    else:
        # Jeśli ostatnia linia NIE była znacznikiem, bierzemy ją włącznie
        return '\n'.join(text_lines[start_index:end_index])

def validate_output(text):
    lines = text.splitlines()
    original = text
    while lines:
        try:
            json.loads('\n'.join(lines))
            return '\n'.join(lines)
        except Exception:
            lines = lines[:-1]
    return original
   
  
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
    
    await websocket.send_json({"role": "user", "content": message})
    
    fulltext = await handleChatMessage(message, websocket)
    
    fulltext = cut_after_json(fulltext)
    fulltext = strip_markdown(fulltext)
    fulltext = validate_output(fulltext)
    
    GetModel().history.SetNodes(fulltext)
    GetModel().history.SetEdges(fulltext)
    
    await websocket.send_json({"IsExtra": True, "Cypher": fulltext})
    
                    


async def handleChatMessage(message, websocket: WebSocket):
    
    sentAny: bool = False
    prev = ""
    full_text = ""
    
    async for full_text in GetModel().GetAiResponse(message['message']):
        delta = full_text[len(prev):]
        prev = full_text
        await websocket.send_text(delta)
        sentAny = True
    if sentAny:
        await websocket.send_text("[END]")
        
    newText = cut_after_json(full_text)
    newText = strip_markdown(newText)
    newText = validate_output(newText)
        
    if(message['updateNodes']):
        GetModel().history.SetNodes(newText)
    if(message['updateEdges']):
        GetModel().history.SetEdges(newText)
    
    if(message['updateNodes'] or message['updateEdges']):
        await SendNodesAndEdges(websocket)
    
       
async def handleLoadChatLog(websocket: WebSocket):
    
    chatLog = GetModel().history.GetMessages()
    
    for message in chatLog:
        await websocket.send_json(message)
    
    await SendNodesAndEdges(websocket)

    await websocket.send_text("[END]")
    
async def SendNodesAndEdges(websocket: WebSocket):
    connected =  GetModel().history.GetNodesAndEdges()
    await websocket.send_json({"IsExtra": True, "Cypher": connected})


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level="debug",
        reload=True,
    )
    