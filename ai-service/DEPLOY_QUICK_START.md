# Quick Start: Deploy AI Service to hackclub.app

## 🚀 One-Command Deployment

```powershell
cd ai-service
.\deploy-complete.ps1
```

This will:
1. ✅ Copy your `.env` file to the server (if it exists)
2. 🐳 Build and deploy the Docker container
3. ✅ Verify the deployment

## 📋 Prerequisites Checklist

- [ ] Docker installed on `hackclub.app` server
- [ ] `.env` file configured (copy from `.env.example`)
- [ ] API keys configured in `.env`:
  - `LLM_API_KEY` (Gemini)
  - `EMBEDDING_API_KEY` (OpenAI)
  - `BRAVE_SEARCH_API_KEY`

## 🔧 Individual Scripts

If you need more control, use individual scripts:

### 1. Copy environment file only:
```powershell
.\copy-env.ps1
```

### 2. Deploy without copying .env:
```powershell
.\deploy.ps1
```

## 🧪 Test the Deployment

```bash
# Health check
curl http://hackclub.app:8000/health

# View API docs
curl http://hackclub.app:8000/docs
```

## 📊 Monitor the Service

```powershell
# View logs
ssh haroki@hackclub.app "docker logs -f ai-service"

# Check status
ssh haroki@hackclub.app "docker ps | grep ai-service"

# Restart service
ssh haroki@hackclub.app "docker restart ai-service"
```

## ⚠️ Troubleshooting

### "Permission denied" error
Make sure Docker is installed and you have permissions:
```bash
ssh haroki@hackclub.app "docker --version"
```

### Port 8000 already in use
Check what's using the port:
```bash
ssh haroki@hackclub.app "netstat -tulpn | grep 8000"
```

### Container crashes on startup
Check the logs:
```bash
ssh haroki@hackclub.app "docker logs ai-service"
```

Common causes:
- Missing or invalid `.env` file
- Invalid API keys
- Database connection issues

### Fix and redeploy
After fixing issues, simply run the deployment script again:
```powershell
.\deploy.ps1
```

## 🔐 Security Note

The SSH key is embedded in the scripts. For production:
1. Store the key in a secure location
2. Use SSH config (`~/.ssh/config`)
3. Or use environment variables

## 📚 Full Documentation

See `DEPLOYMENT.md` for comprehensive deployment guide.

## 🆘 Need Help?

1. Check logs: `ssh haroki@hackclub.app "docker logs ai-service"`
2. Check server status: `ssh haroki@hackclub.app "docker ps -a"`
3. Review `.env` configuration on the server
