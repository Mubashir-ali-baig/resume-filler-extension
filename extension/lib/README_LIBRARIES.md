# Required Libraries for Text Extraction

**✅ These libraries are already included in the extension bundle!**

When users download/install the extension, these libraries are already included. No manual setup required.

---

## For Developers (if libraries need to be updated)

## Required Files

1. **pdf.min.js** - PDF.js library (minified)

   - Download from: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
   - Save as: `lib/pdf.min.js`

2. **pdf.worker.min.js** - PDF.js worker (minified)

   - Download from: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
   - Save as: `lib/pdf.worker.min.js`

3. **mammoth.browser.min.js** - Mammoth.js library for DOCX (minified)
   - Download from: https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js
   - Save as: `lib/mammoth.browser.min.js`

## Quick Setup Script

Run this in your terminal from the extension directory:

```bash
cd lib

# Download PDF.js
curl -o pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js

# Download PDF.js worker
curl -o pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js

# Download Mammoth.js
curl -o mammoth.browser.min.js https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js
```

Or use wget:

```bash
cd lib

wget -O pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
wget -O pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
wget -O mammoth.browser.min.js https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js
```

## Why Local Files?

Browser extensions have Content Security Policy (CSP) restrictions that prevent loading external scripts from CDNs. By bundling these libraries locally, we can use them without violating CSP.

## Verification

After downloading, verify the files exist:

- `lib/pdf.min.js` (should be ~500KB)
- `lib/pdf.worker.min.js` (should be ~200KB)
- `lib/mammoth.browser.min.js` (should be ~50KB)
