// Supabase Client Configuration
// NOTE: Supabase is now handled server-side via backend API
// This client is kept for backward compatibility but should be migrated to use backend API

// Get configuration from window (set by config.js)
// Use a local variable to avoid redeclaration errors
// If SUPABASE_CONFIG is not set, Supabase operations should use backend API instead
const supabaseConfig = window.SUPABASE_CONFIG || null;

// Validate configuration
if (!supabaseConfig) {
  console.warn(
    "⚠️ Supabase configuration not found. Extension should use backend API for Supabase operations."
  );
  console.warn(
    "⚠️ Update extension code to use BACKEND_CONFIG endpoints instead of direct Supabase calls."
  );
}

// Initialize Supabase client
// Note: For browser extensions, we'll use fetch API directly
// Full Supabase JS client requires some adjustments for extensions

class SupabaseClient {
  constructor(config) {
    if (!config) {
      throw new Error("Supabase config is required");
    }
    this.url = config.url;
    this.anonKey = config.anonKey;
    this.accessToken = null;
  }

  // Set access token after authentication
  setAccessToken(token) {
    this.accessToken = token;
  }

  // Make authenticated request
  async request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      apikey: this.anonKey,
      ...options.headers,
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.url}/rest/v1${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = "Request failed";
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        errorMessage = `${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses (common for UPDATE/DELETE operations)
    const contentType = response.headers.get("content-type");
    const text = await response.text();

    // If response is empty or not JSON, return null or empty array
    if (!text || text.trim() === "") {
      return null;
    }

    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      // If not valid JSON, return the text or null
      return text || null;
    }
  }

  // Auth methods
  async signUp(email, password, metadata = {}) {
    const response = await fetch(`${this.url}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.anonKey,
      },
      body: JSON.stringify({
        email,
        password,
        data: metadata,
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      this.setAccessToken(data.access_token);
      await chrome.storage.local.set({
        supabaseAccessToken: data.access_token,
        supabaseRefreshToken: data.refresh_token,
        supabaseUser: data.user,
      });
    }
    return data;
  }

  async signIn(email, password) {
    const response = await fetch(
      `${this.url}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.anonKey,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();
    if (data.access_token) {
      this.setAccessToken(data.access_token);
      await chrome.storage.local.set({
        supabaseAccessToken: data.access_token,
        supabaseRefreshToken: data.refresh_token,
        supabaseUser: data.user,
      });
    }
    return data;
  }

  async signOut() {
    this.setAccessToken(null);
    await chrome.storage.local.remove([
      "supabaseAccessToken",
      "supabaseRefreshToken",
      "supabaseUser",
    ]);
  }

  async getSession() {
    const { supabaseAccessToken, supabaseUser } =
      await chrome.storage.local.get(["supabaseAccessToken", "supabaseUser"]);

    if (supabaseAccessToken) {
      this.setAccessToken(supabaseAccessToken);
      return { access_token: supabaseAccessToken, user: supabaseUser };
    }
    return null;
  }

  // User Profile methods
  async getUserProfile() {
    const session = await this.getSession();
    if (!session) throw new Error("Not authenticated");

    return this.request("/user_profiles?user_id=eq." + session.user.id, {
      method: "GET",
    });
  }

  async createUserProfile(profileData) {
    const session = await this.getSession();
    if (!session) throw new Error("Not authenticated");

    return this.request("/user_profiles", {
      method: "POST",
      body: JSON.stringify({
        user_id: session.user.id,
        ...profileData,
      }),
    });
  }

  async updateUserProfile(profileData) {
    const session = await this.getSession();
    if (!session) throw new Error("Not authenticated");

    return this.request("/user_profiles?user_id=eq." + session.user.id, {
      method: "PATCH",
      body: JSON.stringify(profileData),
    });
  }

  // User Preferences methods
  async getUserPreferences() {
    const session = await this.getSession();
    if (!session) throw new Error("Not authenticated");

    const result = await this.request(
      "/user_preferences?user_id=eq." + session.user.id,
      {
        method: "GET",
      }
    );
    return result[0] || null;
  }

  async updateUserPreferences(preferences) {
    const session = await this.getSession();
    if (!session) throw new Error("Not authenticated");

    const existing = await this.getUserPreferences();

    if (existing) {
      return this.request("/user_preferences?user_id=eq." + session.user.id, {
        method: "PATCH",
        body: JSON.stringify(preferences),
      });
    } else {
      return this.request("/user_preferences", {
        method: "POST",
        body: JSON.stringify({
          user_id: session.user.id,
          ...preferences,
        }),
      });
    }
  }

  // File upload methods
  async uploadFile(file, fileName, folder = "") {
    const session = await this.getSession();
    if (!session) throw new Error("Not authenticated");

    const userId = session.user.id;
    // Store files in user-specific folder: user-files/{userId}/{fileName}
    const filePath = folder
      ? `${userId}/${folder}/${fileName}`
      : `${userId}/${fileName}`;

    // Upload to Supabase Storage
    // Supabase Storage API expects the file directly in the body
    const response = await fetch(
      `${this.url}/storage/v1/object/user-files/${filePath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          apikey: this.anonKey,
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true", // Overwrite if file exists
        },
        body: file,
      }
    );

    if (!response.ok) {
      let errorMessage = "File upload failed";
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Return the file path (not full URL) for storage in database
    // We'll generate signed URLs when needed for access
    return filePath;
  }

  async getFileUrl(filePath) {
    const session = await this.getSession();
    if (!session) throw new Error("Not authenticated");

    // Generate signed URL for private file access
    const response = await fetch(
      `${this.url}/storage/v1/object/sign/user-files/${filePath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          apikey: this.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 3600 }), // 1 hour expiry
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get file URL");
    }

    const { signedURL } = await response.json();
    return `${this.url}${signedURL}`;
  }

  async deleteFile(filePath) {
    const session = await this.getSession();
    if (!session) throw new Error("Not authenticated");

    const response = await fetch(
      `${this.url}/storage/v1/object/user-files/${filePath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          apikey: this.anonKey,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(error.message || "File deletion failed");
    }

    return true;
  }
}

