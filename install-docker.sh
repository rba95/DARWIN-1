#!/bin/bash
# Install Docker Engine on Debian/Ubuntu Linux
# For WSL: use Docker Desktop on Windows instead
set -e

if command -v docker &> /dev/null; then
  echo "Docker already installed: $(docker --version)"
  exit 0
fi

echo "[1/4] Installing prerequisites..."
sudo apt-get update -qq
sudo apt-get install -y ca-certificates curl gnupg lsb-release

echo "[2/4] Adding Docker GPG key..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "[3/4] Adding Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -qq

echo "[4/4] Installing Docker Engine..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER

echo ""
echo "=== Docker installed ==="
echo "Logout and login again to use Docker without sudo."
echo "Then run: ./deploy.sh"
