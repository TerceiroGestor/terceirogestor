variable "project_id" {
  description = "Target GCP project ID."
  type        = string
}

variable "name" {
  description = "Base name for load balancer resources."
  type        = string
}

variable "region" {
  description = "Region of the Cloud Run services referenced by the serverless NEGs."
  type        = string
}

variable "frontend_service_name" {
  description = "Frontend Cloud Run service name."
  type        = string
}

variable "backend_service_name" {
  description = "Backend Cloud Run service name."
  type        = string
}

variable "domains" {
  description = "Optional public domains used for the HTTPS certificate."
  type        = list(string)
  default     = []
}

variable "labels" {
  description = "Labels used where supported."
  type        = map(string)
  default     = {}
}
