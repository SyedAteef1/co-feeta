# Interactive script to set MongoDB URI
param(
    [string]$MongoUri = ""
)

if ([string]::IsNullOrEmpty($MongoUri)) {
    Write-Host "`n🔧 MongoDB Connection String Setup" -ForegroundColor Cyan
    Write-Host "====================================`n" -ForegroundColor Cyan
    
    Write-Host "Please enter your MongoDB Atlas connection string:" -ForegroundColor Yellow
    Write-Host "Format: mongodb+srv://username:password@cluster.mongodb.net/" -ForegroundColor Gray
    Write-Host "Or for local: mongodb://localhost:27017/`n" -ForegroundColor Gray
    
    $MongoUri = Read-Host "MongoDB URI"
}

if ([string]::IsNullOrEmpty($MongoUri)) {
    Write-Host "`n❌ Error: MongoDB URI cannot be empty!" -ForegroundColor Red
    exit 1
}

$envFile = ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "`n⚠️  .env file not found. Creating new one..." -ForegroundColor Yellow
    "" | Out-File $envFile -Encoding utf8
}

$content = Get-Content $envFile
$updated = $false
$newContent = @()

foreach ($line in $content) {
    if ($line -match "^MONGO_URI=") {
        $newContent += "MONGO_URI=$MongoUri"
        $updated = $true
    } else {
        $newContent += $line
    }
}

if (-not $updated) {
    $newContent += "MONGO_URI=$MongoUri"
}

$newContent | Set-Content $envFile -Encoding utf8

Write-Host "`n✅ Successfully updated MONGO_URI in .env file!" -ForegroundColor Green
Write-Host "📝 Updated value: $($MongoUri.Substring(0, [Math]::Min(50, $MongoUri.Length)))..." -ForegroundColor Cyan
Write-Host "`n⚠️  Remember to restart your backend server for changes to take effect!" -ForegroundColor Yellow

