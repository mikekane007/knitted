# Deploys the NestJS API to Google Cloud Run with scale-to-zero free-tier settings.
# Usage (from the backend folder):  .\deploy-cloudrun.ps1 -Project <gcp-project-id>
param(
    [Parameter(Mandatory = $true)][string]$Project,
    # us-central1 keeps Cloud Run, Cloud Build and the source-upload bucket in free-tier regions
    [string]$Region = "us-central1",
    [string]$Service = "knitted-api"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path "cloudrun.env.yaml")) {
    throw "cloudrun.env.yaml not found. Copy cloudrun.env.example.yaml to cloudrun.env.yaml and fill it in."
}

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project $Project

# Free-tier guards:
#   min-instances 0  -> scales to zero, nothing billed while idle
#   cpu-throttling   -> request-based billing (CPU only counted while serving requests)
#   max-instances 2  -> caps worst-case usage
gcloud run deploy $Service `
    --source . `
    --project $Project `
    --region $Region `
    --allow-unauthenticated `
    --min-instances 0 `
    --max-instances 2 `
    --cpu 1 `
    --memory 512Mi `
    --cpu-throttling `
    --timeout 300 `
    --env-vars-file cloudrun.env.yaml

# Keep only the 2 newest images so Artifact Registry stays under its 0.5 GB free storage
$policyFile = Join-Path $env:TEMP "knitted-ar-cleanup.json"
@'
[
  { "name": "keep-latest-2", "action": { "type": "Keep" }, "mostRecentVersions": { "keepCount": 2 } },
  { "name": "delete-older",  "action": { "type": "Delete" }, "condition": { "tagState": "any", "olderThan": "1d" } }
]
'@ | Set-Content -Path $policyFile -Encoding ascii

gcloud artifacts repositories set-cleanup-policies cloud-run-source-deploy `
    --project $Project `
    --location $Region `
    --policy $policyFile `
    --no-dry-run

Write-Host ""
Write-Host "Service URL:"
gcloud run services describe $Service --project $Project --region $Region --format "value(status.url)"
