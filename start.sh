#!/bin/bash
# start.sh - Start Academy in development mode

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Academy Development Environment${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env created - update it with your settings if needed${NC}"
fi

# Start Docker services
echo -e "${YELLOW}Starting Docker services...${NC}"
docker compose up -d

# Wait for PostgreSQL to be healthy
echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Wait for Redis
echo -e "${YELLOW}Waiting for Redis...${NC}"
until docker compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✓ Redis is ready${NC}"

# Generate Prisma client if needed
echo -e "${YELLOW}Generating Prisma client...${NC}"
pnpm db:generate > /dev/null 2>&1
echo -e "${GREEN}✓ Prisma client ready${NC}"

# Push database schema (use --accept-data-loss in dev to avoid interactive prompts)
echo -e "${YELLOW}Pushing database schema...${NC}"
pnpm db:push --accept-data-loss 2>&1 | grep -v "^$"
echo -e "${GREEN}✓ Database schema pushed${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Academy is ready!${NC}"
echo ""
echo -e "  App:    ${GREEN}http://localhost:3000${NC}"
echo -e "  Admin:  ${GREEN}http://localhost:3000/admin${NC}"
echo ""
echo -e "  ${YELLOW}Note: Judge0 requires Linux. Using mock mode on macOS.${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Start Next.js dev server
echo -e "${YELLOW}Starting Next.js dev server...${NC}"
echo ""
pnpm dev
