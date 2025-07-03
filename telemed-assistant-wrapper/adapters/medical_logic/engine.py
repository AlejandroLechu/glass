import re

def triage(text: str) -> dict:
    """Very naive triage based on keywords."""
    lower = text.lower()
    if re.search(r"dolor (de )?pecho|dolor torácico", lower):
        return {"priority": "high", "action": "Derivar a urgencias"}
    if "fiebre" in lower and "niño" in lower:
        return {"priority": "medium", "action": "Programar consulta pediátrica en 24h"}
    return {"priority": "normal", "action": "Continuar preguntas"} 