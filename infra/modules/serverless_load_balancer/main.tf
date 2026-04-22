locals {
  use_https = length(var.domains) > 0
}

resource "google_compute_global_address" "this" {
  project = var.project_id
  name    = "${var.name}-ip"
}

resource "google_compute_region_network_endpoint_group" "frontend" {
  project               = var.project_id
  name                  = "${var.name}-frontend-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = var.frontend_service_name
  }
}

resource "google_compute_region_network_endpoint_group" "backend" {
  project               = var.project_id
  name                  = "${var.name}-backend-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = var.backend_service_name
  }
}

resource "google_compute_backend_service" "frontend" {
  project               = var.project_id
  name                  = "${var.name}-frontend-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.frontend.id
  }
}

resource "google_compute_backend_service" "backend" {
  project               = var.project_id
  name                  = "${var.name}-api-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.backend.id
  }
}

resource "google_compute_url_map" "https" {
  project         = var.project_id
  name            = "${var.name}-url-map"
  default_service = google_compute_backend_service.frontend.id

  host_rule {
    hosts        = local.use_https ? var.domains : ["*"]
    path_matcher = "app"
  }

  path_matcher {
    name            = "app"
    default_service = google_compute_backend_service.frontend.id

    route_rules {
      priority = 10
      service  = google_compute_backend_service.backend.id

      match_rules {
        prefix_match = "/api/"
      }

      route_action {
        url_rewrite {
          path_prefix_rewrite = "/"
        }
      }
    }

    route_rules {
      priority = 11
      service  = google_compute_backend_service.backend.id

      match_rules {
        full_path_match = "/api"
      }

      route_action {
        url_rewrite {
          path_prefix_rewrite = "/"
        }
      }
    }
  }
}

resource "google_compute_url_map" "http_redirect" {
  count = local.use_https ? 1 : 0

  project = var.project_id
  name    = "${var.name}-http-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "this" {
  project = var.project_id
  name    = "${var.name}-http-proxy"
  url_map = local.use_https ? google_compute_url_map.http_redirect[0].id : google_compute_url_map.https.id
}

resource "google_compute_global_forwarding_rule" "http" {
  project               = var.project_id
  name                  = "${var.name}-http"
  target                = google_compute_target_http_proxy.this.id
  ip_address            = google_compute_global_address.this.id
  port_range            = "80"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

resource "google_compute_managed_ssl_certificate" "this" {
  count = local.use_https ? 1 : 0

  project = var.project_id
  name    = "${var.name}-managed-cert"

  managed {
    domains = var.domains
  }
}

resource "google_compute_target_https_proxy" "this" {
  count = local.use_https ? 1 : 0

  project          = var.project_id
  name             = "${var.name}-https-proxy"
  url_map          = google_compute_url_map.https.id
  ssl_certificates = [google_compute_managed_ssl_certificate.this[0].id]
}

resource "google_compute_global_forwarding_rule" "https" {
  count = local.use_https ? 1 : 0

  project               = var.project_id
  name                  = "${var.name}-https"
  target                = google_compute_target_https_proxy.this[0].id
  ip_address            = google_compute_global_address.this.id
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
