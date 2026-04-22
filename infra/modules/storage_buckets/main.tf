resource "google_storage_bucket" "public" {
  project                     = var.project_id
  name                        = var.public_bucket_name
  location                    = var.public_bucket_location
  force_destroy               = var.public_bucket_force_destroy
  uniform_bucket_level_access = true
  public_access_prevention    = "inherited"
  labels                      = var.labels

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 30
    }

    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket" "private" {
  project                     = var.project_id
  name                        = var.private_bucket_name
  location                    = var.private_bucket_location
  force_destroy               = var.private_bucket_force_destroy
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = var.labels

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 5
    }

    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket_iam_member" "backend_public_admin" {
  bucket = google_storage_bucket.public.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.backend_service_account_email}"
}

resource "google_storage_bucket_iam_member" "backend_public_bucket_reader" {
  bucket = google_storage_bucket.public.name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${var.backend_service_account_email}"
}

resource "google_storage_bucket_iam_member" "public_object_viewer" {
  bucket = google_storage_bucket.public.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_storage_bucket_iam_member" "backend_private_admin" {
  bucket = google_storage_bucket.private.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.backend_service_account_email}"
}

resource "google_storage_bucket_iam_member" "backend_private_bucket_reader" {
  bucket = google_storage_bucket.private.name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${var.backend_service_account_email}"
}