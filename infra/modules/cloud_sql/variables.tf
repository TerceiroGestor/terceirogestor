variable "project_id" {
  description = "Target GCP project ID."
  type        = string
}

variable "region" {
  description = "Primary region for the Cloud SQL instance."
  type        = string
}

variable "instance_name" {
  description = "Cloud SQL instance name."
  type        = string
}

variable "database_name" {
  description = "Application database name created inside the instance."
  type        = string
}

variable "database_version" {
  description = "Cloud SQL database engine version."
  type        = string
  default     = "POSTGRES_16"
}

variable "edition" {
  description = "Cloud SQL edition. Use ENTERPRISE for custom tiers like db-custom-* or ENTERPRISE_PLUS for perf-optimized tiers."
  type        = string
  default     = "ENTERPRISE"
}

variable "tier" {
  description = "Cloud SQL machine tier."
  type        = string
  default     = "db-custom-1-3840"
}

variable "disk_type" {
  description = "Cloud SQL disk type."
  type        = string
  default     = "PD_HDD"
}

variable "disk_size_gb" {
  description = "Cloud SQL disk size in GB."
  type        = number
  default     = 20
}

variable "availability_type" {
  description = "Cloud SQL availability type. Use REGIONAL for higher availability."
  type        = string
  default     = "ZONAL"
}

variable "ipv4_enabled" {
  description = "Whether to enable public IPv4 on the instance."
  type        = bool
  default     = true
}

variable "backup_enabled" {
  description = "Whether automated backups are enabled."
  type        = bool
  default     = true
}

variable "point_in_time_recovery_enabled" {
  description = "Whether point-in-time recovery is enabled."
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Whether Terraform should protect the instance from deletion."
  type        = bool
  default     = true
}

variable "labels" {
  description = "Labels applied to supported Cloud SQL resources."
  type        = map(string)
  default     = {}
}
