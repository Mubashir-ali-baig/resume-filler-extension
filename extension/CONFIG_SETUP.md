# Configuration Setup Guide

This extension uses a configuration file to store sensitive credentials like API keys. This keeps secrets out of version control and makes it easy to manage different environments.

## Quick Setup

1. **Copy the example configuration file:**

   ```bash
   cd extension
   cp config.example.js config.js
   ```

2. **Edit `config.js` and add your actual credentials:**

   - Supabase URL and anon key (required)
   - AI API keys (optional, depending on which AI service you want to use)

3. **That's it!** The extension will automatically load your configuration.

## Configuration Files

- **`config.example.js`** - Template file with placeholder values (committed to git)
- **`config.js`** - Your actual configuration with real credentials (gitignored, not committed)

## Required Configuration

### Supabase (Required)

You need a Supabase project for authentication and data storage:

1. Create a project at https://supabase.com
2. Get your project URL and anon key from Settings → API
3. Add them to `config.js`:

```javascript
const SUPABASE_CONFIG = {
  url: "https://your-project.supabase.co",
  anonKey: "your-actual-anon-key-here",
};
```

## Optional: AI Service Configuration

Choose one of the following options for AI-powered form filling:

### Option 1: Backend API (Recommended)

If you have a backend API that handles AI requests:

```javascript
const AI_CONFIG = {
  apiEndpoint: "https://your-api.com/api/v1/generate-answer",
  apiKey: "your-api-key-here",
  // ... other options set to null
};
```

### Option 2: Direct OpenAI API

⚠️ **Not recommended for production** - exposes API key in extension code:

```javascript
const AI_CONFIG = {
  openaiApiKey: "sk-your-openai-key-here",
  openaiModel: "gpt-3.5-turbo", // or 'gpt-4'
  // ... other options set to null
};
```

### Option 3: Direct Anthropic Claude API

⚠️ **Not recommended for production**:

```javascript
const AI_CONFIG = {
  claudeApiKey: "your-claude-key-here",
  claudeModel: "claude-3-sonnet-20240229",
  // ... other options set to null
};
```

### Option 4: Direct Google Gemini API

⚠️ **Not recommended for production**:

```javascript
const AI_CONFIG = {
  geminiApiKey: "your-gemini-key-here",
  geminiModel: "gemini-pro",
  // ... other options set to null
};
```

## Security Notes

1. **Never commit `config.js`** - It's already in `.gitignore`
2. **Use backend API for production** - Storing API keys in browser extensions exposes them to users
3. **Supabase anon key is safe** - It's designed to be public, but protected by Row Level Security (RLS)
4. **Rotate keys if exposed** - If you accidentally commit secrets, rotate them immediately

## Troubleshooting

### Extension shows warning about missing configuration

- Make sure `config.js` exists in the `extension/` directory
- Check that `popup.html` loads `config.js` before other scripts
- Verify the configuration object is properly exported

### Configuration not loading

- Check browser console for errors
- Ensure `config.js` is valid JavaScript
- Verify the file path in `popup.html` is correct

## Environment Variables (Alternative)

If you're using a build process, you can also use environment variables. However, for browser extensions, the `config.js` approach is simpler and more reliable.

See `.env.example` in the project root for reference (though it's mainly for documentation - browser extensions can't directly use `.env` files).
