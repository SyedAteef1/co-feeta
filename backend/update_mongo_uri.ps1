# PowerShell script to update MONGO_URI in .env file
# Usage: .\update_mongo_uri.ps1 "mongodb+srv://username:password@cluster.mongodb.net/"

param(
    [Parameter(Mandatory=$true)]
    [string]$MongoUri
)

$envFile = ".env"

if (Test-Path $envFile) {
    $content = Get-Content $envFile
    
    # Check if MONGO_URI already exists
    $updated = $false
    $newContent = @()
    
    foreach ($line in $content) {
        if ($line -match "^MONGO_URI=") {
            $newContent += "MONGO_URI=$MongoUri"
            $updated = $true
            Write-Host "✅ Updated MONGO_URI in .env file" -ForegroundColor Green
        } else {
            $newContent += $line
        }
    }
    
    if (-not $updated) {
        # Add MONGO_URI if it doesn't exist
        $newContent += "MONGO_URI=$MongoUri"
        Write-Host "✅ Added MONGO_URI to .env file" -ForegroundColor Green
    }
    
    $newContent | Set-Content $envFile
    Write-Host "`n📝 Updated .env file with MongoDB connection string" -ForegroundColor Cyan
    Write-Host "🔒 Remember: Never commit your .env file to version control!" -ForegroundColor Yellow
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Creating new .env file..." -ForegroundColor Yellow
    "MONGO_URI=$MongoUri" | Set-Content $envFile
    Write-Host "✅ Created .env file with MONGO_URI" -ForegroundColor Green
}

