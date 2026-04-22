output "enabled_services" {
  description = "APIs enabled by this module."
  value       = [for service in google_project_service.services : service.service]
}