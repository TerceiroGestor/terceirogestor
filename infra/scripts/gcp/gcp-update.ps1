param(
    [ValidateSet('backend', 'frontend', 'both')]
    [string]$Target = 'both',

    [string]$Tag,

    [string]$EnvironmentDir = 'infra/environments/prod',

    [string]$FrontendPublicApiUrl = '/api',

    [switch]$SkipBuild,

    [switch]$SkipTerraform,

    [switch]$SkipValidation
)

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Get-RepoRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
}

function Resolve-CommandPath {
    param([string]$Name)

    $candidates = Get-Command $Name -All -ErrorAction SilentlyContinue | ForEach-Object {
        $resolvedPath = if ($_.Path) {
            $_.Path
        }
        elseif ($_.Source -and (Test-Path $_.Source)) {
            $_.Source
        }
        else {
            $null
        }

        if (-not $resolvedPath) {
            return
        }

        $extension = [System.IO.Path]::GetExtension($resolvedPath).ToLowerInvariant()
        $score = switch ($extension) {
            '.exe' { 0 }
            '.cmd' { 1 }
            '.bat' { 2 }
            '.ps1' { 3 }
            default { 4 }
        }

        [PSCustomObject]@{
            Path  = $resolvedPath
            Score = $score
        }
    } | Sort-Object Score, Path

    $choice = $candidates | Select-Object -First 1
    if (-not $choice) {
        throw "Comando obrigatorio nao encontrado: $Name"
    }

    return $choice.Path
}

function Invoke-External {
    param(
        [string]$FilePath,
        [string[]]$ArgumentList,
        [string]$WorkingDirectory
    )

    Write-Host ("> " + $FilePath + " " + ($ArgumentList -join ' ')) -ForegroundColor DarkGray

    Push-Location $WorkingDirectory
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = & $FilePath @ArgumentList 2>&1 | ForEach-Object { "$($_)" }
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
        Pop-Location
    }

    if ($output) {
        $outputText = ($output | Out-String).TrimEnd()
        if ($outputText) {
            Write-Host $outputText
        }
    }

    if ($exitCode -ne 0) {
        throw ("Comando falhou com exit code {0}: {1} {2}" -f $exitCode, $FilePath, ($ArgumentList -join ' '))
    }

    return ($output | Out-String)
}

function Get-TfvarsValue {
    param(
        [string]$TfvarsPath,
        [string]$Key
    )

    $pattern = '^(\s*' + [regex]::Escape($Key) + '\s*=\s*")([^"]*)("\s*)$'
    $match = Select-String -Path $TfvarsPath -Pattern $pattern | Select-Object -First 1
    if (-not $match) {
        throw "Chave '$Key' nao encontrada em $TfvarsPath"
    }

    return $match.Matches[0].Groups[2].Value
}

