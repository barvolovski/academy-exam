# Database Rules

## Prisma
- Run `pnpm db:push` after schema changes in development
- Use `pnpm db:migrate` for production migrations
- Always use transactions for multi-table operations
- Use `prisma.$transaction()` for atomic operations

## Schema Design
- UUIDs as primary keys (`@id @default(uuid())`)
- Include timestamps on all tables:
  ```prisma
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  ```
- Use `@map` for snake_case in database
- Define indexes for frequently queried fields

## Queries
- Use Prisma client singleton from `lib/db.ts`
- Select only needed fields with `select`
- Use `include` sparingly - prefer separate queries
- Paginate large result sets

## Connections
- Never create new PrismaClient in components
- Import from `@/lib/db` only
