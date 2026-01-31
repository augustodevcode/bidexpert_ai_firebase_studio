$env:DATABASE_URL_HML='mysql://root:HmlPassword2025@localhost:3307/bidexpert_hml'
$env:DATABASE_URL_PROD='mysql://root:ProdSecurePassword2025!@localhost:3309/bidexpert_prod'

"--- HML STATUS ---" | Out-File db_status.txt
try {
    Invoke-Expression "npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url '$env:DATABASE_URL_HML' --script" | Out-File db_status.txt -Append
} catch {
    $_ | Out-File db_status.txt -Append
}

"--- PROD STATUS ---" | Out-File db_status.txt -Append
try {
    Invoke-Expression "npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url '$env:DATABASE_URL_PROD' --script" | Out-File db_status.txt -Append
} catch {
    $_ | Out-File db_status.txt -Append
}