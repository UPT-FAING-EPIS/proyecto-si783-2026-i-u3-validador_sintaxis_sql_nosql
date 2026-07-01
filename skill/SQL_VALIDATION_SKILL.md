# SQL Multi-Engine Validation Skill

## Descripcion

Skill reutilizable para validar, diagnosticar y analizar consultas SQL/MongoDB desde sistemas externos mediante una API REST publica o desde terminales Linux mediante un CLI local.

Esta Skill expone el core del validador multimotor del proyecto como una capacidad consumible por la web, la API publica y un CLI Linux instalable, sin depender exclusivamente de la interfaz web principal.

El core real permanece en `src`. `skill/service` publica la capacidad como API REST y `packages/cli` empaqueta una copia del core para validar localmente sin depender de una API remota.

## Objetivo

Permitir que otros proyectos o terminales Linux validen consultas SQL o MongoDB y reciban una respuesta estructurada con validacion, diagnosticos, deteccion de motor, compatibilidad, correcciones simples, formateo basico y advertencias de buenas practicas.

## Casos de uso

- Validacion previa a ejecutar consultas en un CLI Linux local.
- Uso desde consola Linux con el comando `sqlcheck`.
- Revision automatica de entregas academicas.
- Integracion con bots que reciben consultas y devuelven diagnosticos.
- Servicios web que necesitan validar SQL/MongoDB sin montar la web principal.
- Sistemas que requieren una API estable y versionada.

## Entradas

La entrada principal usa JSON:

```json
{
  "engine": "auto",
  "code": "CREATE TABL empleados (id INT);"
}
```

`engine` puede ser:

- `auto`
- `sql-ansi`
- `mysql`
- `mariadb`
- `postgresql`
- `sqlserver`
- `oracle`
- `sqlite`
- `mongodb`

`code` debe ser una cadena de texto con la consulta o script a analizar.

## Salidas

La salida de validacion tiene este formato:

```json
{
  "valid": false,
  "engineRequested": "auto",
  "engineDetected": "sql-ansi",
  "errors": [
    {
      "line": 1,
      "column": 8,
      "token": "TABL",
      "message": "CREATE TABL no es valido. Se esperaba CREATE TABLE.",
      "suggestion": "Escriba TABLE completo: CREATE TABLE nombre (...).",
      "severity": "error",
      "code": "SQL_SYNTAX_ERROR"
    }
  ],
  "warnings": [],
  "compatibleEngines": ["sql-ansi", "mysql", "mariadb", "postgresql", "sqlite", "sqlserver", "oracle"],
  "analysisTimeMs": 12
}
```

## Motores soportados

- SQL ANSI
- MySQL
- MariaDB
- PostgreSQL
- SQL Server
- Oracle
- SQLite
- MongoDB

## Formato de errores

Cada error de validacion incluye:

- `line`: linea del error.
- `column`: columna del error.
- `token`: fragmento relacionado.
- `message`: descripcion entendible por humanos.
- `suggestion`: recomendacion cuando existe.
- `severity`: `error`.
- `code`: codigo estable para integraciones.

Para editores, `/api/v1/diagnostic` devuelve rangos:

```json
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
```

## Ejemplos de integracion

Metodos disponibles:

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

### Validacion HTTP

```bash
curl -X POST http://localhost:4000/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"SELECT * FROM empleados;"}'
```

### Integracion en JavaScript

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

### Integracion en tiempo real

Un editor puede llamar `/api/v1/diagnostic` despues de una pausa corta de escritura:

```js
let timer;

function onQueryChanged(code) {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const diagnostics = await fetch('/api/v1/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine: 'auto', code })
    }).then(response => response.json());

    renderDiagnostics(diagnostics.diagnostics);
  }, 300);
}
```

## Limitaciones

- `validate`, `diagnostic`, `detect-engine` y `compatibility` intentan reutilizar el core real del proyecto.
- `fix` aplica correcciones simples para errores conocidos: `TABL`, `VARHAR`, `PRIMRY`, `COLLTE`, `DEFALT`, `NUL`.
- `format` es un formateador basico de palabras clave y saltos de linea; no reemplaza un formateador SQL profesional.
- `lint` incluye reglas minimas de buenas practicas.
- En Docker construido desde `skill/service`, el servicio funciona de forma independiente y usa un fallback basico si el core raiz no esta dentro del contexto de imagen.

## Versionado

La API esta versionada bajo `/api/v1`.

Cambios compatibles deben mantenerse dentro de `v1`. Cambios incompatibles deben publicarse como `/api/v2`.

## Seguridad

- No requiere credenciales por defecto.
- No incluye secretos.
- CORS es configurable con `CORS_ORIGIN`.
- Rate limit configurable con `RATE_LIMIT_WINDOW_MS` y `RATE_LIMIT_MAX`.
- Los consumidores deben enviar solo consultas necesarias para validacion y evitar datos sensibles.

## Buenas practicas de consumo

- Usar `engine: "auto"` cuando el consumidor no conozca el motor.
- Usar un motor explicito cuando el usuario este trabajando en un dialecto concreto.
- Para editores, consumir `/api/v1/diagnostic`.
- Para pipelines o CLIs, consumir `/api/v1/validate`.
- Aplicar debounce en validacion en tiempo real.
- Manejar HTTP `400`, `404`, `429` y `500`.
- No ejecutar automaticamente SQL recibido desde usuarios; esta Skill valida sintaxis, no actua como sandbox de ejecucion.

## Ejemplo de uso en tiempo real

Flujo recomendado para una extension de editor:

1. El usuario escribe una consulta.
2. La extension espera 250-500 ms sin cambios.
3. Envia `{ engine, code }` a `/api/v1/diagnostic`.
4. Mapea cada `diagnostic.range` a decoraciones del editor.
5. Muestra `message` y `suggestion` como tooltip.
6. Si el usuario solicita correccion, llama `/api/v1/fix`.
