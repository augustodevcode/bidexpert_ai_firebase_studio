# Script para iniciar 4 ambientes BidExpert simultaneamente
# Executa em portas diferentes: DEV(9005), HML(9006), DEMO(9007), PROD(9008)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BidExpert Multi-Environment Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$environments = @(
    @{ Name = "DEV";  Port = 9005; Slug = "dev";  DB = "bidexpert_dev" },
    @{ Name = "HML";  Port = 9006; Slug = "hml";  DB = "bidexpert_hml" },
    @{ Name = "DEMO"; Port = 9007; Slug = "demo"; DB = "bidexpert_demo" },
    @{ Name = "PROD"; Port = 9008; Slug = "prod"; DB = "bidexpert_prod" }
)

$jobs = @()

foreach ($env in $environments) {
    Write-Host "Starting $($env.Name) on port $($env.Port)..." -ForegroundColor Yellow
    
    $scriptBlock = {
        param($port, $slug, $db, $workDir)
        Set-Location $workDir
        $env:PORT = $port
        $env:TENANT_SLUG = $slug
        $env:DATABASE_URL = "mysql://root:M%21nh%40S3nha2025@localhost:3306/$db"
        npm run dev
    }
    
    $job = Start-Job -Name "BidExpert-$($env.Name)" -ScriptBlock $scriptBlock -ArgumentList $env.Port, $env.Slug, $env.DB, $PWD
    $jobs += @{ Name = $env.Name; Port = $env.Port; Job = $job }
}

Write-Host ""
Write-Host "Waiting for servers to start (120 seconds)..." -ForegroundColor Gray

# Aguardar inicialização
Start-Sleep -Seconds 120

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Environment Status Report" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($jobInfo in $jobs) {
    $port = $jobInfo.Port
    $name = $jobInfo.Name
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 5 -MaximumRedirection 0 -ErrorAction Stop
        $status = "OK (HTTP $($response.StatusCode))"
        $color = "Green"
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 302) {
            $status = "OK (Redirect)"
            $color = "Green"
        }
        else {
            $status = "FAILED"
            $color = "Red"
        }
    }
    
    Write-Host "| $($name.PadRight(6)) | localhost:$port | $status |" -ForegroundColor $color
}

Write-Host ""
Write-Host "URLs para teste:" -ForegroundColor Cyan
Write-Host "  DEV:  http://dev.localhost:9005"
Write-Host "  HML:  http://hml.localhost:9006"
Write-Host "  DEMO: http://demo.localhost:9007"
Write-Host "  PROD: http://prod.localhost:9008"
Write-Host ""
Write-Host "Pressione Ctrl+C para encerrar todos os ambientes"

# Manter script rodando
try {
    while ($true) {
        Start-Sleep -Seconds 10
        $running = $jobs | Where-Object { $_.Job.State -eq 'Running' }
        if ($running.Count -eq 0) {
            Write-Host "Todos os jobs terminaram." -ForegroundColor Yellow
            break
        }
    }
}
finally {
    Write-Host "Encerrando jobs..." -ForegroundColor Yellow
    $jobs | ForEach-Object { Stop-Job -Job $_.Job -ErrorAction SilentlyContinue }
    $jobs | ForEach-Object { Remove-Job -Job $_.Job -Force -ErrorAction SilentlyContinue }
}
