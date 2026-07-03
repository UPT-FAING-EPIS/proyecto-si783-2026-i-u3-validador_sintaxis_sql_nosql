# Metodos de acceso de la Skill

La Skill de validacion SQL/MongoDB es la capacidad reutilizable del proyecto para analizar sintaxis, detectar motor, generar diagnosticos, sugerir correcciones simples, formatear y ejecutar reglas de lint.

El core real de validacion sigue viviendo en `src`. La API desplegada en `skill/service` mantiene el contrato HTTP existente y el CLI Linux empaqueta una copia del core para validar localmente sin depender de red.

```text
Core de validacion en src
        |
        v
Skill: capacidad de validar SQL/MongoDB
        |
        v
Metodos de acceso
   |-- Frontend Web
   |-- API REST publica
   `-- CLI Linux local
```

## Componentes

- `src`: core principal y validadores existentes.
- `skill/service`: API REST desplegable de la Skill. Mantiene endpoints bajo `/api/v1`.
- `frontend`: web existente para usuarios finales.
- `packages/cli`: comando `sqlcheck` para consola Linux con core local empaquetado.

## API REST publica

URL desplegada:

```text
https://wonderful-benevolence-production-ebaf.up.railway.app
```

Endpoints principales:

- `GET /health`
- `GET /api/v1/engines`
- `GET /api/v1/capabilities`
- `POST /api/v1/validate`
- `POST /api/v1/diagnostic`
- `POST /api/v1/detect-engine`
- `POST /api/v1/compatibility`
- `POST /api/v1/fix`
- `POST /api/v1/format`
- `POST /api/v1/lint`

Ejemplo:

```bash
curl -X POST https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"SELECT * FORM usuarios;"}'
```

## CLI Linux local

El CLI no llama a la API. El paquete instala `sqlcheck` junto con el core local de validacion:

```bash
sqlcheck validate "SELECT * FORM usuarios;"
sqlcheck validate consulta.sql --engine mysql
cat consulta.sql | sqlcheck validate --stdin
```

Esto permite validar consultas en servidores o terminales Linux aunque no haya conectividad hacia la API publica.
