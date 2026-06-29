# Axios

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://URL_PUBLICA',
  timeout: 5000,
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
```
