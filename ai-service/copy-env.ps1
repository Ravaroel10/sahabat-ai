# Copy local .env file to remote server
# Usage: .\copy-env.ps1

$SSH_USER = "haroki"
$SSH_HOST = "hackclub.app"
$SSH_KEY_CONTENT = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP72j/yORhad0SpvKMvQTbV2IuMVkQ1Bskj/Z/3y90Y1"
$REMOTE_DIR = "/home/haroki/ai-service"

# Check if .env exists locally
if (-not (Test-Path ".env")) {
    Write-Host ".env file not found locally!" -ForegroundColor Red
    Write-Host "Please create .env file based on .env.example first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Copying .env file to remote server..." -ForegroundColor Green

# Create temporary SSH key file
$SSH_KEY_FILE = Join-Path $env:TEMP "deploy_key_$(Get-Random)"
$SSH_KEY_CONTENT | Out-File -FilePath $SSH_KEY_FILE -Encoding ASCII -NoNewline

try {
    # Copy .env file
    scp -i $SSH_KEY_FILE -o StrictHostKeyChecking=no ".env" "$SSH_USER@${SSH_HOST}:$REMOTE_DIR/.env"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ".env file copied successfully!" -ForegroundColor Green
        Write-Host "You can now run deploy.ps1 to deploy the service" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to copy .env file!" -ForegroundColor Red
    }
} finally {
    # Cleanup
    Remove-Item $SSH_KEY_FILE -ErrorAction SilentlyContinue
}
