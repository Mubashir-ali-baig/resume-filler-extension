# AI Integration Setup Guide

The extension now includes AI-powered answer generation for form fields. Here's how to set it up.

## Features

- 🤖 **AI Button**: Each form field has an AI button that generates personalized answers
- ✨ **Auto-fill**: Generated answers are automatically filled into the field
- 📝 **Context-aware**: Uses job description, page content, resume, and cover letter for better answers

## Setup Options

### Option 1: Use Your Backend API (Recommended)

1. Open `extension/popup/ai-service.js`
2. Set your API endpoint and key:

```javascript
const AI_CONFIG = {
  apiEndpoint: 'https://your-api.com/api/v1/generate-answer',
  apiKey: 'your-api-key-here'
};
```

3. Your API should accept POST requests with:
```json
{
  "question": "Tell us about yourself",
  "jobDescription": "...",
  "pageContext": "...",
  "resume": "...",
  "coverLetter": "..."
}
```

4. Return response:
```json
{
  "answer": "Generated answer text here"
}
```

### Option 2: Direct OpenAI API

1. Get API key from https://platform.openai.com/api-keys
2. Update `ai-service.js`:

```javascript
const AI_CONFIG = {
  openaiApiKey: 'sk-your-key-here',
  openaiModel: 'gpt-3.5-turbo' // or 'gpt-4'
};
```

### Option 3: Direct Anthropic Claude API

1. Get API key from https://console.anthropic.com/
2. Update `ai-service.js`:

```javascript
const AI_CONFIG = {
  claudeApiKey: 'your-key-here',
  claudeModel: 'claude-3-sonnet-20240229'
};
```

### Option 4: Direct Google Gemini API

1. Get API key from https://makersuite.google.com/app/apikey
2. Update `ai-service.js`:

```javascript
const AI_CONFIG = {
  geminiApiKey: 'your-key-here',
  geminiModel: 'gemini-pro'
};
```

## Storing Resume and Cover Letter

To use resume/cover letter context, store them in extension storage:

```javascript
// In your extension code or popup
chrome.storage.local.set({
  resume: 'Your resume text here...',
  coverLetter: 'Your cover letter text here...'
});
```

## Security Notes

⚠️ **Important**: API keys should be stored securely. For production:

1. **Backend API** (Recommended): Keep keys server-side, never expose in extension
2. **Direct API**: Consider using Chrome's secure storage or encrypting keys
3. **User Input**: Let users enter their own API keys in extension settings

## Testing

1. Reload the extension
2. Navigate to a job application form
3. Click "Scan Page"
4. Click the 🤖 AI button next to any form field
5. The AI will generate an answer and auto-fill the field

## Mock Mode

If no API is configured, the extension uses a mock response for demonstration purposes.

## Troubleshooting

- **"AI generation failed"**: Check API key and endpoint configuration
- **CORS errors**: Use a backend API proxy for direct API calls
- **Rate limits**: Implement retry logic or user feedback for rate limit errors
