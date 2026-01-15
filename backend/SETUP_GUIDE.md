# Backend Setup Guide

## Quick Start with Supabase (Recommended)

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `resume-filler`
   - Database password: (choose a strong password)
   - Region: (choose closest to you)
5. Wait for project to be created (2-3 minutes)

### Step 2: Get Project Credentials

1. Go to Project Settings → API
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)

### Step 3: Run Database Migrations

1. Go to SQL Editor in Supabase dashboard
2. Run `001_create_user_profiles.sql`
3. Run `002_create_user_preferences.sql`
4. Verify tables are created (check Table Editor)

### Step 4: Configure Extension

1. Open `extension/lib/supabase-client.js`
2. Replace placeholders:
   ```javascript
   const SUPABASE_CONFIG = {
     url: "YOUR_SUPABASE_URL", // Paste your Project URL
     anonKey: "YOUR_SUPABASE_ANON_KEY", // Paste your anon key
   };
   ```

### Step 5: Enable Authentication

1. Go to Authentication → Providers
2. Enable "Email" provider
3. (Optional) Enable OAuth providers (Google, GitHub)

### Step 6: Test Setup

1. Reload extension
2. Try signing up with a test email
3. Check Supabase dashboard → Authentication → Users
4. Check Table Editor → user_profiles

---

## Alternative: Custom Backend Setup

### Option A: Node.js/Express + PostgreSQL

#### 1. Initialize Project

```bash
mkdir backend
cd backend
npm init -y
npm install express pg jsonwebtoken bcryptjs cors dotenv
npm install -D nodemon
```

#### 2. Create `.env` file

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/resume_filler
JWT_SECRET=your-secret-key-here
```

#### 3. Setup Database

```bash
# Install PostgreSQL
# Create database
createdb resume_filler

# Run migrations
psql resume_filler < migrations/001_create_user_profiles.sql
psql resume_filler < migrations/002_create_user_preferences.sql
```

#### 4. Create Server

See `backend/server.js` (to be created)

### Option B: Python/FastAPI + PostgreSQL

#### 1. Setup

```bash
mkdir backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose[cryptography] passlib[bcrypt] python-dotenv
```

#### 2. Create `.env` file

```env
DATABASE_URL=postgresql://user:password@localhost:5432/resume_filler
SECRET_KEY=your-secret-key-here
```

#### 3. Setup Database

Same as Node.js option

---

## Security Best Practices

1. **Never expose service role key** in extension
2. **Use RLS policies** in Supabase
3. **Encrypt API keys** in user_preferences
4. **Use HTTPS** for all API calls
5. **Validate inputs** on backend
6. **Rate limit** API endpoints
7. **Use environment variables** for secrets

---

## Deployment Options

### Supabase

- Already hosted, no deployment needed
- Free tier: 500MB database, 2GB bandwidth

### Custom Backend

- **Railway**: Easy PostgreSQL + Node.js deployment
- **Render**: Free tier available
- **Vercel**: Serverless functions
- **AWS**: EC2 or Lambda
- **DigitalOcean**: App Platform

---

## Next Steps

1. ✅ Setup Supabase project
2. ✅ Run migrations
3. ✅ Configure extension
4. ✅ Test authentication
5. ✅ Build profile UI
6. ✅ Integrate with AI service

---

## Troubleshooting

**"Invalid API key"**

- Check you're using the anon key, not service role key
- Verify URL is correct

**"Row Level Security policy violation"**

- Check RLS policies are enabled
- Verify user is authenticated
- Check user_id matches auth.uid()

**"Table doesn't exist"**

- Run migrations again
- Check table names match exactly

**CORS errors**

- Supabase handles CORS automatically
- For custom backend, add CORS middleware
