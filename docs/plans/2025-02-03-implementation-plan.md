# Implementation Plan - Academy Platform

**Created:** 2025-02-03
**Status:** Ready for Implementation

---

## Phase 1: Project Foundation (Day 1-2)

### Step 1.1: Initialize Next.js Project
```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

Configuration:
- TypeScript strict mode
- Path aliases (@/*)
- ESLint + Prettier

### Step 1.2: Install Dependencies
```bash
# Core
pnpm add @prisma/client zod

# UI
pnpm add @radix-ui/react-* class-variance-authority clsx tailwind-merge
pnpm dlx shadcn@latest init

# Editor
pnpm add @monaco-editor/react

# Queue
pnpm add bullmq ioredis

# Dev
pnpm add -D prisma @types/node typescript
```

### Step 1.3: Database Setup
- Create Prisma schema from spec
- Set up PostgreSQL in Docker
- Generate client and push schema

### Step 1.4: Docker Configuration
Create `docker-compose.yml` with:
- PostgreSQL 16
- Redis 7
- Judge0 CE

---

## Phase 2: Core Infrastructure (Day 3-4)

### Step 2.1: Judge0 Client
- Create `src/lib/judge0.ts`
- Implement submission and polling
- Add batch submission support
- Handle all error cases

### Step 2.2: Database Layer
- Create `src/lib/db.ts` (Prisma singleton)
- Create query functions for each entity
- Add server actions for mutations

### Step 2.3: Monaco Editor Component
- Create `src/components/editor/code-editor.tsx`
- Configure language support
- Add theme (dark mode)
- Handle onChange events

---

## Phase 3: Admin Dashboard (Day 5-7)

### Step 3.1: Layout
- Admin layout with sidebar navigation
- Problems list page
- Exams list page

### Step 3.2: Problem Management
- Problem list with search/filter
- Problem create/edit form
- Markdown editor for description
- Test case editor (JSON)
- Starter code editor (per language)

### Step 3.3: Exam Management
- Exam list with status indicators
- Exam create/edit form
- Problem selector (drag-drop order)
- Access code generator
- Exam activation controls

---

## Phase 4: Candidate Exam Interface (Day 8-10)

### Step 4.1: Entry Flow
- Access code entry page
- Candidate info form
- Session creation

### Step 4.2: Exam Interface
- Timer component (countdown)
- Problem sidebar navigation
- Code editor with language selector
- Run code button
- Test results display
- Submit problem button

### Step 4.3: Submission Flow
- Final submit confirmation
- Score calculation
- Thank you page

---

## Phase 5: Proctoring & Results (Day 11-12)

### Step 5.1: Proctoring
- Tab switch detection hook
- Copy/paste tracking
- Event logging API
- Activity timeline component

### Step 5.2: Results Dashboard
- Results list with scores
- Candidate detail view
- Code submission viewer
- Proctor events timeline
- CSV export

---

## Phase 6: Testing & Deployment (Day 13-14)

### Step 6.1: Testing
- Unit tests for Judge0 client
- Integration tests for API
- Load test (300 concurrent)

### Step 6.2: Production Setup
- Production Docker config
- DigitalOcean droplet
- Domain + SSL
- Backup script

---

## Success Criteria Checklist

- [ ] 300 candidates can access exam simultaneously
- [ ] Code execution completes within 15 seconds
- [ ] All proctoring events logged correctly
- [ ] Results export works for 300+ candidates
- [ ] System recovers from Judge0 failures
- [ ] Admin can create exam in under 5 minutes
