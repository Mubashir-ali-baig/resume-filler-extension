// Backend API Client
// Replaces direct Supabase calls - all operations go through backend API

class BackendClient {
  constructor() {
    this.baseUrl = window.BACKEND_CONFIG?.baseUrl || null;
    this.authEndpoint = window.BACKEND_CONFIG?.authEndpoint || null;
    this.profileEndpoint = window.BACKEND_CONFIG?.profileEndpoint || null;
    this.currentSession = null;
  }

  // Get current session from storage
  async getSession() {
    if (this.currentSession) {
      return this.currentSession;
    }

    // Try to get from storage
    try {
      const stored = await chrome.storage.local.get(["session"]);
      if (stored.session) {
        this.currentSession = stored.session;
        return stored.session;
      }
    } catch (error) {
      console.error("Error getting session from storage:", error);
    }

    return null;
  }

  // Store session
  async setSession(session) {
    this.currentSession = session;
    try {
      await chrome.storage.local.set({ session });
    } catch (error) {
      console.error("Error storing session:", error);
    }
  }

  // Clear session
  async clearSession() {
    this.currentSession = null;
    try {
      await chrome.storage.local.remove(["session"]);
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  }

  // Sign up
  async signUp(email, password) {
    if (!this.authEndpoint) {
      throw new Error("Backend API not configured. Set BACKEND_API_URL in config.js");
    }

    try {
      const response = await fetch(`${this.authEndpoint}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Sign up failed");
      }

      const data = await response.json();
      const session = {
        user: data.user,
        access_token: data.session?.access_token || data.session?.accessToken,
        refresh_token: data.session?.refresh_token || data.session?.refreshToken,
        expires_at: data.session?.expires_at || data.session?.expiresAt,
      };

      await this.setSession(session);
      return session;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  }

  // Sign in
  async signIn(email, password) {
    if (!this.authEndpoint) {
      throw new Error("Backend API not configured. Set BACKEND_API_URL in config.js");
    }

    try {
      const response = await fetch(`${this.authEndpoint}/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Sign in failed");
      }

      const data = await response.json();
      const session = {
        user: data.user,
        access_token: data.session?.access_token || data.session?.accessToken,
        refresh_token: data.session?.refresh_token || data.session?.refreshToken,
        expires_at: data.session?.expires_at || data.session?.expiresAt,
      };

      await this.setSession(session);
      return session;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    await this.clearSession();
  }

  // Get user profile
  async getUserProfile() {
    if (!this.profileEndpoint) {
      throw new Error("Backend API not configured. Set BACKEND_API_URL in config.js");
    }

    const session = await this.getSession();
    if (!session || !session.user) {
      throw new Error("Not authenticated");
    }

    try {
      // Add cache-busting parameter to prevent 304 responses
      const cacheBuster = `_t=${Date.now()}`;
      const url = `${this.profileEndpoint}?userId=${session.user.id}&${cacheBuster}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          "x-user-id": session.user.id,
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log("[Backend Client] No profile found (404)");
          return []; // No profile found
        }
        const error = await response.json();
        throw new Error(error.error || "Failed to get profile");
      }

      const data = await response.json();
      
      // Handle null profile (new user, no profile created yet)
      if (data.profile === null) {
        console.log("[Backend Client] Profile is null (user hasn't created profile yet)");
        return [];
      }
      
      return data.profile ? [data.profile] : [];
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  }

  // Create user profile
  async createUserProfile(profileData) {
    if (!this.profileEndpoint) {
      throw new Error("Backend API not configured. Set BACKEND_API_URL in config.js");
    }

    const session = await this.getSession();
    if (!session || !session.user) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(this.profileEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          "x-user-id": session.user.id,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create profile");
      }

      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error("Create profile error:", error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(profileData) {
    if (!this.profileEndpoint) {
      throw new Error("Backend API not configured. Set BACKEND_API_URL in config.js");
    }

    const session = await this.getSession();
    if (!session || !session.user) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(this.profileEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          "x-user-id": session.user.id,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }

  // Upload file (via backend - backend handles Supabase storage)
  async uploadFile(file, fileName, folder = "") {
    const session = await this.getSession();
    if (!session || !session.user) {
      throw new Error("Not authenticated");
    }

    if (!this.baseUrl) {
      throw new Error("Backend API not configured. Set BACKEND_API_URL in config.js");
    }

    // Create FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName);
    formData.append("folder", folder);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/user/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "x-user-id": session.user.id,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "File upload failed");
      }

      const data = await response.json();
      return data.filePath; // Return file path for storage in profile
    } catch (error) {
      console.error("Upload file error:", error);
      throw error;
    }
  }

  // Get file URL (via backend)
  async getFileUrl(filePath) {
    const session = await this.getSession();
    if (!session || !session.user) {
      throw new Error("Not authenticated");
    }

    if (!this.baseUrl) {
      throw new Error("Backend API not configured. Set BACKEND_API_URL in config.js");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/user/file-url?filePath=${encodeURIComponent(filePath)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "x-user-id": session.user.id,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get file URL");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Get file URL error:", error);
      throw error;
    }
  }

  // Delete file (via backend)
  async deleteFile(filePath) {
    const session = await this.getSession();
    if (!session || !session.user) {
      throw new Error("Not authenticated");
    }

    if (!this.baseUrl) {
      throw new Error("Backend API not configured. Set BACKEND_API_URL in config.js");
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/user/file`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          "x-user-id": session.user.id,
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete file");
      }

      return true;
    } catch (error) {
      console.error("Delete file error:", error);
      throw error;
    }
  }
}

// Initialize backend client
if (typeof window !== "undefined") {
  window.backend = new BackendClient();
  
  // For backward compatibility, create window.supabase that uses backend
  // This allows existing code to work without major refactoring
  window.supabase = {
    getSession: () => window.backend.getSession(),
    signUp: (email, password) => window.backend.signUp(email, password),
    signIn: (email, password) => window.backend.signIn(email, password),
    signOut: () => window.backend.signOut(),
    getUserProfile: () => window.backend.getUserProfile(),
    createUserProfile: (data) => window.backend.createUserProfile(data),
    updateUserProfile: (data) => window.backend.updateUserProfile(data),
    uploadFile: (file, fileName, folder) => window.backend.uploadFile(file, fileName, folder),
    getFileUrl: (filePath) => window.backend.getFileUrl(filePath),
    deleteFile: (filePath) => window.backend.deleteFile(filePath),
  };
}
