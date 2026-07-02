# Deployment script for ai-service to hackclub.app (Windows PowerShell)
# Usage: .\deploy.ps1

# Configuration
$SSH_USER = "haroki"
$SSH_HOST = "hackclub.app"
$SSH_KEY_CONTENT = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP72j/yORhad0SpvKMvQTbV2IuMVkQ1Bskj/Z/3y90Y1"
$REMOTE_DIR = "/home/haroki/ai-service"
$IMAGE_NAME = "bantu-arah-ai-service"
$CONTAINER_NAME = "ai-service"

Write-Host "Starting deployment to $SSH_HOST..." -ForegroundColor Green

# Create temporary SSH key file
$SSH_KEY_FILE = Join-Path $env:TEMP "deploy_key_$(Get-Random)"
$SSH_KEY_CONTENT | Out-File -FilePath $SSH_KEY_FILE -Encoding ASCII -NoNewline

Write-Host "Testing SSH connection..." -ForegroundColor Yellow
ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "echo SSH connection successful"

if ($LASTEXITCODE -ne 0) {
    Write-Host "SSH connection failed!" -ForegroundColor Red
    Remove-Item $SSH_KEY_FILE -ErrorAction SilentlyContinue
    exit 1
}

# Create remote directory
Write-Host "Creating remote directory..." -ForegroundColor Yellow
ssh -i $SSH_KEY_FILE "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR"

# Copy files using scp
Write-Host "Copying files to remote server..." -ForegroundColor Yellow

# Get current directory
$currentDir = Get-Location

# Files and directories to copy
$items = @(
    "Dockerfile",
    "requirements.txt",
    "docker-compose.yml",
    "api",
    "app",
    "database",
    "ingest",
    "orchestrator",
    "prompts",
    "schemas",
    "services",
    "tools",
    ".env.example"
)

foreach ($item in $items) {
    $fullPath = Join-Path $currentDir $item
    if (Test-Path $fullPath) {
        Write-Host "  Copying $item..." -ForegroundColor Gray
        scp -i $SSH_KEY_FILE -r -o StrictHostKeyChecking=no "$fullPath" "$SSH_USER@${SSH_HOST}:$REMOTE_DIR/"
    }
}

# Build and run on remote server
Write-Host "Building and starting Docker container on remote server..." -ForegroundColor Yellow

$remoteCommands = @'
cd /home/haroki/ai-service

# Check if .env exists
if [ ! -f .env ]; then
    echo "WARNING: .env file not found. Please create one based on .env.example"
    echo "You can edit it with: nano .env"
    exit 1
fi

# Stop and remove existing container
echo "Stopping existing container..."
docker stop ai-service 2>/dev/null || true
docker rm ai-service 2>/dev/null || true

# Build the Docker image
echo "Building Docker image..."
docker build -t bantu-arah-ai-service .

# Run the container
echo "Starting container..."
docker run -d \
    --name ai-service \
    -p 8000:8000 \
    -v ai-service-data:/data \
    --env-file .env \
    --restart unless-stopped \
    bantu-arah-ai-service

# Wait and check if container is running
sleep 5
if docker ps | grep -q ai-service; then
    echo "SUCCESS: Container is running!"
    docker logs --tail 20 ai-service
else
    echo "ERROR: Container failed to start. Logs:"
    docker logs ai-service
    exit 1
fi

# Show container status
echo ""
echo "Container status:"
docker ps -a | grep ai-service
'@

ssh -i $SSH_KEY_FILE "$SSH_USER@$SSH_HOST" $remoteCommands

# Cleanup
Remove-Item $SSH_KEY_FILE -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "Service should be available at: http://${SSH_HOST}:8000" -ForegroundColor Cyan
    Write-Host "Check logs with: ssh haroki@hackclub.app docker logs -f ai-service" -ForegroundColor Gray
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}
