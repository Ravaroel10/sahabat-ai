# Manual Deployment Guide

## Quick Manual Deployment (No Scripts Needed)

Since you need the SSH private key to use automated scripts, here's how to deploy manually:

### Step 1: Get SSH Access

First, you need to obtain the SSH private key file that corresponds to this public key:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP72j/yORhad0SpvKMvQTbV2IuMVkQ1Bskj/Z/3y90Y1
```

Contact whoever set up the server or check if you have a file that looks like:
- `id_ed25519` (without .pub extension)
- Contains `-----BEGIN OPENSSH PRIVATE KEY-----`

### Step 2: Test SSH Connection

```powershell
# Try connecting
ssh haroki@hackclub.app

# If that works, you're good to go!
```

### Step 3: Upload Files to Server

You can use one of these methods:

#### Method A: Using WinSCP (GUI)
1. Download WinSCP: https://winscp.net/
2. Connect to `hackclub.app` with user `haroki`
3. Navigate to `/home/haroki/`
4. Create folder `ai-service`
5. Upload all files from your local `k:\projects\dev\bantu-arah\ai-service\` folder

#### Method B: Using SCP (Command Line)
Once SSH works, run:
```powershell
cd k:\projects\dev\bantu-arah\ai-service

# Copy each directory
scp -r api haroki@hackclub.app:/home/haroki/ai-service/
scp -r app haroki@hackclub.app:/home/haroki/ai-service/
scp -r database haroki@hackclub.app:/home/haroki/ai-service/
scp -r ingest haroki@hackclub.app:/home/haroki/ai-service/
scp -r orchestrator haroki@hackclub.app:/home/haroki/ai-service/
scp -r prompts haroki@hackclub.app:/home/haroki/ai-service/
scp -r schemas haroki@hackclub.app:/home/haroki/ai-service/
scp -r services haroki@hackclub.app:/home/haroki/ai-service/
scp -r tools haroki@hackclub.app:/home/haroki/ai-service/

# Copy files
scp Dockerfile haroki@hackclub.app:/home/haroki/ai-service/
scp requirements.txt haroki@hackclub.app:/home/haroki/ai-service/
scp .env haroki@hackclub.app:/home/haroki/ai-service/
```

### Step 4: Build and Run Docker Container

SSH into the server and run these commands:

```bash
# Connect to server
ssh haroki@hackclub.app

# Navigate to directory
cd /home/haroki/ai-service

# Verify files are there
ls -la

# Stop any existing container
docker stop ai-service 2>/dev/null
docker rm ai-service 2>/dev/null

# Build the Docker image
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

# View logs
docker logs ai-service

# If successful, you should see FastAPI startup messages
```

### Step 5: Test the Deployment

From your local machine:

```powershell
# Test health endpoint
curl http://hackclub.app:8000/health

# View API documentation
# Open in browser: http://hackclub.app:8000/docs
```

## Updating the Service

When you make changes:

```bash
# SSH to server
ssh haroki@hackclub.app
cd /home/haroki/ai-service

# Pull new code or upload changed files

# Rebuild and restart
docker stop ai-service
docker rm ai-service
docker build -t bantu-arah-ai-service .
docker run -d --name ai-service -p 8000:8000 -v ai-service-data:/data --env-file .env --restart unless-stopped bantu-arah-ai-service
```

## Useful Commands

```bash
# View logs
docker logs -f ai-service

# Stop service
docker stop ai-service

# Start service
docker start ai-service

# Restart service
docker restart ai-service

# Check status
docker ps -a | grep ai-service

# Check resource usage
docker stats ai-service

# Access container shell
docker exec -it ai-service bash

# Remove everything and start fresh
docker stop ai-service
docker rm ai-service
docker rmi bantu-arah-ai-service
# Then rebuild and run
```

## Troubleshooting

### Container exits immediately
```bash
# Check logs for errors
docker logs ai-service

# Common issues:
# - Missing .env file
# - Invalid environment variables
# - Port 8000 already in use
```

### Port already in use
```bash
# Find what's using port 8000
netstat -tulpn | grep 8000

# Or
docker ps | grep 8000
```

### Can't connect to service
```bash
# Check if container is running
docker ps | grep ai-service

# Check if port is exposed
docker port ai-service

# Check firewall (if applicable)
sudo ufw status
```

## Your Current Configuration

Your `.env` file is configured with:
- LLM: OpenRouter (GPT-OSS-120B) with fallbacks
- Embeddings: HuggingFace (sentence-transformers/all-MiniLM-L6-v2)
- Vector DB: ChromaDB
- Search: Brave Search + Exa

The service will run on port 8000 and persist data in Docker volume `ai-service-data`.
