# Deployment Guide: Hosting Resume Filler Extension

This guide shows you how to host the extension so users can install it from Chrome Web Store without configuring API keys.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  User's Browser │ ──────> │  Your Backend    │ ──────> │  AI APIs    │
│  (Extension)    │         │  API Server      │         │  (Gemini)   │
└─────────────────┘         └──────────────────┘         └─────────────┘
     │                              │
     │                              │
     └──────────────────────────────┘
        (Uses your API keys)
```

## Step 1: Deploy Backend API

### Option A: Deploy to Vercel (Recommended - Free)

1. **Install Vercel CLI:**

   ```bash
   npm i -g vercel
   ```

2. **Deploy:**

   ```bash
   cd backend/api
   vercel
   ```

3. **Set environment variables in Vercel dashboard:**

   - `GEMINI_API_KEY` = your Gemini API key
   - `GEMINI_MODEL` = gemini-3-flash-preview
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_ANON_KEY` = your Supabase anon key
   - `PORT` = 3000 (or leave default)

4. **Get your API URL:**
   - Vercel will give you: `https://your-project.vercel.app`
   - Your API endpoint: `https://your-project.vercel.app/api/v1/generate-answer`

### Option B: Deploy to Railway

1. **Create account at https://railway.app**
2. **New Project → Deploy from GitHub**
3. **Select your repository**
4. **Set environment variables:**
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. **Get your API URL from Railway dashboard**

### Option C: Deploy to Render

1. **Create account at https://render.com**
2. **New Web Service**
3. **Connect GitHub repository**
4. **Set build command:** `cd backend/api && npm install`
5. **Set start command:** `cd backend/api && npm start`
6. **Set environment variables**
7. **Deploy**

### Option D: Deploy to Your Own Server

```bash
cd backend/api
npm install
# Set environment variables
export GEMINI_API_KEY=your-key
export PORT=3000
# Run with PM2 or similar
pm2 start server.js --name resume-filler-api
```

## Step 2: Update Extension for Production

1. **Update `config.js`:**

   ```javascript
   const BACKEND_API_URL = "https://your-api.vercel.app"; // Your deployed backend URL
   ```

2. **Remove any direct API keys** from `config.js` (they're now on the server)

3. **Verify build:**

   ```bash
   cd extension
   node build-production.js  # Verifies config.js is ready
   ```

## Step 3: Package Extension

```bash
cd extension
node build.js  # Verify everything is ready
./package.sh   # Create zip file
```

## Step 4: Submit to Chrome Web Store

1. **Create Chrome Web Store Developer account** ($5 one-time fee)
2. **Go to Chrome Web Store Developer Dashboard**
3. **Click "New Item"**
4. **Upload your extension zip**
5. **Fill in store listing:**
   - Name: Resume Filler
   - Description: AI-powered interview answer assistant
   - Screenshots
   - Privacy policy URL
6. **Submit for review**

## Step 5: Update Extension (After Chrome Web Store Approval)

Users will automatically get updates when you publish new versions.

## Environment Variables for Backend

Create `.env` file in `backend/api/`:

```env
PORT=3000

# AI API Keys
GEMINI_API_KEY=your-actual-gemini-api-key
GEMINI_MODEL=gemini-3-flash-preview

# Supabase (server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Get your Supabase keys from: https://supabase.com/dashboard/project/_/settings/api

- Uses the same anon key as the extension (respects RLS policies)
- User access tokens are passed from the extension for proper authentication

## Testing Locally

1. **Start backend:**

   ```bash
   cd backend/api
   npm install
   cp .env.example .env
   # Edit .env with your API keys
   npm start
   ```

2. **Update extension config:**

   ```javascript
   // In extension/config.js
   apiEndpoint: "http://localhost:3000/api/v1/generate-answer";
   ```

3. **Load extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select extension folder

## Security Considerations

1. **Rate Limiting:** Add rate limiting to your API to prevent abuse
2. **Authentication:** Optionally add API key authentication
3. **CORS:** Already configured for extension origins
4. **API Key Security:** Never commit `.env` file to git

## Cost Estimation

- **Backend hosting:** Free (Vercel/Railway free tier)
- **AI API calls:**
  - Gemini: ~$0.075 per 1M tokens (very cheap)
  - ~1000 requests/month = ~$0.10-1.00
- **Chrome Web Store:** $5 one-time developer fee

## Monitoring

Add logging to track usage:

- Number of requests
- API costs
- Error rates

## Support

Users will:

1. Install from Chrome Web Store
2. Sign up/login through your backend API (uses your Supabase)
3. Use the extension - everything goes through your backend

**No configuration needed on their end!** All credentials (AI keys, Supabase) are server-side.
