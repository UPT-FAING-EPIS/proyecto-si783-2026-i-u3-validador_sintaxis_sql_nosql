# Audit App Integration

Base URL:

```text
https://wonderful-benevolence-production-ebaf.up.railway.app
```

## Flujo obligatorio

1. Usuario escribe consulta.
2. La app llama `POST /api/v1/validate`.
3. Si `valid=false`, bloquea ejecucion.
4. La app llama `POST /api/v1/lint`.
5. Si hay warnings criticos, muestra advertencia.
6. Si todo esta correcto, permite ejecutar contra la base real.

## Ejemplo JavaScript

```js
const BASE_URL = 'https://wonderful-benevolence-production-ebaf.up.railway.app';

const CRITICAL_WARNINGS = new Set([
  'SQL_LINT_DELETE_WITHOUT_WHERE',
  'SQL_LINT_UPDATE_WITHOUT_WHERE',
  'SQL_LINT_PLAINTEXT_PASSWORD'
]);

async function post(endpoint, payload) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
  return data;
}

export async function auditBeforeExecution(code, engine = 'auto') {
  const validation = await post('/api/v1/validate', { engine, code });

  if (!validation.valid) {
    return {
      allowed: false,
      reason: 'syntax_error',
      errors: validation.errors
    };
  }

  const lint = await post('/api/v1/lint', { engine, code });
  const criticalWarnings = lint.warnings.filter((warning) =>
    CRITICAL_WARNINGS.has(warning.code)
  );

  if (criticalWarnings.length > 0) {
    return {
      allowed: false,
      reason: 'critical_warning',
      warnings: criticalWarnings
    };
  }

  return {
    allowed: true,
    validation,
    warnings: lint.warnings
  };
}
```

La ejecucion contra la base real debe ocurrir en tu backend, despues de revisar `allowed`.
