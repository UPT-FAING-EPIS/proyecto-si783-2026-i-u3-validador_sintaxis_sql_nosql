# curl

Usa `http://localhost:4000` en desarrollo y reemplazalo por tu URL publica en produccion.

## Health

```bash
curl http://localhost:4000/health
```

## Engines

```bash
curl http://localhost:4000/api/v1/engines
```

## Validate

```bash
curl -X POST http://localhost:4000/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"CREATE TABL empleados (id INT);"}'
```

## Diagnostic

```bash
curl -X POST http://localhost:4000/api/v1/diagnostic \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"CREATE TABL empleados (id INT);"}'
```

## Fix

```bash
curl -X POST http://localhost:4000/api/v1/fix \
  -H "Content-Type: application/json" \
  -d '{"engine":"mysql","code":"CREATE TABL empleados (nombre VARHAR(100) DEFALT NUL);"}'
```
