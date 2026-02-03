# Active Context

## Current Phase
**Phase 1: Foundation** - Core infrastructure is ready

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
- [ ] Start Docker services
- [ ] Push database schema
- [ ] Test the application

## Recent Decisions
| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-02-03 | Use Next.js 15 App Router | Full-stack in one, Server Actions |
| 2025-02-03 | Use Judge0 CE self-hosted | Control, no API limits, data ownership |
| 2025-02-03 | Use memory-bank pattern | Maintain context across sessions |

## Current Blockers
None

## Next Steps
1. Install dependencies with `pnpm install`
2. Start Docker services with `docker compose up -d`
3. Push database schema with `pnpm db:push`
4. Test the exam interface flow

## Session Notes
- User wants simple, one-time setup
- 300 concurrent candidates requirement is critical
- Must be self-hosted, no external dependencies on exam day
