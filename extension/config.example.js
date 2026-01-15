// Resume Filler Extension - Configuration
// Copy this file to config.js and fill in your actual values
// config.js is gitignored and should not be committed to version control

// Backend API URL (replace with your deployed backend URL)
// Example: https://your-api.vercel.app or https://api.yourdomain.com
const BACKEND_API_URL = "YOUR_BACKEND_API_URL"; // Replace with your backend URL

// AI Service Configuration
// All API keys and Supabase are handled server-side - no secrets in extension!
const AI_CONFIG = {
  // Use backend API (your API keys are on the server - no secrets here!)
  apiEndpoint: BACKEND_API_URL
    ? `${BACKEND_API_URL}/api/v1/generate-answer`
    : null,
  apiKey: null, // No API key needed - backend handles everything

  // Direct API keys (ONLY for local development, NOT for distribution)
  // These expose your API keys - use backend API for production!
  openaiApiKey: null,
  openaiModel: "gpt-3.5-turbo",

  claudeApiKey: null,
  claudeModel: "claude-3-sonnet-20240229",

  geminiApiKey: null, // Removed - use backend API instead
  geminiModel: "gemini-3-flash-preview",
};

// Backend API Configuration (for Supabase operations)
// Extension uses backend API for auth and profile operations
const BACKEND_CONFIG = {
  baseUrl: BACKEND_API_URL,
  authEndpoint: BACKEND_API_URL ? `${BACKEND_API_URL}/api/v1/auth` : null,
  profileEndpoint: BACKEND_API_URL
    ? `${BACKEND_API_URL}/api/v1/user/profile`
    : null,
};

// Export configuration
if (typeof window !== "undefined") {
  window.AI_CONFIG = AI_CONFIG;
  window.BACKEND_CONFIG = BACKEND_CONFIG;
  // Supabase config removed - backend handles all Supabase operations
}
