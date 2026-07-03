# Axios

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://wonderful-benevolence-production-ebaf.up.railway.app',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function validateSql(code, engine = 'auto') {
  const { data } = await api.post('/api/v1/validate', {
    engine,
    code
  });

  return data;
}

export async function getDiagnostics(code, engine = 'auto') {
  const { data } = await api.post('/api/v1/diagnostic', {
    engine,
    code
  });

  return data.diagnostics;
}

export async function lintSql(code, engine = 'auto') {
  const { data } = await api.post('/api/v1/lint', {
    engine,
    code
  });

  return data.warnings;
}
```
