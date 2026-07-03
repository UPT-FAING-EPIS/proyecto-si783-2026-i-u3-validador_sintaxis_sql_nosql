# Agent Instructions

Usa esta Skill cuando el usuario pida construir una app, bot, extension, editor, CLI o flujo que valide SQL o MongoDB.

## Regla principal

No reimplementes la gramatica. No copies el core del validador. Consume la API publica:

```text
https://wonderful-benevolence-production-ebaf.up.railway.app
```

## Como actuar

1. Identifica donde el usuario escribe o carga consultas.
2. Envia `{ "engine": "auto", "code": "<consulta>" }` a `/api/v1/validate`.
3. Si `valid=false`, muestra errores y bloquea ejecucion.
4. Para editores, usa `/api/v1/diagnostic` con debounce.
5. Para advertencias, usa `/api/v1/lint`.
6. Para correcciones simples, usa `/api/v1/fix` y pide confirmacion antes de reemplazar codigo.
7. Para apps multi-motor, usa `/api/v1/engines` y `/api/v1/compatibility`.

## Respuestas que debes usar

- `errors[].message`: texto principal para el usuario.
- `errors[].line` y `errors[].column`: ubicacion.
- `errors[].suggestion`: pista de correccion.
- `diagnostics[].range`: decoraciones en editores.
- `warnings[]`: riesgos o malas practicas.
- `engineDetected`: dialecto detectado.

## Patrones recomendados

App educativa:

- Validar cada entrega con `/validate`.
- Mostrar explicacion breve por error.
- Usar `/fix` como pista, no como autocorreccion silenciosa.

App de auditoria:

- Bloquear ejecucion si `valid=false`.
- Ejecutar `/lint` aunque la consulta sea valida.
- Tratar `DELETE`/`UPDATE` sin `WHERE` como warning critico.

Editor:

- Usar `/diagnostic` tras 250-500 ms sin escritura.
- Cancelar o ignorar respuestas viejas si llega una consulta nueva.
- Mapear rangos a marcadores visuales.

CLI:

- Usar `/validate` para modo normal.
- Salir con codigo `1` si hay errores.
- Usar `/diagnostic` para modo watch.

## Evitar

- No enviar credenciales ni datos sensibles innecesarios.
- No ejecutar SQL en nombre de la Skill.
- No tratar `format` como formateador SQL profesional.
- No aplicar `fix` sin mostrar cambios al usuario.
