output "ecr_repository_url" {
  description = "ECR repository URL where the Docker image must be pushed."
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name."
  value       = aws_ecs_service.app.name
}

output "load_balancer_dns" {
  description = "Public DNS name of the Application Load Balancer."
  value       = aws_lb.app.dns_name
}

output "public_url" {
  description = "Public HTTP URL of the application."
  value       = "http://${aws_lb.app.dns_name}"
}
