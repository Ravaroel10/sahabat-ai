# Setup SSH key for deployment
# Usage: .\setup-ssh-key.ps1

$SSH_KEY_CONTENT = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP72j/yORhad0SpvKMvQTbV2IuMVkQ1Bskj/Z/3y90Y1"
$SSH_KEY_FILE = "$env:USERPROFILE\.ssh\hackclub_deploy"

# Create .ssh directory if it doesn't exist
$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) {
    Write-Host "Creating .ssh directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $sshDir | Out-Null
}

# Save the public key
Write-Host "Saving SSH public key to $SSH_KEY_FILE.pub" -ForegroundColor Green
$SSH_KEY_CONTENT | Out-File -FilePath "$SSH_KEY_FILE.pub" -Encoding ASCII -NoNewline

Write-Host ""
Write-Host "PUBLIC KEY SAVED!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: You need the PRIVATE key to connect!" -ForegroundColor Yellow
Write-Host "The public key has been saved, but you need to obtain the private key." -ForegroundColor Yellow
Write-Host ""
Write-Host "Do you have the private key file? It should look something like:" -ForegroundColor Cyan
Write-Host "-----BEGIN OPENSSH PRIVATE KEY-----" -ForegroundColor Gray
Write-Host "b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAG..." -ForegroundColor Gray
Write-Host "-----END OPENSSH PRIVATE KEY-----" -ForegroundColor Gray
Write-Host ""
$hasPrivateKey = Read-Host "Do you have the private key? (y/n)"

if ($hasPrivateKey -eq "y" -or $hasPrivateKey -eq "Y") {
    Write-Host ""
    Write-Host "Please save your private key to: $SSH_KEY_FILE" -ForegroundColor Yellow
    Write-Host "Then run: icacls `"$SSH_KEY_FILE`" /inheritance:r /grant:r `"${env:USERNAME}:R`"" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After that, you can deploy using: .\deploy-with-keyfile.ps1" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "You need to obtain the private key first." -ForegroundColor Red
    Write-Host "Contact the person who created this SSH key pair." -ForegroundColor Yellow
}
