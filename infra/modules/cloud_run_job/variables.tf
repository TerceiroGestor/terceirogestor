variable "project_id" {
  description = "Target GCP project ID."
  type        = string
}

variable "region" {
  description = "Region where the Cloud Run job is deployed."
  type        = string
}

variable "job_name" {
  description = "Cloud Run job name."
  type        = string
}

variable "image" {
  description = "Container image reference."
  type        = string
}

variable "service_account_email" {
  description = "Service account used by the Cloud Run job execution."
  type        = string
  default     = null
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
  description = "Execution timeout in seconds."
  type        = number
  default     = 900
}

variable "max_retries" {
  description = "Maximum retries for failed tasks."
  type        = number
  default     = 0
}

variable "task_count" {
  description = "Number of tasks to run."
  type        = number
  default     = 1
}

variable "parallelism" {
  description = "Number of tasks that may run in parallel."
  type        = number
  default     = 1
}

variable "command" {
  description = "Optional container command override."
  type        = list(string)
  default     = []
}

variable "args" {
  description = "Optional container arguments."
  type        = list(string)
  default     = []
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
  description = "Labels applied to the Cloud Run job."
  type        = map(string)
  default     = {}
}
