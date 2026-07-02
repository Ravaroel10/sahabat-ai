# AI Service Deployment to hackclub.app

## Current Status

✅ Deployment scripts created
✅ Environment file configured  
⚠️ **ACTION NEEDED:** Set up SSH private key access

## What You Have

- **Server:** hackclub.app
- **User:** haroki
- **SSH Public Key:** Already provided
- **Environment:** Configured in `ai-service/.env`
- **Port:** 8000

## What You Need

The **SSH private key** file that corresponds to the public key.

## Choose Your Deployment Method

### Option 1: Automated (Requires SSH Key Setup) ⚡

**Best for:** Regular deployments, fastest method

1. Set up SSH key (see `SSH_SETUP.md`)
2. Run: `.\deploy-simple.ps1`

📖 Full guide: `SSH_SETUP.md`

### Option 2: Manual (Works Without Scripts) 🔧

**Best for:** One-time deployment, no SSH key available yet

1. Get SSH access to server
2. Upload files via WinSCP/SCP
3. Build and run Docker container

📖 Full guide: `MANUAL_DEPLOY.md`

## Quick Start (Once SSH Works)

```powershell
# Test SSH first
ssh haroki@hackclub.app "echo It works!"

# Deploy
cd k:\projects\dev\bantu-arah\ai-service
.\deploy-simple.ps1

# Test
curl http://hackclub.app:8000/health
```

## Files Created

| File | Purpose |
|------|---------|
| `deploy-simple.ps1` | Main deployment script (uses system SSH) |
| `deploy.ps1` | Advanced deployment with embedded key |
| `copy-env.ps1` | Copy .env file only |
| `SSH_SETUP.md` | Complete SSH setup guide |
| `MANUAL_DEPLOY.md` | Manual deployment instructions |
| `DEPLOYMENT.md` | Comprehensive deployment documentation |

## Your Service Configuration

```
LLM Provider: OpenRouter
- Primary: openai/gpt-oss-120b:free
- Fallbacks: nvidia/nemotron-3-ultra-550b-a55b:free, openrouter/free

Embeddings: HuggingFace
- Model: sentence-transformers/all-MiniLM-L6-v2

Vector Database: ChromaDB
- Path: /data/chroma (Docker volume)

Search: 
- Brave Search API
- Exa API

Port: 8000
Frontend URL: https://hackclub.app
```

## Next Steps

1. **Get SSH Access**
   - Locate the SSH private key file, OR
   - Ask server admin to add your public key, OR
   - Use manual deployment method

2. **Deploy**
   - Use `deploy-simple.ps1` (if SSH works), OR
   - Follow `MANUAL_DEPLOY.md`

3. **Test**
   ```bash
   curl http://hackclub.app:8000/health
   curl http://hackclub.app:8000/docs
   ```

4. **Monitor**
   ```bash
   ssh haroki@hackclub.app "docker logs -f ai-service"
   ```

## Common Commands

```powershell
# Deploy
.\deploy-simple.ps1

# View logs
ssh haroki@hackclub.app "docker logs -f ai-service"

# Restart service
ssh haroki@hackclub.app "docker restart ai-service"

# Check status
ssh haroki@hackclub.app "docker ps | grep ai-service"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Permission denied (publickey)" | Set up SSH private key (see `SSH_SETUP.md`) |
| "Connection refused" | Check server is accessible |
| Container won't start | Check logs: `docker logs ai-service` |
| Port in use | Kill process on port 8000 |

## Architecture

```
Your Machine (Windows)
    ↓ (SSH/SCP)
hackclub.app Server
    ↓
Docker Container (ai-service)
    ├─ FastAPI on port 8000
    ├─ ChromaDB in /data volume
    └─ LLM via OpenRouter API
```

## Support

For help, check these files in order:
1. This file (overview)
2. `SSH_SETUP.md` (SSH issues)
3. `MANUAL_DEPLOY.md` (step-by-step manual)
4. `DEPLOYMENT.md` (comprehensive guide)

## Security Notes

- ✅ Environment variables stored in `.env` (not in version control)
- ✅ API keys configured
- ⚠️ SSH private key needed (keep secure, never commit)
- ✅ Docker container runs with restart policy
- ✅ Data persists in Docker volume

---

**Ready to deploy?** Start with getting SSH access working, then run `.\deploy-simple.ps1`!
