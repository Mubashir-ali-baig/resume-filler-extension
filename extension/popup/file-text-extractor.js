// File text extraction utility for PDF and DOCX files
// Uses PDF.js for PDFs and mammoth.js for DOCX files

/**
 * Extract text from a file (PDF or DOCX)
 * @param {File} file - The file to extract text from
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromFile(file) {
  const fileType = file.type || "";
  const fileName = file.name.toLowerCase();

  // Check file type
  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    return await extractTextFromPDF(file);
  } else if (
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword" ||
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc")
  ) {
    return await extractTextFromDOCX(file);
  } else {
    throw new Error(
      `Unsupported file type: ${fileType || fileName}. Only PDF and DOCX files are supported.`
    );
  }
}

/**
 * Extract text from PDF file using PDF.js
 * @param {File} file - PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPDF(file) {
  try {
    // Load PDF.js from local extension files (not CDN due to CSP)
    if (typeof pdfjsLib === "undefined") {
      // Try to load from extension's lib folder
      const pdfJsPath = chrome.runtime.getURL("lib/pdf.min.js");
      await loadScript(pdfJsPath);
    }

    // Set worker source to local file
    if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      const workerPath = chrome.runtime.getURL("lib/pdf.worker.min.js");
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from DOCX file using mammoth.js
 * @param {File} file - DOCX file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromDOCX(file) {
  try {
    // Load mammoth.js from local extension files (not CDN due to CSP)
    if (typeof mammoth === "undefined") {
      // Try to load from extension's lib folder
      const mammothPath = chrome.runtime.getURL("lib/mammoth.browser.min.js");
      await loadScript(mammothPath);
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value.trim();
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

/**
 * Load a script dynamically
 * @param {string} src - Script source URL
 * @returns {Promise<void>}
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Extract text from a file stored in Supabase (using file path)
 * @param {string} filePath - Path to the file in Supabase storage (e.g., "userId/resumes/file.pdf")
 * @param {Object} supabaseClient - Supabase client instance
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromSupabaseFile(filePath, client) {
  try {
    if (!client) {
      throw new Error("Backend client is required");
    }

    // Use backend client to download file (works with both backend and Supabase clients)
    return await downloadFileFromBackend(filePath, client);
  } catch (error) {
    console.error("Error extracting text from backend file:", error);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
}

/**
 * Download file from backend storage (works with backend client or Supabase client)
 * @param {string} filePath - Path to the file
 * @param {Object} client - Backend client or Supabase client instance
 * @returns {Promise<string>} - Extracted text
 */
async function downloadFileFromBackend(filePath, client) {
  try {
    const session = await client.getSession();
    if (!session) {
      throw new Error("Not authenticated");
    }

    let response;
    
    // Check if this is a backend client (has getFileUrl method)
    // Backend client uses getFileUrl to get signed URL, then downloads from that URL
    if (client.getFileUrl && typeof client.getFileUrl === 'function') {
      // Use backend client's getFileUrl method
      const fileUrl = await client.getFileUrl(filePath);
      
      // Download file from the signed URL
      response = await fetch(fileUrl, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to download file: ${response.status} ${response.statusText} - ${errorText}`
        );
      }
    } else if (client.url && client.accessToken && client.anonKey) {
      // Fallback: Direct Supabase storage access (for backward compatibility)
      const supabaseUrl = client.url;
      const accessToken = client.accessToken;
      const anonKey = client.anonKey;

      // Download file directly from Supabase storage API
      response = await fetch(
        `${supabaseUrl}/storage/v1/object/user-files/${filePath}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: anonKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to download file: ${response.status} ${response.statusText} - ${errorText}`
        );
      }
    } else {
      throw new Error("Client does not support file download");
    }

    // Get file type from Content-Type header or URL
    const contentType = response.headers.get("content-type") || "";
    const blob = await response.blob();
    const fileName = filePath.toLowerCase();

    // Create a File-like object
    const file = new File([blob], fileName, { type: contentType });

    // Extract text based on file type
    if (contentType === "application/pdf" || fileName.endsWith(".pdf")) {
      return await extractTextFromPDF(file);
    } else if (
      contentType.includes("wordprocessingml") ||
      contentType === "application/msword" ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc")
    ) {
      return await extractTextFromDOCX(file);
    } else {
      throw new Error(`Unsupported file type: ${contentType || fileName}`);
    }
  } catch (error) {
    console.error("Error downloading file from backend:", error);
    throw error;
  }
}

/**
 * Extract text from a file URL (for existing files in database)
 * @param {string} fileUrl - URL to the file
 * @returns {Promise<string>} - Extracted text
 * @deprecated Use extractTextFromSupabaseFile instead for better reliability
 */
async function extractTextFromFileUrl(fileUrl) {
  try {
    // Fetch the file
    const response = await fetch(fileUrl, {
      method: "GET",
      credentials: "include",
      mode: "cors",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    // Get file type from Content-Type header or URL
    const contentType = response.headers.get("content-type") || "";
    const blob = await response.blob();
    const fileName = fileUrl.toLowerCase();

    // Create a File-like object
    const file = new File([blob], fileName, { type: contentType });

    // Extract text based on file type
    if (contentType === "application/pdf" || fileName.endsWith(".pdf")) {
      return await extractTextFromPDF(file);
    } else if (
      contentType.includes("wordprocessingml") ||
      contentType === "application/msword" ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc")
    ) {
      return await extractTextFromDOCX(file);
    } else {
      throw new Error(`Unsupported file type: ${contentType || fileName}`);
    }
  } catch (error) {
    console.error("Error extracting text from file URL:", error);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
}

// Export functions
if (typeof window !== "undefined") {
  window.FileTextExtractor = {
    extractTextFromFile,
    extractTextFromFileUrl, // Deprecated, use extractTextFromSupabaseFile
    extractTextFromSupabaseFile, // Recommended for Supabase files
    extractTextFromPDF,
    extractTextFromDOCX,
  };
}
