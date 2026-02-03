# Academy - Project Specification

## Vision
A self-hosted, simple coding assessment platform that can handle 300 concurrent candidates taking exams simultaneously.

## Goals
1. **Simple** - One-time setup, minimal maintenance
2. **Reliable** - Handle 300 concurrent users without issues
3. **Self-hosted** - Full data ownership, no external dependencies
4. **Cost-effective** - Replace $5,000-15,000/year SaaS tools

## Core Features

### 1. Admin Dashboard
- Create and manage coding problems
- Set up exams with selected problems
- Generate access codes for candidates
- View real-time exam progress
- Review results with code submissions
- Export results to CSV

### 2. Candidate Exam Interface
- Access exam via link + code
- Monaco code editor (VS Code engine)
- Support Python, Java, C++, Go
- Run code against test cases
- See pass/fail per test case
- Submit final solutions

### 3. Code Execution
- Judge0 CE for sandboxed execution
- Queue system for 300 concurrent submissions
- Timeout: 10 seconds per submission
- Memory limit: 256MB per submission

### 4. Proctoring (Medium Level)
- Tab switch detection
- Copy/paste tracking
- Time spent per problem
- Submission history

### 5. Results & Analytics
- Pass/fail per candidate
- Total score and ranking
- View submitted code
- Time breakdown per question
- Export to Excel/CSV

## Non-Goals (Keep Simple)
- ❌ User accounts/registration
- ❌ Webcam proctoring
- ❌ AI plagiarism detection
- ❌ Live collaborative coding
- ❌ Multiple exam sessions management

## Technical Requirements

### Performance
- Support 300 concurrent candidates
- Code execution response < 15 seconds
- Page load < 3 seconds

### Infrastructure
- Single DigitalOcean droplet ($48-96/month)
- Docker Compose deployment
- PostgreSQL for persistence
- Redis for job queue

### Languages Supported
| Language | Judge0 ID | Version |
|----------|-----------|---------|
| Python   | 71        | 3.8.1   |
| Java     | 62        | 13.0.1  |
| C++      | 54        | 9.2.0   |
| Go       | 60        | 1.13.5  |

## Success Criteria
- [ ] 300 candidates can start exam simultaneously
- [ ] All code submissions execute within 15 seconds
- [ ] Zero data loss during exam
- [ ] Admin can view all results within 1 minute of exam end
- [ ] Export results works for 300+ entries
