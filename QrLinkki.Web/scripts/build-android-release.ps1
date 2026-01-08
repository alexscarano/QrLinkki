# Script de build para release Android - PRODUÇÃO
# 
# ⚠️  ATENÇÃO: Este script gera APKs de PRODUÇÃO assinados com keystore de release.
#    NÃO usa debug key. Requer keystore válido e credenciais corretas.
#
# Uso: executar da raiz do repositório no PowerShell:
#   .\scripts\build-android-release.ps1
#
# Requisitos:
#   - Node.js e npm instalados
#   - Java JDK instalado (para keytool)
#   - Expo CLI disponível via npx
#   - Arquivo .env com API_URL configurado
#   - Keystore de release válido (será gerado automaticamente se não existir)
#
# Segurança:
#   - Keystore é obrigatório (não há fallback para debug key)
#   - Credenciais são validadas antes do build
#   - Senhas são salvas em keystore-passwords.txt (NÃO commitar!)

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

#region Functions

<#
.SYNOPSIS
    Gera uma senha aleatória segura.
.DESCRIPTION
    Gera uma senha aleatória com caracteres alfanuméricos.
.PARAMETER Length
    Comprimento da senha (padrão: 24).
.OUTPUTS
    String com a senha gerada.
#>
function New-RandomPassword {
    [CmdletBinding()]
    param(
        [Parameter()]
        [ValidateRange(8, 128)]
        [int]$Length = 24
    )
    
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    $password = -join ((1..$Length) | ForEach-Object { 
        $chars[(Get-Random -Maximum $chars.Length)] 
    })
    return $password
}

<#
.SYNOPSIS
    Carrega variáveis de ambiente de um arquivo .env.
.DESCRIPTION
    Procura e carrega variáveis de um arquivo .env em várias localizações possíveis.
.PARAMETER RootPath
    Caminho raiz para buscar o arquivo .env.
.OUTPUTS
    String com o caminho do arquivo .env encontrado, ou $null se não encontrado.
#>
function Find-EnvFile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$RootPath
    )
    
    $candidates = @(
        Join-Path $RootPath ".env"
        Join-Path $RootPath "QrLinkki.Web\.env"
    )
    
        $scriptDir = Split-Path $MyInvocation.MyCommand.Definition -Parent
    if ($scriptDir) {
        $parentDir = Split-Path $scriptDir -Parent
        $candidates += Join-Path $parentDir ".env"
    }
    
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            Write-Verbose "Found .env file at: $candidate"
            return $candidate
        }
    }
    
    return $null
}

<#
.SYNOPSIS
    Carrega variáveis de um arquivo .env para o ambiente.
.DESCRIPTION
    Lê um arquivo .env e define as variáveis no ambiente atual.
.PARAMETER EnvFilePath
    Caminho completo para o arquivo .env.
#>
function Import-EnvFile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$EnvFilePath
    )
    
    if (-not (Test-Path $EnvFilePath)) {
        throw "Environment file not found: $EnvFilePath"
}

    Get-Content $EnvFilePath | ForEach-Object {
    $line = $_.Trim()
        
        # Ignora linhas vazias e comentários
        if ([string]::IsNullOrWhiteSpace($line) -or 
            $line.StartsWith("#") -or 
            $line.StartsWith("//")) {
            return
        }
        
        # Ignora linhas sem '='
        if (-not $line.Contains("=")) {
            return
        }
        
    $parts = $line -split "=", 2
    $key = $parts[0].Trim()
    $val = $parts[1].Trim()
        
        # Remove aspas ao redor, se houver
        if ($val.Length -ge 2) {
            if (($val.StartsWith('"') -and $val.EndsWith('"')) -or
                ($val.StartsWith("'") -and $val.EndsWith("'"))) {
                $val = $val.Substring(1, $val.Length - 2)
            }
        }
        
        if ($key -ne "") {
            Set-Item -Path "env:$key" -Value $val -ErrorAction SilentlyContinue
            Write-Verbose "Loaded environment variable: $key"
        }
    }
}

<#
.SYNOPSIS
    Encontra o diretório raiz do projeto Expo.
.DESCRIPTION
    Procura por package.json para identificar o diretório do projeto Expo.
.PARAMETER RootPath
    Caminho raiz para iniciar a busca.
.OUTPUTS
    String com o caminho do diretório Expo, ou $null se não encontrado.
#>
function Find-ExpoRoot {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$RootPath
    )
    
    $candidates = @(
        $RootPath
        Join-Path $RootPath "QrLinkki.Web"
    )
    
    $scriptDir = Split-Path $MyInvocation.MyCommand.Definition -Parent
    if ($scriptDir) {
        $candidates += $scriptDir
        $candidates += Split-Path $scriptDir -Parent
    }
    
    foreach ($candidate in $candidates) {
        $packageJson = Join-Path $candidate "package.json"
        if (Test-Path $packageJson) {
            Write-Verbose "Found Expo project at: $candidate"
            return $candidate
        }
    }
    
    return $null
}

