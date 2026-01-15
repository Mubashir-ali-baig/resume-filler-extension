# Resume Filler Browser Extension

A browser extension that scans web pages to extract content, form fields, and job descriptions.

## Setup Instructions

### 1. Load the Extension in Chrome/Edge

1. Open Chrome or Edge browser
2. Navigate to `chrome://extensions/` (or `edge://extensions/` for Edge)
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `extension` folder from this project
6. The extension should now appear in your extensions list

### 2. Using the Extension

1. Navigate to any webpage (job application form, LinkedIn, Indeed, etc.)
2. Click the extension icon in your browser toolbar
3. Click the **"Scan Page"** button
4. The extension will extract and display:
   - Page text content
   - Form fields (textareas and text inputs)
   - Job description (if detected)
   - Content statistics

### 3. Testing

Try scanning different types of pages:
- Job application forms
- LinkedIn job postings
- Indeed job listings
- Any webpage with forms

## File Structure

```
extension/
├── manifest.json           # Extension manifest (Manifest V3)
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
├── content/
│   └── content-script.js  # Content script (runs on web pages)
├── background/
│   └── service-worker.js  # Background service worker
└── icons/                 # Extension icons (placeholder)
```

## Features

- ✅ Scan any webpage for content
- ✅ Extract form fields (textareas and inputs)
- ✅ Detect job descriptions
- ✅ Display content statistics
- ✅ Works on any website

## Next Steps

- Add LLM integration for answer generation
- Implement intelligent question field detection
- Add resume/cover letter upload
- Connect to backend API

## Development Notes

- Uses Manifest V3 (latest Chrome extension standard)
- Content script runs on all pages (`<all_urls>`)
- Popup communicates with content script via `chrome.tabs.sendMessage`
- Background service worker handles extension lifecycle
