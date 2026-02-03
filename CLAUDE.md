# Academy - Coding Assessment Platform

## Quick Reference
- **Stack**: Next.js 15, TypeScript, Prisma, Judge0, Monaco Editor
- **Database**: PostgreSQL (Docker)
- **Queue**: Redis + BullMQ

## Commands
```bash
pnpm dev              # Dev server
pnpm db:push          # Push schema
pnpm lint             # Lint check
pnpm typecheck        # Type check
docker compose up -d  # Start services
```

## Code Style
- Server Components by default, "use client" only when needed
- No `any` types - use proper typing
- Zod for input validation
- Files: kebab-case, Components: PascalCase

## Git
- Branches: `feature/`, `fix/`, `chore/`
- Run lint + typecheck before commit

## Memory Bank
Project context is maintained in `memory-bank/`:
- projectbrief.md - Goals and requirements
- techContext.md - Stack and integrations
- systemPatterns.md - Code patterns
- activeContext.md - Current work focus
- progress.md - Completed work

## Workflow Commands
- `/workflow-understand` - Load context before starting
- `/workflow-plan` - Plan implementation
- `/workflow-execute` - Implement with quality checks
- `/workflow-update-memory` - Update docs after completing work

**Important**: Run `/workflow-update-memory` after completing any significant work to keep documentation in sync.

@memory-bank/activeContext.md
