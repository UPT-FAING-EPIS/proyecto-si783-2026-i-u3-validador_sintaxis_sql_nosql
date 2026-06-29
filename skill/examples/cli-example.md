# CLI externo

La Skill puede consumirse desde un CLI sin importar el lenguaje.

Ejemplo conceptual:

```bash
sqlcli validate archivo.sql --engine auto
```

Flujo recomendado:

1. Leer `archivo.sql`.
2. Enviar el contenido a `POST /api/v1/validate`.
3. Si `valid` es `false`, imprimir errores con linea, columna, mensaje y sugerencia.
4. Terminar con exit code `1` si hay errores y `0` si la consulta es valida.

Pseudocodigo:

```js
const fs = require('node:fs/promises');

async function validateFile(path, engine = 'auto') {
  const code = await fs.readFile(path, 'utf8');
  const response = await fetch('https://URL_PUBLICA/api/v1/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine, code })
  });

  const result = await response.json();

  if (!result.valid) {
    for (const error of result.errors) {
      console.error(`${error.line}:${error.column} ${error.code} ${error.message}`);
      if (error.suggestion) console.error(`  sugerencia: ${error.suggestion}`);
    }
    process.exit(1);
  }

  console.log('Consulta valida');
}
```

Para modo interactivo:

```bash
sqlcli watch archivo.sql --engine auto
```

El CLI puede observar cambios del archivo y llamar `/api/v1/diagnostic` cada vez que el usuario edita, aplicando debounce para no saturar el servicio.
