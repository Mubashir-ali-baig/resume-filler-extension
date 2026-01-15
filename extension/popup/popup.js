// Get references to DOM elements
const authContainer = document.getElementById("authContainer");
const mainContainer = document.getElementById("mainContainer");
const signInForm = document.getElementById("signInForm");
const signUpForm = document.getElementById("signUpForm");
const signInFormElement = document.getElementById("signInFormElement");
const signUpFormElement = document.getElementById("signUpFormElement");
const signInButton = document.getElementById("signInButton");
const signUpButton = document.getElementById("signUpButton");
const toggleToSignIn = document.getElementById("toggleToSignIn");
const toggleToSignUp = document.getElementById("toggleToSignUp");
const userEmail = document.getElementById("userEmail");
const signOutButton = document.getElementById("signOutButton");
const profileButton = document.getElementById("profileButton");
const profileSection = document.getElementById("profileSection");
const resumeFileInput = document.getElementById("resumeFileInput");
const coverLetterFileInput = document.getElementById("coverLetterFileInput");
const resumeFileInfo = document.getElementById("resumeFileInfo");
const coverLetterFileInfo = document.getElementById("coverLetterFileInfo");
const resumeFilePreview = document.getElementById("resumeFilePreview");
const coverLetterFilePreview = document.getElementById(
  "coverLetterFilePreview"
);
const removeResumeFile = document.getElementById("removeResumeFile");
const removeCoverLetterFile = document.getElementById("removeCoverLetterFile");
const executiveSummaryTextArea = document.getElementById(
  "executiveSummaryTextArea"
);
const saveProfileButton = document.getElementById("saveProfileButton");
const closeProfileButton = document.getElementById("closeProfileButton");

// Store selected files
let selectedResumeFile = null;
let selectedCoverLetterFile = null;
let currentResumeUrl = null;
let currentCoverLetterUrl = null;
let resumeFileRemoved = false;
let coverLetterFileRemoved = false;

const scanButton = document.getElementById("scanButton");
const status = document.getElementById("status");
const results = document.getElementById("results");
const contentTitle = document.getElementById("contentTitle");
const contentPreview = document.getElementById("contentPreview");
const contentStats = document.getElementById("contentStats");
const copyButton = document.getElementById("copyButton");
const formFieldsSection = document.getElementById("formFieldsSection");
const formFieldsList = document.getElementById("formFieldsList");

// Store full content for copying (not truncated)
let fullContent = "";

// Check authentication status on load
async function checkAuthStatus() {
  try {
    // Wait for backend client to be available
    if (!window.backend) {
      console.warn("Backend client not loaded yet, retrying...");
      setTimeout(checkAuthStatus, 100);
      return;
    }

    // Always use backend client (it provides backward-compatible window.supabase)
    const client = window.backend;
    const session = await client.getSession();
    if (session && session.user) {
      showMainApp(session.user);
      await loadUserProfile();
    } else {
      showAuthForm();
    }
  } catch (error) {
    console.error("Auth check error:", error);
    showAuthForm();
  }
}

// Show authentication form
function showAuthForm() {
  if (authContainer) authContainer.classList.remove("hidden");
  if (mainContainer) mainContainer.classList.add("hidden");
  if (signInForm) signInForm.classList.remove("hidden");
  if (signUpForm) signUpForm.classList.add("hidden");
}

// Show main app
function showMainApp(user) {
  if (authContainer) authContainer.classList.add("hidden");
  if (mainContainer) mainContainer.classList.remove("hidden");
  if (userEmail && user) {
    userEmail.textContent = user.email || "User";
  }
}

