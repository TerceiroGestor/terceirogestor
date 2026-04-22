variable "project_id" {
  description = "Target GCP project ID."
  type        = string
}

variable "region" {
  description = "Region where the Cloud Run service is deployed."
  type        = string
}

variable "service_name" {
  description = "Cloud Run service name."
  type        = string
}

variable "image" {
  description = "Container image reference."
  type        = string
}

variable "service_account_email" {
  description = "Service account used by the Cloud Run revision."
  type        = string
  default     = null
}

variable "ingress" {
  description = "Cloud Run ingress mode."
  type        = string
  default     = "INGRESS_TRAFFIC_ALL"
}

variable "allow_unauthenticated" {
  description = "Whether the service should grant run.invoker to allUsers."
  type        = bool
  default     = false
}

variable "container_port" {
  description = "Application port exposed by the container."
  type        = number
  default     = 8080
}

variable "cpu" {
  description = "CPU limit for the container."
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Memory limit for the container."
  type        = string
  default     = "512Mi"
}

variable "timeout_seconds" {
  description = "Request timeout in seconds."
  type        = number
  default     = 300
}

variable "min_instance_count" {
  description = "Minimum number of Cloud Run instances."
  type        = number
  default     = 0
}

variable "max_instance_count" {
  description = "Maximum number of Cloud Run instances."
  type        = number
  default     = 20
}

variable "env_vars" {
  description = "Plain runtime environment variables."
  type        = map(string)
  default     = {}
}

variable "secret_env_vars" {
  description = "Secret-backed runtime environment variables."
  type = map(object({
    secret  = string
    version = string
  }))
  default = {}
}

variable "cloud_sql_instances" {
  description = "Cloud SQL instances mounted at /cloudsql."
  type        = list(string)
  default     = []
}

variable "labels" {
  description = "Labels applied to the Cloud Run service."
  type        = map(string)
  default     = {}
}
