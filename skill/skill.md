# SQL Multi-Engine Validation Skill

## Descripcion

Esta Skill permite incorporar validacion SQL/MongoDB en aplicaciones externas usando una API publica desplegada.

## Base URL

```text
https://wonderful-benevolence-production-ebaf.up.railway.app
```

## Web principal

```text
https://projectvalidador-production-3bcb.up.railway.app
```

## Modo principal de uso

Consumir la API publica desde cualquier aplicacion.

## Instruccion para agentes

Si estas construyendo una aplicacion que necesita validar SQL o MongoDB, usa esta Skill llamando a la API publica. No necesitas reimplementar la gramatica ni copiar el validador. Envia el codigo a validar y usa la respuesta JSON para mostrar errores, advertencias, diagnosticos o sugerencias.

## Que hace

- Valida sintaxis SQL y MongoDB.
- Detecta el motor probable de una consulta.
- Devuelve diagnosticos con linea, columna y rangos para editores.
- Revisa compatibilidad entre motores.
- Aplica correcciones simples para errores conocidos.
- Formatea consultas basicas.
- Genera advertencias de buenas practicas con lint.

## Motores soportados

- `auto`
- `sql-ansi`
- `mysql`
- `mariadb`
- `postgresql`
- `sqlserver`
- `oracle`
- `sqlite`
- `mongodb`

## Endpoints

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| GET | `/health` | Verificar disponibilidad del servicio. |
| GET | `/api/v1/engines` | Listar motores soportados. |
| GET | `/api/v1/capabilities` | Listar capacidades activas. |
| POST | `/api/v1/validate` | Validar una consulta o script. |
| POST | `/api/v1/diagnostic` | Obtener diagnosticos para editores. |
| POST | `/api/v1/detect-engine` | Detectar motor probable. |
| POST | `/api/v1/compatibility` | Revisar compatibilidad con motores. |
| POST | `/api/v1/fix` | Aplicar correcciones simples. |
| POST | `/api/v1/format` | Formatear consulta de forma basica. |
| POST | `/api/v1/lint` | Obtener advertencias de buenas practicas. |

## Request comun para endpoints POST

```json
{
  "engine": "auto",
  "code": "CREATE TABL empleados (id INT);"
}
```

`engine` es opcional. Si no se envia, se usa `auto`.

## Interpretar la respuesta de validacion

`POST /api/v1/validate` devuelve:

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
      "message": "TABL no es valido. Se esperaba TABLE.",
      "suggestion": "Reemplace TABL por TABLE.",
      "severity": "error",
      "code": "SQL_SYNTAX_ERROR"
    }
  ],
  "warnings": [],
  "compatibleEngines": ["sql-ansi", "mysql", "mariadb", "postgresql", "sqlite"],
  "incompatibleEngines": [],
  "confidence": 0.7,
  "suggestions": ["Reemplace TABL por TABLE."],
  "analysisTimeMs": 12
}
```

Reglas de consumo:

- Si `valid` es `false`, no ejecutes la consulta.
- Muestra `errors[].message` al usuario.
- Usa `line`, `column` y `token` para resaltar el error.
- Muestra `suggestion` cuando exista.
- Usa `engineDetected` para explicar el dialecto detectado.
- Usa `compatibleEngines` e `incompatibleEngines` para compatibilidad.

## Diagnosticos para editores

Usa `POST /api/v1/diagnostic` para validacion en tiempo real:

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

Para un editor:

1. Espera 250-500 ms despues de la ultima tecla.
2. Llama `/api/v1/diagnostic`.
3. Mapea `range.start` y `range.end` a decoraciones del editor.
4. Usa `message` y `suggestion` como tooltip.

## Lint para advertencias

Usa `POST /api/v1/lint` para detectar riesgos como:

- `SELECT *`
- `DELETE` sin `WHERE`
- `UPDATE` sin `WHERE`
- Posibles contrasenas en texto plano
- Scripts extensos sin delimitadores

Respuesta:

```json
{
  "warnings": [
    {
      "line": 1,
      "column": 1,
      "message": "DELETE sin WHERE puede eliminar todos los registros.",
      "severity": "warning",
      "code": "SQL_LINT_DELETE_WITHOUT_WHERE"
    }
  ]
}
```

## Fix para correcciones simples

Usa `POST /api/v1/fix` para errores conocidos:

```json
{
  "fixed": true,
  "fixedCode": "CREATE TABLE empleados (nombre VARCHAR(100));",
  "changes": [
    { "from": "TABL", "to": "TABLE", "line": 1, "column": 8 },
    { "from": "VARHAR", "to": "VARCHAR", "line": 1, "column": 32 }
  ]
}
```

El consumidor debe mostrar el diff o pedir confirmacion antes de reemplazar codigo del usuario.

## Ejemplo curl

```bash
curl -X POST https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"CREATE TABL empleados (id INT);"}'
```

## Ejemplo JavaScript fetch

```js
const BASE_URL = 'https://wonderful-benevolence-production-ebaf.up.railway.app';

