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

## Despliegue profesional

El despliegue actual en Railway se mantiene intacto: no se elimina el `Dockerfile`, no se cambia el comando `npm start` y la app sigue escuchando `process.env.PORT || 3000`, compatible con Railway.

### Analisis del proyecto

- Framework: Node.js con Express.
- Frontend: archivos estaticos en `frontend/`, servidos por el mismo servidor Express.
- Backend/API: rutas bajo `/api`, incluyendo `POST /api/validate`, `GET /api/health` y alias `GET /health`.
- Puerto: `PORT` por variable de entorno, con valor por defecto `3000`.
- Build: no hay build frontend separado; la imagen Docker instala dependencias y copia el codigo.
- Start: `npm start`, que ejecuta `node src/server.js`.
- Dockerfile: usa `node:18-alpine`, `npm install --production`, `EXPOSE 3000` y `CMD ["npm", "start"]`.
- docker-compose: existe e incluye la app y PostgreSQL local para desarrollo.
- Base de datos: PostgreSQL opcional para funciones de autenticacion/auditoria. En produccion la app exige `DATABASE_URL` si `NODE_ENV=production`.
- Railway: la app ya usa `PORT` y `DATABASE_URL`, patrones habituales de Railway. No se encontro archivo `railway.toml`.

### Estructura agregada

```text
infra/
  aws/
    main.tf
    variables.tf
    outputs.tf
    terraform.tfvars.example
    README.md
  azure/
    main.tf
    variables.tf
    outputs.tf
    terraform.tfvars.example
    README.md
.github/
  workflows/
    deploy-aws.yml
    deploy-azure.yml
```

### Variables requeridas

Variables comunes de Terraform:

- `project_name`
- `environment`
- `aws_region` en AWS
- `app_port`
- `container_port` en AWS
- `image_name`
- `image_tag`
- `cpu`
- `memory`
- `desired_count` en AWS
- `min_replicas` y `max_replicas` en Azure
- `env_vars`

Variables detectadas en la app:

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

No hardcodees secretos en Terraform. Usa `terraform.tfvars` local, secretos del proveedor cloud o secretos de CI/CD. Los archivos reales `terraform.tfvars`, `.env`, estados Terraform y llaves privadas estan ignorados por Git.

### AWS

Arquitectura:

```text
Docker image -> Amazon ECR -> ECS Fargate -> Application Load Balancer -> CloudWatch Logs -> URL publica
```

Comandos principales:

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply -target=aws_ecr_repository.app
```

Construir y subir imagen:

```bash
cd ../..
docker build -t sql-validator .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.us-east-1.amazonaws.com
docker tag sql-validator:latest <ecr_repository_url>:latest
docker push <ecr_repository_url>:latest
```

Crear o actualizar infraestructura completa:

```bash
cd infra/aws
terraform apply
aws ecs update-service --cluster <cluster> --service <service> --force-new-deployment --region us-east-1
```

Verificar:

```bash
curl http://<load_balancer_dns>/health
```

Logs:

```bash
aws logs tail /ecs/sql-validator-prod --region us-east-1 --follow
```

Destruir:

```bash
terraform destroy
```

### Azure

Arquitectura:

```text
Docker image -> Azure Container Registry -> Azure Container Apps -> URL publica HTTPS
```

Comandos principales:

```bash
cd infra/azure
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply -target=azurerm_resource_group.main -target=azurerm_container_registry.app
```

Construir y subir imagen:

```bash
cd ../..
docker build -t sql-validator .
az acr login --name <acr_name>
docker tag sql-validator:latest <acr_login_server>/sql-validator:latest
docker push <acr_login_server>/sql-validator:latest
```

Crear o actualizar infraestructura completa:

```bash
cd infra/azure
terraform apply
az containerapp update \
  --name <container_app_name> \
  --resource-group <resource_group_name> \
  --image <acr_login_server>/sql-validator:latest
```

Verificar:

```bash
curl https://<container_app_fqdn>/api/health
```

Logs:

```bash
az containerapp logs show \
  --name <container_app_name> \
  --resource-group <resource_group_name> \
  --follow
```

Destruir:

```bash
terraform destroy
```

### GitHub Actions

Se agregan workflows opcionales en `.github/workflows/`.

Secretos sugeridos para AWS:

- `AWS_REGION`
- `AWS_ACCOUNT_ID`
- `AWS_ROLE_TO_ASSUME`, recomendado con OIDC
- `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`, alternativa si no usas OIDC

Secretos sugeridos para Azure:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_CREDENTIALS`, alternativa JSON si no usas federated credentials
- `AZURE_RESOURCE_GROUP`, si decides extender el workflow

Los workflows ejecutan `terraform plan` por defecto. El `apply` queda condicionado al input manual `apply=true`.

### Backend remoto de Terraform

Los archivos `main.tf` incluyen backends remotos comentados:

- AWS: S3 para estado y DynamoDB para lock.
- Azure: Storage Account y Blob Container para `tfstate`.

Primero crea esos recursos de estado remoto, luego descomenta el bloque correspondiente y ejecuta:

```bash
terraform init -migrate-state
```

### Costos y seguridad

- AWS ALB, ECS Fargate, CloudWatch, ACR, Container Apps y Log Analytics pueden generar costos.
- Usa recursos pequenos para pruebas: `cpu`, `memory`, `desired_count`, `min_replicas` y `max_replicas` conservadores.
- En Azure puedes evaluar `min_replicas = 0` para pruebas si aceptas arranque en frio.
- Ejecuta `terraform destroy` cuando termines ambientes temporales.
- No subas credenciales, tokens, `.env`, `terraform.tfvars`, estados Terraform ni claves privadas.
- Para produccion, usa gestores de secretos para `DATABASE_URL`, `JWT_SECRET` y `ADMIN_PASSWORD`.
