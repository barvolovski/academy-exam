# API Specification

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://academy.yourdomain.com/api`

---

## Admin Endpoints

### Problems

#### GET /api/admin/problems
List all problems.

**Response:**
```json
{
  "problems": [
    {
      "id": "uuid",
      "title": "Two Sum",
      "difficulty": "easy",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/admin/problems
Create a new problem.

**Request:**
```json
{
  "title": "Two Sum",
  "description": "Given an array of integers...",
  "difficulty": "easy",
  "starterCode": {
    "python": "def two_sum(nums, target):\n    pass",
    "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n    }\n}"
  },
  "testCases": [
    {"input": "[2,7,11,15]\n9", "expected": "[0,1]", "hidden": false},
    {"input": "[3,2,4]\n6", "expected": "[1,2]", "hidden": true}
  ],
  "timeLimitMs": 2000,
  "memoryLimitKb": 262144
}
```

#### GET /api/admin/problems/:id
Get problem details.

#### PUT /api/admin/problems/:id
Update a problem.

#### DELETE /api/admin/problems/:id
Delete a problem.

---

### Exams

#### GET /api/admin/exams
List all exams.

#### POST /api/admin/exams
Create a new exam.

**Request:**
```json
{
  "title": "Backend Engineer Assessment",
  "durationMinutes": 90,
  "startsAt": "2025-02-15T09:00:00Z",
  "endsAt": "2025-02-15T12:00:00Z",
  "problemIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "accessCode": "EXAM-2025-ABC123",
  "title": "Backend Engineer Assessment"
}
```

#### GET /api/admin/exams/:id
Get exam details with problems.

#### GET /api/admin/exams/:id/results
Get exam results.

**Response:**
```json
{
  "exam": {"id": "uuid", "title": "..."},
  "results": [
    {
      "candidateName": "John Doe",
      "candidateEmail": "john@example.com",
      "totalScore": 85,
      "maxScore": 100,
      "status": "submitted",
      "submittedAt": "2025-02-15T10:30:00Z",
      "proctorFlags": 2
    }
  ]
}
```

#### GET /api/admin/exams/:id/results/export
Export results as CSV.

---

## Candidate Endpoints

### Session

#### POST /api/exam/start
Start exam session.

**Request:**
```json
{
  "accessCode": "EXAM-2025-ABC123",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "token": "jwt-token",
  "exam": {
    "title": "Backend Engineer Assessment",
    "durationMinutes": 90,
    "endsAt": "2025-02-15T12:00:00Z"
  },
  "problems": [
    {
      "id": "uuid",
      "title": "Two Sum",
      "description": "...",
      "starterCode": {"python": "...", "java": "..."},
      "points": 30
    }
  ]
}
```

#### POST /api/exam/submit
Submit final exam.

**Request:**
```json
{
  "sessionId": "uuid"
}
```

---

### Code Execution

#### POST /api/exam/run
Run code against test cases.

**Request:**
```json
{
  "sessionId": "uuid",
  "problemId": "uuid",
  "language": "python",
  "code": "def two_sum(nums, target):\n    return [0, 1]"
}
```

**Response:**
```json
{
  "status": "completed",
  "results": [
    {"testCase": 1, "passed": true, "output": "[0, 1]", "timeMs": 45},
    {"testCase": 2, "passed": false, "output": "[0, 1]", "expected": "[1, 2]", "timeMs": 38}
  ],
  "passedCount": 1,
  "totalCount": 2
}
```

#### POST /api/exam/submit-problem
Submit final solution for a problem.

**Request:**
```json
{
  "sessionId": "uuid",
  "problemId": "uuid",
  "language": "python",
  "code": "def two_sum(nums, target):\n    ..."
}
```

---

### Proctoring

#### POST /api/exam/proctor-event
Log proctoring event.

**Request:**
```json
{
  "sessionId": "uuid",
  "eventType": "tab_switch",
  "details": {"timestamp": "2025-02-15T09:15:00Z"}
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "EXAM_NOT_FOUND",
    "message": "The exam with this access code does not exist"
  }
}
```

### Error Codes
- `INVALID_ACCESS_CODE` - Access code not found
- `EXAM_NOT_ACTIVE` - Exam is not currently active
- `SESSION_EXPIRED` - Exam session has expired
- `SUBMISSION_LIMIT` - Too many submissions
- `EXECUTION_ERROR` - Code execution failed
