variable "project_id" {
  description = "Target GCP project ID."
  type        = string
}

variable "region" {
  description = "Region where the Docker repository will be created."
  type        = string
}

variable "repository_id" {
  description = "Artifact Registry repository ID."
  type        = string
}

variable "description" {
  description = "Artifact Registry repository description."
  type        = string
  default     = "Application Docker images"
}
