# SSH Setup Guide for hackclub.app Deployment

## Problem
You have the SSH **public key** but need the **private key** to authenticate.

**Public key (what you have):**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP72j/yORhad0SpvKMvQTbV2IuMVkQ1Bskj/Z/3y90Y1
```

**Private key (what you need):**
This is a file that starts with `-----BEGIN OPENSSH PRIVATE KEY-----`

## Solution Options

### Option 1: Get the Private Key File (Recommended)

If you have the private key file:

1. Copy the private key to your `.ssh` directory:
```powershell
# Create .ssh directory if it doesn't exist
mkdir $env:USERPROFILE\.ssh -ErrorAction SilentlyContinue

# Copy your private key file (adjust the path)
copy path\to\your\private-key $env:USERPROFILE\.ssh\hackclub_deploy

# Set correct permissions (Windows)
icacls "$env:USERPROFILE\.ssh\hackclub_deploy" /inheritance:r /grant:r "${env:USERNAME}:R"
```

2. Create/edit SSH config:
```powershell
notepad $env:USERPROFILE\.ssh\config
```

Add this content:
```
Host hackclub.app
    HostName hackclub.app
    User haroki
    IdentityFile ~/.ssh/hackclub_deploy
    IdentitiesOnly yes
```

3. Test the connection:
```powershell
ssh haroki@hackclub.app "echo Connection successful"
```

4. If successful, run the deployment:
```powershell
cd ai-service
.\deploy-simple.ps1
```

### Option 2: Manual Deployment (If SSH Key Not Available)

If you can't get the private key, you can deploy manually:

#### Step 1: Get server access
Contact the server administrator to:
- Get the private key file, OR
- Add your own SSH public key to the server, OR
- Set up password authentication (less secure)

#### Step 2: Once you have access, manual deployment:

```bash
# 1. SSH into the server
ssh haroki@hackclub.app

# 2. Create directory
mkdir -p /home/haroki/ai-service
cd /home/haroki/ai-service

# 3. Upload files (from your local machine)
# You can use WinSCP, FileZilla, or scp
```

Then copy all these files from your local `ai-service` directory:
- `Dockerfile`
- `requirements.txt`
- `.env`
- `api/` folder
- `app/` folder
- `database/` folder
- `ingest/` folder
- `orchestrator/` folder
- `prompts/` folder
- `schemas/` folder
- `services/` folder
- `tools/` folder

```bash
# 4. Build and run Docker (on the server)
cd /home/haroki/ai-service

# Stop any existing container
docker stop ai-service 2>/dev/null || true
docker rm ai-service 2>/dev/null || true

# Build the image
docker build -t bantu-arah-ai-service .

# Run the container
docker run -d \
    --name ai-service \
    -p 8000:8000 \
    -v ai-service-data:/data \
    --env-file .env \
    --restart unless-stopped \
    bantu-arah-ai-service

# Check if it's running
docker ps | grep ai-service
docker logs ai-service
```

### Option 3: Use SSH Agent

If the key is already in your SSH agent:

```powershell
# Check if ssh-agent is running
Get-Service ssh-agent

# Start if not running
Start-Service ssh-agent

# Add your key (if you have it)
ssh-add path\to\your\private-key

# Test
ssh haroki@hackclub.app "echo Success"

# Deploy
cd ai-service
.\deploy-simple.ps1
```

## Testing Your Connection

Before deploying, test your SSH connection:

```powershell
# Simple test
ssh haroki@hackclub.app "echo Hello"

# Check Docker access
ssh haroki@hackclub.app "docker --version"

# Check if you can create directories
ssh haroki@hackclub.app "mkdir -p /home/haroki/test && echo Success"
```

## Next Steps

Once SSH is working:

1. Run the deployment:
```powershell
cd k:\projects\dev\bantu-arah\ai-service
.\deploy-simple.ps1
```

2. Test the service:
```powershell
curl http://hackclub.app:8000/health
```

3. Check logs:
```powershell
ssh haroki@hackclub.app "docker logs -f ai-service"
```

## Common Issues

### "Permission denied (publickey)"
- You don't have the private key configured
- The key is in the wrong location
- File permissions are incorrect

### "Load key: invalid format"
- The key file is corrupted or wrong format
- Make sure it's the PRIVATE key, not the public key

### "Connection refused"
- Server might be down
- Firewall blocking port 22
- Wrong hostname/IP

## Need Help?

1. Verify you can SSH to the server at all
2. Check if Docker is installed on the server
3. Ensure you have write permissions to /home/haroki/
4. Make sure port 8000 is available on the server
