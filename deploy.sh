#!/bin/bash
# Academy Simple Deploy Script
# Usage: ./deploy.sh [start|stop|restart|logs|status]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.prod.yml"

case "$1" in
  start)
    echo -e "${GREEN}Starting Academy...${NC}"
    docker compose -f $COMPOSE_FILE up -d --build
    echo -e "${GREEN}Waiting for services...${NC}"
    sleep 10
    echo -e "${GREEN}Running database migrations...${NC}"
    docker compose -f $COMPOSE_FILE exec app npx prisma db push --skip-generate
    echo -e "${GREEN}Academy is running at http://localhost:3000${NC}"
    ;;

  stop)
    echo -e "${YELLOW}Stopping Academy...${NC}"
    docker compose -f $COMPOSE_FILE down
    echo -e "${GREEN}Stopped.${NC}"
    ;;

  restart)
    echo -e "${YELLOW}Restarting Academy...${NC}"
    docker compose -f $COMPOSE_FILE restart
    echo -e "${GREEN}Restarted.${NC}"
    ;;

  logs)
    docker compose -f $COMPOSE_FILE logs -f ${2:-app}
    ;;

  status)
    docker compose -f $COMPOSE_FILE ps
    ;;

  rebuild)
    echo -e "${YELLOW}Rebuilding Academy...${NC}"
    docker compose -f $COMPOSE_FILE up -d --build --force-recreate app
    sleep 5
    docker compose -f $COMPOSE_FILE exec app npx prisma db push --skip-generate
    echo -e "${GREEN}Rebuilt and running.${NC}"
    ;;

  *)
    echo "Academy Deploy Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start    - Start all services"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  rebuild  - Rebuild and restart app"
    echo "  logs     - View logs (default: app, or specify service)"
    echo "  status   - Show service status"
    ;;
esac
