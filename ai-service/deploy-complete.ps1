# Complete deployment script - copies .env and deploys in one go
# Usage: .\deploy-complete.ps1

Write-Host "Starting complete deployment process..." -ForegroundColor Green

# Step 1: Check if .env exists
if (Test-Path ".env") {
    Write-Host "Found .env file" -ForegroundColor Green
    $copyEnv = Read-Host "Do you want to copy the local .env to the server? (y/n)"
    if ($copyEnv -eq "y" -or $copyEnv -eq "Y") {
        Write-Host "`nCopying .env file..." -ForegroundColor Yellow
        & ".\copy-env.ps1"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to copy .env. Aborting deployment." -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "No .env file found locally" -ForegroundColor Yellow
    Write-Host "The deployment will continue, but you will need to create .env on the server manually" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 0
    }
}

# Step 2: Deploy the service
Write-Host "`nDeploying Docker container..." -ForegroundColor Yellow
& ".\deploy.ps1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nComplete deployment finished successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Test the service: curl http://hackclub.app:8000/health" -ForegroundColor Gray
    Write-Host "2. View logs: ssh haroki@hackclub.app docker logs -f ai-service" -ForegroundColor Gray
    Write-Host "3. Check status: ssh haroki@hackclub.app docker ps" -ForegroundColor Gray
} else {
    Write-Host "`nDeployment failed! Check the error messages above." -ForegroundColor Red
    exit 1
}
