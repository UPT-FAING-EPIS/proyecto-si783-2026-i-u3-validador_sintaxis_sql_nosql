# Learning App Example

Base URL:

```text
https://wonderful-benevolence-production-ebaf.up.railway.app
```

## Objetivo

Crear una app de aprendizaje SQL/MongoDB que valide respuestas de estudiantes y muestre pistas accionables.

## Flujo

1. El estudiante escribe una consulta.
2. La app llama `/api/v1/validate`.
3. Si `valid=false`, muestra el primer error.
4. La app muestra `suggestion` como pista.
5. Si el estudiante pide ayuda, la app llama `/api/v1/fix`.
6. La app llama `/api/v1/lint` para explicar buenas practicas.

## Ejemplo

```js
const BASE_URL = 'https://wonderful-benevolence-production-ebaf.up.railway.app';

async function post(endpoint, payload) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`Skill API error: ${response.status}`);
  return response.json();
}

export async function evaluateStudentAnswer(code, engine = 'auto') {
  const validation = await post('/api/v1/validate', { engine, code });

  if (!validation.valid) {
    const firstError = validation.errors[0];
    return {
      correct: false,
      feedback: firstError.message,
      location: { line: firstError.line, column: firstError.column },
      hint: firstError.suggestion
    };
  }

  const lint = await post('/api/v1/lint', { engine, code });

  return {
    correct: true,
    feedback: 'La consulta es valida.',
    warnings: lint.warnings
  };
}
```
