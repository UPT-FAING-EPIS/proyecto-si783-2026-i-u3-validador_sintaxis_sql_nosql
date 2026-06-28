variable "project_name" {
  description = "Project name used to prefix Azure resources."
  type        = string
  default     = "sql-validator"
}

variable "environment" {
  description = "Deployment environment name, for example dev, staging or prod."
  type        = string
  default     = "prod"
}

variable "region" {
  description = "Azure region where resources will be created."
  type        = string
  default     = "eastus"
}

variable "app_port" {
  description = "Container port exposed by the Node/Express application."
  type        = number
  default     = 3000

  validation {
    condition     = var.app_port > 0 && var.app_port < 65536
    error_message = "app_port must be a valid TCP port between 1 and 65535."
  }
}

variable "image_name" {
  description = "Docker image and container name."
  type        = string
  default     = "sql-validator"
}

variable "image_tag" {
  description = "Docker image tag deployed by Azure Container Apps."
  type        = string
  default     = "latest"
}

variable "cpu" {
  description = "Container Apps CPU cores. Common values: 0.25, 0.5, 1.0."
  type        = number
  default     = 0.5

  validation {
    condition     = var.cpu > 0
    error_message = "cpu must be greater than zero."
  }
}

variable "memory" {
  description = "Container Apps memory in GiB. Common values: 0.5, 1.0, 2.0."
  type        = number
  default     = 1

  validation {
    condition     = var.memory > 0
    error_message = "memory must be greater than zero."
  }
}

variable "min_replicas" {
  description = "Minimum number of Container App replicas. Use 0 for scale-to-zero in test environments."
  type        = number
  default     = 1

  validation {
    condition     = var.min_replicas >= 0
    error_message = "min_replicas must be zero or greater."
  }
}

variable "max_replicas" {
  description = "Maximum number of Container App replicas."
  type        = number
  default     = 2

  validation {
    condition     = var.max_replicas >= 1
    error_message = "max_replicas must be one or greater."
  }
}

variable "env_vars" {
  description = "Non-secret environment variables injected into the container. Use Container App secrets or CI/CD secrets for sensitive values in production."
  type        = map(string)
  default = {
    NODE_ENV = "production"
  }
  sensitive = true
}

variable "acr_sku" {
  description = "Azure Container Registry SKU."
  type        = string
  default     = "Basic"
}

variable "log_retention_days" {
  description = "Log Analytics retention in days."
  type        = number
  default     = 30
}
