# Quick Start Guide

## Browser Extension Setup

### Step 1: Create Icons (Required)

Before loading the extension, you need to create icon files:

**Option A: Use the HTML tool**

1. Open `extension/create-icons.html` in your browser
2. Click "Download Icons"
3. Move the downloaded PNG files to `extension/icons/` folder

**Option B: Create manually**

- Create three PNG files: `icon16.png`, `icon48.png`, `icon128.png`
- Place them in `extension/icons/` folder
- You can use any simple images for now (Chrome will scale them)

### Step 2: Configure Extension (Required)

1. Copy the example configuration file:

   ```bash
   cd extension
   cp config.example.js config.js
   ```

2. Edit `config.js` and add your Supabase credentials:

   - Get your Supabase URL and anon key from https://supabase.com/dashboard
   - Replace the placeholder values in `config.js`

   See [extension/CONFIG_SETUP.md](./extension/CONFIG_SETUP.md) for detailed instructions.

### Step 3: Load Extension in Chrome/Edge

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Navigate to and select the `extension` folder
5. The extension should appear in your extensions list

### Step 4: Test the Extension

1. Navigate to any webpage (e.g., a job application form, LinkedIn, Indeed)
2. Click the extension icon in your browser toolbar
3. Click the **"Scan Page"** button
4. You should see:
   - Page content preview
   - Statistics (character count, word count, form fields)
   - Detected form fields

## What It Does

The extension currently:

- ✅ Scans any webpage for text content
- ✅ Extracts form fields (textareas and text inputs)
- ✅ Attempts to detect job descriptions
- ✅ Displays content statistics
- ✅ Works on any website (no site-specific code)

## File Structure

```
extension/
├── manifest.json              # Extension configuration
├── popup/
│   ├── popup.html            # UI
│   ├── popup.css             # Styles
│   └── popup.js              # Logic
├── content/
│   └── content-script.js     # Runs on web pages
├── background/
│   └── service-worker.js     # Background tasks
└── icons/                    # Extension icons
```

## Troubleshooting

**Extension won't load:**

- Make sure icon files exist in `icons/` folder
- Check browser console for errors (F12 → Console)
- Verify manifest.json is valid JSON

**Scan button doesn't work:**

- Open browser DevTools (F12) → Console tab
- Look for error messages
- Make sure you're on a webpage (not chrome:// pages)

**No content detected:**

- Some pages load content dynamically - try waiting a few seconds
- Some pages may block content scripts - try a different site

## Next Steps

- Add LLM integration for answer suggestions
- Implement intelligent question field detection
- Add resume/cover letter upload functionality
- Connect to backend API