function Set-TfvarsValue {
    param(
        [string]$TfvarsPath,
        [string]$Key,
        [string]$Value
    )

    $content = Get-Content -Raw -Path $TfvarsPath
    $pattern = '^(\s*' + [regex]::Escape($Key) + '\s*=\s*")([^"]*)("\s*)$'
    $match = [regex]::Match($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    if (-not $match.Success) {
        throw "Chave '$Key' nao encontrada em $TfvarsPath"
    }

    if ($match.Groups[2].Value -eq $Value) {
        return
    }

    $regex = [regex]::new($pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    $updated = $regex.Replace($content, {
        param($match)
        return $match.Groups[1].Value + $Value + $match.Groups[3].Value
    })

    if ($updated -eq $content) {
        throw "Falha ao atualizar '$Key' em $TfvarsPath"
    }

    [System.IO.File]::WriteAllText($TfvarsPath, $updated, [System.Text.UTF8Encoding]::new($false))
}

function Get-JsonOutput {
    param(
        [string]$FilePath,
        [string[]]$ArgumentList,
        [string]$WorkingDirectory
    )

    $raw = Invoke-External -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory
    return $raw | ConvertFrom-Json
}

function Invoke-CloudRunJob {
    param(
        [string]$GcloudPath,
        [string]$ProjectId,
        [string]$Region,
        [string]$JobName,
        [string]$WorkingDirectory
    )

    Write-Step "Executando Cloud Run Job: $JobName"
    Invoke-External -FilePath $GcloudPath -ArgumentList @(
        'run', 'jobs', 'execute', $JobName,
        '--project', $ProjectId,
        '--region', $Region,
        '--wait'
    ) -WorkingDirectory $WorkingDirectory | Out-Null
}

function Invoke-HealthCheck {
    param(
        [string]$CheckName,
        [string]$Url,
        [string]$Method = 'GET'
    )

    try {
        [PSCustomObject]@{
            label      = $CheckName
            url        = $Url
            statusCode = [int](Invoke-WebRequest -Uri $Url -Method $Method -UseBasicParsing).StatusCode
            ok         = $true
            body       = ''
        }
    }
    catch {
        $response = $_.Exception.Response
        $statusCode = if ($response) { [int]$response.StatusCode } else { 0 }
        $body = ''

        if ($response -and $response.GetResponseStream()) {
            $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
            try {
                $body = $reader.ReadToEnd()
            }
            finally {
                $reader.Dispose()
            }
        }

        return [PSCustomObject]@{
            label      = $CheckName
            url        = $Url
            statusCode = $statusCode
            ok         = $false
            body       = $body
        }
    }
}

$repoRoot = Get-RepoRoot
$envDirAbsolute = Join-Path $repoRoot $EnvironmentDir
$tfvarsPath = Join-Path $envDirAbsolute 'terraform.tfvars'

$dockerCommand = Resolve-CommandPath -Name 'docker'
$gcloudCommand = Resolve-CommandPath -Name 'gcloud'
$terraformCommand = Resolve-CommandPath -Name 'terraform'

if (-not $Tag) {
    $Tag = Get-Date -Format 'yyyyMMdd-HHmmss'
}

$projectId = Get-TfvarsValue -TfvarsPath $tfvarsPath -Key 'project_id'
$region = Get-TfvarsValue -TfvarsPath $tfvarsPath -Key 'region'
$repositoryId = Get-TfvarsValue -TfvarsPath $tfvarsPath -Key 'artifact_registry_repository_id'

$backendImage = "$region-docker.pkg.dev/$projectId/$repositoryId/terceirogestor-backend:$Tag"
$frontendImage = "$region-docker.pkg.dev/$projectId/$repositoryId/terceirogestor-frontend:$Tag"

Write-Host "Projeto: $projectId"
Write-Host "Regiao:  $region"
Write-Host "Repo:    $repositoryId"
Write-Host "Target:  $Target"
Write-Host "Tag:     $Tag"

Invoke-External -FilePath $gcloudCommand -ArgumentList @('config', 'set', 'project', $projectId) -WorkingDirectory $repoRoot | Out-Null
Invoke-External -FilePath $gcloudCommand -ArgumentList @('auth', 'configure-docker', "$region-docker.pkg.dev", '--quiet') -WorkingDirectory $repoRoot | Out-Null

if (-not $env:TF_VAR_gcp_access_token) {
    $token = (Invoke-External -FilePath $gcloudCommand -ArgumentList @('auth', 'print-access-token') -WorkingDirectory $repoRoot).Trim()
    if (-not $token) {
        throw 'Falha ao obter access token do gcloud para TF_VAR_gcp_access_token.'
    }

    $env:TF_VAR_gcp_access_token = $token
    Write-Host 'TF_VAR_gcp_access_token configurado a partir do gcloud auth print-access-token.' -ForegroundColor DarkYellow
}

if (-not $SkipBuild) {
    if ($Target -in @('backend', 'both')) {
        Write-Step 'Build e push do backend'
        Invoke-External -FilePath $dockerCommand -ArgumentList @('build', '-t', $backendImage, '-f', 'backend/Dockerfile', 'backend') -WorkingDirectory $repoRoot | Out-Null
        Invoke-External -FilePath $dockerCommand -ArgumentList @('push', $backendImage) -WorkingDirectory $repoRoot | Out-Null
        Set-TfvarsValue -TfvarsPath $tfvarsPath -Key 'backend_image_tag' -Value $Tag
    }

    if ($Target -in @('frontend', 'both')) {
        Write-Step 'Build e push do frontend'
        Invoke-External -FilePath $dockerCommand -ArgumentList @('build', '--build-arg', "NEXT_PUBLIC_API_URL=$FrontendPublicApiUrl", '-t', $frontendImage, '-f', 'frontend/Dockerfile', 'frontend') -WorkingDirectory $repoRoot | Out-Null
        Invoke-External -FilePath $dockerCommand -ArgumentList @('push', $frontendImage) -WorkingDirectory $repoRoot | Out-Null
        Set-TfvarsValue -TfvarsPath $tfvarsPath -Key 'frontend_image_tag' -Value $Tag
        Set-TfvarsValue -TfvarsPath $tfvarsPath -Key 'frontend_public_api_url' -Value $FrontendPublicApiUrl
    }
}

if (-not $SkipTerraform) {
    Write-Step 'Terraform validate/apply'
    Invoke-External -FilePath $terraformCommand -ArgumentList @('validate', '-no-color') -WorkingDirectory $envDirAbsolute | Out-Null

    $terraformApplyArgs = @('apply', '-auto-approve', '-no-color', '-lock-timeout=10m')

    if ($Target -eq 'frontend') {
        # Frontend deploy should not reconcile unrelated infrastructure resources.
        $terraformApplyArgs += @('-target=module.frontend_service.google_cloud_run_v2_service.this')
    }
    elseif ($Target -eq 'backend') {
        # Backend deploy updates backend service and migration job image safely.
        $terraformApplyArgs += @(
            '-target=module.backend_service.google_cloud_run_v2_service.this',
            '-target=module.migration_job[0].google_cloud_run_v2_job.this'
        )
    }
    else {
        # Full app deploy still avoids touching Cloud SQL and other infra layers.
        $terraformApplyArgs += @(
            '-target=module.backend_service.google_cloud_run_v2_service.this',
            '-target=module.frontend_service.google_cloud_run_v2_service.this',
            '-target=module.migration_job[0].google_cloud_run_v2_job.this'
        )
    }

    Invoke-External -FilePath $terraformCommand -ArgumentList $terraformApplyArgs -WorkingDirectory $envDirAbsolute | Out-Null
}

$outputs = Get-JsonOutput -FilePath $terraformCommand -ArgumentList @('output', '-json') -WorkingDirectory $envDirAbsolute
$migrationJobName = if ($outputs.PSObject.Properties.Name -contains 'migration_job_name') {
    $outputs.migration_job_name.value
} else {
    $null
}

if ($Target -in @('backend', 'both') -and $migrationJobName) {
    Invoke-CloudRunJob -GcloudPath $gcloudCommand -ProjectId $projectId -Region $region -JobName $migrationJobName -WorkingDirectory $repoRoot
}

Write-Host "`nURLs finais:" -ForegroundColor Green
Write-Host "Backend:  $($outputs.backend_service_url.value)"
Write-Host "Frontend: $($outputs.frontend_service_url.value)"

if (-not $SkipValidation) {
    Write-Step 'Validacao HTTP final'
    $frontendServiceUrl = $outputs.frontend_service_url.value
    $backendServiceUrl = $outputs.backend_service_url.value
    $publicFrontendUrl = if (
        $outputs.PSObject.Properties.Name -contains 'load_balancer_frontend_url' -and
        $null -ne $outputs.load_balancer_frontend_url.value -and
        [string]::IsNullOrWhiteSpace([string]$outputs.load_balancer_frontend_url.value) -eq $false
    ) {
        [string]$outputs.load_balancer_frontend_url.value
    }
    else {
        $frontendServiceUrl
    }

    $checks = @(
        (Invoke-HealthCheck -CheckName 'frontend-root' -Url $publicFrontendUrl),
        (Invoke-HealthCheck -CheckName 'backend-health-detailed' -Url ($backendServiceUrl + '/health/detailed'))
    )

    $isUsingLoadBalancer = $publicFrontendUrl -ne $frontendServiceUrl
    if ($isUsingLoadBalancer) {
        $checks += (Invoke-HealthCheck -CheckName 'public-api-health-detailed' -Url ($publicFrontendUrl + '/api/health/detailed'))
    }
    else {
        Write-Host 'Aviso: load balancer nao detectado nos outputs. Validacao de /api publico foi ignorada para evitar falso negativo.' -ForegroundColor Yellow
    }

    $checks | ForEach-Object {
        Write-Host ("{0}: {1} ({2})" -f $_.label, $_.statusCode, $_.url)
    }

    $failed = $checks | Where-Object { -not $_.ok }
    if ($failed) {
        throw "Validacao HTTP falhou para: $($failed.label -join ', ')"
    }
}

Write-Host "`nAtualizacao GCP concluida com sucesso." -ForegroundColor Green
