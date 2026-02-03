# Bulk Candidate Import Design

**Date:** 2026-02-03
**Status:** Ready for Implementation

## Overview

Allow admins to upload a CSV file to bulk import candidates for an exam. Each imported candidate receives a unique direct link to bypass the access code entry flow.

## CSV Format

```csv
name,email
John Doe,john@example.com
Jane Smith,jane@example.com
```

- Headers required: `name`, `email`
- UTF-8 encoding
- Max file size: 1MB

## User Flow

### Admin Import Flow
1. Admin navigates to `/admin/exams/[id]` (exam edit page)
2. Clicks "Import Candidates" button
3. Redirected to `/admin/exams/[id]/import`
4. Uploads CSV via drag-drop or file picker
5. System processes file:
   - Parses CSV
   - Validates each row (name required, email valid format, no duplicates)
   - Creates ExamSession records with unique tokens
6. Shows results:
   - Success count with list of imported candidates
   - Failed rows with specific error messages
7. Admin can copy individual links or download all links as CSV

### Candidate Direct Join Flow
1. Candidate receives link: `/exam/join/[token]`
2. System looks up ExamSession by token
3. Validates exam is active and within time window
4. Redirects to `/exam/[sessionId]` with session pre-loaded
5. Candidate starts exam immediately (no form entry needed)

## Database Changes

### ExamSession Model Update
```prisma
model ExamSession {
  // ... existing fields ...
  token         String?   @unique  // New: unique token for direct access
  importedAt    DateTime?           // New: when bulk imported (null if self-registered)
}
```

## Files to Create/Modify

### New Files

1. **`src/app/(admin)/admin/exams/[id]/import/page.tsx`**
   - Server component that renders import UI
   - Fetches exam details for context
   - Contains CSVUpload client component

2. **`src/app/api/admin/exams/[id]/import/route.ts`**
   - POST endpoint for CSV upload
   - Parses multipart form data
   - Validates and processes CSV
   - Returns JSON with results

3. **`src/app/(exam)/exam/join/[token]/page.tsx`**
   - Server component for direct join
   - Looks up session by token
   - Validates exam availability
   - Redirects to exam interface or shows error

4. **`src/components/admin/csv-upload.tsx`**
   - Client component with drag-drop zone
   - File validation (type, size)
   - Upload progress indicator
   - Results display

5. **`src/lib/csv.ts`**
   - `parseCSV(content: string)` - Parse CSV to array of objects
   - `escapeCSV(value: string)` - Escape values for CSV output
   - Handle quoted fields, commas in values, line breaks

6. **`src/lib/candidates/actions.ts`**
   - `importCandidates(examId, candidates)` - Create sessions with tokens
   - Uses transaction for consistency

7. **`src/lib/candidates/schemas.ts`**
   - Zod schemas for candidate validation

### Modified Files

1. **`prisma/schema.prisma`**
   - Add `token` and `importedAt` fields to ExamSession

2. **`src/app/(admin)/admin/exams/[id]/page.tsx`**
   - Add "Import Candidates" button linking to import page

3. **`src/app/(admin)/admin/exams/_components/exam-form.tsx`**
   - Add "Import Candidates" link/button

## API Design

### POST `/api/admin/exams/[id]/import`

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (CSV file)

**Response (200):**
```json
{
  "success": true,
  "imported": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "token": "abc123",
      "link": "/exam/join/abc123"
    }
  ],
  "failed": [
    {
      "row": 3,
      "name": "Invalid",
      "email": "not-an-email",
      "error": "Invalid email format"
    }
  ],
  "summary": {
    "total": 10,
    "imported": 8,
    "failed": 2
  }
}
```

**Errors:**
- 400: Invalid file type, file too large, no valid rows
- 404: Exam not found
- 500: Server error

## Validation Rules

1. **File validation:**
   - Must be `.csv` file
   - Max 1MB size
   - Must have `name` and `email` headers

2. **Row validation:**
   - `name`: Required, non-empty, max 255 chars
   - `email`: Required, valid email format, max 255 chars
   - No duplicate emails within same file
   - No duplicate emails with existing sessions for this exam

3. **Token generation:**
   - Use `crypto.randomUUID()` or nanoid
   - 21 character URL-safe string

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid file type | Reject with clear message |
| File too large | Reject with size limit message |
| Missing headers | Reject with format instructions |
| Invalid email | Skip row, include in failed list |
| Duplicate in file | Skip row, include in failed list |
| Duplicate in database | Skip row, include in failed list |
| All rows invalid | Return error, nothing imported |

## UI Components

### Import Page Layout
```
┌─────────────────────────────────────────┐
│ ← Back to Exam                          │
│                                         │
│ Import Candidates: [Exam Title]         │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │     📁 Drop CSV file here           │ │
│ │        or click to browse           │ │
│ │                                     │ │
│ │     Format: name,email              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [After upload - Results Section]        │
│                                         │
│ ✓ 8 candidates imported                 │
│ ✗ 2 rows failed                         │
│                                         │
│ [Download Links CSV] [Copy All Links]   │
│                                         │
│ Imported:                               │
│ ┌─────────────────────────────────────┐ │
│ │ John Doe - john@example.com   [📋] │ │
│ │ Jane Smith - jane@example.com [📋] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Failed:                                 │
│ ┌─────────────────────────────────────┐ │
│ │ Row 3: Invalid email format         │ │
│ │ Row 5: Duplicate email              │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Implementation Order

1. Database schema update (add token field)
2. CSV parsing utility
3. Candidate validation schemas
4. Import API route
5. Direct join page
6. CSV upload component
7. Import page
8. Add import button to exam form
9. Testing

## Test Plan

1. **Unit tests:**
   - CSV parsing with edge cases (quotes, commas, newlines)
   - Email validation
   - Duplicate detection

2. **Integration tests:**
   - Import API with valid CSV
   - Import API with mixed valid/invalid rows
   - Direct join with valid token
   - Direct join with invalid/expired token

3. **Manual testing:**
   - Upload 5-candidate CSV
   - Verify sessions created
   - Use direct link to join exam
   - Test error cases (invalid emails, duplicates)

## Security Considerations

- Tokens are unguessable (UUID/nanoid)
- No PII in URLs beyond the token
- Rate limit import endpoint
- Validate file content, not just extension
- Sanitize CSV content before database insertion
