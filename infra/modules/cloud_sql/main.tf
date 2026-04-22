resource "google_sql_database_instance" "postgres" {
  project             = var.project_id
  name                = var.instance_name
  region              = var.region
  database_version    = var.database_version
  deletion_protection = var.deletion_protection

  lifecycle {
    precondition {
      condition     = var.backup_enabled || !var.point_in_time_recovery_enabled
      error_message = "point_in_time_recovery_enabled requires backup_enabled=true."
    }
  }

  settings {
    edition           = var.edition
    tier              = var.tier
    disk_type         = var.disk_type
    disk_size         = var.disk_size_gb
    availability_type = var.availability_type
    user_labels       = var.labels

    backup_configuration {
      enabled                        = var.backup_enabled
      point_in_time_recovery_enabled = var.point_in_time_recovery_enabled
    }

    ip_configuration {
      ipv4_enabled = var.ipv4_enabled
    }
  }
}

resource "google_sql_database" "app" {
  project  = var.project_id
  name     = var.database_name
  instance = google_sql_database_instance.postgres.name
}
