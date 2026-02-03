# Academy - Quick Deployment Guide

## Requirements
- Linux server (Ubuntu 22.04 recommended)
- Docker & Docker Compose
- 4GB+ RAM (8GB for 300 users)
- 20GB disk space

## Quick Start (5 minutes)

### 1. Clone and configure
```bash
git clone <your-repo> academy
cd academy

# Create .env file
cp .env.example .env

# Edit .env - set these:
# DB_PASSWORD=your-secure-password
# ADMIN_PASSWORD=your-admin-password
```

### 2. Deploy
```bash
./deploy.sh start
```

### 3. Access
- App: http://your-server:3000
- Admin: http://your-server:3000/admin

## Commands

| Command | Description |
|---------|-------------|
| `./deploy.sh start` | Start all services |
| `./deploy.sh stop` | Stop all services |
| `./deploy.sh restart` | Restart services |
| `./deploy.sh rebuild` | Rebuild app after code changes |
| `./deploy.sh logs` | View app logs |
| `./deploy.sh logs judge0` | View Judge0 logs |
| `./deploy.sh status` | Check service status |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | postgres | Database password |
| `ADMIN_PASSWORD` | admin123 | Admin panel password |
| `JUDGE0_MOCK_MODE` | false | Set true if Judge0 not working |

## For DigitalOcean

### Recommended Droplet
- **Basic:** $48/mo (4GB RAM, 2 vCPU) - up to 100 users
- **Production:** $96/mo (8GB RAM, 4 vCPU) - 300 users

### Setup
```bash
# SSH to droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and deploy
git clone <repo> academy && cd academy
cp .env.example .env
nano .env  # Set passwords
./deploy.sh start
```

### Firewall
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 3000  # App (or use nginx proxy)
ufw enable
```

## Nginx Reverse Proxy (Optional)

For domain + HTTPS:

```nginx
server {
    listen 80;
    server_name exam.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then run `certbot --nginx` for free SSL.

## Troubleshooting

### App won't start
```bash
./deploy.sh logs app
```

### Database issues
```bash
docker compose -f docker-compose.prod.yml exec app npx prisma db push
```

### Judge0 not executing code
Set `JUDGE0_MOCK_MODE=true` in .env and rebuild:
```bash
./deploy.sh rebuild
```

### Check health
```bash
curl http://localhost:3000/api/health
```

## Backup

### Database
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres academy > backup.sql
```

### Restore
```bash
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres academy
```
