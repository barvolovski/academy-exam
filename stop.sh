#!/bin/bash
# stop.sh - Stop Academy development services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping Docker services...${NC}"
docker compose down

echo -e "${GREEN}✓ Academy stopped${NC}"
echo ""
echo "Data is preserved in Docker volumes."
echo "Run ./start.sh to start again."
