# Script para configurar hosts - Executar como Administrador
# Este script adiciona as entradas necessárias para multi-tenancy BidExpert

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

$entries = @"

# BidExpert Multi-Environment (adicionado automaticamente)
127.0.0.1 dev.localhost
127.0.0.1 hml.localhost
127.0.0.1 demo.localhost
127.0.0.1 prod.localhost
"@

$content = Get-Content $hostsPath -Raw -ErrorAction SilentlyContinue

if ($content -notmatch "dev\.localhost") {
    Add-Content -Path $hostsPath -Value $entries -Force
    Write-Host "✅ Entradas adicionadas ao arquivo hosts!" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Entradas já existem no arquivo hosts." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Entradas atuais relacionadas a localhost:" -ForegroundColor Cyan
Get-Content $hostsPath | Select-String "localhost"

Write-Host ""
Write-Host "Teste de resolução:" -ForegroundColor Cyan
@("dev.localhost", "hml.localhost", "demo.localhost", "prod.localhost") | ForEach-Object {
    $result = Resolve-DnsName $_ -ErrorAction SilentlyContinue
    if ($result) {
        Write-Host "  ✅ $_" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $_" -ForegroundColor Red
    }
}
