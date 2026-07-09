# Quick Redeploy Script for AI Service
# Usage: .\redeploy.ps1

$SSH_USER = "haroki"
$SSH_HOST = "hackclub.app"
$REMOTE_DIR = "/home/haroki/ai-service"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Service Redeployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop and remove old container
Write-Host "[1/5] Stopping old container..." -ForegroundColor Yellow
ssh "$SSH_USER@$SSH_HOST" "docker stop ai-service 2>/dev/null && docker rm ai-service 2>/dev/null || true"
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Step 2: Copy updated files
Write-Host "[2/5] Copying updated files..." -ForegroundColor Yellow
$items = @(
    "Dockerfile",
    "requirements.txt",
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
        Write-Host "  Copying $item" -ForegroundColor Gray
        scp -r "$item" "$SSH_USER@${SSH_HOST}:$REMOTE_DIR/" 2>$null
    }
}

# Copy .env if exists
if (Test-Path ".env") {
    Write-Host "  Copying .env" -ForegroundColor Gray
    scp ".env" "$SSH_USER@${SSH_HOST}:$REMOTE_DIR/.env" 2>$null
}

Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Step 3: Build new Docker image
Write-Host "[3/5] Building Docker image..." -ForegroundColor Yellow
ssh "$SSH_USER@$SSH_HOST" "cd $REMOTE_DIR && docker build -t bantu-arah-ai-service ."
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Step 4: Start new container
Write-Host "[4/5] Starting new container..." -ForegroundColor Yellow
ssh "$SSH_USER@$SSH_HOST" "docker run -d --name ai-service -p 8000:8000 --env-file $REMOTE_DIR/.env -v ai-service-data:/data bantu-arah-ai-service"
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Step 5: Health check
Write-Host "[5/5] Running health check..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$healthCheck = ssh "$SSH_USER@$SSH_HOST" "curl -s http://localhost:8000/health"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($healthCheck) {
    Write-Host "Service is healthy!" -ForegroundColor Green
    Write-Host "Status: $healthCheck" -ForegroundColor Cyan
} else {
    Write-Host "Health check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Service URL: http://haroki.hackclub.app" -ForegroundColor Green
Write-Host "Health check: http://haroki.hackclub.app/health" -ForegroundColor Green
Write-Host "API docs: http://haroki.hackclub.app/docs" -ForegroundColor Green
Write-Host ""