async function validateSql(code, engine = 'auto') {
  const response = await fetch(`${BASE_URL}/api/v1/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine, code })
  });

  if (!response.ok) {
    throw new Error(`Validation API error: ${response.status}`);
  }

  return response.json();
}

validateSql('SELECT * FROM empleados;').then(console.log);
```

## Ejemplo Python requests

```python
import requests

BASE_URL = "https://wonderful-benevolence-production-ebaf.up.railway.app"


def validate_sql(code, engine="auto"):
    response = requests.post(
        f"{BASE_URL}/api/v1/validate",
        json={"engine": engine, "code": code},
        timeout=8,
    )
    response.raise_for_status()
    return response.json()


print(validate_sql("CREATE TABL empleados (id INT);"))
```

## Ejemplo Java HttpClient

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ValidateSql {
  private static final String BASE_URL =
      "https://wonderful-benevolence-production-ebaf.up.railway.app";

  public static void main(String[] args) throws Exception {
    String body = """
        {"engine":"auto","code":"CREATE TABL empleados (id INT);"}
        """;

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/api/v1/validate"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();

    HttpResponse<String> response = HttpClient.newHttpClient()
        .send(request, HttpResponse.BodyHandlers.ofString());

    System.out.println(response.body());
  }
}
```

## App de aprendizaje SQL

Flujo conceptual:

1. El estudiante escribe una consulta.
2. La app llama `/api/v1/validate`.
3. Si hay errores, muestra `message`, `line`, `column` y `suggestion`.
4. La app llama `/api/v1/fix` solo si quiere ofrecer una pista de correccion.
5. La app llama `/api/v1/lint` para explicar buenas practicas.
6. La app registra el resultado educativo, no la consulta sensible.

## App de auditoria de base de datos

Flujo obligatorio:

1. Usuario escribe consulta.
2. La app llama `POST /api/v1/validate`.
3. Si `valid=false`, bloquea ejecucion.
4. La app llama `POST /api/v1/lint`.
5. Si hay warnings criticos, muestra advertencia.
6. Si todo esta correcto, permite ejecutar contra la base real.

## CLI externo

Un CLI puede:

1. Leer un archivo `.sql` o `.js` con consulta MongoDB.
2. Enviar el contenido a `/api/v1/validate`.
3. Imprimir errores como `line:column code message`.
4. Salir con codigo `1` si `valid=false`.
5. Usar `/api/v1/diagnostic` en modo watch.

## Editor con validacion en tiempo real

Usa debounce:

```js
const BASE_URL = 'https://wonderful-benevolence-production-ebaf.up.railway.app';
let timer;

function onChange(code, engine = 'auto') {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const response = await fetch(`${BASE_URL}/api/v1/diagnostic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine, code })
    });

    const data = await response.json();
    showMarkers(data.diagnostics);
  }, 300);
}
```

## Bot educativo

El bot puede recibir una consulta, llamar `/api/v1/validate`, explicar el primer error y ofrecer una pista. Si el usuario pide ayuda adicional, puede llamar `/api/v1/fix` y mostrar los cambios propuestos.

## Codigos HTTP

- `200`: solicitud procesada.
- `400`: body invalido o falta `code`.
- `404`: ruta no encontrada.
- `429`: rate limit excedido.
- `500`: error interno.

## Seguridad

- La Skill valida, no ejecuta consultas.
- No requiere credenciales por defecto.
- No enviar secretos, tokens ni datos sensibles si no son necesarios.
- Manejar timeouts y errores HTTP en el cliente.