// Handle sign up
async function handleSignUp(event) {
  event.preventDefault();
  const email = document.getElementById("signUpEmail").value;
  const password = document.getElementById("signUpPassword").value;
  const confirmPassword = document.getElementById(
    "signUpConfirmPassword"
  ).value;

  if (password !== confirmPassword) {
    showError("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return;
  }

  try {
    const client = window.backend || window.supabase;
    if (!client) {
      throw new Error(
        "Backend client not loaded. Please refresh the extension."
      );
    }

    signUpButton.disabled = true;
    signUpButton.textContent = "Signing up...";

    const result = await client.signUp(email, password);

    if (result.user || result.access_token) {
      showSuccess("Account created! Redirecting...");
      await checkAuthStatus();
    } else {
      throw new Error(result.error?.message || "Sign up failed");
    }
  } catch (error) {
    console.error("Sign up error:", error);
    showError(error.message || "Failed to create account");
  } finally {
    signUpButton.disabled = false;
    signUpButton.textContent = "Sign Up";
  }
}

// Handle sign in
async function handleSignIn(event) {
  event.preventDefault();
  const email = document.getElementById("signInEmail").value;
  const password = document.getElementById("signInPassword").value;

  try {
    const client = window.backend || window.supabase;
    if (!client) {
      throw new Error(
        "Backend client not loaded. Please refresh the extension."
      );
    }

    signInButton.disabled = true;
    signInButton.textContent = "Signing in...";

    const result = await client.signIn(email, password);

    if (result.access_token) {
      showSuccess("Signed in successfully!");
      await checkAuthStatus();
    } else {
      throw new Error(result.error?.message || "Sign in failed");
    }
  } catch (error) {
    console.error("Sign in error:", error);
    showError(error.message || "Failed to sign in");
  } finally {
    signInButton.disabled = false;
    signInButton.textContent = "Sign In";
  }
}

// Handle sign out
async function handleSignOut() {
  try {
    const client = window.backend || window.supabase;
    if (client) {
      await client.signOut();
    }
    showAuthForm();
    showSuccess("Signed out successfully");
  } catch (error) {
    console.error("Sign out error:", error);
    showError("Failed to sign out");
  }
}

// Toggle between sign up and sign in
function toggleToSignInForm() {
  console.log("Toggling to sign in form");
  // Re-query elements in case they weren't found initially
  const signUpFormEl = document.getElementById("signUpForm");
  const signInFormEl = document.getElementById("signInForm");

  if (signUpFormEl) {
    signUpFormEl.classList.add("hidden");
    console.log("Sign up form hidden");
  } else {
    console.error("signUpForm element not found");
  }
  if (signInFormEl) {
    signInFormEl.classList.remove("hidden");
    console.log("Sign in form shown");
  } else {
    console.error("signInForm element not found");
  }
}

function toggleToSignUpForm() {
  console.log("Toggling to sign up form");
  // Re-query elements in case they weren't found initially
  const signInFormEl = document.getElementById("signInForm");
  const signUpFormEl = document.getElementById("signUpForm");

  if (signInFormEl) {
    signInFormEl.classList.add("hidden");
    console.log("Sign in form hidden");
  } else {
    console.error("signInForm element not found");
  }
  if (signUpFormEl) {
    signUpFormEl.classList.remove("hidden");
    console.log("Sign up form shown");
  } else {
    console.error("signUpForm element not found");
  }
}

// Load user profile
async function loadUserProfile() {
  try {
    // Reset removal flags when loading profile
    resumeFileRemoved = false;
    coverLetterFileRemoved = false;
    selectedResumeFile = null;
    selectedCoverLetterFile = null;

    const client = window.backend || window.supabase;
    if (!client) {
      console.error("Backend client not available");
      return;
    }
    const profile = await client.getUserProfile();

    if (profile && profile.length > 0) {
      const data = profile[0];

      // Load resume file info
      if (data.resume_file_url) {
        try {
          // Get signed URL for the stored file path
          const client = window.backend || window.supabase;
          const signedUrl = await client.getFileUrl(data.resume_file_url);
          currentResumeUrl = signedUrl;
          updateFileDisplay("resume", signedUrl, true);
        } catch (error) {
          console.error("Error loading resume URL:", error);
          updateFileDisplay(
            "resume",
            data.resume_file_url.split("/").pop(),
            true
          );
        }
      } else {
        updateFileDisplay("resume", null, false);
      }

      // Load cover letter file info
      if (data.cover_letter_file_url) {
        try {
          // Get signed URL for the stored file path
          const client = window.backend || window.supabase;
          const signedUrl = await client.getFileUrl(data.cover_letter_file_url);
          currentCoverLetterUrl = signedUrl;
          updateFileDisplay("coverLetter", signedUrl, true);
        } catch (error) {
          console.error("Error loading cover letter URL:", error);
          updateFileDisplay(
            "coverLetter",
            data.cover_letter_file_url.split("/").pop(),
            true
          );
        }
      } else {
        updateFileDisplay("coverLetter", null, false);
      }

      // Load executive summary
      if (executiveSummaryTextArea)
        executiveSummaryTextArea.value = data.executive_summary || "";
    } else {
      // No profile yet
      updateFileDisplay("resume", null, false);
      updateFileDisplay("coverLetter", null, false);
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    // Don't show error, profile might not exist yet
  }
}

// Update file display UI
function updateFileDisplay(type, fileUrlOrName, hasFile) {
  const isResume = type === "resume";
  const fileInfo = isResume ? resumeFileInfo : coverLetterFileInfo;
  const filePreview = isResume ? resumeFilePreview : coverLetterFilePreview;
  const removeButton = isResume ? removeResumeFile : removeCoverLetterFile;
  const fileNameSpan = fileInfo?.querySelector(".file-name");

  if (hasFile && fileUrlOrName) {
    // If it's a URL (starts with http), extract filename, otherwise use the name directly
    const fileName = fileUrlOrName.includes("http")
      ? fileUrlOrName.split("/").pop() || "Uploaded file"
      : fileUrlOrName;

    if (fileNameSpan) {
      fileNameSpan.textContent = fileName;
      fileNameSpan.classList.add("has-file");
    }
    if (removeButton) removeButton.style.display = "inline-block";

    // Only show preview link if it's a URL
    if (filePreview) {
      if (fileUrlOrName.includes("http")) {
        filePreview.innerHTML = `<a href="${fileUrlOrName}" target="_blank">📄 View file</a>`;
      } else {
        filePreview.innerHTML = `<span>📄 ${fileName}</span>`;
      }
    }
  } else {
    if (fileNameSpan) {
      fileNameSpan.textContent = "No file selected";
      fileNameSpan.classList.remove("has-file");
    }
    if (removeButton) removeButton.style.display = "none";
    if (filePreview) filePreview.innerHTML = "";
  }
}

// Save user profile
async function saveUserProfile() {
  try {
    saveProfileButton.disabled = true;
    saveProfileButton.textContent = "Saving...";

    const profileData = {
      executive_summary: executiveSummaryTextArea?.value || "",
    };

    // Get existing profile once (for checking and deleting old files)
    const client = window.backend || window.supabase;
    if (!client) {
      throw new Error("Backend client not available");
    }
    const existing = await client.getUserProfile();
    const existingProfile =
      existing && existing.length > 0 ? existing[0] : null;

    // Handle resume file removal
    if (resumeFileRemoved) {
      // Delete file from storage if exists
      if (existingProfile && existingProfile.resume_file_url) {
        try {
          await client.deleteFile(existingProfile.resume_file_url);
        } catch (e) {
          console.log("Could not delete resume file:", e);
        }
      }
      profileData.resume_file_url = null;
      currentResumeUrl = null;
      resumeFileRemoved = false;
    }
    // Upload resume file if selected
    else if (selectedResumeFile) {
      const fileName = `resume_${Date.now()}_${selectedResumeFile.name}`;

      // Delete old resume if exists
      if (existingProfile && existingProfile.resume_file_url) {
        try {
          await client.deleteFile(existingProfile.resume_file_url);
        } catch (e) {
          console.log("Could not delete old resume:", e);
        }
      }

      // Extract text from resume file
      try {
        console.log("[Profile] Extracting text from resume file...");
        if (
          window.FileTextExtractor &&
          window.FileTextExtractor.extractTextFromFile
        ) {
          const extractedText =
            await window.FileTextExtractor.extractTextFromFile(
              selectedResumeFile
            );
          if (extractedText && extractedText.trim()) {
            profileData.resume_text = extractedText.trim();
            console.log(
              `[Profile] ✓ Extracted ${extractedText.length} characters from resume`
            );
          } else {
            console.warn("[Profile] ⚠️ No text extracted from resume file");
          }
        } else {
          console.warn(
            "[Profile] ⚠️ FileTextExtractor not available, skipping text extraction"
          );
        }
      } catch (error) {
        console.error("[Profile] Error extracting text from resume:", error);
        // Continue with upload even if text extraction fails
      }

      // Upload new resume
      const resumePath = await client.uploadFile(
        selectedResumeFile,
        fileName,
        "resumes"
      );
      // Get signed URL for the uploaded file
      const resumeUrl = await client.getFileUrl(resumePath);
      profileData.resume_file_url = resumePath; // Store path in DB, use signed URL for access
      currentResumeUrl = resumeUrl; // Store signed URL for display
      selectedResumeFile = null;
    }
    // Preserve existing resume file URL and text if no changes
    else if (
      existingProfile &&
      existingProfile.resume_file_url &&
      !resumeFileRemoved
    ) {
      profileData.resume_file_url = existingProfile.resume_file_url;
      // Also preserve existing resume_text if available
      if (existingProfile.resume_text) {
        profileData.resume_text = existingProfile.resume_text;
      }
    }

    // Handle cover letter file removal
    if (coverLetterFileRemoved) {
      // Delete file from storage if exists
      if (existingProfile && existingProfile.cover_letter_file_url) {
        try {
          await client.deleteFile(existingProfile.cover_letter_file_url);
        } catch (e) {
          console.log("Could not delete cover letter file:", e);
        }
      }
      profileData.cover_letter_file_url = null;
      currentCoverLetterUrl = null;
      coverLetterFileRemoved = false;
    }
    // Upload cover letter file if selected
    else if (selectedCoverLetterFile) {
      const fileName = `coverletter_${Date.now()}_${
        selectedCoverLetterFile.name
      }`;

      // Delete old cover letter if exists
      if (existingProfile && existingProfile.cover_letter_file_url) {
        try {
          await client.deleteFile(existingProfile.cover_letter_file_url);
        } catch (e) {
          console.log("Could not delete old cover letter:", e);
        }
      }

      // Extract text from cover letter file
      try {
        console.log("[Profile] Extracting text from cover letter file...");
        if (
          window.FileTextExtractor &&
          window.FileTextExtractor.extractTextFromFile
        ) {
          const extractedText =
            await window.FileTextExtractor.extractTextFromFile(
              selectedCoverLetterFile
            );
          if (extractedText && extractedText.trim()) {
            profileData.cover_letter_text = extractedText.trim();
            console.log(
              `[Profile] ✓ Extracted ${extractedText.length} characters from cover letter`
            );
          } else {
            console.warn(
              "[Profile] ⚠️ No text extracted from cover letter file"
            );
          }
        } else {
          console.warn(
            "[Profile] ⚠️ FileTextExtractor not available, skipping text extraction"
          );
        }
      } catch (error) {
        console.error(
          "[Profile] Error extracting text from cover letter:",
          error
        );
        // Continue with upload even if text extraction fails
      }

      // Upload new cover letter
      const coverLetterPath = await client.uploadFile(
        selectedCoverLetterFile,
        fileName,
        "cover-letters"
      );
      // Get signed URL for the uploaded file
      const coverLetterUrl = await client.getFileUrl(coverLetterPath);
      profileData.cover_letter_file_url = coverLetterPath; // Store path in DB, use signed URL for access
      currentCoverLetterUrl = coverLetterUrl; // Store signed URL for display
      selectedCoverLetterFile = null;
    }
    // Preserve existing cover letter file URL and text if no changes
    else if (
      existingProfile &&
      existingProfile.cover_letter_file_url &&
      !coverLetterFileRemoved
    ) {
      profileData.cover_letter_file_url = existingProfile.cover_letter_file_url;
      // Also preserve existing cover_letter_text if available
      if (existingProfile.cover_letter_text) {
        profileData.cover_letter_text = existingProfile.cover_letter_text;
      }
    }

    // Save or update profile
    if (existingProfile) {
      // Update existing profile
      await client.updateUserProfile(profileData);
    } else {
      // Create new profile
      await client.createUserProfile(profileData);
    }

    // Update file displays with signed URLs
    if (profileData.resume_file_url) {
      try {
        // Get signed URL for display
        const signedUrl = await client.getFileUrl(profileData.resume_file_url);
        currentResumeUrl = signedUrl;
        updateFileDisplay("resume", signedUrl, true);
      } catch (error) {
        console.error("Error getting resume signed URL:", error);
        // Fallback to filename
        updateFileDisplay(
          "resume",
          profileData.resume_file_url.split("/").pop(),
          true
        );
      }
    } else {
      updateFileDisplay("resume", null, false);
    }

    if (profileData.cover_letter_file_url) {
      try {
        // Get signed URL for display
        const signedUrl = await client.getFileUrl(
          profileData.cover_letter_file_url
        );
        currentCoverLetterUrl = signedUrl;
        updateFileDisplay("coverLetter", signedUrl, true);
      } catch (error) {
        console.error("Error getting cover letter signed URL:", error);
        // Fallback to filename
        updateFileDisplay(
          "coverLetter",
          profileData.cover_letter_file_url.split("/").pop(),
          true
        );
      }
    } else {
      updateFileDisplay("coverLetter", null, false);
    }

    // Reset file inputs
    if (resumeFileInput) resumeFileInput.value = "";
    if (coverLetterFileInput) coverLetterFileInput.value = "";

    showSuccess("Profile saved successfully!");
  } catch (error) {
    console.error("Error saving profile:", error);
    showError("Failed to save profile: " + error.message);
  } finally {
    saveProfileButton.disabled = false;
    saveProfileButton.textContent = "💾 Save Profile";
  }
}

// Toggle profile section
function toggleProfileSection() {
  if (profileSection) {
    profileSection.classList.toggle("hidden");
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Auth form listeners
  if (signUpFormElement) {
    signUpFormElement.addEventListener("submit", handleSignUp);
  }

  if (signInFormElement) {
    signInFormElement.addEventListener("submit", handleSignIn);
  }

  // Use event delegation for toggle links in case they're not found initially
  const authContainerEl = document.getElementById("authContainer");
  if (authContainerEl) {
    authContainerEl.addEventListener("click", (e) => {
      if (e.target && e.target.id === "toggleToSignUp") {
        e.preventDefault();
        e.stopPropagation();
        console.log("toggleToSignUp clicked (via delegation)");
        toggleToSignUpForm();
      } else if (e.target && e.target.id === "toggleToSignIn") {
        e.preventDefault();
        e.stopPropagation();
        console.log("toggleToSignIn clicked (via delegation)");
        toggleToSignInForm();
      }
    });
  }

  // Also add direct listeners if elements exist
  if (toggleToSignIn) {
    console.log("Adding direct listener to toggleToSignIn");
    toggleToSignIn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("toggleToSignIn clicked (direct)");
      toggleToSignInForm();
    });
  } else {
    console.warn("toggleToSignIn element not found, using delegation");
  }

  if (toggleToSignUp) {
    console.log("Adding direct listener to toggleToSignUp");
    toggleToSignUp.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("toggleToSignUp clicked (direct)");
      toggleToSignUpForm();
    });
  } else {
    console.warn("toggleToSignUp element not found, using delegation");
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", handleSignOut);
  }

  // Profile listeners
  if (profileButton) {
    profileButton.addEventListener("click", toggleProfileSection);
  }

  if (closeProfileButton) {
    closeProfileButton.addEventListener("click", toggleProfileSection);
  }

  if (saveProfileButton) {
    saveProfileButton.addEventListener("click", saveUserProfile);
  }

  // File input listeners - capture selected files
  if (resumeFileInput) {
    resumeFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedResumeFile = file;
        resumeFileRemoved = false; // Reset removal flag if new file selected
        updateFileDisplay("resume", file.name, true);
      }
    });
  }

  if (coverLetterFileInput) {
    coverLetterFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedCoverLetterFile = file;
        coverLetterFileRemoved = false; // Reset removal flag if new file selected
        updateFileDisplay("coverLetter", file.name, true);
      }
    });
  }

  // Remove file button listeners
  if (removeResumeFile) {
    removeResumeFile.addEventListener("click", () => {
      selectedResumeFile = null;
      resumeFileRemoved = true;
      currentResumeUrl = null;
      if (resumeFileInput) resumeFileInput.value = "";
      updateFileDisplay("resume", null, false);
    });
  }

  if (removeCoverLetterFile) {
    removeCoverLetterFile.addEventListener("click", () => {
      selectedCoverLetterFile = null;
      coverLetterFileRemoved = true;
      currentCoverLetterUrl = null;
      if (coverLetterFileInput) coverLetterFileInput.value = "";
      updateFileDisplay("coverLetter", null, false);
    });
  }
}

