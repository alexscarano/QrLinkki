# Script de Desenvolvimento Android
# Inicia o Metro bundler para desenvolvimento com Expo
#
# Uso:
#   .\scripts\dev-android.ps1              # Inicia Metro bundler
#   .\scripts\dev-android.ps1 -Clear       # Limpa cache antes de iniciar
#
# Após Metro iniciar:
#   - Pressione 'a' no Metro para executar no Android
#   - Ou abra outro terminal: npm run android:dev
#   - Para ver logs: npm run android:logs

[CmdletBinding()]
param(
    [Parameter()]
    [switch]$Clear,
    
    [Parameter()]
    [switch]$Logs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

try {
    $script:RootPath = (Get-Location).Path
    $scriptDir = Split-Path $MyInvocation.MyCommand.Definition -Parent
    $expoRoot = if (Test-Path (Join-Path $script:RootPath "QrLinkki.Web\package.json")) {
        Join-Path $script:RootPath "QrLinkki.Web"
    } else {
        $script:RootPath
    }
    
    Write-Host "=== Android Development ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Verifica se está no diretório correto
    if (-not (Test-Path (Join-Path $expoRoot "package.json"))) {
        throw "package.json not found. Please run this script from the project root or QrLinkki.Web directory."
    }
    
    # Verifica dependências
    Write-Host "Checking dependencies..." -ForegroundColor Gray
    try {
        $null = Get-Command npx -ErrorAction Stop
    }
    catch {
        throw "npx not found. Please install Node.js and npm."
    }
    
    # Verifica adb se Logs for solicitado
    if ($Logs) {
        try {
            $null = Get-Command adb -ErrorAction Stop
        }
        catch {
            Write-Warning "adb not found. Logs will not be available."
            Write-Warning "Install Android SDK Platform Tools to enable log viewing."
            $Logs = $false
        }
    }
    
    # Limpa cache se solicitado
    if ($Clear) {
        Write-Host "Clearing Expo cache..." -ForegroundColor Yellow
        Push-Location $expoRoot
        try {
            # Limpa cache do Metro
            $metroCache = Join-Path $expoRoot ".expo"
            if (Test-Path $metroCache) {
                Remove-Item -Path $metroCache -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "  - Cleared .expo cache" -ForegroundColor Gray
            }
            # Limpa cache do node_modules/.cache
            $nodeCache = Join-Path $expoRoot "node_modules\.cache"
            if (Test-Path $nodeCache) {
                Remove-Item -Path $nodeCache -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "  - Cleared node_modules cache" -ForegroundColor Gray
            }
            # Limpa cache do Metro (metro-file-map)
            $metroFileMapCache = Join-Path $expoRoot "node_modules\metro-file-map\.cache"
            if (Test-Path $metroFileMapCache) {
                Remove-Item -Path $metroFileMapCache -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "  - Cleared Metro file map cache" -ForegroundColor Gray
            }
            # Mata processos do Metro/Expo se estiverem rodando
            $killed = Get-Process | Where-Object { 
                ($_.ProcessName -like "*node*" -or $_.ProcessName -like "*expo*" -or $_.ProcessName -like "*metro*") -and
                $_.MainWindowTitle -eq "" 
            } | Stop-Process -Force -ErrorAction SilentlyContinue
            if ($killed) {
                Write-Host "  - Stopped existing Metro/Expo processes" -ForegroundColor Gray
            }
            Start-Sleep -Seconds 1
        }
        catch {
            # Ignora erros ao limpar
        }
        finally {
            Pop-Location
        }
        Write-Host "Cache cleared" -ForegroundColor Green
        Write-Host ""
    }
    
    # Verifica se a porta 8081 (Metro) está em uso e libera se necessário
    Write-Host "Checking port 8081..." -ForegroundColor Gray
    try {
        $connections = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
        if ($connections) {
            $pidsToKill = $connections.OwningProcess | Select-Object -Unique
            foreach ($processId in $pidsToKill) {
                # Evita matar o próprio processo (embora improvável estar na 8081)
                if ($processId -ne $PID) {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            }
            Write-Host "  - Freed port 8081" -ForegroundColor Green
        }
    }
    catch {
        # Fallback para sistemas onde Get-NetTCPConnection pode falhar ou outro erro
        Write-Verbose "Could not check port 8081: $_"
    }
    
    # Inicia Metro bundler no MESMO terminal (não em janela separada)
    Write-Host ""
    Write-Host "Starting Metro bundler..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop Metro and return to this script" -ForegroundColor Yellow
    Write-Host ""
    
    Push-Location $expoRoot
    try {
        # Usa porta 8081 (agora garantidamente livre)
        # Não inicia em processo separado (janela), mas usa Start-Process para garantir stdin correto
        $npxParams = @("expo", "start", "--dev-client", "--port", "8081")
        
        $runningOnWindows = $true
        if (Test-Path variable:IsWindows) {
            $runningOnWindows = $IsWindows
        }
        
        if ($runningOnWindows) {
            # No Windows, invocação direta pode perder o stdin. Start-Process corrige isso.
            # Procuramos npx.cmd explicitamente para evitar problemas
            Start-Process -FilePath "npx.cmd" -ArgumentList $npxParams -NoNewWindow -Wait
        } else {
            Start-Process -FilePath "npx" -ArgumentList $npxParams -NoNewWindow -Wait
        }
        
        # Se chegou aqui, Metro foi interrompido pelo usuário
        Write-Host ""
        Write-Host "Metro was stopped by user" -ForegroundColor Yellow
        exit 0
    }
    finally {
        Pop-Location
    }
    
    # Metro roda neste terminal - não precisa aguardar ou executar expo run:android
    # O usuário pode:
    # 1. Pressionar 'a' no Metro para executar no Android
    # 2. Ou abrir outro terminal e executar: npm run android:dev
}
catch {
    Write-Host ""
    Write-Host "ERROR: Development setup failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ScriptStackTrace) {
        Write-Verbose "Stack trace: $($_.ScriptStackTrace)"
    }
    exit 1
}
