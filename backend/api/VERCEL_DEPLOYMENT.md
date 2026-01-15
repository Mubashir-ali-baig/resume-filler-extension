# Deploying to Vercel

This guide will help you deploy the Resume Filler API server to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com - it's free)
2. Your API keys ready:
   - Gemini API key (or OpenAI/Claude)
   - Supabase URL and anon key

## Method 1: Deploy via Vercel CLI (Recommended)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Navigate to API Directory

```bash
cd backend/api
```

### Step 4: Deploy

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (for first deployment)
- **Project name?** → resume-filler-api (or your preferred name)
- **Directory?** → `./` (current directory)
- **Override settings?** → No

### Step 5: Set Environment Variables

After deployment, set your environment variables:

```bash
vercel env add GEMINI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

Or set them via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - `GEMINI_API_KEY` = your Gemini API key
   - `GEMINI_MODEL` = `gemini-3-flash-preview` (optional)
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_ANON_KEY` = your Supabase anon key
   - `OPENAI_API_KEY` = (optional, if using OpenAI)
   - `CLAUDE_API_KEY` = (optional, if using Claude)

### Step 6: Redeploy

After adding environment variables, redeploy:

```bash
vercel --prod
```

### Step 7: Get Your API URL

After deployment, Vercel will give you a URL like:
```
https://resume-filler-api.vercel.app
```

Your API endpoints will be:
- Health check: `https://resume-filler-api.vercel.app/health`
- Generate answer: `https://resume-filler-api.vercel.app/api/v1/generate-answer`
- Auth sign in: `https://resume-filler-api.vercel.app/api/v1/auth/signin`
- Auth sign up: `https://resume-filler-api.vercel.app/api/v1/auth/signup`
- User profile: `https://resume-filler-api.vercel.app/api/v1/user/profile`

## Method 2: Deploy via GitHub Integration

### Step 1: Push to GitHub

Make sure your code is pushed to a GitHub repository.

### Step 2: Import Project in Vercel

1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `backend/api`
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty)
   - **Install Command:** `npm install`

### Step 3: Set Environment Variables

In the project settings, add all environment variables (same as Method 1, Step 5).

### Step 4: Deploy

Click **Deploy**. Vercel will automatically deploy your project.

## Method 3: Deploy via Vercel Dashboard (Quick)

1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Drag and drop the `backend/api` folder
4. Set environment variables
5. Click **Deploy**

## Update Extension Config

After deployment, update your extension's `config.js`:

```javascript
const BACKEND_API_URL = "https://your-project.vercel.app";
```

## Testing Your Deployment

1. **Health Check:**
   ```bash
   curl https://your-project.vercel.app/health
   ```

2. **Test AI Endpoint:**
   ```bash
   curl -X POST https://your-project.vercel.app/api/v1/generate-answer \
     -H "Content-Type: application/json" \
     -d '{"question": "Tell me about yourself"}'
   ```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes* | Your Google Gemini API key |
| `GEMINI_MODEL` | No | Gemini model (default: `gemini-3-flash-preview`) |
| `OPENAI_API_KEY` | Yes* | Your OpenAI API key (alternative to Gemini) |
| `OPENAI_MODEL` | No | OpenAI model (default: `gpt-3.5-turbo`) |
| `CLAUDE_API_KEY` | Yes* | Your Anthropic Claude API key (alternative) |
| `CLAUDE_MODEL` | No | Claude model (default: `claude-3-sonnet-20240229`) |
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key |

*At least one AI API key is required (Gemini, OpenAI, or Claude)

## Troubleshooting

### Issue: "No AI API keys configured"

**Solution:** Make sure you've set at least one AI API key in Vercel environment variables.

### Issue: "Supabase not configured"

**Solution:** Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel environment variables.

### Issue: CORS errors

**Solution:** CORS is already configured in the server. Make sure your extension's `BACKEND_API_URL` matches your Vercel deployment URL.

### Issue: Function timeout

**Solution:** Vercel free tier has a 10-second timeout for serverless functions. For longer operations, consider upgrading to Pro plan or optimizing your prompts.

### Issue: Environment variables not working

**Solution:** 
1. Make sure variables are set in Vercel dashboard
2. Redeploy after adding variables: `vercel --prod`
3. Check variable names match exactly (case-sensitive)

## Updating Deployment

After making changes to your code:

```bash
cd backend/api
vercel --prod
```

Or push to GitHub if using GitHub integration - Vercel will auto-deploy.

## Monitoring

Check your deployment logs:
- Vercel Dashboard → Your Project → **Deployments** → Click on a deployment → **Logs**

## Cost

Vercel free tier includes:
- 100GB bandwidth/month
- 100 serverless function executions/day
- Unlimited deployments

For production use, consider upgrading to Pro plan ($20/month) for:
- Unlimited bandwidth
- Unlimited function executions
- Better performance
