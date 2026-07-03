# Use Cases

Base URL:

```text
https://wonderful-benevolence-production-ebaf.up.railway.app
```

## App de aprendizaje SQL

Objetivo: ayudar a estudiantes a practicar consultas.

Flujo:

1. El estudiante escribe SQL o MongoDB.
2. La app llama `/api/v1/validate`.
3. Si hay errores, muestra linea, columna, mensaje y sugerencia.
4. La app llama `/api/v1/lint` para buenas practicas.
5. Si el estudiante pide ayuda, la app llama `/api/v1/fix`.
6. La app explica el cambio propuesto sin reemplazar automaticamente.

## App de auditoria

Objetivo: validar consultas antes de ejecutarlas contra una base real.

Flujo obligatorio:

1. Usuario escribe consulta.
2. La app llama `POST /api/v1/validate`.
3. Si `valid=false`, bloquea ejecucion.
4. La app llama `POST /api/v1/lint`.
5. Si hay warnings criticos, muestra advertencia.
6. Si todo esta correcto, permite ejecutar contra la base real.

Warnings criticos sugeridos:

- `SQL_LINT_DELETE_WITHOUT_WHERE`
- `SQL_LINT_UPDATE_WITHOUT_WHERE`
- `SQL_LINT_PLAINTEXT_PASSWORD`

## Editor con validacion en tiempo real

Objetivo: mostrar errores mientras el usuario escribe.

Flujo:

1. Escuchar cambios del editor.
2. Aplicar debounce de 250-500 ms.
3. Llamar `/api/v1/diagnostic`.
4. Pintar `diagnostics[].range`.
5. Mostrar `message` y `suggestion` como tooltip.
6. Llamar `/api/v1/fix` solo cuando el usuario solicite una correccion.

## CLI externo

Objetivo: validar archivos desde terminal.

Flujo:

1. Leer archivo.
2. Llamar `/api/v1/validate`.
3. Imprimir errores con `line:column`.
4. Salir `0` si es valido.
5. Salir `1` si es invalido.

## Bot educativo

Objetivo: responder a consultas enviadas por chat.

Flujo:

1. Recibir consulta del usuario.
2. Llamar `/api/v1/detect-engine`.
3. Llamar `/api/v1/validate`.
4. Explicar el primer error en lenguaje simple.
5. Ofrecer sugerencia o correccion simple con `/api/v1/fix`.
