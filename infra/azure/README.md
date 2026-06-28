# Despliegue en Azure con Terraform

Esta carpeta crea una infraestructura simple y funcional:

Docker image -> Azure Container Registry -> Azure Container Apps -> URL publica HTTPS

## Requisitos previos

- Terraform >= 1.5
- Azure CLI
- Docker
- Una base PostgreSQL externa si se usa `NODE_ENV=production`, porque la app requiere `DATABASE_URL` en produccion.

## Login en Azure

```bash
az login
az account set --subscription <subscription_id>
```

## Variables

Copia el ejemplo y ajusta valores:

```bash
cd infra/azure
cp terraform.tfvars.example terraform.tfvars
```

No subas `terraform.tfvars` al repositorio.

Variables principales:

- `project_name`
- `environment`
- `region`
- `app_port`
- `image_name`
- `image_tag`
- `cpu`
- `memory`
- `min_replicas`
- `max_replicas`
- `env_vars`

## Crear infraestructura

```bash
terraform init
terraform fmt
terraform validate
terraform plan
```

Para el primer despliegue, crea primero el Resource Group y ACR, sube la imagen y luego crea el resto de la infraestructura:

```bash
terraform apply -target=azurerm_resource_group.main -target=azurerm_container_registry.app
```

Obtiene los outputs:

```bash
terraform output
terraform output -raw acr_login_server
terraform output -raw container_app_url
```

## Construir y subir imagen a ACR

Desde la raiz del proyecto:

```bash
docker build -t sql-validator .
```

Autenticarse en ACR:

```bash
az acr login --name <acr_name>
```

Etiquetar y subir:

```bash
docker tag sql-validator:latest <acr_login_server>/sql-validator:latest
docker push <acr_login_server>/sql-validator:latest
```

Crea o actualiza toda la infraestructura:

```bash
terraform apply
```

Actualizar la Container App cuando subas una nueva imagen con el mismo tag:

```bash
az containerapp update \
  --name <container_app_name> \
  --resource-group <resource_group_name> \
  --image <acr_login_server>/sql-validator:latest
```

## Verificar despliegue

```bash
curl https://<container_app_fqdn>/api/health
```

La URL publica queda en:

```bash
terraform output -raw container_app_url
```

## Logs

Logs en tiempo real:

```bash
az containerapp logs show \
  --name <container_app_name> \
  --resource-group <resource_group_name> \
  --follow
```

Tambien puedes consultarlos desde Log Analytics en el portal de Azure.

## Backend remoto opcional

El archivo `main.tf` incluye un bloque comentado para backend `azurerm`. Para activarlo necesitas crear previamente:

- Resource Group para estado
- Storage Account
- Blob Container

Luego descomenta el bloque `backend "azurerm"` y ejecuta:

```bash
terraform init -migrate-state
```

## Destruir infraestructura

```bash
terraform destroy
```

## Costos y seguridad

- Azure Container Registry y Log Analytics pueden generar costos.
- Container Apps cobra por recursos consumidos y replicas activas.
- Para pruebas puedes usar `min_replicas = 0` si tu escenario acepta arranque en frio.
- Para pruebas, destruye recursos al terminar.
- No subas credenciales, `.env`, `terraform.tfvars`, claves privadas ni tokens.
- Usa `cpu`, `memory`, `min_replicas` y `max_replicas` conservadores.
- En produccion, mueve secretos como `DATABASE_URL`, `JWT_SECRET` y `ADMIN_PASSWORD` a Azure Key Vault o secretos de Container Apps.
