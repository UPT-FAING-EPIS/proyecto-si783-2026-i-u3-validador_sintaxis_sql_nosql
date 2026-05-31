# SQL/NoSQL Syntax Validator ⚡

Herramienta web para validar consultas **SQL** y **MongoDB (NoSQL)** con editor Monaco, resaltado de errores y sugerencias inteligentes.

## 🚀 Instalación y Ejecución

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar el servidor
```bash
npm start
```

### 3. Abrir en el navegador
```
http://localhost:3000
```

### Desarrollo con auto-reload
```bash
npm run dev
```

## 📁 Estructura

```
├── backend/
│   ├── server.js                  # Servidor Express
│   ├── routes/validateRoutes.js   # Rutas de la API
│   └── controllers/validatorController.js  # Lógica de validación
├── frontend/
│   ├── index.html                 # Interfaz principal
│   ├── styles.css                 # Estilos VS Code theme
│   └── app.js                    # Lógica del frontend
├── package.json
├── Dockerfile
└── README.md
```

## 🔌 API REST

### `POST /api/validate`

**Request:**
```json
{
  "type": "sql",
  "query": "SELECT * FROM usuarios WHERE id = 1;"
}
```

**Response (válida):**
```json
{
  "valid": true,
  "errors": [],
  "suggestions": ["✅ Tu consulta SQL tiene una estructura correcta."]
}
```

**Response (inválida):**
```json
{
  "valid": false,
  "errors": [{ "line": 1, "message": "Error de sintaxis..." }],
  "suggestions": ["Las consultas SELECT requieren una cláusula FROM."]
}
```

### `GET /api/health` — Estado del servidor
### `GET /api/examples` — Ejemplos de consultas

## ✨ Características

- 🖊️ Editor Monaco (el mismo de VS Code)
- 🎯 Validación SQL con node-sql-parser
- 🍃 Validación MongoDB con reglas personalizadas
- 💡 Sugerencias inteligentes
- 📋 Historial de validaciones
- 🌙/☀️ Tema oscuro y claro
- ⌨️ Atajos de teclado (Ctrl+Enter)
- 📊 Estadísticas de uso
- 📖 Ejemplos precargados

## 🐳 Docker

```bash
docker build -t sql-validator .
docker run -p 3000:3000 sql-validator
```

## 📦 Dependencias

- **express** — Servidor web
- **cors** — Manejo de CORS
- **node-sql-parser** — Parser SQL
- **nodemon** — Auto-reload (dev)
