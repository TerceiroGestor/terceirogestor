output "backend_service_account_email" {
  description = "Backend runtime service account email."
  value       = module.backend_service_account.email
}

output "frontend_service_account_email" {
  description = "Frontend runtime service account email."
  value       = module.frontend_service_account.email
}

output "artifact_registry_repository_id" {
  description = "Artifact Registry repository ID."
  value       = module.artifact_registry.repository_id
}

output "artifact_registry_repository_url" {
  description = "Artifact Registry Docker repository base URL."
  value       = module.artifact_registry.repository_url
}

output "cloud_sql_instance_name" {
  description = "Cloud SQL instance name."
  value       = module.cloud_sql.instance_name
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL connection name used by Cloud Run."
  value       = module.cloud_sql.connection_name
}

output "cloud_sql_database_name" {
  description = "Cloud SQL database name."
  value       = module.cloud_sql.database_name
}

output "backend_service_url" {
  description = "Cloud Run backend service URL."
  value       = module.backend_service.uri
}

output "frontend_service_url" {
  description = "Cloud Run frontend service URL."
  value       = module.frontend_service.uri
}

output "migration_job_name" {
  description = "Cloud Run job name for Prisma migrations."
  value       = var.migration_job_enabled ? module.migration_job[0].name : null
}

output "load_balancer_ip_address" {
  description = "Global IP address of the load balancer when enabled."
  value       = var.load_balancer_enabled ? module.load_balancer[0].ip_address : null
}

output "load_balancer_frontend_url" {
  description = "Primary frontend URL served by the load balancer when enabled."
  value       = var.load_balancer_enabled ? module.load_balancer[0].frontend_url : null
}

output "public_bucket_name" {
  description = "Name of the public Cloud Storage bucket."
  value       = module.storage_buckets.public_bucket_name
}

output "private_bucket_name" {
  description = "Name of the private Cloud Storage bucket."
  value       = module.storage_buckets.private_bucket_name
}

output "secret_names" {
  description = "Secrets provisioned for the application contract."
  value       = module.secrets.secret_names
}