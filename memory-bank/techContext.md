# Technical Context

## Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 15 (App Router) |
| Language | TypeScript | 5.x (strict) |
| Database | PostgreSQL | 16 |
| ORM | Prisma | Latest |
| Code Execution | Judge0 CE | Latest |
| Editor | Monaco Editor | @monaco-editor/react |
| Styling | Tailwind CSS + shadcn/ui | Latest |
| Queue | Redis + BullMQ | 7 |
| Deployment | Docker Compose | DigitalOcean |

## Key Integrations

### Judge0 API
- URL: `http://localhost:2358` (dev) / configured in production
- Languages: Python (71), Java (62), C++ (54), Go (60)
- Submission flow: POST submission → poll for result
- Timeout: 10 seconds, Memory: 256MB

### Database
- Connection via Prisma singleton pattern
- All tables use UUID primary keys
- snake_case in DB, camelCase in code

## Development Commands
```bash
pnpm dev          # Start Next.js dev server
pnpm db:push      # Push Prisma schema
pnpm db:studio    # Open Prisma Studio
docker compose up # Start infrastructure
```

## Environment Variables
See `.env.example` for required variables.
