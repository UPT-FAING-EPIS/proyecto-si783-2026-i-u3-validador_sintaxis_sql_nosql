terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
  }

  # Backend remoto opcional:
  # backend "azurerm" {
  #   resource_group_name  = "rg-terraform-state"
  #   storage_account_name = "mytfstateaccount"
  #   container_name       = "tfstate"
  #   key                  = "sql-validator/azure/terraform.tfstate"
  # }
}

provider "azurerm" {
  features {}
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  safe_prefix = substr(
    lower(replace(replace("${var.project_name}-${var.environment}", "_", "-"), ".", "-")),
    0,
    36
  )
  acr_name = substr(
    replace("${var.project_name}${var.environment}acr", "/[^A-Za-z0-9]/", ""),
    0,
    50
  )
  container_image = "${azurerm_container_registry.app.login_server}/${var.image_name}:${var.image_tag}"
  container_env_vars = merge(
    {
      PORT = tostring(var.app_port)
    },
    var.env_vars
  )

  common_tags = {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.safe_prefix}"
  location = var.region
  tags     = local.common_tags
}

resource "azurerm_container_registry" "app" {
  name                = local.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.acr_sku
  admin_enabled       = false
  tags                = local.common_tags
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = "law-${local.safe_prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = var.log_retention_days
  tags                = local.common_tags
}

resource "azurerm_container_app_environment" "main" {
  name                       = "cae-${local.safe_prefix}"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = local.common_tags
}

resource "azurerm_user_assigned_identity" "container_app" {
  name                = "id-${local.safe_prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tags                = local.common_tags
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.app.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.container_app.principal_id
}

resource "azurerm_container_app" "app" {
  name                         = "ca-${local.safe_prefix}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.common_tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_app.id]
  }

  registry {
    server   = azurerm_container_registry.app.login_server
    identity = azurerm_user_assigned_identity.container_app.id
  }

  ingress {
    external_enabled = true
    target_port      = var.app_port

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = var.image_name
      image  = local.container_image
      cpu    = var.cpu
      memory = format("%.1fGi", var.memory)

      dynamic "env" {
        for_each = local.container_env_vars
        content {
          name  = env.key
          value = tostring(env.value)
        }
      }
    }
  }

  depends_on = [azurerm_role_assignment.acr_pull]
}
