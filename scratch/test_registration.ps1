$body = @{
    username = "testuser"
    email    = "test@example.com"
    password = "test123"
} | ConvertTo-Json

Write-Host "`n=== ТЕСТ 1: Реєстрація нового користувача ===" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/users/register" `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    
    Write-Host "STATUS: 201 (SUCCESS)" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errorBody = $reader.ReadToEnd()
    Write-Host "STATUS: $statusCode (ERROR)" -ForegroundColor Red
    Write-Host $errorBody
}

Write-Host "`n=== ТЕСТ 2: Дублікат email (повинна бути помилка 409) ===" -ForegroundColor Cyan

try {
    $body2 = @{
        username = "testuser2"
        email    = "test@example.com"
        password = "test123"
    } | ConvertTo-Json

    $response2 = Invoke-RestMethod -Uri "http://localhost:5000/api/users/register" `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($body2))
    
    Write-Host "STATUS: SUCCESS (unexpected)" -ForegroundColor Yellow
    $response2 | ConvertTo-Json -Depth 5
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errorBody = $reader.ReadToEnd()
    Write-Host "STATUS: $statusCode (Expected error)" -ForegroundColor Green
    Write-Host $errorBody
}

Write-Host "`n=== ТЕСТ 3: Короткий пароль (повинна бути помилка 400) ===" -ForegroundColor Cyan

try {
    $body3 = @{
        username = "shortpwd"
        email    = "short@test.com"
        password = "12"
    } | ConvertTo-Json

    $response3 = Invoke-RestMethod -Uri "http://localhost:5000/api/users/register" `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($body3))
    
    Write-Host "STATUS: SUCCESS (unexpected)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errorBody = $reader.ReadToEnd()
    Write-Host "STATUS: $statusCode (Expected error)" -ForegroundColor Green
    Write-Host $errorBody
}

Write-Host "`n=== ВСІ ТЕСТИ ЗАВЕРШЕНО ===" -ForegroundColor Cyan
