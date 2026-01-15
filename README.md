# Resume Filler - Browser Extension + LLM Interview Assistant

An intelligent browser extension that helps job seekers answer interview questions by leveraging LLM agents (OpenAI, Gemini, Claude) with context from their resume, cover letter, and job descriptions.

## Overview

This application consists of:

- **Browser Extension**: Interacts with job application forms (LinkedIn, Indeed, etc.)
- **Backend API**: Processes requests and manages LLM integrations
- **LLM Integration**: Connects with OpenAI, Google Gemini, or Anthropic Claude
- **Data Storage**: Manages user resumes, cover letters, and job descriptions

## Key Features

- 🔍 **Automatic Question Detection**: Detects interview questions on job application forms
- 🤖 **AI-Powered Answers**: Generates personalized answers using LLM agents
- 📄 **Context-Aware**: Uses your resume, cover letter, and job description
- 🔄 **Multiple LLM Support**: Choose between OpenAI, Gemini, or Claude
- ✨ **Smart Suggestions**: Provides multiple answer variations
- 🔒 **Privacy-Focused**: Secure handling of personal data

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system architecture, component breakdown, data flow, and technology stack recommendations.

## Quick Start (Future Implementation)

### Prerequisites

- Node.js 18+ or Python 3.10+
- Chrome/Edge browser
- API keys for chosen LLM provider(s)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd resume-filler

# Install dependencies
cd extension && npm install
cd ../backend && npm install  # or pip install -r requirements.txt
```

### Configuration

1. **Set up extension configuration:**

   ```bash
   cd extension
   cp config.example.js config.js
   # Edit config.js with your Supabase credentials and AI API keys
   ```

   See [extension/CONFIG_SETUP.md](./extension/CONFIG_SETUP.md) for detailed instructions.

2. **Set up backend environment variables** (if using custom backend):

   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Build and load extension in browser**
4. **Upload resume and cover letter** in the extension popup

## Project Status

🚧 **Architecture Phase** - Currently in design/planning phase

## Next Steps

1. Set up project structure
2. Implement browser extension (Manifest V3)
3. Build backend API service
4. Integrate LLM providers
5. Implement document processing
6. Add authentication system
7. Deploy and test

## License

[To be determined]