<#
.SYNOPSIS
    Valida se as dependências necessárias estão instaladas.
.DESCRIPTION
    Verifica se npx, keytool e outras ferramentas necessárias estão disponíveis.
#>
function Test-BuildDependencies {
    [CmdletBinding()]
    param()
    
    $missing = @()
    
    # Verifica npx
    try {
        $null = Get-Command npx -ErrorAction Stop
    }
    catch {
        $missing += "npx (Node.js)"
    }
    
    # Verifica keytool
    $keytoolFound = $false
    if ($env:JAVA_HOME) {
        $keytoolPath = Join-Path $env:JAVA_HOME "bin\keytool.exe"
        if (Test-Path $keytoolPath) {
            $keytoolFound = $true
        }
    }
    
    if (-not $keytoolFound) {
        try {
            $null = Get-Command keytool -ErrorAction Stop
            $keytoolFound = $true
        }
        catch {
            # keytool não encontrado
        }
    }
    
    if (-not $keytoolFound) {
        $missing += "keytool (Java JDK)"
    }
    
    if ($missing.Count -gt 0) {
        $missingList = $missing -join ", "
        throw "Missing required dependencies: $missingList"
    }
    
    Write-Verbose "All build dependencies are available"
}

<#
.SYNOPSIS
    Encontra o executável keytool.
.DESCRIPTION
    Procura keytool no JAVA_HOME ou no PATH.
.OUTPUTS
    String com o caminho do keytool, ou 'keytool' se estiver no PATH.
#>
function Get-KeytoolPath {
    [CmdletBinding()]
    param()
    
    if ($env:JAVA_HOME) {
        $keytoolPath = Join-Path $env:JAVA_HOME "bin\keytool.exe"
        if (Test-Path $keytoolPath) {
            return $keytoolPath
        }
    }
    
    return 'keytool'
}

<#
.SYNOPSIS
    Gera um keystore para assinatura do APK.
.DESCRIPTION
    Cria um novo keystore com as credenciais fornecidas ou geradas.
.PARAMETER KeystorePath
    Caminho onde o keystore será criado.
.PARAMETER Alias
    Alias da chave (padrão: 'qrlinkki_alias').
.PARAMETER StorePassword
    Senha do keystore (gerada automaticamente se não fornecida).
.PARAMETER KeyPassword
    Senha da chave (gerada automaticamente se não fornecida).
.OUTPUTS
    Hashtable com as credenciais do keystore.
