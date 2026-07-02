# AI Service Deployment Guide

## Deploy to hackclub.app

### Prerequisites

1. SSH access to `haroki@hackclub.app`
2. Docker installed on the remote server
3. The required SSH key (already configured in deploy scripts)

### Deployment Steps

#### On Windows (PowerShell):

```powershell
cd ai-service
.\deploy.ps1
```

#### On Linux/Mac (Bash):

```bash
cd ai-service
chmod +x deploy.sh
./deploy.sh
```

### What the deployment script does:

1. ✅ Tests SSH connection to the server
2. 📁 Creates remote directory `/home/haroki/ai-service`
3. 📤 Copies all necessary files to the server
4. 🐳 Builds the Docker image on the remote server
5. 🚀 Runs the container with proper configuration
6. ✅ Verifies the container is running

### First Time Setup

After the first deployment, you'll need to set up the `.env` file on the server:

```bash
ssh haroki@hackclub.app
cd /home/haroki/ai-service
nano .env
```

Copy the contents from `.env.example` and configure:

- `OPENAI_API_KEY` - Your OpenAI API key
- `DATABASE_URL` - Your database connection string
- `CHROMA_PATH=/data/chroma` - ChromaDB storage path (already configured)
- Any other required environment variables

Then re-run the deployment script to restart the container with the new configuration.

### Manual Deployment Commands

If you prefer manual deployment:

```bash
# 1. Copy files to server
scp -r ai-service/* haroki@hackclub.app:/home/haroki/ai-service/

# 2. SSH into server
ssh haroki@hackclub.app

# 3. Build and run Docker container
cd /home/haroki/ai-service
docker build -t bantu-arah-ai-service .
docker run -d \
    --name ai-service \
    -p 8000:8000 \
    -v ai-service-data:/data \
    --env-file .env \
    --restart unless-stopped \
    bantu-arah-ai-service
```

### Managing the Service

#### View logs:
```bash
ssh haroki@hackclub.app 'docker logs -f ai-service'
```

#### Restart the service:
```bash
ssh haroki@hackclub.app 'docker restart ai-service'
```

#### Stop the service:
```bash
ssh haroki@hackclub.app 'docker stop ai-service'
```

#### Check status:
```bash
ssh haroki@hackclub.app 'docker ps -a | grep ai-service'
```

#### Access the server:
```bash
ssh haroki@hackclub.app
```

### Testing the Deployment

Once deployed, test the service:

```bash
curl http://hackclub.app:8000/health
```

You should see a health check response.

### Port Configuration

The service runs on port `8000` by default. Make sure:
- Port 8000 is open in the firewall
- No other service is using port 8000
- Update `FRONTEND_URL` in `.env` to point to your actual frontend URL

### Troubleshooting

#### Container won't start:
```bash
ssh haroki@hackclub.app 'docker logs ai-service'
```

#### Port already in use:
```bash
ssh haroki@hackclub.app 'docker ps | grep 8000'
```

#### Environment variables not loading:
Check the `.env` file exists and has correct permissions:
```bash
ssh haroki@hackclub.app 'ls -la /home/haroki/ai-service/.env'
```

### Security Notes

- The SSH key is embedded in the deployment scripts for convenience
- Consider using SSH config or environment variables for production
- Ensure `.env` file is never committed to version control
- The container data persists in Docker volume `ai-service-data`
