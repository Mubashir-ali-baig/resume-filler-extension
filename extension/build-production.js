#!/usr/bin/env node

/**
 * Production build script
 * Verifies config.js is ready for production distribution
 */

const fs = require('fs');
const path = require('path');

const CONFIG = path.join(__dirname, 'config.js');

console.log('🏗️  Verifying production build...\n');

// Check if config.js exists
if (!fs.existsSync(CONFIG)) {
  console.error('❌ config.js not found!');
  console.log('   Copy config.example.js to config.js and update with your values.');
  process.exit(1);
}

// Read config
const configContent = fs.readFileSync(CONFIG, 'utf8');

// Check if API URL is set
if (configContent.includes('YOUR_BACKEND_API_URL')) {
  console.error('❌ Please update config.js with your actual backend API URL!');
  console.log('   Replace YOUR_BACKEND_API_URL with your deployed backend URL.');
  console.log('   Example: https://your-api.vercel.app');
  process.exit(1);
}

// Check if direct API keys are still set (warn but don't fail)
if (configContent.includes('geminiApiKey: "AIza') || 
    configContent.includes('openaiApiKey: "sk-') ||
    configContent.includes('claudeApiKey: "')) {
  console.warn('⚠️  Warning: Direct API keys found in config.js');
  console.warn('   For production distribution, remove API keys and use backend API only.');
  console.warn('   Set BACKEND_API_URL instead.');
}

console.log('✅ config.js is ready for production');

// Run build verification
console.log('\n');
require('./build.js');
