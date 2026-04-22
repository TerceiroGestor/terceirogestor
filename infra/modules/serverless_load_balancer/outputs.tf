output "ip_address" {
  description = "Global IP address reserved for the load balancer."
  value       = google_compute_global_address.this.address
}

output "frontend_url" {
  description = "Primary frontend URL exposed by the load balancer."
  value       = length(var.domains) > 0 ? "https://${var.domains[0]}" : "http://${google_compute_global_address.this.address}"
}

output "api_base_path" {
  description = "API base path served by the load balancer."
  value       = "/api"
}
