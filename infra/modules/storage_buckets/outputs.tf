output "public_bucket_name" {
  description = "Public bucket name."
  value       = google_storage_bucket.public.name
}

output "private_bucket_name" {
  description = "Private bucket name."
  value       = google_storage_bucket.private.name
}