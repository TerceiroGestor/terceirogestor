provider "google" {
  project      = var.project_id
  region       = var.region
  access_token = var.gcp_access_token != "" ? var.gcp_access_token : null
}