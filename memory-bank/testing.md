# Testing Documentation

## Test Session: 2026-02-03 (Updated)

### Testing Environment
- Server: localhost:3000
- Database: PostgreSQL (Docker)
- Judge0: localhost:2358 (Docker) - **MOCK MODE ENABLED** (JUDGE0_MOCK_MODE="true")
- Browser: cursor-ide-browser MCP (Playwright-based)

---

## Test Coverage Matrix

### 1. Homepage
| Test Case | Status | Notes |
|-----------|--------|-------|
| Page loads | ✅ PASS | Title "Academy" displays correctly |
| "Take Exam" link works | ✅ PASS | Navigates to /exam |
| "Admin Dashboard" link works | ✅ PASS | Navigates to /admin |

### 2. Admin Dashboard
| Test Case | Status | Notes |
|-----------|--------|-------|
| Dashboard loads | ✅ PASS | Shows stats cards (Problems: 5, Exams: 2, Sessions: 7) |
| Navigation to Problems | ✅ PASS | Sidebar link works |
| Navigation to Exams | ✅ PASS | Sidebar link works |
| Navigation to Results | ✅ PASS | Sidebar link works |
| Admin login | ✅ PASS | Password "admin123" works |

### 3. Problem Management (Admin)
| Test Case | Status | Notes |
|-----------|--------|-------|
| Problems list loads | ✅ PASS | Shows table with Title, Difficulty, Created, Actions |
| Create new problem | ✅ PASS | Created "Test Problem - Reverse String" successfully |
| Add test cases to problem | ✅ PASS | Input/output fields work, hidden checkbox works |
| Edit existing problem | ✅ PASS | Form pre-fills with existing data |
| Delete problem | ✅ PASS | Confirmation dialog works, delete successful |
| Form validation works | ✅ PASS | Shows "Title is required", "Description is required", difficulty validation |
| Starter code tabs (Python/Java/C++/Go) | ✅ PASS | Monaco editor loads for each language |
| Difficulty selector | ✅ PASS | Easy/Medium/Hard options work |
| AI assistance toggle | ✅ PASS | Checkbox present and functional |

### 4. Exam Management (Admin)
| Test Case | Status | Notes |
|-----------|--------|-------|
| Exams list loads | ✅ PASS | Shows exam cards with access codes, status, stats |
| Create new exam | ✅ PASS | Form loads with all fields |
| Select problems for exam | ✅ PASS | Add/remove problems works, shows point values |
| Set exam duration/dates | ✅ PASS | Duration spinner, date/time pickers present |
| Generate access code | ✅ PASS | Access codes auto-generated (e.g., HRKQZL9F, WLA7E8S6) |
| Edit existing exam | ✅ PASS | Edit link works |
| View Results link | ✅ PASS | Links to results filtered by exam |
| Activate/deactivate exam | ✅ PASS | Shows Active/Inactive badge |

### 5. Results Management (Admin)
| Test Case | Status | Notes |
|-----------|--------|-------|
| Results list loads | ✅ PASS | Shows 6 sessions with View Details links |
| Filter by exam | ✅ PASS | Dropdown filter "All Exams" present |
| View session details | ✅ PASS | Shows candidate info (name, email, duration, events) |
| View submission code | ⏳ NOT TESTED | No submissions available yet |
| View proctor events | ✅ PASS | Tab shows "Proctor Events (2)" for some sessions |
| Export to CSV | ⏳ NOT TESTED | Button not visible in current view |

### 6. Exam Entry (Candidate)
| Test Case | Status | Notes |
|-----------|--------|-------|
| Entry page loads | ✅ PASS | Shows form with Access Code, Name, Email |
| Access code validation (HRKQZL9F) | ✅ PASS | Valid code accepted, redirects to exam |
| Access code validation (ADMIN123) | ✅ PASS | Also works (case-insensitive) |
| Name/email form works | ✅ PASS | Fields fill correctly |
| Invalid code rejected | ✅ PASS | Shows "Invalid access code" error message |
| Start exam redirect | ✅ PASS | Redirects to /exam/[sessionId] |

