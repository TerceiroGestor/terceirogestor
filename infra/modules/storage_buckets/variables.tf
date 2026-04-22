variable "project_id" {
  description = "Target GCP project ID."
  type        = string
}

variable "public_bucket_name" {
  description = "Name of the public bucket."
  type        = string
}

variable "private_bucket_name" {
  description = "Name of the private bucket."
  type        = string
}

variable "public_bucket_location" {
  description = "Location of the public bucket."
  type        = string
}

variable "private_bucket_location" {
  description = "Location of the private bucket."
  type        = string
}

variable "public_bucket_force_destroy" {
  description = "Whether public bucket can be force destroyed."
  type        = bool
  default     = false
}

variable "private_bucket_force_destroy" {
  description = "Whether private bucket can be force destroyed."
  type        = bool
  default     = false
}

variable "backend_service_account_email" {
  description = "Backend runtime service account email."
  type        = string
}

variable "labels" {
  description = "Common labels for managed resources."
  type        = map(string)
  default     = {}
}