# SQL/NoSQL Syntax Validator — GitHub Action

Valida la sintaxis de archivos SQL y MongoDB/NoSQL en tu repositorio automáticamente en cada push o pull request. Sin servidor requerido — el validador corre directamente en el runner de GitHub.

## Uso básico

```yaml
name: Validate SQL

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: GianfrancoArocutipa/sql-nosql-validator-action@v1
```

## Opciones

```yaml
- uses: GianfrancoArocutipa/sql-nosql-validator-action@v1
  with:
    path: 'src/database'   # Directorio donde buscar (default: ".")
    extension: '.sql'      # Extensión de archivos (default: ".sql")
    type: 'auto'           # "sql", "nosql" o "auto" (default: "auto")
    fail-on-error: 'true'  # Falla el workflow si hay errores (default: "true")
```

## Outputs

| Output | Descripción |
|---|---|
| `error-count` | Número total de errores encontrados |
| `file-count` | Número de archivos validados |

```yaml
- uses: GianfrancoArocutipa/sql-nosql-validator-action@v1
  id: validate
- run: echo "Errores encontrados ${{ steps.validate.outputs.error-count }}"
```

## Ejemplo completo con validación de SQL y NoSQL

```yaml
name: Validate SQL & NoSQL

on:
  push:
    paths: ['**/*.sql', '**/*.mongo']
  pull_request:
    paths: ['**/*.sql', '**/*.mongo']

jobs:
  validate-sql:
    name: Validar SQL
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: GianfrancoArocutipa/sql-nosql-validator-action@v1
        with:
          path: '.'
          extension: '.sql'
          type: 'sql'

  validate-nosql:
    name: Validar NoSQL
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: GianfrancoArocutipa/sql-nosql-validator-action@v1
        with:
          path: '.'
          extension: '.mongo'
          type: 'nosql'
```

## Qué valida

- **SQL**: SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, CTEs, funciones de ventana, múltiples dialectos (MySQL, PostgreSQL, SQL Server, Oracle, SQLite).
- **NoSQL/MongoDB**: `db.collection.find()`, `insertOne`, `updateOne`, `aggregate`, operadores `$match`, `$group`, `$set`, etc.

## Anotaciones en Pull Requests

Cuando hay errores, el Action crea anotaciones inline directamente en el diff del PR:

```
❌ src/db/migration.sql — Línea 5, Col 8: FORM no es válido. Se esperaba FROM
```

## Proyecto principal

Este Action forma parte del ecosistema **SQL/NoSQL Syntax Validator**:

- **Web App**: validador online con frontend y API REST
- **VS Code Extension**: `ext install gianfranco-arocutipa.sql-nosql-syntax-validator`
- **GitHub Action**: este repositorio
- **Skill API**: REST API pública documentada con OpenAPI

## Licencia

MIT
