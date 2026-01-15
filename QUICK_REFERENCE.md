# Quick Reference Guide

## System Components Summary

### 1. Browser Extension
- **Content Scripts**: Extract questions from job sites
- **Background Worker**: Manages API calls and state
- **Popup UI**: Settings and manual controls
- **Storage**: Local data persistence

### 2. Backend API
- **REST/GraphQL API**: Communication layer
- **Context Builder**: Prepares LLM prompts
- **LLM Orchestrator**: Manages multiple providers
- **Auth Service**: User authentication

### 3. Data Storage
- **User Database**: Accounts, preferences
- **Document Storage**: Resumes, cover letters
- **Vector DB** (optional): Semantic search
- **Cache**: Performance optimization

## Key API Endpoints

```
POST /api/v1/analyze-question
POST /api/v1/upload-resume
POST /api/v1/upload-cover-letter
GET  /api/v1/user-context/:userId
POST /api/v1/process-job-description
```

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Extension | TypeScript, Manifest V3 |
| Backend | Node.js/Express or Python/FastAPI |
| Database | PostgreSQL/MongoDB |
| Vector DB | Pinecone/Weaviate (optional) |
| Cache | Redis |
| LLM | OpenAI/Gemini/Claude |

## Data Flow (Simplified)

```
Job Site → Content Script → Background Worker → Backend API
                                                      ↓
                                              Context Builder
                                                      ↓
                                              LLM Orchestrator
                                                      ↓
                                              LLM Provider
                                                      ↓
                                              Answer → Extension → User
```

## Security Checklist

- ✅ API keys stored server-side only
- ✅ HTTPS for all communications
- ✅ Encrypted sensitive data
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Input validation

## Cost Optimization Tips

1. Cache processed documents
2. Batch similar requests
3. Use smaller models when appropriate
4. Implement usage quotas
5. Monitor API usage

## Implementation Priority

1. **MVP**: Basic extension + single LLM + simple backend
2. **Enhancement**: Multi-provider + cover letter + job parsing
3. **Advanced**: Vector DB + semantic search + analytics
4. **Scale**: Optimization + caching + cost management