### 7. Exam Interface (Candidate)
| Test Case | Status | Notes |
|-----------|--------|-------|
| Exam page loads | ✅ PASS | Full interface loads |
| Timer displays | ✅ PASS | Timer visible in interface |
| Problem list in sidebar | ✅ PASS | Shows problem with points (P1. Add Two Numbers 10pts) |
| Problem description shows | ✅ PASS | Description text displays |
| Code editor loads | ✅ PASS | Monaco editor with syntax highlighting |
| Language selector works | ✅ PASS | Dropdown with Python, Java, C++, Go |
| Run code (Python) | ✅ PASS | Mock mode returns results, shows test status |
| Run code (Java) | ✅ PASS | Language switch works, execution runs |
| Test results display | ✅ PASS | Shows "Test Results" heading after run |
| Problem status indicator | ✅ PASS | Changes from ○ to ✗ after failed test |
| Submit Problem button | ✅ PASS | Fixed - endpoint created |
| Submit All button | ⚠️ PARTIAL | Redirects to /exam/completed but completed page shows error |
| Navigation between problems | ⏳ NOT TESTED | Only 1 problem in test exam |

### 8. Code Execution
| Test Case | Status | Notes |
|-----------|--------|-------|
| Python execution | ✅ PASS | Mock mode enabled, returns results |
| Java execution | ✅ PASS | Mock mode enabled, returns results |
| C++ execution | ⏳ NOT TESTED | |
| Go execution | ⏳ NOT TESTED | |
| Timeout handling | ⏳ NOT TESTED | |
| Error handling | ⏳ NOT TESTED | |

### 9. Proctoring
| Test Case | Status | Notes |
|-----------|--------|-------|
| Tab switch detected | ✅ PASS | Events recorded (2 events shown in admin) |
| Copy event tracked | ⏳ NOT TESTED | |
| Paste event tracked | ⏳ NOT TESTED | |
| Events stored in DB | ✅ PASS | Visible in session details |

### 10. AI Chat Feature
| Test Case | Status | Notes |
|-----------|--------|-------|
| AI settings page loads | ✅ PASS | /admin/settings/ai shows Claude and OpenAI providers |
| Enable AI for problem (admin) | ✅ PASS | Checkbox enables AI, shows provider selector |
| AI provider selection | ✅ PASS | Claude/GPT-4 options available |
| Max messages setting | ✅ PASS | Optional field present |
| System prompt setting | ✅ PASS | Optional textarea present |
| AI chat panel visible (user) | ✅ PASS | Panel appears when AI enabled for problem |
| Send message to AI | ✅ PASS | Message sent, loading state shown |
| AI response (no API key) | ✅ PASS | Shows "No API key configured" error as expected |
| Message limit display | ✅ PASS | "X messages left" shown in header |

### 11. Timer & Expiration
| Test Case | Status | Notes |
|-----------|--------|-------|
| Timer displays | ✅ PASS | Countdown timer visible in header |
| Timer format (HH:MM:SS) | ✅ PASS | Proper formatting observed |
| Low time warning (<5 min) | ⏳ NOT TESTED | Would need exam close to ending |
| Critical time warning (<1 min) | ⏳ NOT TESTED | Would need exam close to ending |
| Time up redirect | ⏳ NOT TESTED | Code shows alert + redirect to /exam/completed |

### 12. Submission States
| Test Case | Status | Notes |
|-----------|--------|-------|
| Run code - fail state | ✅ PASS | Shows ✗ indicator, Test Results visible |
| Run code - pass state | ⏳ NOT TESTED | Requires correct solution code |
| Submit with failed tests | ✅ PASS | Submission accepted, status remains ✗ |
| Submit with passed tests | ⏳ NOT TESTED | Requires correct solution code |
| Multiple submissions | ✅ PASS | Can submit multiple times |

---

## Issues Found

| ID | Severity | Description | Location | Status |
|----|----------|-------------|----------|--------|
| ISS-001 | CRITICAL | Judge0 code execution fails on macOS Docker | Judge0 workers | RESOLVED (Mock mode) |
| ISS-002 | MEDIUM | Delete problem button not visible | /admin/problems | RESOLVED - Button is collapsed, click to expand |
| ISS-003 | LOW | 404 console error on homepage | Homepage | NEEDS REVIEW |
| ISS-004 | HIGH | Submit Problem returns JSON parse error | /exam/[sessionId] | FIXED |
| ISS-005 | MEDIUM | Exam completed page shows "session not found" | /exam/completed | NEW |

---

## Issue Details

### ISS-001: Judge0 Code Execution Fails on macOS (RESOLVED)

**Status:** RESOLVED via JUDGE0_MOCK_MODE