#>
function New-AndroidKeystore {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$KeystorePath,
        [Parameter()]
        [string]$Alias = 'qrlinkki_alias',
        [Parameter()]
        [string]$StorePassword,
        [Parameter()]
        [string]$KeyPassword
    )
    
    $ksFull = [System.IO.Path]::GetFullPath($KeystorePath)
    $ksDir = Split-Path $ksFull -Parent
    
    # Cria diretório se não existir
    if (-not (Test-Path $ksDir)) {
        New-Item -ItemType Directory -Path $ksDir -Force | Out-Null
        Write-Verbose "Created keystore directory: $ksDir"
    }
    
    # Gera senhas se não fornecidas
    if ([string]::IsNullOrWhiteSpace($StorePassword)) {
        $StorePassword = New-RandomPassword -Length 24
    }
    if ([string]::IsNullOrWhiteSpace($KeyPassword)) {
        $KeyPassword = New-RandomPassword -Length 24
    }
    
    $keytool = Get-KeytoolPath
    $dname = "CN=QrLinkki, OU=Dev, O=QrLinkki, L=Unknown, ST=Unknown, C=BR"
    
    Write-Host "Generating keystore at: $ksFull"
    
    & $keytool -genkeypair -v `
        -keystore $ksFull `
        -alias $Alias `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $StorePassword `
        -keypass $KeyPassword `
        -dname $dname
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to generate keystore. keytool exited with code $LASTEXITCODE"
    }
    
    # Salva senhas em arquivo
    $passwordsFile = Join-Path $ksDir "keystore-passwords.txt"
    $passwordsContent = @"
# Keystore Credentials - DO NOT COMMIT THIS FILE!
# Generated automatically on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
KEYSTORE_PATH=$ksFull
KEYSTORE_PASSWORD=$StorePassword
KEY_ALIAS=$Alias
KEY_PASSWORD=$KeyPassword
"@
    Set-Content -Path $passwordsFile -Value $passwordsContent -NoNewline
    Write-Host "WARNING: Passwords saved to $passwordsFile" -ForegroundColor Yellow
    Write-Host "         Keep this file secure! You will need it to update the app." -ForegroundColor Yellow
    
    return @{
        Path = $ksFull
        Alias = $Alias
        StorePassword = $StorePassword
        KeyPassword = $KeyPassword
    }
}

#endregion

#region Main Script

try {
    # Inicialização
    $script:RootPath = (Get-Location).Path
    $script:LocationStack = New-Object System.Collections.Stack
    $script:LocationStack.Push($script:RootPath)
    
    Write-Host "=== Android Release Build ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Valida dependências
    Write-Host "Checking dependencies..." -ForegroundColor Gray
    Test-BuildDependencies
    
    # Carrega .env
    Write-Host "Loading environment variables..." -ForegroundColor Gray
    $envFile = Find-EnvFile -RootPath $script:RootPath
    if (-not $envFile) {
        throw "Environment file (.env) not found. Please create one with API_URL configured."
    }
    
    Import-EnvFile -EnvFilePath $envFile
    
    if ([string]::IsNullOrWhiteSpace($env:API_URL)) {
        throw "API_URL is not set in .env file or environment variables."
    }

    Write-Host "Using API_URL: $($env:API_URL)" -ForegroundColor Green
    
    # Encontra projeto Expo
    Write-Host "Locating Expo project..." -ForegroundColor Gray
    $expoRoot = Find-ExpoRoot -RootPath $script:RootPath
    if (-not $expoRoot) {
        throw "Expo project not found. Ensure package.json exists in the project root or QrLinkki.Web directory."
    }
    
    # Configura variável de ambiente para produção
    $env:BUILD_ENV = "production"
    $env:EXPO_PUBLIC_BUILD_ENV = "production"
    $env:NODE_ENV = "production"
    Write-Host "Build environment set to: PRODUCTION" -ForegroundColor Green
    Write-Host ""
    
    # Executa expo prebuild
    Write-Host "Running expo prebuild..." -ForegroundColor Gray
    Push-Location $expoRoot
    $script:LocationStack.Push($expoRoot)
    
    try {
        # --clean garante que a pasta android seja recriada com o package name correto (com.warph.qrlinkkiweb)
        # isso evita conflitos com o package de staging (com.warph.qrlinkkiweb.staging) se existir
        & npx expo prebuild --platform android --no-install --clean
        if ($LASTEXITCODE -ne 0) {
            throw "expo prebuild failed with exit code $LASTEXITCODE"
        }
}
catch {
        throw "Failed to run expo prebuild. Ensure Expo CLI is installed. Error: $_"
}
finally {
        Pop-Location
        $null = $script:LocationStack.Pop()
}

    # Verifica diretório Android
$androidDir = Join-Path $expoRoot "android"
if (-not (Test-Path $androidDir)) {
        throw "Android directory not found at: $androidDir. expo prebuild may have failed."
}

$gradlew = Join-Path $androidDir "gradlew.bat"
if (-not (Test-Path $gradlew)) {
        throw "gradlew not found at: $gradlew. Run 'npx expo prebuild' first."
}

    # Configura keystore - PRODUÇÃO: Requer keystore válido
    Write-Host "Configuring release keystore..." -ForegroundColor Gray
    $defaultKeystorePath = Join-Path $script:RootPath "keystores\qrlinkki-release.jks"
    $keystorePath = if ($env:KEYSTORE_PATH) { $env:KEYSTORE_PATH } else { $defaultKeystorePath }
    $ksFull = [System.IO.Path]::GetFullPath($keystorePath)
    
    # Validação rigorosa: keystore é obrigatório para produção
    if (-not (Test-Path $ksFull)) {
        Write-Host ""
        Write-Host "ERROR: Release keystore not found!" -ForegroundColor Red
        Write-Host "Production builds require a valid release keystore." -ForegroundColor Red
        Write-Host "Expected location: $ksFull" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Cyan
        Write-Host "  1. The script will generate a new keystore automatically" -ForegroundColor Gray
        Write-Host "  2. Or provide an existing keystore via KEYSTORE_PATH environment variable" -ForegroundColor Gray
        Write-Host ""
        Write-Host "WARNING: This is a PRODUCTION build. Debug key is NOT allowed!" -ForegroundColor Yellow
        Write-Host ""
        
        # Gera novo keystore
        # Gera novo keystore
        $keystoreCreds = New-AndroidKeystore `
            -KeystorePath $ksFull `
            -Alias $(if ($env:KEY_ALIAS) { $env:KEY_ALIAS } else { 'qrlinkki_alias' }) `
            -StorePassword $env:KEYSTORE_PASSWORD `
            -KeyPassword $env:KEY_PASSWORD
        
        # Exporta para ambiente
        $env:KEYSTORE_PATH = $keystoreCreds.Path
        $env:KEYSTORE_PASSWORD = $keystoreCreds.StorePassword
        $env:KEY_ALIAS = $keystoreCreds.Alias
        $env:KEY_PASSWORD = $keystoreCreds.KeyPassword
    }
    else {
        Write-Host "Using existing keystore: $ksFull" -ForegroundColor Green
        
        # Tenta carregar senhas do arquivo se não estiverem no ambiente
        if ([string]::IsNullOrWhiteSpace($env:KEYSTORE_PASSWORD)) {
            $passwordsFile = Join-Path (Split-Path $ksFull -Parent) "keystore-passwords.txt"
            if (Test-Path $passwordsFile) {
                Write-Verbose "Loading keystore passwords from file"
                Import-EnvFile -EnvFilePath $passwordsFile
            }
            else {
                Write-Warning "Keystore exists but passwords not found. Using environment variables or defaults."
            }
        }
        
        # Validação rigorosa: credenciais são obrigatórias para produção
        if ([string]::IsNullOrWhiteSpace($env:KEYSTORE_PASSWORD) -or 
            [string]::IsNullOrWhiteSpace($env:KEY_ALIAS)) {
            Write-Host ""
            Write-Host "ERROR: Keystore credentials are missing!" -ForegroundColor Red
            Write-Host "Production builds require valid keystore credentials." -ForegroundColor Red
            Write-Host ""
            Write-Host "Keystore found at: $ksFull" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Required environment variables:" -ForegroundColor Cyan
            Write-Host "  - KEYSTORE_PASSWORD" -ForegroundColor Gray
            Write-Host "  - KEY_ALIAS" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Options:" -ForegroundColor Cyan
            Write-Host "  1. Set environment variables before running the script" -ForegroundColor Gray
            Write-Host "  2. Check keystore-passwords.txt file in keystores directory" -ForegroundColor Gray
            Write-Host "  3. Delete the keystore to generate a new one with saved passwords" -ForegroundColor Gray
            Write-Host ""
            throw "Keystore credentials are required for production builds. Debug key is NOT allowed."
        }

        Write-Host "Keystore credentials validated successfully" -ForegroundColor Green
    }
    
    # Validação final antes do build
    Write-Host "Validating keystore configuration..." -ForegroundColor Gray
    if ([string]::IsNullOrWhiteSpace($ksFull) -or 
        [string]::IsNullOrWhiteSpace($env:KEYSTORE_PASSWORD) -or 
        [string]::IsNullOrWhiteSpace($env:KEY_ALIAS) -or 
        [string]::IsNullOrWhiteSpace($env:KEY_PASSWORD)) {
        throw "Invalid keystore configuration. All credentials must be set for production builds."
    }
    
    if (-not (Test-Path $ksFull)) {
        throw "Keystore file not found: $ksFull"
    }
    
    Write-Host "Keystore configuration validated" -ForegroundColor Green
    
    # Prepara argumentos do Gradle - PRODUÇÃO: Todas as propriedades são obrigatórias
    Write-Host "Preparing Gradle build arguments..." -ForegroundColor Gray
    $gradleArgs = @("assembleRelease")
    $gradleArgs += "-PKEYSTORE_PATH=$ksFull"
    $gradleArgs += "-PKEYSTORE_PASSWORD=$($env:KEYSTORE_PASSWORD)"
    $gradleArgs += "-PKEY_ALIAS=$($env:KEY_ALIAS)"
    $gradleArgs += "-PKEY_PASSWORD=$($env:KEY_PASSWORD)"
    
    # Executa build
    Write-Host "Building release APK with Gradle..." -ForegroundColor Gray
    Push-Location $androidDir
    $script:LocationStack.Push($androidDir)
    
    try {
& $gradlew @gradleArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Gradle build failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
        $null = $script:LocationStack.Pop()
}

    # Verifica APK gerado
$apkPath = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
        Write-Host ""
        Write-Host "SUCCESS: Release APK built successfully!" -ForegroundColor Green
        Write-Host "Location: $apkPath" -ForegroundColor Cyan
        Write-Host ""
}
else {
        Write-Warning "APK not found at expected path: $apkPath"
        Write-Warning "Check android/app/build/outputs/apk/release/ for results."
}
}
catch {
    Write-Host ""
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ScriptStackTrace) {
        Write-Verbose "Stack trace: $($_.ScriptStackTrace)"
    }
    exit 1
}
finally {
    # Limpa stack de localizações
    while ($script:LocationStack.Count -gt 0) {
        try {
            Pop-Location -ErrorAction SilentlyContinue
            $null = $script:LocationStack.Pop()
        }
        catch {
            # Ignora erros ao limpar
        }
    }
}

#endregion
