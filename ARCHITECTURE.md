# Browser Extension + LLM Interview Answer Assistant - Architecture

## Overview

A browser extension that reads interview questions from job application forms (LinkedIn, Indeed, etc.) and suggests personalized answers using LLM agents (OpenAI, Gemini, Claude) based on user's resume, cover letter, and job description context.

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Extension                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Content      │  │ Background   │  │ Popup/UI     │     │
│  │ Scripts      │  │ Service      │  │ Component    │     │
│  │              │  │ Worker       │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │  Extension     │                       │
│                    │  Storage API   │                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ HTTPS API Calls
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Backend API Service                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ REST/GraphQL │  │ Auth &       │  │ Context      │     │
│  │ API Layer    │  │ User Mgmt    │  │ Builder      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │  LLM Service   │                       │
│                    │  Orchestrator  │                       │
│                    └───────┬────────┘                       │
│                            │                                │
│         ┌──────────────────┼──────────────────┐             │
│         │                  │                  │             │
│  ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐      │
│  │ OpenAI      │  │ Gemini API   │  │ Claude API   │      │
│  │ Integration │  │ Integration  │  │ Integration  │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Data Storage Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ User Data    │  │ Resume &     │  │ Job          │     │
│  │ (PostgreSQL/ │  │ Cover Letter │  │ Descriptions │     │
│  │  MongoDB)    │  │ (Vector DB)  │  │ Cache        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Browser Extension (Frontend)

#### 1.1 Content Scripts

**Purpose**: Intelligently detect and interact with interview question fields on any job application platform

**Responsibilities**:

- **Smart Field Detection**: Identify interview/question fields using heuristics and patterns:
  - Analyze form field labels, placeholders, and surrounding text
  - Detect common question patterns (e.g., "Tell us about...", "Why...", "Describe...")
  - Identify textarea/input fields with question-like context
  - Use semantic analysis to distinguish interview questions from other form fields
- **Dynamic Monitoring**: Watch for new question fields as pages load dynamically
- **Question Extraction**: Extract question text and context from detected fields
- **UI Injection**: Inject answer suggestion UI elements near detected question fields
- **Job Description Extraction**: Identify and extract job description content from the page
- **User Activation**: Allow users to manually trigger scanning or select specific fields

**Key Technologies**:

- Vanilla JavaScript or TypeScript
- DOM MutationObserver for dynamic content detection
- Pattern matching and heuristics for field identification
- Natural Language Processing (client-side or API-based) for question detection
- Content analysis algorithms (keyword matching, semantic patterns)

**Implementation Approach**:

```javascript
// Generic content script that works on any platform
- content-script.ts (main generic script)
  - FieldDetector: Identifies potential interview question fields
  - QuestionAnalyzer: Validates if field contains interview question
  - UIManager: Injects suggestion UI elements
  - JobDescriptionExtractor: Finds and extracts job description
  - FieldWatcher: Monitors for dynamically added fields

// Detection Strategy:
1. Scan page for form elements (textarea, input[type="text"])
2. Analyze labels, placeholders, aria-labels, and surrounding text
3. Use pattern matching for common question keywords/phrases
4. Optionally send to backend for NLP-based validation
5. Present detected fields to user for confirmation (optional)
6. Inject suggestion UI for validated fields
```

#### 1.2 Background Service Worker

**Purpose**: Coordinate extension activities, manage state, handle API calls

**Responsibilities**:

- Manage extension lifecycle
- Handle API communication with backend
- Cache frequently used data
- Manage authentication tokens
- Coordinate between content scripts and popup

**Key Technologies**:

- Service Worker API (Manifest V3)
- Chrome Storage API or IndexedDB
- Fetch API for backend communication

#### 1.3 Popup/UI Component

**Purpose**: User interface for settings and manual interactions

**Responsibilities**:

- Display user profile/resume status
- Settings configuration
- Manual answer review/editing
- LLM provider selection
- API key management (if client-side)

**Key Technologies**:

- React/Vue/Svelte (optional, can be vanilla)
- Chrome Extension Popup API

#### 1.4 Extension Storage

**Purpose**: Local data persistence

**Data Stored**:

- User preferences
- Cached resume/cover letter
- Recent job descriptions
- API tokens (encrypted)
- Usage analytics

**Key Technologies**:

- Chrome Storage API (chrome.storage.local/sync)
- IndexedDB for larger data

### 2. Backend API Service

#### 2.1 API Layer

**Purpose**: RESTful or GraphQL API for extension communication

**Endpoints**:

```
POST /api/v1/analyze-question
  - Input: { question, jobDescription, context }
  - Output: { suggestedAnswer, confidence, alternatives }

POST /api/v1/upload-resume
  - Input: { resumeFile, userId }
  - Output: { resumeId, extractedData }

POST /api/v1/upload-cover-letter
  - Input: { coverLetter, userId }
  - Output: { coverLetterId }

GET /api/v1/user-context/:userId
  - Output: { resume, coverLetter, preferences }

POST /api/v1/process-job-description
  - Input: { jobDescription, userId }
  - Output: { extractedInfo, keyPoints }
```

