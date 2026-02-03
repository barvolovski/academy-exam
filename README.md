# Academy - Coding Assessment Platform

Self-hosted coding assessment platform for technical interviews. Handle 300 concurrent candidates with real-time code execution.

## Features

- **Code Editor**: Monaco Editor (VS Code engine) with syntax highlighting
- **Languages**: Python, Java, C++, Go
- **Code Execution**: Judge0 sandboxed execution
- **Proctoring**: Tab switch detection, copy/paste tracking
- **Results**: Scores, rankings, code review, CSV export

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- pnpm

### Setup

```bash
# Clone and install
git clone <repo>
cd academy
pnpm install

# Start infrastructure
docker compose up -d

# Setup database
cp .env.example .env
pnpm db:push
pnpm db:seed

# Start development
pnpm dev
```

### Access
- **App**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **Judge0 API**: http://localhost:2358

## Project Structure

```
academy/
├── src/
│   ├── app/           # Next.js pages
│   ├── components/    # React components
│   ├── lib/           # Utilities
│   └── types/         # TypeScript types
├── prisma/            # Database schema
├── docker/            # Docker configs
└── docs/              # Documentation
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm lint` | Run linter |
| `pnpm typecheck` | Check TypeScript |

## Documentation

- [Project Spec](docs/specs/project-spec.md)
- [Database Schema](docs/specs/database-schema.md)
- [API Spec](docs/specs/api-spec.md)
- [Implementation Plan](docs/plans/2025-02-03-implementation-plan.md)

## Claude Code

This project includes Claude Code configuration for AI-assisted development:

- **CLAUDE.md**: Project context and conventions
- **.claude/rules/**: Code quality rules
- **.claude/agents/**: Custom review agents
- **.claude/commands/**: Workflow commands
- **.claude/skills/**: Domain-specific skills

## License

Private - Internal Use Only
