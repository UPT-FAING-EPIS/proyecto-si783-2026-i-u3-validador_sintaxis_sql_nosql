# Python requests

```python
import requests

BASE_URL = "https://URL_PUBLICA"


def validate_sql(code, engine="auto"):
    response = requests.post(
        f"{BASE_URL}/api/v1/validate",
        json={"engine": engine, "code": code},
        timeout=5,
    )
    response.raise_for_status()
    return response.json()


result = validate_sql("CREATE TABL empleados (id INT);")
print(result)
```

Diagnosticos para un editor:

```python
def diagnostics(code, engine="auto"):
    response = requests.post(
        f"{BASE_URL}/api/v1/diagnostic",
        json={"engine": engine, "code": code},
        timeout=5,
    )
    response.raise_for_status()
    return response.json()["diagnostics"]
```
