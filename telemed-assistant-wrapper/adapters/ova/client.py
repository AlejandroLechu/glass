import os, requests

OVA_URL = os.getenv("OVA_URL", "http://ova:5001/chat")

def chat(prompt: str) -> str:
    """Send prompt to OVA and return response text."""
    try:
        resp = requests.post(OVA_URL, json={"prompt": prompt}, timeout=30)
        resp.raise_for_status()
        return resp.json().get("response", "")
    except Exception:
        return "(LLM response unavailable)" 