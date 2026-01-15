# Building and Distributing the Extension

## ✅ Libraries Are Already Included

The required libraries (`pdf.min.js`, `pdf.worker.min.js`, `mammoth.browser.min.js`) are **already bundled** in the `lib/` folder. When users download the extension, they get everything they need - no manual setup required!

## Building the Extension

### Option 1: Verify Build (Recommended)

Run the build verification script to ensure everything is ready:

```bash
cd extension
node build.js
```

This will check:
- ✅ All required libraries are present
- ✅ All required files exist
- ✅ Icons are available
- ✅ Configuration template exists

### Option 2: Package for Distribution

Create a distributable zip file:

```bash
cd extension
./package.sh
```

This creates `resume-filler-extension-v1.0.0.zip` with:
- All extension files
- All libraries (already included)
- Configuration example (users create their own `config.js`)

## User Installation Steps

When users download the extension:

1. **Extract the zip file** (if downloaded as zip)
2. **Create configuration:**
   ```bash
   cp config.example.js config.js
   ```
3. **Add API keys** to `config.js`:
   - Supabase URL and anon key
   - Gemini API key (or OpenAI/Claude)
4. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

## What's Included

The extension bundle includes:
- ✅ All JavaScript libraries (PDF.js, Mammoth.js)
- ✅ All extension code
- ✅ Icons and assets
- ✅ Configuration template (`config.example.js`)

**Users do NOT need to:**
- ❌ Download libraries manually
- ❌ Run npm install
- ❌ Build anything
- ❌ Set up a development environment

## Updating Libraries

If you need to update the libraries in the future:

```bash
cd extension/lib

# Update PDF.js
curl -o pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
curl -o pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js

# Update Mammoth.js
curl -o mammoth.browser.min.js https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js
```

Then commit the updated files to your repository.

## Distribution Checklist

Before distributing:
- [ ] Run `node build.js` to verify everything
- [ ] Test the extension in Chrome
- [ ] Ensure `config.example.js` is up to date
- [ ] Package with `./package.sh` (optional)
- [ ] Create installation instructions for users
