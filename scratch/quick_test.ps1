$body = @{
    username = "demouser"
    email    = "demo@test.com"
    password = "demo123"
} | ConvertTo-Json

try {
    $r = Invoke-RestMethod -Uri "http://localhost:5000/api/users/register" -Method POST -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    Write-Host "RESULT:" -ForegroundColor Green
    $r | ConvertTo-Json -Depth 5
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $err = $reader.ReadToEnd()
    Write-Host "ERROR ($code):" -ForegroundColor Red
    Write-Host $err
}
