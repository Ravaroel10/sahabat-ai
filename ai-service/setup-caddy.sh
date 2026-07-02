#!/bin/bash
# Install and configure Caddy reverse proxy

echo "Installing Caddy..."

# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# Configure Caddy for the AI service
echo "Configuring Caddy..."
sudo tee /etc/caddy/Caddyfile > /dev/null <<'EOF'
haroki.hackclub.app:8000 {
    reverse_proxy localhost:8000
}

haroki.hackclub.app {
    reverse_proxy localhost:8000
}
EOF

# Restart Caddy
echo "Restarting Caddy..."
sudo systemctl restart caddy
sudo systemctl enable caddy

# Check status
echo ""
echo "Caddy status:"
sudo systemctl status caddy --no-pager

echo ""
echo "Configuration complete!"
echo "Your AI service should now be accessible at:"
echo "- http://haroki.hackclub.app:8000"
echo "- http://haroki.hackclub.app (port 80)"
