variable "project_name" {
  description = "Project name used to prefix AWS resources."
  type        = string
  default     = "sql-validator"
}

variable "environment" {
  description = "Deployment environment name, for example dev, staging or prod."
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region where resources will be created."
  type        = string
  default     = null
}

variable "region" {
  description = "Deprecated. Use aws_region instead."
  type        = string
  default     = null
}

variable "app_port" {
  description = "Port configured inside the application through the PORT environment variable."
  type        = number
  default     = 3000

  validation {
    condition     = var.app_port > 0 && var.app_port < 65536
    error_message = "app_port must be a valid TCP port between 1 and 65535."
  }
}

variable "container_port" {
  description = "Container port exposed to ECS and the load balancer."
  type        = number
  default     = 3000

  validation {
    condition     = var.container_port > 0 && var.container_port < 65536
    error_message = "container_port must be a valid TCP port between 1 and 65535."
  }
}

variable "image_name" {
  description = "Docker image and container name. Also used as part of the ECR repository name."
  type        = string
  default     = "sql-validator"
}

variable "image_tag" {
  description = "Docker image tag deployed by ECS."
  type        = string
  default     = "latest"
}

variable "cpu" {
  description = "Fargate task CPU units. Common values: 256, 512, 1024."
  type        = number
  default     = 256

  validation {
    condition     = contains([256, 512, 1024, 2048, 4096], var.cpu)
    error_message = "cpu must be one of the valid Fargate CPU values: 256, 512, 1024, 2048 or 4096."
  }
}

variable "memory" {
  description = "Fargate task memory in MiB. Common values for 256 CPU: 512, 1024, 2048."
  type        = number
  default     = 512

  validation {
    condition     = var.memory >= 512
    error_message = "memory must be at least 512 MiB."
  }
}

variable "desired_count" {
  description = "Desired number of ECS Fargate tasks."
  type        = number
  default     = null

  validation {
    condition     = var.desired_count == null || var.desired_count >= 1
    error_message = "desired_count must be one or greater."
  }
}

variable "min_replicas" {
  description = "Deprecated. Use desired_count instead."
  type        = number
  default     = null

  validation {
    condition     = var.min_replicas == null || var.min_replicas >= 1
    error_message = "min_replicas must be one or greater when provided."
  }
}

variable "max_replicas" {
  description = "Deprecated. Kept only to avoid warnings from older local terraform.tfvars files."
  type        = number
  default     = null
}

variable "env_vars" {
  description = "Additional environment variables injected into the container. Values here override the explicit app variables when names collide."
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "node_env" {
  description = "NODE_ENV value injected into the container."
  type        = string
  default     = "development"
}

variable "port" {
  description = "PORT value injected into the container. Defaults to app_port when null."
  type        = string
  default     = null
}

variable "database_url" {
  description = "PostgreSQL connection string used when NODE_ENV=production."
  type        = string
  default     = null
  sensitive   = true

  validation {
    condition     = var.node_env != "production" || (var.database_url != null && trimspace(var.database_url) != "")
    error_message = "database_url is required when node_env is production."
  }
}

variable "jwt_secret" {
  description = "Secret used to sign and verify JWT tokens."
  type        = string
  default     = null
  sensitive   = true
}

variable "admin_email" {
  description = "Initial admin email. Optional, used when creating the first admin user."
  type        = string
  default     = null
}

variable "admin_password" {
  description = "Initial admin password. Optional, used with admin_email when creating the first admin user."
  type        = string
  default     = null
  sensitive   = true
}

variable "admin_name" {
  description = "Initial admin display name."
  type        = string
  default     = null
}

variable "db_host" {
  description = "PostgreSQL host used only when DATABASE_URL is not provided."
  type        = string
  default     = null
}

variable "db_port" {
  description = "PostgreSQL port used only when DATABASE_URL is not provided."
  type        = string
  default     = null
}

variable "db_name" {
  description = "PostgreSQL database name used only when DATABASE_URL is not provided."
  type        = string
  default     = null
}

variable "db_user" {
  description = "PostgreSQL user used only when DATABASE_URL is not provided."
  type        = string
  default     = null
}

variable "db_password" {
  description = "PostgreSQL password used only when DATABASE_URL is not provided."
  type        = string
  default     = null
  sensitive   = true
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets. Use at least two for the ALB."
  type        = list(string)
  default     = ["10.20.1.0/24", "10.20.2.0/24"]
}

variable "availability_zones" {
  description = "Optional availability zones for public subnets. If omitted, Terraform uses the first available AZs in aws_region."
  type        = list(string)
  default     = null
}

variable "allowed_http_cidr_blocks" {
  description = "CIDR blocks allowed to access the public load balancer over HTTP."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "target_group_health_check_path" {
  description = "Application health endpoint used by the target group."
  type        = string
  default     = "/health"
}

variable "health_check_path" {
  description = "Deprecated. Kept only to avoid warnings from older local terraform.tfvars files."
  type        = string
  default     = null
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days."
  type        = number
  default     = 14
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights. This may increase CloudWatch costs."
  type        = bool
  default     = false
}
