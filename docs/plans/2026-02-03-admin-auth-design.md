# Admin Panel Authentication Design

## Overview

Protect `/admin/*` routes with password-based authentication using signed JWT cookies.

## Decisions

- **Single admin**: One shared password for all admins
- **Stateless sessions**: JWT stored in signed cookie (no server-side storage)
- **24-hour expiry**: Sessions last 24 hours before requiring re-login

## Authentication Flow

```
User visits /admin/*
        ↓
Middleware checks for valid JWT cookie
        ↓
┌─────────────────┐     ┌──────────────────────────────┐
│ Valid cookie?   │ NO  │ Redirect to /admin/login     │
│                 │────→│                              │
└────────┬────────┘     └──────────────────────────────┘
         │ YES
         ↓
Allow access to admin page
```

**Login**: Enter password → server verifies with timing-safe comparison → set JWT cookie → redirect to /admin

**Logout**: POST to logout endpoint → clear cookie → redirect to /admin/login

## Files

### New Files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Auth utilities (sign/verify JWT, check password) |
| `src/middleware.ts` | Route protection for `/admin/*` |
| `src/app/(admin)/admin/login/page.tsx` | Login form page |
| `src/app/api/admin/login/route.ts` | POST handler to verify password, set cookie |
| `src/app/api/admin/logout/route.ts` | POST handler to clear cookie |

### Modified Files

| File | Change |
|------|--------|
| `.env.example` | Add `ADMIN_PASSWORD` |
| `src/app/(admin)/layout.tsx` | Add logout button to sidebar |
| `package.json` | Add `jose` dependency |

## Implementation Details

### Cookie Settings

- Name: `admin_session`
- HttpOnly: true
- Secure: true in production
- SameSite: lax
- Path: /admin
- MaxAge: 24 hours

### Environment Variables

```
ADMIN_PASSWORD="your-secure-password-here"
SESSION_SECRET="your-session-secret-here"  # already exists
```

### Dependencies

- `jose` - JWT signing/verification

## Login Page UI

- Centered card with "Admin Login" heading
- Single password field
- "Sign In" button
- Error message display for wrong password
- Matches existing admin UI style
