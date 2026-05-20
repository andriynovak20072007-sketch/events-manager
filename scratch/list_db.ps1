$env:PGPASSWORD = "ptSQL"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
& $psql -U postgres -c "\l" 2>&1
