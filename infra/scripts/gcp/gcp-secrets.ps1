param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,

    [string]$SecretsFile,

    [string]$DatabaseSecretName = 'database-url',

    [string]$InstanceConnectionName,

    [string]$DatabaseName = 'terceirogestor',

    [string]$DatabaseUser,

    [string]$DatabasePassword,

    [switch]$PromptDatabasePassword,

    [switch]$SkipDatabaseUrl
)

$ErrorActionPreference = 'Stop'

function Test-Gcloud {
    & gcloud version *> $null
    if ($LASTEXITCODE -ne 0) {
        throw 'gcloud nao esta disponivel. Instale/configure o Google Cloud SDK antes de continuar.'
    }
}

function Convert-SecureStringToPlainText {
    param([Security.SecureString]$Value)

    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

function Get-JsonSecretMap {
    param([string]$FilePath)

    if (-not $FilePath) {
        return @{}
    }

    if (-not (Test-Path $FilePath)) {
        throw "Arquivo de secrets nao encontrado: $FilePath"
    }

    $raw = Get-Content -Raw -Path $FilePath
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return @{}
    }

    $parsed = $raw | ConvertFrom-Json
    $map = @{}
    foreach ($property in $parsed.PSObject.Properties) {
        $map[$property.Name] = [string]$property.Value
    }

    return $map
}

function Assert-SecretExists {
    param([string]$SecretName)

    & gcloud secrets describe $SecretName --project $ProjectId *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Secret '$SecretName' nao existe no projeto '$ProjectId'. Provisione antes com Terraform."
    }
}

function Set-SecretVersion {
    param(
        [string]$SecretName,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        Write-Host "Ignorando '$SecretName' porque o valor esta vazio."
        return
    }

    Assert-SecretExists -SecretName $SecretName

    $tempFile = [IO.Path]::GetTempFileName()
    try {
        [IO.File]::WriteAllText($tempFile, $Value, [Text.UTF8Encoding]::new($false))
        & gcloud secrets versions add $SecretName --project $ProjectId --data-file $tempFile
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao adicionar nova versao ao secret '$SecretName'."
        }
    }
    finally {
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force
        }
    }
}

function New-CloudSqlPostgresUrl {
    param(
        [string]$User,
        [string]$Password,
        [string]$DbName,
        [string]$ConnectionName
    )

    $encodedUser = [Uri]::EscapeDataString($User)
    $encodedPassword = [Uri]::EscapeDataString($Password)
    $encodedSocket = [Uri]::EscapeDataString("/cloudsql/$ConnectionName")

    return "postgresql://${encodedUser}:${encodedPassword}@localhost:5432/${DbName}?host=${encodedSocket}&sslmode=disable"
}

Test-Gcloud
& gcloud config set project $ProjectId | Out-Null

$secretMap = Get-JsonSecretMap -FilePath $SecretsFile

if (-not $SkipDatabaseUrl) {
    if (-not $secretMap.ContainsKey($DatabaseSecretName)) {
        if ($PromptDatabasePassword -and -not $DatabasePassword) {
            $secure = Read-Host -Prompt 'Senha do usuario PostgreSQL do Cloud SQL' -AsSecureString
            $DatabasePassword = Convert-SecureStringToPlainText -Value $secure
        }

        $canBuildDatabaseUrl =
            -not [string]::IsNullOrWhiteSpace($InstanceConnectionName) -and
            -not [string]::IsNullOrWhiteSpace($DatabaseUser) -and
            -not [string]::IsNullOrWhiteSpace($DatabasePassword)

        if ($canBuildDatabaseUrl) {
            $secretMap[$DatabaseSecretName] = New-CloudSqlPostgresUrl `
                -User $DatabaseUser `
                -Password $DatabasePassword `
                -DbName $DatabaseName `
                -ConnectionName $InstanceConnectionName
        }
        else {
            Write-Host "DATABASE_URL nao sera gerado automaticamente. Informe pelo JSON ou passe InstanceConnectionName, DatabaseUser e DatabasePassword."
        }
    }
}

if ($secretMap.Count -eq 0) {
    throw 'Nenhum secret com valor foi informado.'
}

foreach ($entry in $secretMap.GetEnumerator() | Sort-Object Name) {
    Set-SecretVersion -SecretName $entry.Key -Value $entry.Value
}

Write-Host ''
Write-Host 'Secrets atualizados com sucesso.'
Write-Host 'Se o backend ja estiver deployado, redeploy para consumir as novas versions.'