**Key Technologies**:

- Node.js/Express or Python/FastAPI
- GraphQL (optional, for flexible queries)
- Rate limiting middleware
- Request validation

#### 2.2 Authentication & User Management

**Purpose**: Secure user authentication and session management

**Responsibilities**:

- User registration/login
- JWT token management
- API key validation
- User profile management

**Key Technologies**:

- OAuth 2.0 / JWT
- bcrypt for password hashing
- Session management

#### 2.3 Context Builder

**Purpose**: Prepare comprehensive context for LLM prompts

**Responsibilities**:

- Extract key information from resume (skills, experience, education)
- Parse cover letter for relevant points
- Extract key requirements from job description
- Build structured prompt context
- Manage context window limits

**Key Technologies**:

- PDF parsing libraries (pdf-parse, PyPDF2)
- Text extraction and NLP
- Vector embeddings for semantic search (optional)

#### 2.4 LLM Service Orchestrator

**Purpose**: Manage LLM API calls and handle different providers

**Responsibilities**:

- Route requests to selected LLM provider
- Handle API rate limits and retries
- Manage prompt templates
- Stream responses (if needed)
- Fallback between providers
- Cost optimization

**Key Technologies**:

- LangChain or LlamaIndex (for abstraction)
- Provider-specific SDKs:
  - OpenAI SDK
  - Google Gemini SDK
  - Anthropic Claude SDK

### 3. LLM Integration Layer

#### 3.1 Prompt Engineering

**Purpose**: Construct effective prompts for answer generation

**Prompt Structure**:

```
System Prompt:
"You are an expert career coach helping candidates answer interview questions.
Use the following context to provide personalized, authentic answers."

Context:
- Resume: [extracted resume data]
- Cover Letter: [relevant cover letter excerpts]
- Job Description: [key requirements and company info]
- Question: [the interview question]

Instructions:
- Answer should be authentic and match the candidate's background
- Highlight relevant experience from resume
- Align with company values from job description
- Keep answer concise (2-3 sentences for short answers)
- Provide 2-3 alternative phrasings
```

**Key Technologies**:

- Prompt templates (Handlebars, Jinja2)
- Few-shot examples
- Chain-of-thought prompting

#### 3.2 Response Processing

**Purpose**: Process and format LLM responses

**Responsibilities**:

- Parse LLM output
- Extract multiple answer variations
- Calculate confidence scores
- Format for display in extension
- Handle errors and edge cases

### 4. Data Storage Layer

#### 4.1 User Data Database

**Purpose**: Store user accounts and preferences

**Schema**:

```sql
users (
  id, email, password_hash, created_at, preferences
)

user_resumes (
  id, user_id, resume_file_path, extracted_data_json,
  uploaded_at, is_active
)

user_cover_letters (
  id, user_id, cover_letter_text, uploaded_at, is_active
)

job_applications (
  id, user_id, job_title, company, job_description,
  questions_answered, created_at
)
```

**Key Technologies**:

- PostgreSQL (relational) or MongoDB (NoSQL)
- ORM: Prisma, TypeORM, or Mongoose

#### 4.2 Vector Database (Optional but Recommended)

**Purpose**: Semantic search for resume/cover letter content

**Use Cases**:

- Find most relevant resume sections for a question
- Semantic matching between question and experience
- RAG (Retrieval Augmented Generation) for better context

**Key Technologies**:

- Pinecone, Weaviate, or Chroma
- Embedding models (OpenAI embeddings, sentence-transformers)

#### 4.3 Cache Layer

**Purpose**: Improve performance and reduce API costs

**Cached Data**:

- Processed job descriptions
- Common question-answer pairs
- User context (with TTL)

**Key Technologies**:

- Redis or Memcached
- In-memory caching

## Data Flow

### Answer Generation Flow

```
1. User navigates to job application form (any platform)
   ↓
2. Content script scans page and detects interview question fields
   ↓
3. Content script extracts:
   - Question text
   - Job description (if available)
   - Form context
   ↓
4. Background worker sends to backend API:
   POST /api/v1/analyze-question
   {
     question: "...",
     jobDescription: "...",
     userId: "..."
   }
   ↓
5. Backend Context Builder:
   - Retrieves user resume from database
   - Retrieves user cover letter
   - Processes job description
   - Builds comprehensive context
   ↓
6. LLM Orchestrator:
   - Selects LLM provider (user preference)
   - Constructs prompt with context
   - Calls LLM API
   - Processes response
   ↓
7. Backend returns:
   {
     suggestedAnswer: "...",
     alternatives: ["...", "..."],
     confidence: 0.85,
     reasoning: "..."
   }
   ↓
8. Content script displays suggestion:
   - Injects UI near question field
   - Shows answer with "Use" button
   - Allows editing before insertion
   ↓
9. User reviews/edits and inserts answer
```

