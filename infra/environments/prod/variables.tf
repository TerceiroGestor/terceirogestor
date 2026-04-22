variable "project_id" {
  description = "Target GCP project ID."
  type        = string
}

variable "region" {
  description = "Primary GCP region for Cloud Run and Cloud SQL."
  type        = string
}

variable "gcp_access_token" {
  description = "GCP access token for authentication. Can be set via environment variable TF_VAR_gcp_access_token."
  type        = string
  default     = ""
  sensitive   = true
}

variable "environment" {
  description = "Environment name suffix used in resource labels."
  type        = string
  default     = "prod"
}

variable "artifact_registry_repository_id" {
  description = "Artifact Registry Docker repository ID used for backend and frontend images."
  type        = string
  default     = "terceirogestor"
}

variable "artifact_registry_repository_description" {
  description = "Artifact Registry Docker repository description."
  type        = string
  default     = "Terceiro Gestor application images"
}

variable "cloud_sql_instance_name" {
  description = "Cloud SQL instance name."
  type        = string
  default     = "terceirogestor-prod"
}

variable "cloud_sql_database_name" {
  description = "Primary PostgreSQL database name."
  type        = string
  default     = "terceirogestor"
}

variable "cloud_sql_database_version" {
  description = "Cloud SQL PostgreSQL engine version."
  type        = string
  default     = "POSTGRES_16"
}

variable "cloud_sql_edition" {
  description = "Cloud SQL edition. ENTERPRISE supports db-custom-* tiers; ENTERPRISE_PLUS requires perf-optimized tiers."
  type        = string
  default     = "ENTERPRISE"
}

variable "cloud_sql_tier" {
  description = "Cloud SQL machine tier."
  type        = string
  default     = "db-custom-1-3840"
}

variable "cloud_sql_disk_type" {
  description = "Cloud SQL disk type."
  type        = string
  default     = "PD_HDD"
}

variable "cloud_sql_disk_size_gb" {
  description = "Cloud SQL disk size in GB."
  type        = number
  default     = 20
}

variable "cloud_sql_availability_type" {
  description = "Cloud SQL availability type."
  type        = string
  default     = "ZONAL"
}

variable "cloud_sql_ipv4_enabled" {
  description = "Whether public IPv4 is enabled on the instance."
  type        = bool
  default     = true
}

variable "cloud_sql_backup_enabled" {
  description = "Whether automated backups are enabled."
  type        = bool
  default     = true
}

variable "cloud_sql_point_in_time_recovery_enabled" {
  description = "Whether point-in-time recovery is enabled."
  type        = bool
  default     = true
}

variable "cloud_sql_deletion_protection" {
  description = "Whether Terraform protects the instance against deletion."
  type        = bool
  default     = true
}

variable "backend_allow_unauthenticated" {
  description = "Whether the backend Cloud Run service allows unauthenticated direct access."
  type        = bool
  default     = true
}

variable "migration_job_enabled" {
  description = "Whether to provision a Cloud Run job for database migrations."
  type        = bool
  default     = true
}

variable "migration_job_name" {
  description = "Cloud Run job name for Prisma migrations."
  type        = string
  default     = "terceirogestor-db-migrate"
}

variable "migration_job_timeout_seconds" {
  description = "Execution timeout in seconds for the migration job."
  type        = number
  default     = 1800
}

variable "load_balancer_enabled" {
  description = "Whether to provision the global serverless load balancer with /api routing."
  type        = bool
  default     = false
}

variable "load_balancer_name" {
  description = "Base name for load balancer resources."
  type        = string
  default     = "terceirogestor"
}

variable "load_balancer_domains" {
  description = "Optional public domains for the HTTPS load balancer certificate."
  type        = list(string)
  default     = []
}

variable "backend_service_name" {
  description = "Cloud Run backend service name."
  type        = string
  default     = "terceirogestor-backend"
}

variable "frontend_service_name" {
  description = "Cloud Run frontend service name."
  type        = string
  default     = "terceirogestor-frontend"
}

variable "frontend_service_account_id" {
  description = "Account ID for the frontend runtime service account."
  type        = string
  default     = "terceirogestor-frontend"
}

variable "frontend_service_account_display_name" {
  description = "Display name for the frontend runtime service account."
  type        = string
  default     = "Terceiro Gestor Frontend"
}

