# SQL Multi-Engine Validation Skill

Skill reutilizable para incorporar validacion SQL/MongoDB en aplicaciones externas, agentes IA, editores, CLIs y flujos de auditoria. Su modo principal de uso es consumir una API publica ya desplegada; no hace falta copiar el core ni reimplementar la gramatica.

## URLs

- Skill/API publica: https://wonderful-benevolence-production-ebaf.up.railway.app
- Web principal: https://projectvalidador-production-3bcb.up.railway.app
- Skill descargable desde la web: https://projectvalidador-production-3bcb.up.railway.app/skill.md

## Que es esta Skill

Esta carpeta documenta una capacidad reusable: validar, diagnosticar, detectar motor, revisar compatibilidad, aplicar correcciones simples, formatear y generar advertencias para SQL y MongoDB.

Un agente IA debe leer primero `skill/skill.md`. Ese archivo contiene la informacion suficiente para construir una app externa usando la API desplegada.

## Endpoints

- `GET /health`
- `GET /api/v1/engines`
- `GET /api/v1/capabilities`
- `POST /api/v1/validate`
- `POST /api/v1/diagnostic`
- `POST /api/v1/detect-engine`
- `POST /api/v1/compatibility`
- `POST /api/v1/fix`
- `POST /api/v1/format`
- `POST /api/v1/lint`

Los endpoints `POST` reciben:

```json
{
  "engine": "auto",
  "code": "SELECT * FROM empleados;"
}
```

`engine` puede ser `auto`, `sql-ansi`, `mysql`, `mariadb`, `postgresql`, `sqlserver`, `oracle`, `sqlite` o `mongodb`.

## Probar con curl

```bash
curl https://wonderful-benevolence-production-ebaf.up.railway.app/health
```

```bash
curl -X POST https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"CREATE TABL empleados (id INT);"}'
```

```bash
curl -X POST https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/diagnostic \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"SELECT * FORM usuarios;"}'
```

```bash
curl -X POST https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/lint \
  -H "Content-Type: application/json" \
  -d '{"engine":"postgresql","code":"DELETE FROM usuarios;"}'
```

## Integrarla en otra aplicacion

1. Captura la consulta que escribe el usuario.
2. Envia `{ "engine": "auto", "code": "<consulta>" }` a `POST /api/v1/validate`.
3. Si `valid` es `false`, muestra `errors` y bloquea la ejecucion.
4. Llama `POST /api/v1/lint` para advertencias de buenas practicas.
5. Si no hay errores ni advertencias criticas, permite que tu aplicacion ejecute la consulta contra su base real.

Ejemplo JavaScript:

```js
const BASE_URL = 'https://wonderful-benevolence-production-ebaf.up.railway.app';

export async function validateBeforeRun(code, engine = 'auto') {
  const response = await fetch(`${BASE_URL}/api/v1/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine, code })
  });

  return response.json();
}
```

## Usarla desde un agente IA

Instruccion recomendada para el agente:

> Si estas construyendo una aplicacion que necesita validar SQL o MongoDB, usa la API publica de esta Skill. No copies el validador ni reimplementes la gramatica. Envia el codigo a validar y usa la respuesta JSON para mostrar errores, advertencias, diagnosticos o sugerencias.

Archivos utiles:

- `skill/skill.md`: contexto principal para agentes.
- `skill/API_INTEGRATION.md`: contrato practico para desarrolladores.
- `skill/AGENT_INSTRUCTIONS.md`: instrucciones operativas para agentes IA.
- `skill/USE_CASES.md`: apps de aprendizaje, auditoria, editores, CLI y bots.
- `skill/examples/`: ejemplos por lenguaje y caso de uso.

## Descargar o copiar la Skill

Desde la web principal hay un enlace visible "Descargar Skill". Tambien puede descargarse directamente:

```text
https://projectvalidador-production-3bcb.up.railway.app/skill.md
```

Para dar contexto a un agente:

1. Descarga `skill.md`.
2. Adjuntalo al agente o copialo como contexto del proyecto externo.
3. Indica al agente que use la API publica de la Skill como servicio de validacion.

## Validar antes de ejecutar una consulta

Flujo recomendado para apps externas:

```text
Usuario escribe consulta
        |
        v
POST /api/v1/validate
        |
        |-- valid=false -> bloquear ejecucion y mostrar errors
        |
        v
POST /api/v1/lint
        |
        |-- warnings criticos -> pedir confirmacion o bloquear segun politica
        |
        v
Ejecutar contra la base real
```

## Validacion en tiempo real con debounce

Usa `/api/v1/diagnostic` para editores:

```js
const BASE_URL = 'https://wonderful-benevolence-production-ebaf.up.railway.app';
let timer;

function onEditorChange(code, engine = 'auto') {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const response = await fetch(`${BASE_URL}/api/v1/diagnostic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine, code })
    });

    const data = await response.json();
    renderDiagnostics(data.diagnostics);
  }, 300);
}
```

## Desarrollo local

La URL publica debe usarse como ejemplo principal. Para desarrollar el servicio localmente:

```bash
cd skill/service
npm install
npm start
```

Servicio local:

```text
http://localhost:4000
```

## Pruebas

```bash
cd skill/service
npm test
```

## Seguridad

- La Skill valida y analiza; no ejecuta consultas.
- No requiere credenciales por defecto.
- No enviar datos sensibles si no son necesarios para la validacion.
- Manejar rate limit (`429`) y errores HTTP.