// Show status message
function showStatus(message, type = "success") {
  status.textContent = message;
  status.className = `status ${type}`;
  status.classList.remove("hidden");

  // Auto-hide success messages after 3 seconds
  if (type === "success") {
    setTimeout(() => {
      status.classList.add("hidden");
    }, 3000);
  }
}

// Show error message
function showError(message) {
  showStatus(message, "error");
}

// Show success message
function showSuccess(message) {
  showStatus(message, "success");
}

// Show loading state
function showLoading(message) {
  showStatus(message, "loading");
}

// Format content preview
function formatContentPreview(text) {
  // Truncate if too long
  const maxLength = 1000;
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...\n\n[Content truncated]";
  }
  return text;
}

// Display results
function displayResults(content) {
  const text = content.text || "";
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const charCount = text.length;
  const formFields = content.formFields || [];
  const modalsFound = content.modalsFound || 0;
  const openModalsFound = content.openModalsFound || 0;
  const latestModalFound = content.latestModalFound || false;
  const isModalContent = content.isModalContent || false;
  const fieldsInModals = formFields.filter((f) => f.inModal).length;
  const fieldsInLatestModal = formFields.filter((f) => f.inLatestModal).length;

  // Update title based on content source
  if (isModalContent && latestModalFound) {
    contentTitle.textContent = "Latest Modal Content:";
    contentTitle.style.color = "#667eea";
  } else {
    contentTitle.textContent = "Page Content:";
    contentTitle.style.color = "#333";
  }

  // Store full content (not truncated) for copying
  fullContent = text;

  // Show truncated preview
  contentPreview.textContent = formatContentPreview(text);
  contentStats.innerHTML = `
    <span><strong>Characters:</strong> ${charCount.toLocaleString()}</span>
    <span><strong>Words:</strong> ${wordCount.toLocaleString()}</span>
    <span><strong>Form Fields:</strong> ${formFields.length}</span>
    ${
      modalsFound > 0
        ? `<span><strong>Total Modals:</strong> ${modalsFound}</span>`
        : ""
    }
    ${
      latestModalFound
        ? `<span><strong>Latest Modal:</strong> Active</span>`
        : ""
    }
    ${
      fieldsInLatestModal > 0
        ? `<span><strong>Fields in Latest Modal:</strong> ${fieldsInLatestModal}</span>`
        : ""
    }
  `;

  // Display form fields
  displayFormFields(formFields);

  results.classList.remove("hidden");
}

