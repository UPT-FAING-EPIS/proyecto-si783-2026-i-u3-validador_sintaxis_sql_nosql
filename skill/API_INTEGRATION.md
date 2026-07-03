# API Integration Guide

Base URL publica:

```text
https://wonderful-benevolence-production-ebaf.up.railway.app
```

Web principal:

```text
https://projectvalidador-production-3bcb.up.railway.app
```

## Contrato rapido

Todos los endpoints `POST` reciben JSON:

```json
{
  "engine": "auto",
  "code": "SELECT * FROM usuarios;"
}
```

Headers:

```text
Content-Type: application/json
```

No se requiere autenticacion por defecto para la Skill/API publica.

## Endpoints

| Endpoint | Cuando usarlo |
| --- | --- |
| `GET /health` | Health check y monitoreo. |
| `GET /api/v1/engines` | Poblar un selector de motor. |
| `GET /api/v1/capabilities` | Confirmar funciones disponibles. |
| `POST /api/v1/validate` | Bloquear o permitir ejecucion. |
| `POST /api/v1/diagnostic` | Marcas de error para editores. |
| `POST /api/v1/detect-engine` | Detectar dialecto antes de validar. |
| `POST /api/v1/compatibility` | Mostrar motores compatibles. |
| `POST /api/v1/fix` | Proponer correcciones simples. |
| `POST /api/v1/format` | Formatear consultas basicas. |
| `POST /api/v1/lint` | Advertencias de buenas practicas. |

## Flujo para apps externas

1. Recibir consulta del usuario.
2. Llamar `/api/v1/validate`.
3. Si `valid=false`, bloquear ejecucion y mostrar `errors`.
4. Si `valid=true`, llamar `/api/v1/lint`.
5. Si hay warnings criticos, pedir confirmacion o bloquear segun la politica de la app.
6. Ejecutar contra la base real solo desde tu backend seguro.

## Manejo de errores HTTP

- `400`: revisar que `code` sea string.
- `404`: revisar URL y version `/api/v1`.
- `429`: aplicar backoff o aumentar debounce.
- `500`: mostrar error transitorio y registrar el evento.

## Ejemplo fetch

```js
const BASE_URL = 'https://wonderful-benevolence-production-ebaf.up.railway.app';

async function postSkill(endpoint, payload) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `HTTP ${response.status}`);
  }
  return data;
}

export async function validateAndLint(code, engine = 'auto') {
  const validation = await postSkill('/api/v1/validate', { engine, code });
  if (!validation.valid) return { allowed: false, validation };

  const lint = await postSkill('/api/v1/lint', { engine, code });
  return { allowed: true, validation, lint };
}
```

## Desarrollo local

Usa la URL publica como default. Solo para desarrollo local:

```text
http://localhost:4000
```
