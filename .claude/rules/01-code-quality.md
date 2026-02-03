# Code Quality Rules

## TypeScript
- NEVER use `any` type - use `unknown` and type guards instead
- Enable strict mode in tsconfig.json
- Export types from dedicated `types/` directory
- Use Zod for runtime validation at boundaries

## React Components
- Prefer Server Components by default
- Add "use client" only when using hooks, events, or browser APIs
- Keep components under 150 lines
- Extract logic into custom hooks
- Use composition over prop drilling

## File Organization
- One component per file
- Co-locate tests with source files (*.test.ts)
- Group by feature, not by type
- Index files only for public exports

## Error Handling
- Always handle errors explicitly
- Use Result pattern for expected failures
- Log errors with context
- Show user-friendly messages in UI
