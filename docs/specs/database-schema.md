# Database Schema Specification

## Entity Relationship

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Problem   │────<│ ExamProblem │>────│    Exam     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              │
                                        ┌─────┴─────┐
                                        │           │
                                   ┌────▼────┐ ┌────▼────┐
                                   │  Exam   │ │ Proctor │
                                   │ Session │ │  Event  │
                                   └────┬────┘ └─────────┘
                                        │
                                   ┌────▼────┐
                                   │Submission│
                                   └─────────┘
```

## Tables

### problems
Stores coding problems with test cases.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR(255) | Problem title |
| description | TEXT | Problem description (markdown) |
| difficulty | ENUM | easy, medium, hard |
| starter_code | JSONB | {python: "", java: "", cpp: "", go: ""} |
| test_cases | JSONB | [{input: "", expected: "", hidden: bool}] |
| time_limit_ms | INT | Execution time limit |
| memory_limit_kb | INT | Memory limit |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

### exams
Stores exam configurations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR(255) | Exam title |
| access_code | VARCHAR(20) | Unique access code |
| duration_minutes | INT | Exam duration |
| starts_at | TIMESTAMP | Exam start time |
| ends_at | TIMESTAMP | Exam end time |
| is_active | BOOLEAN | Is exam currently active |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

### exam_problems
Junction table for exam-problem relationship.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| exam_id | UUID | FK to exams |
| problem_id | UUID | FK to problems |
| order | INT | Display order |
| points | INT | Points for this problem |

### exam_sessions
Tracks each candidate's exam session.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| exam_id | UUID | FK to exams |
| candidate_name | VARCHAR(255) | Candidate's name |
| candidate_email | VARCHAR(255) | Candidate's email |
| started_at | TIMESTAMP | When candidate started |
| submitted_at | TIMESTAMP | When candidate submitted |
| total_score | INT | Calculated total score |
| status | ENUM | in_progress, submitted, timed_out |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

### submissions
Stores code submissions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | FK to exam_sessions |
| problem_id | UUID | FK to problems |
| language | VARCHAR(20) | Programming language |
| code | TEXT | Submitted code |
| status | ENUM | pending, running, passed, failed, error |
| test_results | JSONB | [{passed: bool, output: "", time_ms: int}] |
| execution_time_ms | INT | Total execution time |
| memory_used_kb | INT | Memory used |
| is_final | BOOLEAN | Is this the final submission |
| created_at | TIMESTAMP | Created timestamp |

### proctor_events
Stores proctoring events.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | FK to exam_sessions |
| event_type | ENUM | tab_switch, copy, paste, focus_lost |
| details | JSONB | Event-specific details |
| created_at | TIMESTAMP | When event occurred |

## Indexes
- `exams.access_code` - UNIQUE
- `exam_sessions(exam_id, candidate_email)` - UNIQUE
- `submissions(session_id, problem_id, is_final)`
- `proctor_events(session_id, created_at)`
