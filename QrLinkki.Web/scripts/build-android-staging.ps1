[CmdletBinding()]
param(
    [Parameter()]
    [switch]$UseDebugKey
)

$OutputEncoding = [System.Console]::InputEncoding = [System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- CONFIGURACAO ---
$ENV_FILE_PATHS = @(".env", "QrLinkki.Web\.env")
$REQUIRED_ENV_VARS = @("API_URL")
$EXPO_PROJECT_SUBDIR = "QrLinkki.Web"
$KEYSTORE_REL_PATH = "keystores\qrlinkki-release.jks"

# --- FUNCOES AUXILIARES ---

function Get-ProjectRoot {
    return (Get-Location).Path
}

function Load-EnvFile {
    param([string]$RootPath)
    
    foreach ($path in $ENV_FILE_PATHS) {
        $fullPath = Join-Path $RootPath $path
        if (Test-Path $fullPath) {
            Write-Host " [Configuration] Carregando .env de: $fullPath" -ForegroundColor Gray
            Get-Content $fullPath | ForEach-Object {
                $line = $_.Trim()
                if ($line -match "^[^#=]+=[^#]+$") {
                    $parts = $line -split "=", 2
                    $key = $parts[0].Trim()
                    $val = $parts[1].Trim().Trim('"').Trim("'")
                    Set-Item -Path "env:$key" -Value $val -ErrorAction SilentlyContinue
                }
            }
            return
        }
    }
    Write-Warning "Arquivo .env nao encontrado. Assumindo que variaveis ja estao no ambiente."
}

function Assert-EnvVars {
    foreach ($var in $REQUIRED_ENV_VARS) {
        if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
            throw "Variavel de ambiente obrigatoria faltando: $var"
        }
    }
}

function Get-SigningConfig {
    param([string]$RootPath, [switch]$ForceDebug)

    $ksPath = Join-Path $RootPath $KEYSTORE_REL_PATH
    $hasKeystoreFile = Test-Path $ksPath
    $hasCreds = ($env:KEYSTORE_PASSWORD -and $env:KEY_ALIAS)
    
    if ($ForceDebug) {
        return @{ Type = "Debug"; Reason = "Solicitado pelo usuario (-UseDebugKey)" }
    }

    if ($hasKeystoreFile -and $hasCreds) {
        return @{ 
            Type = "Release"; 
            Path = $ksPath; 
            Reason = "Keystore e credenciais encontradas" 
        }
    }

    if ($hasKeystoreFile -and -not $hasCreds) {
        Write-Warning "Keystore encontrada ($ksPath) mas SEM senhas no ambiente."
        Write-Warning "Para usar Release Key, configure KEYSTORE_PASSWORD e KEY_ALIAS no .env."
        return @{ Type = "Debug"; Reason = "Credenciais de Release faltando (Fallback)" }
    }

    return @{ Type = "Debug"; Reason = "Keystore de Release nao encontrada (Fallback)" }
}

# --- EXECUCAO PRINCIPAL ---

try {
    Write-Host "`n=== QrLinkki Android Staging Build ===`n" -ForegroundColor Cyan

    $rootPath = Get-ProjectRoot
    
    # 1. Configurar Ambiente
    Load-EnvFile -RootPath $rootPath
    Assert-EnvVars
    
    # Definir contexto de Staging
    $env:BUILD_ENV = "staging"
    $env:EXPO_PUBLIC_BUILD_ENV = "staging"
    $env:NODE_ENV = "production"
    Write-Host " [Environment] API_URL: $env:API_URL" -ForegroundColor Gray
    Write-Host " [Environment] Build Mode: STAGING" -ForegroundColor Gray

    # 2. Localizar Expo
    $expoRoot = Join-Path $rootPath $EXPO_PROJECT_SUBDIR
    if (-not (Test-Path "$expoRoot\package.json")) {
        # Fallback se rodar de dentro da pasta
        if (Test-Path "$rootPath\package.json") { $expoRoot = $rootPath }
        else { throw "Projeto Expo nao encontrado." }
    }

    # 3. Prebuild
    Write-Host "`n [Expo] Executando prebuild..." -ForegroundColor Gray
    Push-Location $expoRoot
    # --clean garante que a pasta android seja recriada com o package name correto (com.warph.qrlinkkiweb.staging)
    # isso evita conflitos com o package de producao (com.warph.qrlinkkiweb) se existir
    & npx expo prebuild --platform android --no-install --clean
    if ($LASTEXITCODE -ne 0) { throw "Falha no expo prebuild." }

    # 4. Configurar Assinatura
    $signing = Get-SigningConfig -RootPath $rootPath -ForceDebug:$UseDebugKey
    
    $gradleArgs = @("assembleRelease")
    
    if ($signing.Type -eq "Release") {
        Write-Host " [Signing] MODO RELEASE (Producao)" -ForegroundColor Green
        Write-Host "           Usando: $($signing.Path)" -ForegroundColor Gray
        $gradleArgs += "-PKEYSTORE_PATH=$($signing.Path)"
        $gradleArgs += "-PKEYSTORE_PASSWORD=$env:KEYSTORE_PASSWORD"
        $gradleArgs += "-PKEY_ALIAS=$env:KEY_ALIAS"
        $gradleArgs += "-PKEY_PASSWORD=$($env:KEY_PASSWORD)"
    } else {
        Write-Host " [Signing] MODO DEBUG (Teste Rapido)" -ForegroundColor Yellow
        Write-Host "           Motivo: $($signing.Reason)" -ForegroundColor Yellow
        $gradleArgs += "-PSTAGING_USE_DEBUG_KEY=true"
    }

    # 5. Build Gradle
    $androidDir = Join-Path $expoRoot "android"
    $gradlew = Join-Path $androidDir "gradlew.bat"
    
    Write-Host "`n [Gradle] Iniciando compilacao..." -ForegroundColor Gray
    Push-Location $androidDir
    & $gradlew @gradleArgs
    
    if ($LASTEXITCODE -ne 0) { throw "Falha no build do Gradle." }
    
    # 6. Finalizacao
    $apkSource = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
    $apkDest = Join-Path $androidDir "app\build\outputs\apk\release\app-staging.apk"
    
    if (Test-Path $apkSource) {
        Copy-Item -Path $apkSource -Destination $apkDest -Force
        Write-Host "`n Sucesso! APK gerado em:" -ForegroundColor Green
        Write-Host " $apkDest" -ForegroundColor Cyan
    } else {
        throw "APK nao encontrado apos build."
    }

} catch {
    Write-Host "`n [ERRO CRITICO] $_" -ForegroundColor Red
    exit 1
} finally {
    Set-Location $rootPath
}
