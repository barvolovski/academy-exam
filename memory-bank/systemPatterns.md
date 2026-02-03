# System Patterns

## Architecture Patterns

### Server vs Client Components
```
Server Components (default):
- Data fetching
- Database queries
- Sensitive operations

Client Components ("use client"):
- Event handlers
- useState/useEffect
- Browser APIs
```

### API Route Pattern
```typescript
// src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({ /* ... */ })

export async function POST(request: NextRequest) {
  const body = await request.json()
  const data = schema.parse(body)
  // ... handle request
  return NextResponse.json({ success: true })
}
```

### Server Action Pattern
```typescript
// src/lib/[feature]/actions.ts
"use server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function createItem(formData: FormData) {
  const data = schema.parse(Object.fromEntries(formData))
  await db.item.create({ data })
  revalidatePath("/items")
}
```

### Prisma Singleton
```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as { prisma?: PrismaClient }
export const db = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

## Code Execution Pattern
```
1. User submits code
2. Backend validates session
3. Create Judge0 submission (base64 encoded)
4. Poll for result (or use callback)
5. Parse result, save to DB
6. Return to frontend
```

## Proctoring Pattern
```typescript
// Frontend: detect and report events
document.addEventListener("visibilitychange", () => {
  if (document.hidden) reportEvent("tab_switch")
})
document.addEventListener("paste", () => reportEvent("paste"))

// Backend: log events with timestamps
```