// Display form fields with fill capability
function displayFormFields(fields) {
  if (!fields || fields.length === 0) {
    formFieldsSection.classList.add("hidden");
    return;
  }

  formFieldsSection.classList.remove("hidden");
  formFieldsList.innerHTML = "";

  fields.forEach((field, index) => {
    const fieldItem = document.createElement("div");
    fieldItem.className = "form-field-item";

    const label =
      field.label || field.placeholder || field.name || `Field ${index + 1}`;
    const location = field.inModal ? " (in modal)" : "";
    const typeLabel = field.type === "textarea" ? "textarea" : "input";

    fieldItem.innerHTML = `
      <label class="form-field-label">
        ${label}
        <span class="field-type">(${typeLabel})</span>
        ${location ? `<span class="field-location">${location}</span>` : ""}
      </label>
      <textarea 
        class="form-field-input" 
        data-field-selector="${field.selector}"
        data-field-id="${field.fieldId}"
        placeholder="Enter text to fill this field..."
        rows="3"
      >${field.currentValue || ""}</textarea>
      <div class="form-field-actions">
        <button class="ai-button" data-field-selector="${
          field.selector
        }" data-field-label="${
      label || placeholder || name
    }" title="Generate AI answer">
          🤖 AI
        </button>
        <button class="fill-button" data-field-selector="${field.selector}">
          Fill Field
        </button>
      </div>
    `;

    formFieldsList.appendChild(fieldItem);

    // Add fill button handler
    const fillButton = fieldItem.querySelector(".fill-button");
    const aiButton = fieldItem.querySelector(".ai-button");
    const textInput = fieldItem.querySelector(".form-field-input");

    fillButton.addEventListener("click", async () => {
      await fillSingleField(field.selector, textInput.value, fillButton);
    });

    // Add AI button handler
    aiButton.addEventListener("click", async () => {
      await generateAndFillField(field, textInput, aiButton, fillButton);
    });
  });
}