variable "backend_image_tag" {
  description = "Backend image tag deployed to Cloud Run."
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  description = "Frontend image tag deployed to Cloud Run."
  type        = string
  default     = "latest"
}

variable "web_url" {
  description = "Public base URL used by frontend and backend."
  type        = string
}

variable "frontend_public_api_url" {
  description = "Public API URL baked into the frontend build contract. Leave empty to default runtime references to the backend Cloud Run URL."
  type        = string
  default     = ""
}

variable "gcs_public_base_url" {
  description = "Optional CDN or public base URL for public bucket assets."
  type        = string
  default     = ""
}

variable "timezone" {
  description = "Shared timezone used across services."
  type        = string
  default     = "America/Sao_Paulo"
}

variable "gcs_signed_url_ttl_sensitive" {
  description = "Signed URL TTL in seconds for sensitive documents."
  type        = number
  default     = 300
}

variable "gcs_signed_url_ttl_medium" {
  description = "Signed URL TTL in seconds for medium-sensitivity documents."
  type        = number
  default     = 1800
}

variable "gcs_signed_url_ttl_low" {
  description = "Signed URL TTL in seconds for low-sensitivity documents."
  type        = number
  default     = 3600
}

variable "backend_extra_env_vars" {
  description = "Additional plain env vars injected into the backend Cloud Run service."
  type        = map(string)
  default     = {}
}

variable "frontend_extra_env_vars" {
  description = "Additional plain env vars injected into the frontend Cloud Run service."
  type        = map(string)
  default     = {}
}

variable "backend_secret_env_vars" {
  description = "Secret-backed env vars injected into the backend Cloud Run service."
  type = map(object({
    secret  = string
    version = string
  }))
  default = {
    DATABASE_URL = {
      secret  = "database-url"
      version = "latest"
    }
    JWT_SECRET = {
      secret  = "jwt-secret"
      version = "latest"
    }
    PII_MASTER_KEY = {
      secret  = "pii-master-key"
      version = "latest"
    }
    TOTP_ENCRYPTION_KEY = {
      secret  = "totp-encryption-key"
      version = "latest"
    }
    SMTP_PASS = {
      secret  = "smtp-password"
      version = "latest"
    }
    GOOGLE_OAUTH_CLIENT_SECRET = {
      secret  = "google-oauth-client-secret"
      version = "latest"
    }
    MICROSOFT_OAUTH_CLIENT_SECRET = {
      secret  = "microsoft-oauth-client-secret"
      version = "latest"
    }
  }

  validation {
    condition = alltrue([
      for secret_ref in values(var.backend_secret_env_vars) : contains(var.secret_names, secret_ref.secret)
    ])
    error_message = "Each backend_secret_env_vars secret must also exist in secret_names."
  }
}

variable "backend_service_account_id" {
  description = "Account ID for the backend runtime service account."
  type        = string
  default     = "terceirogestor-backend"
}

variable "backend_service_account_display_name" {
  description = "Display name for the backend runtime service account."
  type        = string
  default     = "Terceiro Gestor Backend"
}

variable "public_bucket_name" {
  description = "Cloud Storage bucket for public assets such as avatars, logos, and action photos."
  type        = string
}

variable "private_bucket_name" {
  description = "Cloud Storage bucket for protected and sensitive files served through signed URLs."
  type        = string
}

variable "public_bucket_location" {
  description = "Location for the public bucket."
  type        = string
  default     = "US-CENTRAL1"
}

variable "private_bucket_location" {
  description = "Location for the private bucket."
  type        = string
  default     = "US-CENTRAL1"
}

variable "public_bucket_force_destroy" {
  description = "Whether the public bucket can be force destroyed. Keep false in production."
  type        = bool
  default     = false
}

variable "private_bucket_force_destroy" {
  description = "Whether the private bucket can be force destroyed. Keep false in production."
  type        = bool
  default     = false
}

variable "secret_names" {
  description = "Secret Manager secret names to provision for the application contract."
  type        = list(string)
  default = [
    "jwt-secret",
    "database-url",
    "pii-master-key",
    "totp-encryption-key",
    "smtp-password",
    "google-oauth-client-secret",
    "microsoft-oauth-client-secret"
  ]
}