output "resource_group_name" {
  description = "Azure Resource Group name."
  value       = azurerm_resource_group.main.name
}

output "acr_login_server" {
  description = "Azure Container Registry login server."
  value       = azurerm_container_registry.app.login_server
}

output "acr_name" {
  description = "Azure Container Registry name."
  value       = azurerm_container_registry.app.name
}

output "container_app_name" {
  description = "Azure Container App name."
  value       = azurerm_container_app.app.name
}

output "container_app_url" {
  description = "Public HTTPS URL of the Azure Container App."
  value       = "https://${azurerm_container_app.app.latest_revision_fqdn}"
}
