# SQL Multi-Engine Validation Skill

Este archivo se conserva por compatibilidad con integraciones anteriores. El archivo principal que deben leer agentes IA y desarrolladores externos es:

```text
skill/skill.md
```

## URLs

- Skill/API publica: https://wonderful-benevolence-production-ebaf.up.railway.app
- Web principal: https://projectvalidador-production-3bcb.up.railway.app
- Descarga desde la web: https://projectvalidador-production-3bcb.up.railway.app/skill.md

## Resumen

La Skill permite validar SQL y MongoDB desde aplicaciones externas usando una API publica desplegada. No es necesario reimplementar la gramatica ni copiar el core del validador. Los consumidores deben enviar el codigo a validar y usar la respuesta JSON para mostrar errores, advertencias, diagnosticos o sugerencias.

## Endpoints

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

## Ejemplo rapido

```bash
curl -X POST https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"CREATE TABL empleados (id INT);"}'
```

Para instrucciones completas, ejemplos en JavaScript, Python, Java, apps de auditoria, apps de aprendizaje y editores con debounce, leer `skill/skill.md`.
