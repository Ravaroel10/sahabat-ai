#!/bin/bash
cd /home/haroki/ai-service

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    exit 1
fi

# Check if we need sudo for docker
if ! docker ps >/dev/null 2>&1; then
    echo "Using sudo for Docker commands..."
    DOCKER="sudo docker"
else
    DOCKER="docker"
fi

# Stop existing container
echo "Stopping existing container..."
$DOCKER stop ai-service 2>/dev/null || true
$DOCKER rm ai-service 2>/dev/null || true

# Build image
echo "Building Docker image..."
$DOCKER build -t bantu-arah-ai-service .

# Run container
echo "Starting container..."
$DOCKER run -d \
    --name ai-service \
    -p 8000:8000 \
    -v ai-service-data:/data \
    --env-file .env \
    --restart unless-stopped \
    bantu-arah-ai-service

# Check status
sleep 5
if $DOCKER ps | grep -q ai-service; then
    echo ""
    echo "SUCCESS: Container is running!"
    echo ""
    echo "Logs:"
    $DOCKER logs --tail 20 ai-service
    echo ""
    echo "Status:"
    $DOCKER ps | grep ai-service
    exit 0
else
    echo ""
    echo "ERROR: Container failed to start!"
    echo ""
    echo "Logs:"
    $DOCKER logs ai-service
    exit 1
fi