## Technology Stack Recommendations

### Frontend (Extension)

- **Language**: TypeScript
- **Framework**: Vanilla JS or React (for popup)
- **Build Tool**: Webpack or Vite
- **Manifest**: V3 (latest Chrome extension standard)

### Backend

- **Runtime**: Node.js (Express) or Python (FastAPI)
- **Language**: TypeScript or Python
- **API**: REST or GraphQL
- **Validation**: Zod (TypeScript) or Pydantic (Python)

### LLM Integration

- **Abstraction**: LangChain or direct SDKs
- **Providers**: OpenAI, Google Gemini, Anthropic Claude
- **Embeddings**: OpenAI text-embedding-ada-002 or similar

### Database

- **Primary**: PostgreSQL or MongoDB
- **Vector DB**: Pinecone, Weaviate, or Chroma (optional)
- **Cache**: Redis

### Infrastructure

- **Hosting**: AWS, GCP, or Vercel/Railway
- **API Gateway**: Cloudflare Workers or AWS API Gateway
- **File Storage**: AWS S3 or Cloud Storage

## Security Considerations

1. **API Key Management**

   - Store API keys server-side (never in extension)
   - Use environment variables
   - Rotate keys regularly

2. **Data Privacy**

   - Encrypt sensitive data (resume, cover letter)
   - HTTPS only for all API calls
   - GDPR compliance for user data

3. **Authentication**

   - JWT tokens with expiration
   - Refresh token mechanism
   - Secure token storage in extension

4. **Rate Limiting**

   - Prevent abuse of LLM APIs
   - User-level rate limits
   - Cost monitoring

5. **Content Security**
   - Validate all user inputs
   - Sanitize LLM outputs before display
   - Prevent XSS attacks in injected content

## Scalability Considerations

1. **Caching Strategy**

   - Cache processed resumes/cover letters
   - Cache common question patterns
   - Use CDN for static assets

2. **LLM Cost Optimization**

   - Batch similar requests
   - Use smaller models when possible
   - Implement usage quotas

3. **Database Optimization**

   - Index frequently queried fields
   - Use connection pooling
   - Implement pagination

4. **Horizontal Scaling**
   - Stateless API design
   - Load balancing
   - Queue system for heavy processing

## Implementation Phases

### Phase 1: MVP

- Basic extension with content script
- Single LLM provider (OpenAI)
- Simple backend API
- Basic resume upload
- Answer generation for single question

### Phase 2: Enhancement

- Multiple LLM provider support
- Cover letter integration
- Job description parsing
- Improved UI/UX
- Answer alternatives

### Phase 3: Advanced Features

- Vector database for semantic search
- Multi-question handling
- Answer history and learning
- Analytics dashboard
- Enhanced field detection accuracy with ML models
- Custom field detection patterns and user training

### Phase 4: Scale & Optimize

- Performance optimization
- Advanced caching
- Cost optimization
- User analytics
- A/B testing for prompts

## File Structure Example

```
resume-filler/
├── extension/
│   ├── manifest.json
│   ├── src/
│   │   ├── content/
│   │   │   ├── content-script.ts (main generic script)
│   │   │   ├── field-detector.ts
│   │   │   ├── question-analyzer.ts
│   │   │   ├── ui-manager.ts
│   │   │   └── job-description-extractor.ts
│   │   ├── background/
│   │   │   └── service-worker.ts
│   │   ├── popup/
│   │   │   ├── popup.html
│   │   │   ├── popup.tsx
│   │   │   └── styles.css
│   │   └── shared/
│   │       ├── types.ts
│   │       └── api-client.ts
│   └── assets/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── services/
│   │   │   ├── llm/
│   │   │   ├── context-builder/
│   │   │   └── document-processor/
│   │   ├── models/
│   │   └── utils/
│   └── tests/
├── shared/
│   └── types.ts
└── docs/
    └── ARCHITECTURE.md
```

## Key Design Decisions

1. **Server-Side LLM Calls**: Keeps API keys secure and allows better cost control
2. **Context Builder Service**: Separates concerns and allows optimization
3. **Multi-Provider Support**: Gives users flexibility and fallback options
4. **Vector Database (Optional)**: Enables semantic search for better context retrieval
5. **Manifest V3**: Future-proof extension development
6. **TypeScript**: Type safety across frontend and backend

## Monitoring & Analytics

- **User Metrics**: Questions answered, success rate, user retention
- **Performance**: API response times, LLM latency
- **Costs**: LLM API usage, infrastructure costs
- **Errors**: Error rates, failed requests, LLM failures
- **Usage Patterns**: Most common questions, popular job sites
