# Active Context

## Current Phase
**Phase 5: Testing & Deployment** - Application tested and working

## What We're Working On
- [x] Created project specifications
- [x] Set up Claude Code memory bank
- [x] Created workflow commands
- [x] Initialize Next.js project
- [x] Set up database schema (Prisma)
- [x] Configure Docker services
- [x] Created Judge0 client
- [x] Created admin pages (dashboard, problems, exams)
- [x] Created exam entry page
- [x] Created API routes (start, run)
- [x] Created Monaco Editor component
- [x] Created exam interface components (timer, sidebar, test results)
- [x] Created main exam page with code editor
- [x] Start Docker services
- [x] Push database schema
- [x] Test the application

## Recent Decisions
| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-02-03 | Use Next.js 15 App Router | Full-stack in one, Server Actions |
| 2025-02-03 | Use Judge0 CE self-hosted | Control, no API limits, data ownership |
| 2025-02-03 | Use memory-bank pattern | Maintain context across sessions |
| 2026-02-03 | Enable JUDGE0_MOCK_MODE on macOS | Judge0 requires Linux cgroups unavailable in Docker Desktop |
| 2026-02-03 | Simple production deployment | Single docker-compose, deploy.sh script, no nginx complexity |

## Current Blockers
None

## Next Steps
1. Add authentication for admin panel
2. Deploy to DigitalOcean production server

## Dev Scripts (2026-02-03)
- `./start.sh` - Start dev environment (Docker + Next.js)
- `./stop.sh` - Stop Docker services
- Fixed db:push hanging with `--accept-data-loss` flag
- Added `platform: linux/amd64` for Judge0 on Apple Silicon

## Deployment Configuration (2026-02-03)
Files created:
- `Dockerfile` - Multi-stage build for Next.js standalone
- `docker-compose.prod.yml` - Production services with Judge0 workers
- `deploy.sh` - Simple deployment script (start/stop/logs/status)
- `DEPLOY.md` - Quick deployment guide
- `src/app/api/health/route.ts` - Health check endpoint

## Session Notes
- User wants simple, one-time setup
- 300 concurrent candidates requirement is critical
- Must be self-hosted, no external dependencies on exam day

## Testing Results (2026-02-03)
All core features tested and working:
- Admin dashboard with stats
- Problem CRUD with Monaco editor
- Exam creation/management
- Candidate exam flow
- Code execution (mock mode)
- Proctor event tracking
- LeetCode problem import catalog
- CSV export for exam results (with BOM for Excel compatibility)
- Bulk candidate import via CSV with direct access links
