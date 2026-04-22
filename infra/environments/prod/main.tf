locals {
  common_labels = {
    application = "terceirogestor"
    environment = var.environment
    managed_by  = "terraform"
  }

  required_services = [
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "sqladmin.googleapis.com",
    "storage.googleapis.com"
  ]

  backend_project_roles = [
    "roles/cloudsql.client",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectAdmin"
  ]

  backend_service_account_roles = [
    "roles/iam.serviceAccountTokenCreator"
  ]

  frontend_project_roles = [
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ]

  backend_image = "${module.artifact_registry.repository_url}/terceirogestor-backend:${var.backend_image_tag}"
  frontend_image = "${module.artifact_registry.repository_url}/terceirogestor-frontend:${var.frontend_image_tag}"
  frontend_public_api_url = trimspace(var.frontend_public_api_url) != "" ? trimspace(var.frontend_public_api_url) : "/api"

  backend_env_vars = merge({
    APP_NAME                     = "Terceiro Gestor"
    CLOUD_SQL_CONNECTION_NAME    = module.cloud_sql.connection_name
    GCP_PROJECT_ID               = var.project_id
    GCS_PRIVATE_BUCKET_NAME      = var.private_bucket_name
    GCS_PUBLIC_BASE_URL          = var.gcs_public_base_url
    GCS_PUBLIC_BUCKET_NAME       = var.public_bucket_name
    GCS_SIGNED_URL_TTL_LOW       = tostring(var.gcs_signed_url_ttl_low)
    GCS_SIGNED_URL_TTL_MEDIUM    = tostring(var.gcs_signed_url_ttl_medium)
    GCS_SIGNED_URL_TTL_SENSITIVE = tostring(var.gcs_signed_url_ttl_sensitive)
    RUN_DB_PRESTART              = "false"
    TZ                           = var.timezone
    WEB_URL                      = var.web_url
  }, var.backend_extra_env_vars)

  frontend_env_vars = merge({
    API_INTERNAL_URL           = module.backend_service.uri
    NEXT_PUBLIC_API_URL        = local.frontend_public_api_url
    NEXT_PUBLIC_PWA_FORCE_INSTALL = "0"
    NEXT_PUBLIC_PWA_SW         = "0"
    TZ                         = var.timezone
    WEB_URL                    = var.web_url
  }, var.frontend_extra_env_vars)

  migration_job_env_vars = merge(local.backend_env_vars, {
    RUN_DB_PRESTART = "false"
  })
}

module "project_services" {
  source   = "../../modules/project_services"
  project_id = var.project_id
  services = local.required_services
}

module "artifact_registry" {
  source = "../../modules/artifact_registry"

  project_id    = var.project_id
  region        = var.region
  repository_id = var.artifact_registry_repository_id
  description   = var.artifact_registry_repository_description

  depends_on = [module.project_services]
}

module "cloud_sql" {
  source = "../../modules/cloud_sql"

  project_id                       = var.project_id
  region                           = var.region
  instance_name                    = var.cloud_sql_instance_name
  database_name                    = var.cloud_sql_database_name
  database_version                 = var.cloud_sql_database_version
  edition                          = var.cloud_sql_edition
  tier                             = var.cloud_sql_tier
  disk_type                        = var.cloud_sql_disk_type
  disk_size_gb                     = var.cloud_sql_disk_size_gb
  availability_type                = var.cloud_sql_availability_type
  ipv4_enabled                     = var.cloud_sql_ipv4_enabled
  backup_enabled                   = var.cloud_sql_backup_enabled
  point_in_time_recovery_enabled   = var.cloud_sql_point_in_time_recovery_enabled
  deletion_protection              = var.cloud_sql_deletion_protection
  labels                           = local.common_labels

  depends_on = [module.project_services]
}

module "backend_service_account" {
  source = "../../modules/service_account"

  project_id    = var.project_id
  account_id    = var.backend_service_account_id
  display_name  = var.backend_service_account_display_name
  project_roles = local.backend_project_roles
  service_account_roles = local.backend_service_account_roles
}