// Generate AI response and fill field
async function generateAndFillField(field, textInput, aiButton, fillButton) {
  try {
    aiButton.disabled = true;
    aiButton.textContent = "🤖 Generating...";
    showLoading("Generating AI response...");

    // Get context for AI generation
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("No active tab found");
    }

    // Get page content and job description for context
    const scanResponse = await chrome.tabs.sendMessage(tab.id, {
      action: "scanPage",
    });

    if (!scanResponse || !scanResponse.success) {
      throw new Error("Failed to get page context");
    }

    const pageContext = scanResponse.data;
    const question =
      field.label || field.placeholder || field.name || "this question";
    const jobDescription = pageContext.jobDescription || "";
    const pageText = pageContext.text || "";

    // Generate AI response
    const aiResponse = await generateAIAnswerForField(
      question,
      jobDescription,
      pageText
    );

    // Auto-fill the text input
    textInput.value = aiResponse;

    // Auto-fill the field on the page
    await fillSingleField(field.selector, aiResponse, fillButton);

    aiButton.textContent = "🤖 AI";
    aiButton.classList.add("success");
    showStatus("AI answer generated and filled!", "success");

    setTimeout(() => {
      aiButton.classList.remove("success");
      aiButton.disabled = false;
    }, 2000);
  } catch (error) {
    console.error("AI generation error:", error);
    showError(`AI generation failed: ${error.message}`);
    aiButton.textContent = "🤖 AI";
    aiButton.disabled = false;
  }
}

