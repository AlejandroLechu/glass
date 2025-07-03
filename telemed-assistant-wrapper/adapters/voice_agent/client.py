import base64, requests, os, websockets, asyncio

VOICE_STT_URL = os.getenv("VOICE_STT_URL", "http://voi-server:8080/stt")
VOICE_TTS_URL = os.getenv("VOICE_TTS_URL", "http://voi-server:8080/tts")

async def transcribe(audio: bytes) -> str:
    """Send raw audio bytes to voi-server STT and return transcript."""
    try:
        # voi-server expects wav bytes via websocket; simplified HTTP fallback
        resp = requests.post(VOICE_STT_URL, files={"file": ("audio.wav", audio, "audio/wav")}, timeout=30)
        resp.raise_for_status()
        return resp.json().get("text", "")
    except Exception:
        # fallback placeholder
        return "(transcription not available)"

async def synthesize(text: str) -> bytes:
    """Send text to voi-server TTS and return audio bytes."""
    try:
        resp = requests.post(VOICE_TTS_URL, json={"text": text}, timeout=30)
        resp.raise_for_status()
        data = resp.json().get("audio_base64", "")
        return base64.b64decode(data) if data else b""
    except Exception:
        return b"" 