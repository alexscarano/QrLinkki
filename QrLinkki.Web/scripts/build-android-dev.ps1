# Script de build para desenvolvimento Android (Debug)
# 
# Uso:
#   .\scripts\build-android-dev.ps1
#
# O que faz:
#   - Gera um APK de DEBUG (assembleDebug)
#   - Permite conectar com o Metro Bundler (`npm run dev:android`)
#   - Instala no emulador/celular conectado automaticamente
#

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

try {
    $script:RootPath = (Get-Location).Path
    $scriptDir = Split-Path $MyInvocation.MyCommand.Definition -Parent
    
    Write-Host "=== Android Development Build (Debug) ===" -ForegroundColor Cyan
    Write-Host "This will build the 'Development Client' app needed for coding." -ForegroundColor Gray
    Write-Host ""
    
    # 1. Encontrar raiz do Expo
    $expoRoot = if (Test-Path (Join-Path $script:RootPath "QrLinkki.Web\package.json")) {
        Join-Path $script:RootPath "QrLinkki.Web"
    } else {
        $script:RootPath
    }
    
    # 2. Configurar variáveis para Dev
    $env:BUILD_ENV = "development"
    $env:EXPO_PUBLIC_BUILD_ENV = "development"
    
    # 3. Rodar Prebuild (garantir código nativo atualizado)
    Write-Host "Running expo prebuild..." -ForegroundColor Gray
    Push-Location $expoRoot
    try {
        & npx expo prebuild --platform android --no-install
        if ($LASTEXITCODE -ne 0) { throw "Prebuild failed" }
    }
    finally {
        Pop-Location
    }
    
    # 4. Rodar Gradle assembleDebug
    $androidDir = Join-Path $expoRoot "android"
    $gradlew = Join-Path $androidDir "gradlew.bat"
    
    Write-Host "Building Debug APK..." -ForegroundColor Green
    Push-Location $androidDir
    try {
        & $gradlew assembleDebug
        if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }
    }
    finally {
        Pop-Location
    }
    
    # 5. Copiar/Instalar
    $apkPath = Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        Write-Host ""
        Write-Host "SUCCESS: Debug APK built!" -ForegroundColor Green
        Write-Host "Location: $apkPath" -ForegroundColor Cyan
        Write-Host ""
        
        # Tentar instalar se tiver dispositivo
        try {
            Write-Host "Attempting to install on connected device..." -ForegroundColor Gray
            & adb install -r $apkPath
            Write-Host "Installed successfully!" -ForegroundColor Green
            
            # Auto-start Metro Bundler
            Write-Host ""
            Write-Host "Starting Development Server..." -ForegroundColor Cyan
            Start-Sleep -Seconds 2
            
            $devScript = Join-Path $scriptDir "dev-android.ps1"
            & $devScript
        }
        catch {
            Write-Warning "Could not install automatically (adb failed or no device found)."
            Write-Warning "Install manually: adb install $apkPath"
            Write-Warning "Then run: npm run dev:android"
        }
    }
    else {
        throw "APK not found at $apkPath"
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
