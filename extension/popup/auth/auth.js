// Authentication handling for Resume Filler extension

// Get references to DOM elements
const signUpForm = document.getElementById('signUpForm');
const signInForm = document.getElementById('signInForm');
const signUpButton = document.getElementById('signUpButton');
const signInButton = document.getElementById('signInButton');
const toggleToSignIn = document.getElementById('toggleToSignIn');
const toggleToSignUp = document.getElementById('toggleToSignUp');
const authContainer = document.getElementById('authContainer');
const mainContainer = document.getElementById('mainContainer');
const userEmail = document.getElementById('userEmail');
const signOutButton = document.getElementById('signOutButton');

// Check authentication status on load
async function checkAuthStatus() {
  try {
    const session = await window.supabase.getSession();
    if (session && session.user) {
      showMainApp(session.user);
    } else {
      showAuthForm();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    showAuthForm();
  }
}

// Show authentication form
function showAuthForm() {
  authContainer.classList.remove('hidden');
  mainContainer.classList.add('hidden');
  signInForm.classList.remove('hidden');
  signUpForm.classList.add('hidden');
}

// Show main app
function showMainApp(user) {
  authContainer.classList.add('hidden');
  mainContainer.classList.remove('hidden');
  if (userEmail) {
    userEmail.textContent = user.email || 'User';
  }
}

// Handle sign up
async function handleSignUp(event) {
  event.preventDefault();
  const email = document.getElementById('signUpEmail').value;
  const password = document.getElementById('signUpPassword').value;
  const confirmPassword = document.getElementById('signUpConfirmPassword').value;

  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }

  try {
    signUpButton.disabled = true;
    signUpButton.textContent = 'Signing up...';

    const result = await window.supabase.signUp(email, password);
    
    if (result.user) {
      showSuccess('Account created! Please check your email to verify your account.');
      // Switch to sign in form
      signUpForm.classList.add('hidden');
      signInForm.classList.remove('hidden');
    } else {
      throw new Error(result.error?.message || 'Sign up failed');
    }
  } catch (error) {
    console.error('Sign up error:', error);
    showError(error.message || 'Failed to create account');
  } finally {
    signUpButton.disabled = false;
    signUpButton.textContent = 'Sign Up';
  }
}

// Handle sign in
async function handleSignIn(event) {
  event.preventDefault();
  const email = document.getElementById('signInEmail').value;
  const password = document.getElementById('signInPassword').value;

  try {
    signInButton.disabled = true;
    signInButton.textContent = 'Signing in...';

    const result = await window.supabase.signIn(email, password);
    
    if (result.access_token) {
      showSuccess('Signed in successfully!');
      await checkAuthStatus();
    } else {
      throw new Error(result.error?.message || 'Sign in failed');
    }
  } catch (error) {
    console.error('Sign in error:', error);
    showError(error.message || 'Failed to sign in');
  } finally {
    signInButton.disabled = false;
    signInButton.textContent = 'Sign In';
  }
}

// Handle sign out
async function handleSignOut() {
  try {
    await window.supabase.signOut();
    showAuthForm();
    showSuccess('Signed out successfully');
  } catch (error) {
    console.error('Sign out error:', error);
    showError('Failed to sign out');
  }
}

// Toggle between sign up and sign in
function toggleToSignInForm() {
  signUpForm.classList.add('hidden');
  signInForm.classList.remove('hidden');
}

function toggleToSignUpForm() {
  signInForm.classList.add('hidden');
  signUpForm.classList.remove('hidden');
}

// Show error message
function showError(message) {
  // You can implement a toast/notification system here
  alert('Error: ' + message);
}

// Show success message
function showSuccess(message) {
  // You can implement a toast/notification system here
  alert('Success: ' + message);
}

// Event listeners
if (signUpForm) {
  signUpForm.addEventListener('submit', handleSignUp);
}

if (signInForm) {
  signInForm.addEventListener('submit', handleSignIn);
}

if (toggleToSignIn) {
  toggleToSignIn.addEventListener('click', toggleToSignInForm);
}

if (toggleToSignUp) {
  toggleToSignUp.addEventListener('click', toggleToSignUpForm);
}

if (signOutButton) {
  signOutButton.addEventListener('click', handleSignOut);
}

// Check auth status on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAuthStatus);
} else {
  checkAuthStatus();
}
