#!/bin/bash
# Academy - One Command Server Setup
# Run this on a fresh Ubuntu 22.04 server (DigitalOcean, etc.)
# Usage: curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/setup-server.sh | bash

set -e

echo "============================================"
echo "  Academy - Coding Assessment Platform"
echo "  Server Setup Script"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

echo -e "${GREEN}[1/6] Updating system...${NC}"
apt-get update -qq
apt-get upgrade -y -qq

echo -e "${GREEN}[2/6] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "Docker already installed"
fi

echo -e "${GREEN}[3/6] Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
  apt-get install -y -qq docker-compose-plugin
fi

echo -e "${GREEN}[4/6] Cloning Academy...${NC}"
cd /opt
if [ -d "academy" ]; then
  echo "Academy folder exists, pulling latest..."
  cd academy
  git pull
else
  git clone https://github.com/barvolovski/academy-exam.git academy
  cd academy
fi

echo -e "${GREEN}[5/6] Configuring environment...${NC}"
if [ ! -f .env ]; then
  cp .env.example .env

  # Generate random passwords
  DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
  ADMIN_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 12)
  SESSION_SECRET=$(openssl rand -base64 32)

  # Update .env file
  sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=\"$DB_PASS\"/" .env
  sed -i "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=\"$ADMIN_PASS\"/" .env
  sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=\"$SESSION_SECRET\"/" .env

  echo ""
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}  SAVE THESE CREDENTIALS!${NC}"
  echo -e "${YELLOW}========================================${NC}"
  echo -e "  Admin Password: ${GREEN}$ADMIN_PASS${NC}"
  echo -e "  Database Password: ${GREEN}$DB_PASS${NC}"
  echo -e "${YELLOW}========================================${NC}"
  echo ""
fi

echo -e "${GREEN}[6/6] Starting Academy...${NC}"
chmod +x deploy.sh
./deploy.sh start

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Academy is ready!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  App URL:   ${GREEN}http://$SERVER_IP:3000${NC}"
echo -e "  Admin:     ${GREEN}http://$SERVER_IP:3000/admin${NC}"
echo ""
echo -e "  Commands:"
echo -e "    cd /opt/academy"
echo -e "    ./deploy.sh logs     - View logs"
echo -e "    ./deploy.sh stop     - Stop services"
echo -e "    ./deploy.sh start    - Start services"
echo ""
echo -e "${YELLOW}  Note: Save your admin password shown above!${NC}"
echo -e "${GREEN}============================================${NC}"
