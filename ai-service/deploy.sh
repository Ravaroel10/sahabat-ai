#!/bin/bash

# Deployment script for ai-service to hackclub.app
# Usage: ./deploy.sh

set -e

# Configuration
SSH_USER="haroki"
SSH_HOST="hackclub.app"
SSH_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP72j/yORhad0SpvKMvQTbV2IuMVkQ1Bskj/Z/3y90Y1"
REMOTE_DIR="/home/haroki/ai-service"
IMAGE_NAME="bantu-arah-ai-service"
CONTAINER_NAME="ai-service"

echo "🚀 Starting deployment to ${SSH_HOST}..."

# Save SSH key to temporary file
SSH_KEY_FILE=$(mktemp)
echo "${SSH_KEY}" > "${SSH_KEY_FILE}"
chmod 600 "${SSH_KEY_FILE}"

# Function to cleanup temp file on exit
cleanup() {
    rm -f "${SSH_KEY_FILE}"
}
trap cleanup EXIT

# Test SSH connection
echo "Testing SSH connection..."
ssh -i "${SSH_KEY_FILE}" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" "echo 'SSH connection successful'"

# Create remote directory
echo "Creating remote directory..."
ssh -i "${SSH_KEY_FILE}" "${SSH_USER}@${SSH_HOST}" "mkdir -p ${REMOTE_DIR}"

# Copy files to remote server
echo "Copying files to remote server..."
rsync -avz -e "ssh -i ${SSH_KEY_FILE} -o StrictHostKeyChecking=no" \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='tests/' \
    --exclude='*.md' \
    ./ "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"

# Copy .env.example as reference
echo "Copying environment template..."
rsync -avz -e "ssh -i ${SSH_KEY_FILE}" \
    .env.example "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/.env.example"

# Build and run on remote server
echo "Building and starting Docker container on remote server..."
ssh -i "${SSH_KEY_FILE}" "${SSH_USER}@${SSH_HOST}" << 'ENDSSH'
cd /home/haroki/ai-service

# Check if .env exists, if not prompt user
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please create one based on .env.example"
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

# Wait a bit and check if container is running
sleep 5
if docker ps | grep -q ai-service; then
    echo "✅ Container is running!"
    docker logs --tail 20 ai-service
else
    echo "❌ Container failed to start. Logs:"
    docker logs ai-service
    exit 1
fi

# Show container status
echo ""
echo "Container status:"
docker ps -a | grep ai-service
ENDSSH

echo ""
echo "✅ Deployment complete!"
echo "Service should be available at: http://${SSH_HOST}:8000"
echo "Check logs with: ssh -i <key> ${SSH_USER}@${SSH_HOST} 'docker logs -f ai-service'"
