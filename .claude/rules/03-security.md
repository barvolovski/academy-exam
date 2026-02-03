# Security Rules

## Input Validation
- Validate ALL user input with Zod
- Sanitize before database operations
- Never trust client-side data

## Code Execution (Judge0)
- Never expose Judge0 directly to frontend
- All submissions go through backend API
- Rate limit submissions per session
- Set execution timeouts (max 10 seconds)
- Memory limits per submission

## Exam Security
- Generate unique access codes per exam
- Track tab switches and copy/paste events
- Log all suspicious activity
- Timeout inactive sessions (30 min)

## API Security
- Validate exam session tokens
- No sensitive data in URLs
- Use HTTP-only cookies for sessions
- CORS configured for production domain only

## Environment
- Never commit .env files
- Use different secrets per environment
- Rotate secrets regularly
