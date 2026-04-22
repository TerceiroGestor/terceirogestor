variable "project_id" {
  description = "Target GCP project ID."
  type        = string
}

variable "secret_names" {
  description = "Secrets to provision. Secret versions are managed outside of this initial module."
  type        = list(string)
}

variable "secret_accessor_member" {
  description = "IAM member allowed to access the provisioned secrets."
  type        = string
}

variable "labels" {
  description = "Common labels for managed resources."
  type        = map(string)
  default     = {}
}