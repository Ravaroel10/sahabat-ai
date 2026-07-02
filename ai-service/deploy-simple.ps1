# Simple deployment script - uses default SSH authentication
# Usage: .\deploy-simple.ps1
# Make sure you can SSH to the server first: ssh haroki@hackclub.app

$SSH_USER = "haroki"
$SSH_HOST = "hackclub.app"
$REMOTE_DIR = "/home/haroki/ai-service"

Write-Host "Starting deployment to $SSH_HOST..." -ForegroundColor Green
Write-Host "You may be prompted for password or passphrase..." -ForegroundColor Yellow

# Test SSH connection
Write-Host "`nTesting SSH connection..." -ForegroundColor Yellow
$testResult = ssh "$SSH_USER@$SSH_HOST" "echo OK"
if ($LASTEXITCODE -ne 0) {
    Write-Host "SSH connection failed!" -ForegroundColor Red
    Write-Host "Please make sure you can connect: ssh $SSH_USER@$SSH_HOST" -ForegroundColor Yellow
    exit 1
}
Write-Host "SSH connection successful!" -ForegroundColor Green

# Create remote directory
Write-Host "`nCreating remote directory..." -ForegroundColor Yellow
ssh "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR"

# Copy .env file if it exists
if (Test-Path ".env") {
    Write-Host "`nCopying .env file..." -ForegroundColor Yellow
    scp ".env" "$SSH_USER@${SSH_HOST}:$REMOTE_DIR/.env"
    if ($LASTEXITCODE -eq 0) {
        Write-Host ".env file copied!" -ForegroundColor Green
    }
}

# Copy application files
Write-Host "`nCopying application files..." -ForegroundColor Yellow
$items = @(
    "Dockerfile",
    "requirements.txt",
    "docker-compose.yml",
    "remote-deploy.sh",
    "api",
    "app",
    "database",
    "ingest",
    "orchestrator",
    "prompts",
    "schemas",
    "services",
    "tools"
)

foreach ($item in $items) {
    if (Test-Path $item) {
        Write-Host "  Copying $item..." -ForegroundColor Gray
        scp -r "$item" "$SSH_USER@${SSH_HOST}:$REMOTE_DIR/"
    }
}

# Build and run on remote server
Write-Host "`nBuilding and starting Docker container..." -ForegroundColor Yellow

# Make the script executable and run it
ssh "$SSH_USER@$SSH_HOST" "chmod +x /home/haroki/ai-service/remote-deploy.sh && /home/haroki/ai-service/remote-deploy.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Service URL: http://$SSH_HOST:8000" -ForegroundColor Cyan
    Write-Host "Health check: http://$SSH_HOST:8000/health" -ForegroundColor Cyan
    Write-Host "API docs: http://$SSH_HOST:8000/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "View logs: ssh $SSH_USER@$SSH_HOST docker logs -f ai-service" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}
