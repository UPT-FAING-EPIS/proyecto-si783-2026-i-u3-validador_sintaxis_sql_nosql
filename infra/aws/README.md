# Despliegue en AWS con Terraform

Esta carpeta crea una infraestructura simple y funcional:

Docker image -> Amazon ECR -> ECS Fargate -> Application Load Balancer -> CloudWatch Logs -> URL publica

## Requisitos previos

- Terraform >= 1.5
- AWS CLI configurado
- Docker
- Una base PostgreSQL externa si se usa `NODE_ENV=production`, porque la app requiere `DATABASE_URL` en produccion.
- Para una demo academica sin base administrada en AWS, puedes usar `NODE_ENV=development`; la API de validacion y `/api/health` siguen funcionando, pero login/auditoria dependen de PostgreSQL.

## Configurar AWS CLI

```bash
aws configure
aws sts get-caller-identity
```

## Variables

Copia el ejemplo y ajusta valores:

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars
```

No subas `terraform.tfvars` al repositorio.

Variables principales:

- `project_name`
- `environment`
- `aws_region`
- `app_port`
- `container_port`
- `image_name`
- `image_tag`
- `cpu`
- `memory`
- `desired_count`
- `env_vars`

## Configuración de variables de entorno

Las variables reales se configuran en `infra/aws/terraform.tfvars`. Ese archivo esta ignorado por Git y no debe subirse al repositorio.

Para crear el archivo local:

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars
```

Variables detectadas automaticamente en la aplicacion:

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

Variables obligatorias para produccion:

- `node_env = "production"`
- `port = "3000"`
- `database_url`
- `jwt_secret`

Variables recomendadas para inicializar el administrador:

- `admin_email`
- `admin_password`
- `admin_name`

Variables opcionales:

- `db_host`
- `db_port`
- `db_name`
- `db_user`
- `db_password`
- `env_vars`, para variables adicionales futuras

Si usas `NODE_ENV=production`, la app exige `DATABASE_URL`. El error `DATABASE_URL no configurada en producción` se corrige completando `database_url` en `terraform.tfvars` y aplicando Terraform.

Después de modificar variables de entorno:

```bash
terraform apply
aws ecs update-service --cluster <cluster> --service <service> --force-new-deployment --region <region>
```

## Crear infraestructura

```bash
terraform init
terraform fmt
terraform validate
terraform plan
```

Para el primer despliegue, crea primero el repositorio ECR, sube la imagen y luego crea el resto de la infraestructura:

```bash
terraform apply -target=aws_ecr_repository.app
```

Obtiene los outputs:

```bash
terraform output
terraform output -raw ecr_repository_url
terraform output -raw public_url
```

## Construir y subir imagen a ECR

Desde la raiz del proyecto:

```bash
docker build -t sql-validator .
```

Autenticarse en ECR:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.us-east-1.amazonaws.com
```

Etiquetar y subir:

```bash
docker tag sql-validator:latest <ecr_repository_url>:latest
docker push <ecr_repository_url>:latest
```

Crea o actualiza toda la infraestructura:

```bash
terraform apply
```

Forzar redeploy de ECS cuando subas una nueva imagen con el mismo tag:

```bash
aws ecs update-service --cluster <cluster> --service <service> --force-new-deployment --region us-east-1
```

## Verificar despliegue

```bash
curl http://<load_balancer_dns>/health
```

La URL publica queda en:

```bash
terraform output -raw public_url
```

## Logs

Los logs se envian a CloudWatch Logs en:

```bash
/ecs/<project_name>-<environment>
```

Consultar por CLI:

```bash
aws logs tail /ecs/sql-validator-prod --region us-east-1 --follow
```

## Backend remoto opcional

El archivo `main.tf` incluye un bloque comentado para backend S3. Para activarlo necesitas crear previamente:

- Un bucket S3 para `terraform.tfstate`
- Una tabla DynamoDB para lock

Luego descomenta el bloque `backend "s3"` y ejecuta:

```bash
terraform init -migrate-state
```

## Destruir infraestructura

```bash
terraform destroy
```

## Costos y seguridad

- El Application Load Balancer genera costo aunque tenga poco trafico.
- ECS Fargate cobra por CPU/memoria mientras haya tareas corriendo.
- CloudWatch puede cobrar por logs y metricas.
- Para pruebas, destruye recursos al terminar.
- No subas credenciales, `.env`, `terraform.tfvars`, claves privadas ni tokens.
- Usa `cpu`, `memory` y `desired_count` conservadores.
- En produccion, mueve secretos como `DATABASE_URL`, `JWT_SECRET` y `ADMIN_PASSWORD` a un gestor de secretos.
