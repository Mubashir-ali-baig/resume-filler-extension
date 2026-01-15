# Resume Filler Backend API

Backend API server that proxies AI requests for the Resume Filler extension. This allows users to use the extension without configuring their own API keys.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Start server:**
   ```bash
   npm start
   ```

4. **Test:**
   ```bash
   curl http://localhost:3000/health
   ```

## Environment Variables

Create a `.env` file with:

```env
PORT=3000

# AI API Keys (set at least one)
GEMINI_API_KEY=your-actual-gemini-api-key
GEMINI_MODEL=gemini-3-flash-preview

# OR use OpenAI/Claude
# OPENAI_API_KEY=sk-your-key
# OPENAI_MODEL=gpt-3.5-turbo
# CLAUDE_API_KEY=your-claude-key
# CLAUDE_MODEL=claude-3-sonnet-20240229

# Supabase Configuration (server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** Get your Supabase keys from: https://supabase.com/dashboard/project/_/settings/api
- Uses the same anon key as the extension (respects RLS policies)
- User access tokens are passed from the extension for proper authentication

## API Endpoints

### Health Check
```
GET /health
```

### Generate Answer
```
POST /api/v1/generate-answer
Content-Type: application/json

{
  "question": "Tell us about yourself",
  "jobDescription": "...",
  "pageContext": "...",
  "resume": "...",  // Optional if userId provided
  "coverLetter": "...",  // Optional if userId provided
  "executiveSummary": "...",  // Optional if userId provided
  "userId": "user-uuid"  // Optional: fetches from Supabase if provided
}
```

Response:
```json
{
  "answer": "Generated answer text here"
}
```

### Get User Profile
```
GET /api/v1/user/profile?userId=user-uuid
# OR
GET /api/v1/user/profile
Headers: x-user-id: user-uuid
```

### Save User Profile
```
POST /api/v1/user/profile
Headers: x-user-id: user-uuid
Content-Type: application/json

{
  "resume_text": "...",
  "cover_letter_text": "...",
  "executive_summary": "..."
}
```

### Authentication

#### Sign In
```
POST /api/v1/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Sign Up
```
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## Deployment

See [DEPLOYMENT.md](../../DEPLOYMENT.md) for deployment instructions to Vercel, Railway, Render, etc.

## Development

```bash
npm run dev  # Uses nodemon for auto-reload
```

## Security

- API keys are stored server-side (never exposed to users)
- CORS is configured for extension origins
- Consider adding rate limiting for production
- Consider adding API key authentication if needed
