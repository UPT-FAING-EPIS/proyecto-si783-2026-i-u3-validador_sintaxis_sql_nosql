# SQL/NoSQL Syntax Validator

Aplicacion web para validar consultas SQL y MongoDB/NoSQL. El proyecto usa un servidor Node.js con Express que expone la API y sirve el frontend estatico desde la misma aplicacion.

## Estado Actual

- Despliegue existente: Railway con Docker.
- Despliegue profesional agregado: AWS con Terraform, ECR, ECS Fargate, ALB y CloudWatch Logs.
- Frontend: archivos estaticos en `frontend/`.
- Backend/API: Express en `src/`.
- Puerto: `PORT`, con valor por defecto `3000`.
- Health checks: `GET /health` y `GET /api/health`.

Railway no fue eliminado ni modificado de forma destructiva. El `Dockerfile` y el comando `npm start` siguen siendo compatibles.

## Requisitos

- Node.js >= 18
- npm
- Docker
- Terraform >= 1.5, solo para despliegue AWS/Azure
- AWS CLI configurado, solo para despliegue AWS

## Instalacion Local

```bash
npm install
npm start
```

Abrir:

```text
http://localhost:3000
```

Modo desarrollo:

```bash
npm run dev
```

## Docker Local

```bash
docker build -t sql-validator .
docker run -p 3000:3000 -e NODE_ENV=development -e PORT=3000 sql-validator
```

Verificar:

```bash
curl http://localhost:3000/health
```

## Estructura

```text
.
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── services/
├── frontend/
├── infra/
│   ├── aws/
│   └── azure/
├── .github/workflows/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## API

### `POST /api/validate`

Valida una consulta SQL o MongoDB.

Request:

```json
{
  "type": "sql",
  "query": "SELECT * FROM usuarios WHERE id = 1;"
}
```

Response valida:

```json
{
  "valid": true,
  "errors": [],
  "suggestions": ["Tu consulta SQL tiene una estructura correcta."]
}
```

### `GET /health`

Health check simple para Docker, ECS y balanceadores.

```json
{
  "status": "ok"
}
```

### `GET /api/health`

Health check detallado de la API.

### `GET /api/examples`

Devuelve ejemplos de consultas SQL y MongoDB.

## Variables De Entorno

Variables detectadas en la aplicacion:

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

Para `NODE_ENV=production`, la aplicacion exige `DATABASE_URL`. Si no se configura, el contenedor falla con:

```text
DATABASE_URL no configurada en produccion
```

En AWS, estos valores se configuran en:

```text
infra/aws/terraform.tfvars
```

Ese archivo no debe subirse a Git.

Ejemplo:

```hcl
node_env       = "production"
port           = "3000"
database_url   = "postgresql://usuario:password@host:5432/validator_db"
jwt_secret     = "CAMBIAR_POR_UN_SECRET"
admin_email    = "admin@example.com"
admin_password = "CAMBIAR_PASSWORD"
admin_name     = "Administrador"
```

## Despliegue AWS

Arquitectura:

```text
Docker image -> Amazon ECR -> ECS Fargate -> Application Load Balancer -> CloudWatch Logs -> URL publica
```

Recursos Terraform:

- VPC
- Subnets publicas
- Internet Gateway
- Route Table
- Security Groups
- ECR Repository
- ECS Cluster
- ECS Task Definition
- ECS Service Fargate
- Application Load Balancer
- Target Group
- HTTP Listener
- CloudWatch Log Group
- IAM Role para ECS Task Execution

### 1. Configurar Variables

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars
```

Editar `terraform.tfvars` con valores reales. No escribir secretos reales en `terraform.tfvars.example`.

### 2. Crear ECR

```bash
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply -target=aws_ecr_repository.app
```

### 3. Construir Y Subir Imagen

Desde la raiz del proyecto:

```bash
docker build -t sql-validator .
```

Login en ECR:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.us-east-1.amazonaws.com
```

Tag y push:

```bash
docker tag sql-validator:latest <ecr_repository_url>:latest
docker push <ecr_repository_url>:latest
```

### 4. Crear Infraestructura Completa

```bash
cd infra/aws
terraform apply
```

Forzar nuevo despliegue:

```bash
aws ecs update-service \
  --cluster sql-validator-prod-cluster \
  --service sql-validator-prod-service \
  --force-new-deployment \
  --region us-east-1
```

### 5. Abrir URL Publica

```bash
terraform output -raw public_url
```

Verificar:

```bash
curl $(terraform output -raw public_url)/health
```

### Logs AWS

```bash
aws logs tail /ecs/sql-validator-prod --region us-east-1 --follow
```

### Destruir AWS

```bash
cd infra/aws
terraform destroy
```

## Despliegue Azure

La estructura base para Azure esta en `infra/azure/`.

Arquitectura prevista:

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
terraform apply
```

Subir imagen:

```bash
docker build -t sql-validator .
az acr login --name <acr_name>
docker tag sql-validator:latest <acr_login_server>/sql-validator:latest
docker push <acr_login_server>/sql-validator:latest
```

Actualizar Container App:

```bash
az containerapp update \
  --name <container_app_name> \
  --resource-group <resource_group_name> \
  --image <acr_login_server>/sql-validator:latest
```

## GitHub Actions

Workflows disponibles:

- `.github/workflows/deploy-aws.yml`
- `.github/workflows/deploy-azure.yml`

Secretos sugeridos para AWS:

- `AWS_REGION`
- `AWS_ACCOUNT_ID`
- `AWS_ROLE_TO_ASSUME`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Secretos sugeridos para Azure:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_CREDENTIALS`

## Seguridad

No subir al repositorio:

- `.env`
- `.env.*`
- `terraform.tfvars`
- `terraform.tfstate`
- `terraform.tfstate.backup`
- `.terraform/`
- claves privadas
- tokens
- credenciales reales

Los archivos de ejemplo permitidos son:

- `terraform.tfvars.example`
- `.env.example`

## Costos

AWS ALB, ECS Fargate, CloudWatch, Azure Container Apps, ACR y Log Analytics pueden generar costos. Para entornos de prueba, ejecutar `terraform destroy` al terminar.

## Validacion Realizada

- `docker build -t sql-validator .`
- `GET /health` en contenedor local.
- `GET /api/health` en contenedor local.
- `terraform fmt`
- `terraform validate`
- `terraform plan`

## Compatibilidad

- Railway: compatible.
- Docker local: compatible.
- AWS ECS Fargate: compatible.
- Azure Container Apps: estructura preparada.
