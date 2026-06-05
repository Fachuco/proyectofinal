# AutoCheck IA

Sistema web para diagnosticar mantenimiento vehicular con apoyo de IA.

## Fuentes de datos

- Catalogo local LATAM: funciona sin internet ni claves externas.
- Datos manuales del vehiculo: marca, modelo, kilometraje, combustible y consumo semanal.
- Historial opcional: kilometraje del ultimo cambio/revision de aceite, filtros, frenos, llantas, bujias, refrigerante, transmision y distribucion.

## Ejecutar

```bash
npm run dev
```

Abrir:

```txt
http://127.0.0.1:3000
```

## Variables opcionales

Crear variables de entorno usando `.env.example` como referencia:

```bash
OPENAI_API_KEY=tu_clave npm run dev
```

Si no configuras esta clave, la app intenta usar Ollama local. Si Ollama no esta activo, sigue funcionando con diagnostico demo.

## IA local gratis con Ollama

Para una MacBook Air M1 se recomienda empezar con un modelo liviano:

```bash
ollama pull llama3.2
ollama serve
```

En otra terminal:

```bash
AI_PROVIDER=ollama OLLAMA_MODEL=llama3.2 npm run dev
```

Modos disponibles:

- `AI_PROVIDER=auto`: usa OpenAI si hay API key, luego Ollama, luego demo local.
- `AI_PROVIDER=ollama`: usa solo Ollama y cae a demo si no responde.
- `AI_PROVIDER=openai`: usa solo OpenAI si hay API key.
# proyectofinal
