# Infrastructure

This directory is the source of truth for GCP infrastructure needed to run the application locally with strong parity to Cloud Run production.

## Goals

- Keep application code identical across local and production environments.
- Provision GCP resources with repeatable configuration.
- Minimize manual setup drift between developers and deployments.

## Structure

```text
infra/
  environments/
    prod/
      versions.tf
      providers.tf
      variables.tf
      main.tf
      outputs.tf
      terraform.tfvars.example
  modules/
    artifact_registry/
    cloud_sql/
    cloud_run_job/
    cloud_run_service/
    project_services/
    serverless_load_balancer/
    service_account/
    storage_buckets/
    secret_manager/
```

## Scope of the first implementation slice

The initial scaffold provisions the shared platform foundation:

- required GCP APIs
- Artifact Registry Docker repository
- Cloud SQL PostgreSQL instance and application database
- backend service account
- frontend service account
- public and private Cloud Storage buckets
- Secret Manager secret resources
- Cloud Run backend and frontend services
- Cloud Run migration job
- Optional global serverless load balancer with `/api` routing

CI/CD polish and remote Terraform state should be added in the next slices on top of this foundation.

## Usage

1. Copy `terraform.tfvars.example` to `terraform.tfvars` inside the target environment.
2. Fill project, region, bucket names, and secret names.
3. Run Terraform from the environment folder.

Example:

```bash
cd infra/environments/prod
terraform init
terraform plan
terraform apply
```

## State strategy

Recommended:

- local state only for initial bootstrap
- remote backend after bootstrap, preferably GCS with state locking strategy agreed by the team

## Notes

- Local development should continue using root `.env` plus Docker for PostgreSQL.
- Production should use Secret Manager and Cloud Run service accounts instead of JSON credentials.
- Buckets are intentionally split into public and private resources to match the application contract already implemented in the backend.
- Database users and secret versions are intentionally left for a later slice so credentials can be finalized without baking sensitive values into Terraform prematurely.
- Frontend images still need to be built with the intended `NEXT_PUBLIC_API_URL` because that value is part of the frontend build contract, even though the Cloud Run service also exposes the runtime URL configuration.
- Secret versions can be published separately with [scripts/gcp/gcp-secrets.ps1](./scripts/gcp/gcp-secrets.ps1) after Terraform creates the Secret Manager resources.
- When the load balancer is enabled, build the frontend with `NEXT_PUBLIC_API_URL=/api` to match the routed public contract.

## Troubleshooting (LB + API)

If public API calls fail after a deploy, use this checklist in order:

1. Check certificate status:

```bash
gcloud compute ssl-certificates describe terceirogestor-managed-cert --global --format="yaml(managed.status,managed.domainStatus)"
```

1. Confirm DNS points to the LB IP for all required hosts (`@` and `www`) and remove stale AAAA records if they conflict.

1. Validate URL map routing and rewrite for `/api`:

```bash
gcloud compute url-maps describe terceirogestor-url-map --format="yaml(hostRules,pathMatchers,defaultService)"
```

With the current contract, `/api/*` must be routed to backend and rewritten to `/*`.

1. Validate endpoint using the public domain (not Cloud Run frontend direct URL):

```bash
curl -i https://terceirogestor.org/api/health/detailed
```

1. Validate auth refresh with `POST` (do not use `HEAD`/`GET` for this route):

```bash
curl -i -X POST -H "Content-Type: application/json" --data-raw "{}" https://terceirogestor.org/api/t/nova-instituicao/auth/refresh
```

1. If using `scripts/gcp/gcp-update.ps1`, keep `TF_VAR_gcp_access_token` available (the script now auto-populates it from `gcloud auth print-access-token` when missing).