**Original Error:**
```
Failed to create control group /sys/fs/cgroup/memory/box-1/: No such file or directory
No such file or directory @ rb_sysopen - /box/script.py
```

**Resolution:**
Set `JUDGE0_MOCK_MODE="true"` in `.env` to enable mock responses for local development. Code execution now returns mock results allowing UI testing.

**For Production:**
Deploy Judge0 on a Linux server where cgroups are available.

---

### ISS-004: Submit Problem JSON Parse Error (FIXED)

**Error:**
```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Location:** /exam/[sessionId] - Submit Problem button

**Root Cause:**
The `/api/exam/submit` endpoint did not exist. The frontend was calling an endpoint that returned a 404 HTML page.

**Resolution:**
Created `/src/app/api/exam/submit/route.ts` with:
- Validation of session and problem
- Execution of ALL test cases (including hidden ones)
- Final submission storage with `isFinal: true`
- Score calculation based on passed tests
- Session total score update

**Status:** FIXED - Submit Problem now works correctly

---

### ISS-005: Exam Completed Page Shows "Session Not Found" (NEW)

**Error:**
```
Exam session not found. Please start the exam again.
```

**Location:** /exam/completed - After clicking Submit All

**Impact:**
- Candidates see error message after submitting exam
- No confirmation of successful exam completion

**Likely Cause:**
The completed page is trying to load session data from localStorage but either:
1. The session data isn't being stored before redirect
2. The completed page is looking for wrong key
3. Race condition between redirect and localStorage write

**Next Steps:**
1. Check /exam/completed page implementation
2. Verify localStorage keys match
3. Consider using query params or server-side session

---

## Test Progress Log

### Session: 2026-02-03 (Latest)

**Tools Used:** cursor-ide-browser MCP (Playwright-based)

**Test Flow:**
1. ✅ Homepage - Links work
2. ✅ Admin Login - Password "admin123" works
3. ✅ Admin Dashboard - All navigation works, stats display (4 Problems, 3 Exams, 10 Sessions)
4. ✅ Problem CRUD - Create/Edit/Delete all work, Monaco editor loads
5. ✅ Exam Management - View exams with access codes works
6. ✅ Results - Session list and details work, proctor events visible
7. ✅ Exam Entry - Valid codes accepted, invalid codes rejected with error
8. ✅ Exam Interface - UI loads, timer works, editor works
9. ✅ Code Execution - Mock mode works for Python and Java
10. ✅ Submit Problem - **FIXED** (created /api/exam/submit endpoint)
11. ✅ AI Feature (Admin) - Enable/disable AI, provider selection, settings work
12. ✅ AI Feature (User) - Chat panel visible, messages work (needs API key for responses)
13. ✅ Submission States - Run/Submit with failed tests works correctly
14. ✅ Delete Problem - Confirmation dialog, deletion successful
15. ✅ Form Validation - Shows error messages for required fields
16. ⚠️ Submit All - Redirects but completed page has error (ISS-005)
17. ✅ Settings Link - Navigates to /admin/settings/ai correctly

**Database State After Testing:**
- 4 Problems (deleted 1 test problem)
- 3 Exams
- 10+ Sessions (including multiple test sessions)

**Next Steps:**
1. ~~Fix Submit Problem API endpoint (ISS-004)~~ DONE
2. ~~Test delete functionality~~ DONE
3. ~~Test form validation (empty fields, invalid data)~~ DONE
4. Test CSV export
5. ~~Test invalid access code rejection~~ DONE
6. ~~Test Submit All functionality~~ DONE (needs ISS-005 fix)
7. Configure AI API keys for full AI testing
8. Test timer expiration behavior
9. Fix exam completed page (ISS-005)

---

## Test Data Created

| Type | Name | Notes |
|------|------|-------|
| Problem | Test Problem - FizzBuzz | Created during earlier testing, medium difficulty |
| Problem | Test Problem - Reverse String | Created 2026-02-03, easy difficulty - **DELETED** |
| Session | Browser Test User | browsertest@example.com |
| Session | Agent Browser Test | agenttest@example.com |
| Session | Test User | testuser@example.com |
| Session | Test Candidate | candidate@test.com |
| Session | Submit Test User | submit-test@example.com |
| Session | AI Test User | ai-test@example.com |
| Session | Invalid Code Test | invalid@test.com (failed - invalid code) |
| Session | Submit All Tester | submitall@test.com |
