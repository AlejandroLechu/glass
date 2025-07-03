import base64, asyncio
from fastapi import FastAPI, UploadFile, WebSocket
from fastapi.responses import JSONResponse

from adapters.voice_agent.client import transcribe, synthesize
from adapters.ova.client import chat
from adapters.medical_logic.engine import triage

app = FastAPI()

@app.post("/telemed")
async def telemed(audio: UploadFile):
    data = await audio.read()
    text = await transcribe(data)
    llm_resp = await chat(text)
    diagnosis = triage(llm_resp)
    audio_out = await synthesize(llm_resp)
    return JSONResponse({
        "stt": text,
        "llm": llm_resp,
        "diagnosis": diagnosis,
        "tts_base64": base64.b64encode(audio_out).decode()
    })

@app.websocket("/stream")
async def stream(ws: WebSocket):
    await ws.accept()
    while True:
        chunk = await ws.receive_bytes()
        text = await transcribe(chunk)
        llm_resp = await chat(text)
        await ws.send_text(llm_resp) 