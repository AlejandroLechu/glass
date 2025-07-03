# Telemed Assistant Wrapper

Este directorio contiene un conjunto de servicios que integran:

1. **voi-server** – entrada/salida de audio (STT + TTS)
2. **open-virtual-assistant (OVA)** – gestor de prompts / flujo LLM
3. **medical_logic** – reglas médicas básicas
4. **api_gateway** – punto de entrada HTTP/WS que orquesta el flujo 

```
audio in → STT → OVA → lógica médica → TTS → audio out
```

## Submódulos

Añade los proyectos externos como submódulos (SHA fijo):

```bash
git submodule add https://github.com/alievk/voi-server.git submodules/voi-server
git submodule add https://github.com/dvonthenen/open-virtual-assistant.git submodules/open-virtual-assistant
git submodule add https://github.com/<org>/medical_logic.git submodules/medical_logic
```

## Levantar todos los servicios

```bash
docker compose up --build -d
```

La puerta de entrada estará disponible en `http://localhost:9000/telemed`. 