// Create singleton instance only if config is available
// If no config, create a stub object that will use backend API instead
let supabase = null;

if (supabaseConfig) {
  try {
    supabase = new SupabaseClient(supabaseConfig);
    // Initialize session on load
    supabase.getSession().catch(() => {
      // Not logged in, that's okay
    });
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    supabase = null;
  }
} else {
  // Create a stub object for backward compatibility
  // Note: backend-client.js will override this with a working implementation
  // These methods return null/empty to avoid errors, but backend-client provides the real implementation
  supabase = {
    getSession: async () => {
      // Return null - backend-client.js will provide the real implementation
      return null;
    },
    signUp: async () => {
      throw new Error(
        "Supabase not configured. Use backend API (window.backend) instead."
      );
    },
    signIn: async () => {
      throw new Error(
        "Supabase not configured. Use backend API (window.backend) instead."
      );
    },
    signOut: async () => {
      // Silent fail - backend-client.js will provide the real implementation
      return;
    },
    getUserProfile: async () => {
      throw new Error(
        "Supabase not configured. Use backend API (window.backend) instead."
      );
    },
    createUserProfile: async () => {
      throw new Error(
        "Supabase not configured. Use backend API (window.backend) instead."
      );
    },
    updateUserProfile: async () => {
      throw new Error(
        "Supabase not configured. Use backend API (window.backend) instead."
      );
    },
    uploadFile: async () => {
      throw new Error(
        "Supabase not configured. Use backend API (window.backend) instead."
      );
    },
    getFileUrl: async () => {
      throw new Error(
        "Supabase not configured. Use backend API (window.backend) instead."
      );
    },
    deleteFile: async () => {
      throw new Error(
        "Supabase not configured. Use backend API (window.backend) instead."
      );
    },
  };
}

// Export for use in other files
if (typeof window !== "undefined") {
  window.supabase = supabase;
}
