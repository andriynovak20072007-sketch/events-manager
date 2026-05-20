$env:PGPASSWORD = "ptSQL"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "=== Applying migration_registration.sql ===" -ForegroundColor Cyan
& $psql -U postgres -d "events-manager" -f "e:\pkrfiles\events-manager\backend\databases\migration_registration.sql" 2>&1

Write-Host "=== Applying migration_trial.sql ===" -ForegroundColor Cyan
& $psql -U postgres -d "events-manager" -f "e:\pkrfiles\events-manager\backend\databases\migration_trial.sql" 2>&1

Write-Host "=== DONE ===" -ForegroundColor Green
