// Profile management for Resume Filler extension

// Get references to DOM elements
const resumeTextArea = document.getElementById('resumeTextArea');
const coverLetterTextArea = document.getElementById('coverLetterTextArea');
const executiveSummaryTextArea = document.getElementById('executiveSummaryTextArea');
const saveProfileButton = document.getElementById('saveProfileButton');
const uploadResumeButton = document.getElementById('uploadResumeButton');
const resumeFileInput = document.getElementById('resumeFileInput');

// Load user profile
async function loadUserProfile() {
  try {
    const profile = await window.supabase.getUserProfile();
    
    if (profile && profile.length > 0) {
      const data = profile[0];
      
      if (resumeTextArea) resumeTextArea.value = data.resume_text || '';
      if (coverLetterTextArea) coverLetterTextArea.value = data.cover_letter_text || '';
      if (executiveSummaryTextArea) executiveSummaryTextArea.value = data.executive_summary || '';
      
      showSuccess('Profile loaded');
    } else {
      // No profile yet, show empty form
      console.log('No profile found, showing empty form');
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    showError('Failed to load profile: ' + error.message);
  }
}

// Save user profile
async function saveUserProfile() {
  try {
    saveProfileButton.disabled = true;
    saveProfileButton.textContent = 'Saving...';

    const profileData = {
      resume_text: resumeTextArea?.value || '',
      cover_letter_text: coverLetterTextArea?.value || '',
      executive_summary: executiveSummaryTextArea?.value || ''
    };

    // Check if profile exists
    const existing = await window.supabase.getUserProfile();
    
    let result;
    if (existing && existing.length > 0) {
      // Update existing profile
      result = await window.supabase.updateUserProfile(profileData);
    } else {
      // Create new profile
      result = await window.supabase.createUserProfile(profileData);
    }

    showSuccess('Profile saved successfully!');
  } catch (error) {
    console.error('Error saving profile:', error);
    showError('Failed to save profile: ' + error.message);
  } finally {
    saveProfileButton.disabled = false;
    saveProfileButton.textContent = 'Save Profile';
  }
}

// Handle resume file upload
async function handleResumeUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // For now, extract text from file
  // In production, upload to Supabase Storage and get URL
  try {
    uploadResumeButton.disabled = true;
    uploadResumeButton.textContent = 'Uploading...';

    // Read file as text (for PDF, you'd need a PDF parser)
    const text = await readFileAsText(file);
    
    // Update resume textarea
    if (resumeTextArea) {
      resumeTextArea.value = text;
    }

    // TODO: Upload file to Supabase Storage
    // const fileUrl = await uploadToSupabaseStorage(file);
    // await window.supabase.updateUserProfile({ resume_file_url: fileUrl });

    showSuccess('Resume uploaded!');
  } catch (error) {
    console.error('Error uploading resume:', error);
    showError('Failed to upload resume: ' + error.message);
  } finally {
    uploadResumeButton.disabled = false;
    uploadResumeButton.textContent = 'Upload Resume';
  }
}

// Read file as text (simple implementation)
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      reader.readAsText(file);
    } else {
      // For PDF/DOC files, you'd need a library
      reject(new Error('Please upload a text file. PDF/DOC support coming soon.'));
    }
  });
}

// Show error message
function showError(message) {
  alert('Error: ' + message);
}

// Show success message
function showSuccess(message) {
  alert('Success: ' + message);
}

// Event listeners
if (saveProfileButton) {
  saveProfileButton.addEventListener('click', saveUserProfile);
}

if (uploadResumeButton && resumeFileInput) {
  uploadResumeButton.addEventListener('click', () => {
    resumeFileInput.click();
  });
  
  resumeFileInput.addEventListener('change', handleResumeUpload);
}

// Load profile on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadUserProfile);
} else {
  loadUserProfile();
}
