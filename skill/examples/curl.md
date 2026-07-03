# curl

La URL principal de consumo es:

```text
https://wonderful-benevolence-production-ebaf.up.railway.app
```

## Health

```bash
curl https://wonderful-benevolence-production-ebaf.up.railway.app/health
```

## Engines

```bash
curl https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/engines
```

## Capabilities

```bash
curl https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/capabilities
```

## Validate

```bash
curl -X POST https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"CREATE TABL empleados (id INT);"}'
```

## Diagnostic

```bash
curl -X POST https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/diagnostic \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"CREATE TABL empleados (id INT);"}'
```

## Lint

```bash
curl -X POST https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/lint \
  -H "Content-Type: application/json" \
  -d '{"engine":"postgresql","code":"DELETE FROM usuarios;"}'
```

## Fix

```bash
curl -X POST https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/fix \
  -H "Content-Type: application/json" \
  -d '{"engine":"mysql","code":"CREATE TABL empleados (nombre VARHAR(100) DEFALT NUL);"}'
```

## Desarrollo local

Solo para desarrollo del servicio:

```bash
curl http://localhost:4000/health
```
