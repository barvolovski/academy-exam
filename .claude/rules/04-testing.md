# Testing Rules

## Test Structure
- Co-locate test files with source: `component.tsx` → `component.test.tsx`
- Use descriptive test names: "should return error when session expired"
- Group related tests with `describe` blocks

## What to Test

### Must Test
- API routes (all endpoints)
- Server Actions (mutations)
- Code execution flow
- Authentication/authorization
- Score calculation

### Should Test
- Complex utility functions
- Custom hooks
- Form validation

### Optional
- Simple presentational components
- Static content

## Testing Patterns

### API Route Test
```typescript
import { POST } from "@/app/api/exam/run/route"
import { NextRequest } from "next/server"

describe("POST /api/exam/run", () => {
  it("should execute code successfully", async () => {
    const request = new NextRequest("http://localhost/api/exam/run", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "test-session",
        problemId: "test-problem",
        language: "python",
        code: "print('hello')"
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results).toBeDefined()
  })
})
```

### Mock External Services
```typescript
// Mock Judge0
vi.mock("@/lib/judge0", () => ({
  submitCode: vi.fn().mockResolvedValue({
    token: "test-token"
  }),
  getResult: vi.fn().mockResolvedValue({
    status: { id: 3 },
    stdout: "hello\n"
  })
}))
```

## Running Tests
```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # With coverage
pnpm test:e2e       # E2E tests (Playwright)
```
