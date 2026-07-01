# SQL Validation Skill

Servicio REST independiente para consumir el validador multimotor SQL/MongoDB desde otros proyectos sin abrir la web principal.

La Skill es la capacidad reutilizable de validar SQL/MongoDB. El core real sigue en `src`; `skill/service` expone esa capacidad mediante API REST y el CLI Linux instala una copia del core para validar localmente sin depender de una API remota.

## Que resuelve

La web actual sigue existiendo, pero otros sistemas necesitan validar consultas desde una URL publica o desde terminales Linux sin red. Esta Skill mantiene una API reutilizable y un CLI local instalable.

## Arquitectura

- `skill/SQL_VALIDATION_SKILL.md`: definicion de la capacidad reutilizable.
- `skill/openapi.yaml`: contrato OpenAPI principal.
- `skill/openapi.yml`: alias del contrato para documentacion y descargas.
- `skill/examples/`: ejemplos de consumo.
- `skill/docs/`: guias de acceso, CLI, demo y publicacion.
- `skill/service/`: servicio Express independiente.
- `skill/service/src/lib/skill-core.adapter.js`: adaptador fino hacia el core existente en `src/services/validation.service.js`.
- `packages/cli`: CLI Linux `sqlcheck` con core local empaquetado.

La Skill no depende de controladores, autenticacion, base de datos ni frontend de la web principal.

## Metodos de acceso

```text
Core de validacion en src
        |
        v
Skill: capacidad de validar SQL/MongoDB
        |
        v
Metodos de acceso
   |-- Frontend Web
   |-- API REST publica
   `-- CLI Linux local
```

La web es solo uno de los canales disponibles. La API publica sirve integraciones HTTP y el CLI Linux valida localmente dentro del entorno donde se instala.

## Documentacion nueva

- `skill/docs/access-methods.md`
- `skill/docs/cli-usage.md`
- `skill/docs/demo-guide.md`
- `skill/docs/publishing-integrations.md`

## Ejecutar localmente

Desde la raiz del repositorio:

```bash
cd skill/service
npm install
npm start
```

El servicio escucha en:

```text
http://localhost:4000
```

Health check:

```bash
curl http://localhost:4000/health
```

## Swagger

Abrir:

```text
http://localhost:4000/docs
```

El contrato tambien esta disponible en:

```text
http://localhost:4000/openapi.yaml
```

## Docker

Desde `skill/service`:

```bash
docker build -t sql-validation-skill .
docker run -p 4000:4000 sql-validation-skill
```

El contenedor queda listo para exponer `PORT=4000`. Si se construye solo desde `skill/service`, la imagen usa el servicio independiente y mantiene un fallback basico cuando el core raiz no esta incluido en el contexto Docker.

Para una imagen que incluya tambien el core real del repositorio, construir posteriormente desde la raiz con un Dockerfile ajustado a contexto completo o montar el repositorio como volumen.

## Variables de entorno

```env
PORT=4000
NODE_ENV=production
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

No se requieren credenciales.

## Endpoints

- `GET /health`
- `GET /api/v1/engines`
- `GET /api/v1/capabilities`
- `POST /api/v1/detect-engine`
- `POST /api/v1/validate`
- `POST /api/v1/diagnostic`
- `POST /api/v1/compatibility`
- `POST /api/v1/fix`
- `POST /api/v1/format`
- `POST /api/v1/lint`

## Ejemplo curl

```bash
curl -X POST http://localhost:4000/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"CREATE TABL empleados (id INT);"}'
```

## Ejemplo JavaScript fetch

```js
async function validateSql(code) {
  const response = await fetch('https://URL_PUBLICA/api/v1/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine: 'auto', code })
  });

  return response.json();
}
```

## Ejemplo Python requests

```python
import requests

response = requests.post(
    "https://URL_PUBLICA/api/v1/validate",
    json={"engine": "auto", "code": "SELECT * FROM empleados;"}
)

print(response.json())
```

## Ejemplo conceptual para CLI

```bash
sqlcli validate archivo.sql --engine auto
```

El CLI puede leer el archivo, llamar `/api/v1/validate` y pintar errores por linea y columna. Para modo interactivo o tiempo real, debe llamar `/api/v1/diagnostic` con debounce.

## Consumo en tiempo real

Usar `/api/v1/diagnostic` para editores e IDEs:

```json
{
  "diagnostics": [
    {
      "range": {
        "start": { "line": 1, "character": 8 },
        "end": { "line": 1, "character": 12 }
      },
      "severity": "error",
      "code": "SQL001",
      "source": "sql-validation-skill",
      "message": "TABL no es valido. Se esperaba TABLE.",
      "suggestion": "CREATE TABLE"
    }
  ]
}
```

## Codigos HTTP

- `200`: solicitud procesada.
- `400`: falta `code` o el body no es valido.
- `404`: ruta no encontrada.
- `429`: rate limit excedido.
- `500`: error interno.

## Formato de respuesta

Todas las respuestas son JSON. Los errores HTTP usan:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "El campo \"code\" es obligatorio y debe ser string."
  }
}
```

## Versionado

La version actual es `1.0.0` y los endpoints publicos viven bajo `/api/v1`.

## Seguridad y rate limit

- CORS configurable con `CORS_ORIGIN`.
- Rate limit basico por IP con `RATE_LIMIT_WINDOW_MS` y `RATE_LIMIT_MAX`.
- No se almacenan consultas.
- No se ejecutan consultas contra bases de datos.

## Despliegue

### Railway

Crear un nuevo servicio desde el repositorio y configurar:

```text
Root Directory: skill/service
Start Command: npm start
PORT: 4000
```

Variables recomendadas:

```env
NODE_ENV=production
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Render

Usar `skill/service` como root, `npm install` como build command y `npm start` como start command.

### AWS ECS / Azure Container Apps

Construir la imagen Docker y publicar el puerto `4000`. Terraform puede agregarse posteriormente usando esta imagen como unidad de despliegue.

## Pruebas

```bash
cd skill/service
npm test
```

Las pruebas cubren health, engines, validacion valida, validacion invalida, deteccion MongoDB y correccion `TABL`.

## Licencia

Sigue la licencia del proyecto principal: MIT.