// Generate AI answer using the AI service
async function generateAIAnswerForField(question, jobDescription, pageContext) {
  // Use the AI service if available
  if (window.AIService && window.AIService.generateAIAnswer) {
    return await window.AIService.generateAIAnswer(
      question,
      jobDescription,
      pageContext
    );
  }

  // Fallback: Mock response if AI service not loaded
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockAnswer = `Based on the question "${question}", here is a professional response that highlights relevant experience and aligns with the job requirements. This demonstrates strong communication skills and attention to detail.`;
      resolve(mockAnswer);
    }, 1500);
  });
}

// Fill a single field
async function fillSingleField(selector, text, buttonElement) {
  try {
    buttonElement.disabled = true;
    buttonElement.textContent = "Filling...";

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("No active tab found");
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "fillField",
      selector: selector,
      text: text,
    });

    if (response && response.success) {
      buttonElement.textContent = "✓ Filled!";
      buttonElement.classList.add("success");
      showStatus("Field filled successfully!", "success");

      setTimeout(() => {
        buttonElement.textContent = "Fill Field";
        buttonElement.classList.remove("success");
        buttonElement.disabled = false;
      }, 2000);
    } else {
      throw new Error(response?.error || "Failed to fill field");
    }
  } catch (error) {
    console.error("Fill error:", error);
    showError(`Failed to fill field: ${error.message}`);
    buttonElement.textContent = "Fill Field";
    buttonElement.disabled = false;
  }
}