module "frontend_service_account" {
  source = "../../modules/service_account"

  project_id    = var.project_id
  account_id    = var.frontend_service_account_id
  display_name  = var.frontend_service_account_display_name
  project_roles = local.frontend_project_roles
}

module "storage_buckets" {
  source = "../../modules/storage_buckets"

  project_id                    = var.project_id
  public_bucket_name            = var.public_bucket_name
  private_bucket_name           = var.private_bucket_name
  public_bucket_location        = var.public_bucket_location
  private_bucket_location       = var.private_bucket_location
  public_bucket_force_destroy   = var.public_bucket_force_destroy
  private_bucket_force_destroy  = var.private_bucket_force_destroy
  backend_service_account_email = module.backend_service_account.email
  labels                        = local.common_labels

  depends_on = [module.project_services]
}

module "secrets" {
  source = "../../modules/secret_manager"

  project_id                    = var.project_id
  secret_names                  = var.secret_names
  secret_accessor_member        = "serviceAccount:${module.backend_service_account.email}"
  labels                        = local.common_labels

  depends_on = [module.project_services]
}

module "backend_service" {
  source = "../../modules/cloud_run_service"

  project_id             = var.project_id
  region                 = var.region
  service_name           = var.backend_service_name
  image                  = local.backend_image
  service_account_email  = module.backend_service_account.email
  allow_unauthenticated  = var.backend_allow_unauthenticated
  container_port         = 8080
  cpu                    = "1"
  memory                 = "512Mi"
  timeout_seconds        = 300
  max_instance_count     = 20
  env_vars               = local.backend_env_vars
  secret_env_vars        = var.backend_secret_env_vars
  cloud_sql_instances    = [module.cloud_sql.connection_name]
  labels                 = local.common_labels

  depends_on = [module.cloud_sql, module.secrets, module.backend_service_account]
}

module "frontend_service" {
  source = "../../modules/cloud_run_service"

  project_id            = var.project_id
  region                = var.region
  service_name          = var.frontend_service_name
  image                 = local.frontend_image
  service_account_email = module.frontend_service_account.email
  allow_unauthenticated = true
  container_port        = 8080
  cpu                   = "1"
  memory                = "512Mi"
  timeout_seconds       = 120
  max_instance_count    = 20
  env_vars              = local.frontend_env_vars
  labels                = local.common_labels

  depends_on = [module.backend_service, module.frontend_service_account]
}

module "migration_job" {
  count  = var.migration_job_enabled ? 1 : 0
  source = "../../modules/cloud_run_job"

  project_id            = var.project_id
  region                = var.region
  job_name              = var.migration_job_name
  image                 = local.backend_image
  service_account_email = module.backend_service_account.email
  cpu                   = "1"
  memory                = "512Mi"
  timeout_seconds       = var.migration_job_timeout_seconds
  command               = ["sh"]
  args = [
    "-c",
    "node scripts/ensure-database.js && if find prisma/migrations -mindepth 1 -maxdepth 1 -type d | grep -q .; then npx prisma migrate deploy; else echo '[cloud-run-job] no prisma migrations found; refusing to run db push in production' && exit 1; fi",
  ]
  env_vars              = local.migration_job_env_vars
  secret_env_vars       = var.backend_secret_env_vars
  cloud_sql_instances   = [module.cloud_sql.connection_name]
  labels                = local.common_labels

  depends_on = [module.cloud_sql, module.secrets, module.backend_service_account]
}

module "load_balancer" {
  count  = var.load_balancer_enabled ? 1 : 0
  source = "../../modules/serverless_load_balancer"

  project_id           = var.project_id
  name                 = var.load_balancer_name
  region               = var.region
  frontend_service_name = module.frontend_service.name
  backend_service_name  = module.backend_service.name
  domains              = var.load_balancer_domains
  labels               = local.common_labels

  depends_on = [module.backend_service, module.frontend_service]
}