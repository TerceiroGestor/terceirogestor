variable "project_id" {
  description = "Target GCP project ID."
  type        = string
}

variable "services" {
  description = "APIs that must be enabled in the project."
  type        = list(string)
}