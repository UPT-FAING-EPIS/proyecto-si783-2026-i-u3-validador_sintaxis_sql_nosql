# JavaScript fetch

```js
async function validateSql(code) {
  const response = await fetch('https://URL_PUBLICA/api/v1/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      engine: 'auto',
      code
    })
  });

  return await response.json();
}

validateSql('SELECT * FROM empleados;')
  .then(console.log)
  .catch(console.error);
```

Para validacion en tiempo real, usa `/api/v1/diagnostic` con debounce:

```js
let timer;

function validateAfterTyping(code) {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const response = await fetch('https://URL_PUBLICA/api/v1/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine: 'auto', code })
    });

    const data = await response.json();
    console.log(data.diagnostics);
  }, 300);
}
```
