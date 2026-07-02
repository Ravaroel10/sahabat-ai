# AI Service Deployment Status

## ✅ Deployment Complete!

Your AI service is successfully deployed and running on the server!

### Current Status

- **Container**: ✅ Running
- **Health**: ✅ Healthy (`{"status":"healthy","chromadb":"connected"}`)
- **Port**: 8000
- **Nest Reverse Proxy**: ⚠️ **CONFIGURE IN DASHBOARD**

### Access Information

#### Configure Nest Reverse Proxy

**IMPORTANT**: Go to [Nest Dashboard](https://dashboard.hackclub.app) and configure the reverse proxy:

1. **Log in** to the Nest Dashboard at https://dashboard.hackclub.app
2. **Go to the "Domains" tab**
3. **Add Domain**:
   - Domain: `haroki.hackclub.app`
   - Target Port: `8000`
   - Click "Add Domain"

4. If you get "unauthorized" error, reload the page and try again (known bug)

Once configured, your service will be accessible at:
- `http://haroki.hackclub.app/health`
- `http://haroki.hackclub.app/docs`
- `http://haroki.hackclub.app/chat`

#### From the Server (Local Testing)
```bash
ssh haroki@hackclub.app
curl http://localhost:8000/health
# {"status":"healthy","chromadb":"connected"}
```

### Service Management

#### View Logs
```bash
ssh haroki@hackclub.app "docker logs -f ai-service"
```

#### Restart Service
```bash
ssh haroki@hackclub.app "docker restart ai-service"
```

#### Stop Service
```bash
ssh haroki@hackclub.app "docker stop ai-service"
```

#### Start Service
```bash
ssh haroki@hackclub.app "docker start ai-service"
```

#### Rebuild and Redeploy
From your local machine:
```powershell
cd k:\projects\dev\bantu-arah\ai-service
scp Dockerfile haroki@hackclub.app:/home/haroki/ai-service/
ssh haroki@hackclub.app "cd /home/haroki/ai-service && docker stop ai-service && docker rm ai-service && docker build -t bantu-arah-ai-service . && docker run -d --name ai-service -p 8000:8000 --env-file .env -v ai-service-data:/data bantu-arah-ai-service"
```

### Nest Dashboard Configuration

The Nest platform provides an automatic reverse proxy through the dashboard. No need to manually configure Caddy or nginx!

**To enable public access**:

1. Go to https://dashboard.hackclub.app
2. Navigate to the **Domains** tab
3. Add a new domain:
   - **Domain**: `haroki.hackclub.app`
   - **Target Port**: `8000`
4. Click **Add Domain**

The Nest platform will automatically:
- Configure the reverse proxy
- Route traffic from `haroki.hackclub.app` to your container on port 8000
- Handle SSL/TLS certificates (HTTPS)

**Note**: If you get an "unauthorized" error when adding the domain, just reload the page and try again - it's a known bug.

### API Endpoints

Once DNS is configured, your service will be available at:

```
Health Check:
http://haroki.hackclub.app/health

API Documentation:
http://haroki.hackclub.app/docs

Chat Endpoint:
POST http://haroki.hackclub.app/chat
```

### Environment Configuration

Your service is running with:
- **LLM**: OpenRouter (GPT-OSS-120B + fallbacks)
- **Embeddings**: HuggingFace (sentence-transformers/all-MiniLM-L6-v2)
- **Vector DB**: ChromaDB (persisted in Docker volume)
- **Search**: Brave Search + Exa

### Next Steps

1. ✅ **Container is running** - Service is healthy on port 8000
2. ⚠️ **Configure Nest Dashboard** - Add domain in dashboard.hackclub.app
3. 🧪 **Test the service** - Once domain is added, test at http://haroki.hackclub.app/health
4. 🔒 **HTTPS will auto-enable** - Nest automatically configures SSL certificates
5. 🎯 **Update your frontend** - Point to `https://haroki.hackclub.app`

### Troubleshooting

#### Container not responding
```bash
ssh haroki@hackclub.app "docker ps | grep ai-service"
ssh haroki@hackclub.app "docker logs --tail 100 ai-service"
```

#### Port issues
```bash
ssh haroki@hackclub.app "ss -tulpn | grep 8000"
```

#### Caddy issues
```bash
ssh haroki@hackclub.app "sudo systemctl status caddy"
ssh haroki@hackclub.app "sudo journalctl -u caddy -n 50"
```

### Summary

🎉 **Your AI service is deployed and running successfully!**

The only remaining step is to configure DNS to point to your server, then you'll be able to access it publicly at `http://haroki.hackclub.app`.