// Copy full content to clipboard
async function copyContentToClipboard() {
  if (!fullContent) {
    showError("No content to copy");
    return;
  }

  try {
    await navigator.clipboard.writeText(fullContent);
    copyButton.textContent = "✓ Copied!";
    copyButton.classList.add("copied");
    showStatus("Content copied to clipboard!", "success");

    setTimeout(() => {
      copyButton.textContent = "📋 Copy";
      copyButton.classList.remove("copied");
    }, 2000);
  } catch (error) {
    // Fallback for older browsers or if clipboard API fails
    try {
      const textArea = document.createElement("textarea");
      textArea.value = fullContent;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, 999999); // For mobile devices

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        copyButton.textContent = "✓ Copied!";
        copyButton.classList.add("copied");
        showStatus("Content copied to clipboard!", "success");

        setTimeout(() => {
          copyButton.textContent = "📋 Copy";
          copyButton.classList.remove("copied");
        }, 2000);
      } else {
        throw new Error("Copy command failed");
      }
    } catch (err) {
      console.error("Copy error:", err);
      showError(
        "Failed to copy content. Please try selecting and copying manually."
      );
    }
  }
}

// Add copy button click handler
if (copyButton) {
  copyButton.addEventListener("click", copyContentToClipboard);
}

// Handle scan button click (only works when authenticated)
if (scanButton) {
  scanButton.addEventListener("click", async () => {
    // Check if authenticated
    const client = window.backend || window.supabase;
    if (!client) {
      showError("Backend client not loaded. Please refresh the extension.");
      return;
    }
    const session = await client.getSession();
    if (!session || !session.user) {
      showError("Please sign in to use this feature");
      showAuthForm();
      return;
    }

    await handleScanPage();
  });
}

