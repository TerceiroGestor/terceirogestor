output "secret_names" {
  description = "Names of provisioned secrets."
  value       = [for secret in google_secret_manager_secret.secrets : secret.secret_id]
}