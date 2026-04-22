resource "google_service_account" "this" {
  project      = var.project_id
  account_id   = var.account_id
  display_name = var.display_name
}

resource "google_project_iam_member" "project_roles" {
  for_each = toset(var.project_roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.this.email}"
}

resource "google_service_account_iam_member" "self_roles" {
  for_each = toset(var.service_account_roles)

  service_account_id = google_service_account.this.name
  role               = each.value
  member             = "serviceAccount:${google_service_account.this.email}"
}