async function handleScanPage() {
  try {
    // Disable button and show loading
    scanButton.disabled = true;
    showLoading("Scanning page...");
    results.classList.add("hidden");

    // Get the active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("No active tab found");
    }

    // Check if we can access the page (not chrome:// or extension pages)
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("edge-extension://")
    ) {
      throw new Error(
        "Cannot scan Chrome/Edge internal pages. Please navigate to a regular website."
      );
    }

    // Try to send message to content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "scanPage",
      });

      if (response && response.success) {
        displayResults(response.data);
        showStatus("Page scanned successfully!", "success");
      } else {
        throw new Error(response?.error || "Failed to scan page");
      }
    } catch (error) {
      // If message fails, content script might not be loaded yet
      // Try injecting it manually if scripting API is available
      if (
        error.message.includes("Could not establish connection") ||
        error.message.includes("Receiving end does not exist")
      ) {
        // Check if scripting API is available
        if (!chrome.scripting) {
          throw new Error(
            "Content script not loaded. Please reload the page and try again."
          );
        }

        // Inject script and try again
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content/content-script.js"],
          });

          // Wait a bit for script to initialize
          await new Promise((resolve) => setTimeout(resolve, 200));

          // Try again
          const response = await chrome.tabs.sendMessage(tab.id, {
            action: "scanPage",
          });

          if (response && response.success) {
            displayResults(response.data);
            showStatus("Page scanned successfully!", "success");
          } else {
            throw new Error(
              response?.error || "Failed to scan page after injection"
            );
          }
        } catch (injectError) {
          throw new Error(
            `Failed to inject content script: ${injectError.message}`
          );
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Scan error:", error);
    showError(`Error: ${error.message}`);
  } finally {
    if (scanButton) scanButton.disabled = false;
  }
}

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeEventListeners();
    checkAuthStatus();
  });
} else {
  initializeEventListeners();
  checkAuthStatus();
}

console.log("Resume Filler popup loaded");
