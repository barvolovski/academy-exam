# Execute Plan

Implement the current plan with quality checks.

## Instructions

1. **Verify plan exists**
   - Check activeContext.md for current plan
   - If no plan, run /workflow-plan first

2. **Implement step by step**
   - Follow the plan order
   - Check each step against systemPatterns.md
   - Use established conventions

3. **Quality checks after each file**
   - No `any` types
   - Proper error handling
   - Follows project patterns

4. **Test if applicable**
   - Run relevant tests
   - Check TypeScript: `pnpm typecheck`
   - Check lint: `pnpm lint`

5. **After completion**
   - Run /workflow-update-memory to document progress
