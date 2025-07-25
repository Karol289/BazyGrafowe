from typing import AsyncGenerator, NoReturn

import os
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from openai import AsyncOpenAI

os.environ.pop("SSL_CERT_FILE", None)

load_dotenv()

app = FastAPI()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# with open('E:\\HDISED\\Projekt2\\BazyGrafowe\\backend\\index.html') as f:
#     html = f.read()

async def get_ai_response(message: str) -> AsyncGenerator[str, None]:
    """
    OpenAI Response
    """
    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant, skilled in explaining "
                    "complex concepts in simple terms."
                ),
            },
            {
                "role": "user",
                "content": message,
            },
        ],
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
    await websocket.accept()
    while True:
        message = await websocket.receive_text()
        sentAny: bool = False
        prev = ""
        async for full_text in get_ai_response(message):
            delta = full_text[len(prev):]
            prev = full_text
            await websocket.send_text(delta)
            sentAny = True
        if sentAny:
            await websocket.send_text("[END]")
            
        

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level="debug",
        reload=True,
    )