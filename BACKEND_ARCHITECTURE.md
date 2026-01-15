# Backend Architecture - Auth & User Profiles

## Recommended Approach: Supabase (Fastest to Implement)

### Why Supabase?
- ✅ Built-in authentication (email/password, OAuth)
- ✅ PostgreSQL database (reliable, structured)
- ✅ Auto-generated REST API
- ✅ Row-level security
- ✅ Real-time capabilities
- ✅ Free tier available
- ✅ Easy browser extension integration
- ✅ File storage for resume PDFs

### Alternative: Custom Backend
- Node.js/Express + PostgreSQL + JWT
- More control, but more setup required

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Browser Extension                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Auth UI      │  │ Profile UI   │  │ AI Service   │ │
│  │ (Sign up/In) │  │ (Resume/CL)  │  │ (Uses Profile)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                              │
│                    ┌───────▼────────┐                     │
│                    │  API Client    │                     │
│                    │  (Supabase SDK)│                     │
│                    └───────┬────────┘                     │
└────────────────────────────┼──────────────────────────────┘
                             │ HTTPS
                             │
┌────────────────────────────▼──────────────────────────────┐
│                    Supabase Backend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Auth Service │  │ PostgreSQL   │  │ Storage      │   │
│  │              │  │ Database     │  │ (Files)       │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Table: `user_profiles`

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile Data
  resume_text TEXT,
  resume_file_url TEXT, -- URL to uploaded PDF/doc
  cover_letter_text TEXT,
  executive_summary TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### Table: `user_preferences` (Optional)

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- AI Preferences
  preferred_llm_provider TEXT DEFAULT 'openai', -- 'openai', 'claude', 'gemini'
  default_answer_length TEXT DEFAULT 'medium', -- 'short', 'medium', 'long'
  tone_preference TEXT DEFAULT 'professional', -- 'professional', 'casual', 'formal'
  
  -- Extension Settings
  auto_fill_enabled BOOLEAN DEFAULT false,
  show_suggestions BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

---

## Implementation Plan

### Phase 1: Setup Supabase Project

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note down: Project URL, Anon Key, Service Role Key

2. **Setup Database Schema**
   - Run SQL migrations in Supabase SQL Editor
   - Create tables as defined above

3. **Configure Authentication**
   - Enable Email/Password auth
   - (Optional) Enable OAuth providers (Google, GitHub)

### Phase 2: Extension Integration

1. **Add Supabase Client**
   - Install Supabase JS client
   - Initialize in extension

2. **Create Auth UI**
   - Sign up form
   - Sign in form
   - Profile management

3. **Create Profile Management**
   - Upload resume (text + file)
   - Edit cover letter
   - Edit executive summary

### Phase 3: AI Integration

1. **Update AI Service**
   - Fetch user profile from Supabase
   - Use profile data in AI prompts

2. **Backend API (Optional)**
   - If using custom backend, create API endpoints
   - Or use Supabase Edge Functions for AI processing

---

## File Structure

```
backend/
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_user_profiles.sql
│   │   └── 002_create_user_preferences.sql
│   └── functions/ (Edge Functions if needed)
│       └── generate-answer/
│           └── index.ts
│
extension/
├── lib/
│   └── supabase-client.js
├── popup/
│   ├── auth/
│   │   ├── signup.html
│   │   ├── signin.html
│   │   └── auth.js
│   ├── profile/
│   │   ├── profile.html
│   │   └── profile.js
│   └── ...
└── ...
```

---

## Alternative: Custom Backend Architecture

If you prefer more control:

### Tech Stack
- **Backend**: Node.js/Express or Python/FastAPI
- **Database**: PostgreSQL
- **Auth**: JWT tokens
- **Hosting**: Railway, Render, or AWS

### API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/user/profile
PUT    /api/user/profile
POST   /api/user/upload-resume
GET    /api/user/resume/:id
```

### Database Schema (Same as above)

### Implementation Steps

1. Setup Express/FastAPI server
2. Add PostgreSQL connection
3. Implement JWT authentication
4. Create REST API endpoints
5. Add file upload handling
6. Deploy to hosting platform

---

## Recommendation: Start with Supabase

**Reasons:**
1. **Faster Development**: Auth + DB + Storage ready
2. **Less Infrastructure**: No server management
3. **Built-in Security**: Row-level security, automatic API
4. **Scalable**: Handles scaling automatically
5. **Cost-effective**: Free tier sufficient for MVP

**Migration Path:**
- Start with Supabase for MVP
- Migrate to custom backend later if needed
- Database schema remains similar

---

## Next Steps

1. Create Supabase project
2. Setup database schema
3. Integrate Supabase client in extension
4. Build auth UI
5. Build profile management UI
6. Update AI service to use profile data
