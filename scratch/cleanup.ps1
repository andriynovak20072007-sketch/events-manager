$c = [System.IO.File]::ReadAllText('e:\pkrfiles\events-manager\backend\routes\users.js')
$lines = $c -split "`r`n"
# Keep lines 1-160 (index 0-159) and lines 198+ (index 197+)
# This removes lines 161-197 (old login handler body)
$newLines = $lines[0..159] + $lines[197..($lines.Count-1)]
[System.IO.File]::WriteAllText('e:\pkrfiles\events-manager\backend\routes\users.js', ($newLines -join "`r`n"))
Write-Host "Done! Removed old login code (lines 161-197)"
