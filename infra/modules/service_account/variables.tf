variable "project_id" {
  description = "Target GCP project ID."
  type        = string
}

variable "account_id" {
  description = "Service account ID."
  type        = string
}

variable "display_name" {
  description = "Service account display name."
  type        = string
}

variable "project_roles" {
  description = "Project-level IAM roles granted to the service account."
  type        = list(string)
  default     = []
}

variable "service_account_roles" {
  description = "Roles granted on the service account resource itself."
  type        = list(string)
  default     = []
}