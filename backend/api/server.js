/**
 * Backend API Server for Resume Filler Extension
 * This server proxies AI API requests using your API keys
 * Users don't need to configure anything - just install the extension
 */

const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads (memory storage for serverless)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Security middleware: Remove sensitive data from request logging
app.use((req, res, next) => {
  // Don't log request body for auth endpoints (contains passwords)
  if (req.path.includes("/auth/signin") || req.path.includes("/auth/signup")) {
    const originalJson = res.json;
    res.json = function (data) {
      // Ensure we never log passwords
      return originalJson.call(this, data);
    };
  }
  next();
});

// Security headers
app.use((req, res, next) => {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // HSTS header (only if HTTPS - Vercel handles HTTPS automatically)
  if (req.headers["x-forwarded-proto"] === "https" || process.env.VERCEL) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  next();
});

// Your API keys (set in .env file)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Supabase configuration (server-side)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client (using @supabase/supabase-js if available, or fetch API)
let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  // Use anon key - same as extension (respects RLS policies)
  try {
    const { createClient } = require("@supabase/supabase-js");
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log("✅ Supabase client initialized");
  } catch (error) {
    console.warn(
      "⚠️  @supabase/supabase-js not installed. Using fetch API instead."
    );
    console.warn("   Install with: npm install @supabase/supabase-js");
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "resume-filler-api",
    supabase: !!supabaseClient,
  });
});

// Get user profile (resume, cover letter, etc.)
app.get("/api/v1/user/profile", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.query.userId;
    const accessToken = req.headers["authorization"]?.replace("Bearer ", "");

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!supabaseClient) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Set the user's access token for RLS to work properly
    if (!accessToken) {
      console.warn(
        `[Profile] No access token provided for user ${userId} - RLS will block access`
      );
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.status(401).json({
        error: "Authentication required. Access token missing.",
        hint: "Include Authorization: Bearer <token> header",
      });
    }

    // Validate the access token by calling Supabase Auth API directly
    let tokenUserId;
    try {
      // Validate token by calling Supabase Auth API
      const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY,
        },
      });

      if (!authResponse.ok) {
        const authError = await authResponse
          .json()
          .catch(() => ({ message: "Token validation failed" }));
        console.error(
          `[Profile] Invalid access token for user ${userId}:`,
          authError.message || "Token validation failed"
        );
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.status(401).json({
          error: "Invalid access token",
          details: authError.message || "Token validation failed",
        });
      }

      const userData = await authResponse.json();
      tokenUserId = userData.id;

      // Verify the token user matches the requested userId
      if (tokenUserId !== userId) {
        console.warn(
          `[Profile] Token user ID (${tokenUserId}) doesn't match requested userId (${userId})`
        );
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.status(403).json({
          error:
            "Access denied. Token user ID doesn't match requested user ID.",
        });
      }

      console.log(`[Profile] Token validated successfully for user ${userId}`);
    } catch (authError) {
      console.error(
        `[Profile] Exception validating token for user ${userId}:`,
        authError
      );
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res
        .status(401)
        .json({ error: authError.message || "Authentication failed" });
    }

    // Create a Supabase client instance with the user's access token in headers
    // RLS will use the Authorization header to determine auth.uid()
    const { createClient } = require("@supabase/supabase-js");
    const userSupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user profile from Supabase (respects RLS policies)
    const { data, error } = await userSupabaseClient
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No profile found - this is normal for new users
        console.log(
          `[Profile] No profile found for user ${userId} (PGRST116 - RLS working, just no data)`
        );
        // Disable caching for null responses
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        return res.json({ profile: null });
      }
      // Log detailed error for debugging RLS issues
      console.error(`[Profile] Error fetching profile for user ${userId}:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      // If it's an RLS/permission error, provide helpful message
      if (
        error.code === "42501" ||
        error.message?.includes("permission") ||
        error.message?.includes("policy")
      ) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.status(403).json({
          error: "Access denied. RLS policy check failed.",
          hint: "Make sure the access token matches the user_id and RLS policies are configured correctly.",
        });
      }

      throw error;
    }

    // Disable caching for profile data (it changes frequently)
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    console.log(`[Profile] Profile found for user ${userId}`);
    res.json({ profile: data });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: error.message || "Failed to fetch profile" });
  }
});

// Save user profile
app.post("/api/v1/user/profile", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.body.userId;
    const accessToken = req.headers["authorization"]?.replace("Bearer ", "");
    const profileData = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!supabaseClient) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Set the user's access token for RLS to work properly
    if (accessToken) {
      supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: "",
      });
    }

    // Remove userId from profileData if present (we use it from header/param)
    delete profileData.userId;

    // Upsert profile (respects RLS policies)
    const { data, error } = await supabaseClient
      .from("user_profiles")
      .upsert(
        {
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) throw error;

    res.json({ profile: data });
  } catch (error) {
    console.error("Error saving user profile:", error);
    res.status(500).json({ error: error.message || "Failed to save profile" });
  }
});

// Authenticate user (sign in/sign up)
app.post("/api/v1/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Log sign-in attempt (without password)
    console.log(`[Auth] Sign-in attempt for: ${email}`);

    // Sign in via Supabase Auth API
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      // Log failed attempt (without password)
      console.log(`[Auth] Sign-in failed for: ${email}`);
      return res
        .status(response.status)
        .json({ error: error.error_description || "Authentication failed" });
    }

    const data = await response.json();
    // Log successful sign-in (without password)
    console.log(`[Auth] Sign-in successful for: ${email}`);

    res.json({
      user: data.user,
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      },
    });
  } catch (error) {
    // Never log passwords in error messages
    console.error("Error signing in:", error.message);
    res.status(500).json({ error: error.message || "Failed to sign in" });
  }
});

app.post("/api/v1/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length and strength
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Log sign-up attempt (without password)
    console.log(`[Auth] Sign-up attempt for: ${email}`);

    // Sign up via Supabase Auth API
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Log failed attempt (without password)
      console.log(`[Auth] Sign-up failed for: ${email}`);
      return res
        .status(response.status)
        .json({ error: error.error_description || "Sign up failed" });
    }

    const data = await response.json();
    // Log successful sign-up (without password)
    console.log(`[Auth] Sign-up successful for: ${email}`);

    res.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    // Never log passwords in error messages
    console.error("Error signing up:", error.message);
    res.status(500).json({ error: error.message || "Failed to sign up" });
  }
});

// File upload endpoint
app.post("/api/v1/user/upload", upload.single("file"), async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const accessToken = req.headers["authorization"]?.replace("Bearer ", "");

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!supabaseClient) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Set the user's access token for RLS to work properly
    if (accessToken) {
      supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: "",
      });
    }

    const file = req.file;
    const fileName = req.body?.fileName || file?.originalname;
    const folder = req.body?.folder || "";

    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    if (!fileName) {
      return res.status(400).json({ error: "File name is required" });
    }

    // Construct file path
    const filePath = folder
      ? `${userId}/${folder}/${fileName}`
      : `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from("user-files")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype || "application/octet-stream",
        upsert: true,
      });

    if (error) throw error;

    res.json({ filePath: data.path });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: error.message || "Failed to upload file" });
  }
});

// Get file URL endpoint
app.get("/api/v1/user/file-url", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const accessToken = req.headers["authorization"]?.replace("Bearer ", "");
    const filePath = req.query.filePath;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!filePath) {
      return res.status(400).json({ error: "File path is required" });
    }

    if (!supabaseClient) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Set the user's access token for RLS to work properly
    if (accessToken) {
      supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: "",
      });
    }

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabaseClient.storage
      .from("user-files")
      .createSignedUrl(filePath, 3600);

    if (error) throw error;

    res.json({ url: data.signedUrl });
  } catch (error) {
    console.error("Error getting file URL:", error);
    res.status(500).json({ error: error.message || "Failed to get file URL" });
  }
});

// Delete file endpoint
app.delete("/api/v1/user/file", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const accessToken = req.headers["authorization"]?.replace("Bearer ", "");
    const { filePath } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!filePath) {
      return res.status(400).json({ error: "File path is required" });
    }

    if (!supabaseClient) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Set the user's access token for RLS to work properly
    if (accessToken) {
      supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: "",
      });
    }

    // Delete file from Supabase Storage
    const { error } = await supabaseClient.storage
      .from("user-files")
      .remove([filePath]);

    if (error && error.message !== "Object not found") {
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: error.message || "Failed to delete file" });
  }
});

// Main AI generation endpoint
app.post("/api/v1/generate-answer", async (req, res) => {
  try {
    const {
      question,
      jobDescription,
      pageContext,
      resume,
      coverLetter,
      executiveSummary,
      userId, // Optional: if provided, fetch from Supabase
    } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    // If userId is provided and Supabase is configured, fetch user data from server
    let userResume = resume || "";
    let userCoverLetter = coverLetter || "";
    let userExecutiveSummary = executiveSummary || "";

    if (userId && supabaseClient) {
      try {
        const { data: profile } = await supabaseClient
          .from("user_profiles")
          .select("resume_text, cover_letter_text, executive_summary")
          .eq("user_id", userId)
          .single();

        if (profile) {
          userResume = profile.resume_text || userResume;
          userCoverLetter = profile.cover_letter_text || userCoverLetter;
          userExecutiveSummary =
            profile.executive_summary || userExecutiveSummary;
        }
      } catch (error) {
        console.log(
          "Could not fetch user profile, using provided data:",
          error.message
        );
      }
    }

    // Build prompt (same as extension)
    const prompt = buildPrompt(question, jobDescription, pageContext, {
      resume: userResume,
      coverLetter: userCoverLetter,
      executiveSummary: userExecutiveSummary,
    });

    // Try Gemini first (or your preferred provider)
    let answer;
    if (GEMINI_API_KEY) {
      answer = await generateViaGemini(prompt);
    } else if (OPENAI_API_KEY) {
      answer = await generateViaOpenAI(prompt);
    } else if (CLAUDE_API_KEY) {
      answer = await generateViaClaude(prompt);
    } else {
      return res.status(500).json({ error: "No AI API keys configured" });
    }

    res.json({ answer });
  } catch (error) {
    console.error("Error generating answer:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate answer" });
  }
});

// Build prompt function (same as extension)
function buildPrompt(question, jobDescription, pageContext, userData) {
  let prompt = `You are helping a job candidate answer interview questions. Your task is to provide personalized, authentic answers based EXCLUSIVELY on the candidate's actual resume and background information provided below.\n\n`;

  let hasResumeContext = false;

  if (userData.executiveSummary && userData.executiveSummary.trim()) {
    prompt += `=== CANDIDATE'S EXECUTIVE SUMMARY ===\n${userData.executiveSummary}\n\n`;
    hasResumeContext = true;
  }

  if (userData.resume && userData.resume.trim()) {
    const resumeText =
      userData.resume.length > 6000
        ? userData.resume.substring(0, 6000) + "\n[... resume continues ...]"
        : userData.resume;
    prompt += `=== CANDIDATE'S COMPLETE RESUME ===\n${resumeText}\n\n`;
    hasResumeContext = true;
  } else {
    prompt += `=== CANDIDATE'S RESUME ===\n[No resume information available]\n\n`;
  }

  if (userData.coverLetter && userData.coverLetter.trim()) {
    prompt += `=== CANDIDATE'S COVER LETTER ===\n${userData.coverLetter.substring(
      0,
      2000
    )}\n\n`;
    hasResumeContext = true;
  }

  if (jobDescription) {
    prompt += `=== JOB DESCRIPTION ===\n${jobDescription.substring(
      0,
      2500
    )}\n\n`;
  }

  if (pageContext) {
    prompt += `=== ADDITIONAL PAGE CONTEXT ===\n${pageContext.substring(
      0,
      1000
    )}\n\n`;
  }

  prompt += `=== QUESTION TO ANSWER ===\n${question}\n\n`;

  prompt += `=== YOUR TASK ===\n`;
  prompt += `Based on the candidate's resume and background information above, provide a personalized, professional answer (2-4 sentences) that:\n\n`;
  prompt += `1. DIRECTLY ADDRESSES THE QUESTION: Answer the specific question asked, not a generic version of it.\n\n`;
  prompt += `2. USES ACTUAL RESUME DETAILS: Extract and reference SPECIFIC information from the resume:\n`;
  prompt += `   - Exact job titles, company names, and employment dates\n`;
  prompt += `   - Specific skills, technologies, tools, or methodologies mentioned\n`;
  prompt += `   - Concrete achievements, projects, or accomplishments with numbers/metrics if available\n`;
  prompt += `   - Education, certifications, or relevant training\n`;
  prompt += `   - Years of experience in specific domains\n\n`;
  prompt += `3. PROVIDES CONCRETE EXAMPLES: Instead of saying "I have experience," say "In my role as [Job Title] at [Company], I [specific achievement]."\n\n`;
  prompt += `4. ALIGNS WITH JOB REQUIREMENTS: Connect the candidate's resume experiences to the job description requirements when relevant.\n\n`;
  prompt += `5. SOUNDS AUTHENTIC: Write in first person as if the candidate is speaking naturally about their own experience. Use their actual background, not generic statements.\n\n`;
  prompt += `6. HANDLES MISSING EXPERIENCE: If the resume doesn't contain relevant experience for the question, acknowledge this honestly but frame it positively.\n\n`;
  prompt += `=== CRITICAL RULES ===\n`;
  prompt += `- DO NOT invent, fabricate, or make up any experiences, companies, projects, or achievements\n`;
  prompt += `- DO NOT use placeholder text like "[Company Name]" or "[Your Experience]"\n`;
  prompt += `- ONLY use information explicitly stated in the resume, executive summary, or cover letter provided above\n`;
  prompt += `- If specific details aren't in the resume, use general but accurate statements based on what IS in the resume\n`;
  prompt += `- Write naturally and conversationally, as if the candidate is speaking in an interview\n\n`;

  if (!hasResumeContext) {
    prompt += `⚠️ WARNING: No resume context was provided. Provide a professional but generic answer, and note that personalized details are unavailable.\n\n`;
  }

  prompt += `=== YOUR ANSWER ===\n`;

  return prompt;
}

// Generate via Gemini
async function generateViaGemini(prompt) {
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/interactions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      model: model,
      input: prompt,
      generation_config: {
        max_output_tokens: 1000,
        temperature: 0.7,
      },
      store: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Gemini API error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  if (data.outputs && data.outputs.length > 0) {
    const textOutputs = data.outputs.filter((output) => output.type === "text");
    if (textOutputs.length > 0) {
      return textOutputs[textOutputs.length - 1].text.trim();
    }
    const lastOutput = data.outputs[data.outputs.length - 1];
    if (lastOutput.text) {
      return lastOutput.text.trim();
    }
  }

  throw new Error("Unexpected response format from Gemini API");
}

// Generate via OpenAI
async function generateViaOpenAI(prompt) {
  const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert career coach helping candidates answer interview questions. Provide concise, professional answers that highlight relevant experience.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `OpenAI API error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// Generate via Claude
async function generateViaClaude(prompt) {
  const model = process.env.CLAUDE_MODEL || "claude-3-sonnet-20240229";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Claude API error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

// Export app for Vercel serverless functions
module.exports = app;

// Start server only if not in Vercel environment
if (process.env.VERCEL !== "1" && !process.env.VERCEL_ENV) {
  app.listen(PORT, () => {
    console.log(`🚀 Resume Filler API server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(
      `🤖 AI endpoint: http://localhost:${PORT}/api/v1/generate-answer`
    );

    // Check which API keys are configured
    console.log("\n🔑 API Keys configured:");
    if (GEMINI_API_KEY) console.log("  ✅ Gemini");
    if (OPENAI_API_KEY) console.log("  ✅ OpenAI");
    if (CLAUDE_API_KEY) console.log("  ✅ Claude");
    if (!GEMINI_API_KEY && !OPENAI_API_KEY && !CLAUDE_API_KEY) {
      console.log(
        "  ⚠️  No AI API keys configured! Set GEMINI_API_KEY, OPENAI_API_KEY, or CLAUDE_API_KEY in .env"
      );
    }

    // Check Supabase configuration
    console.log("\n🗄️  Supabase configuration:");
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      console.log("  ✅ Supabase configured");
      console.log(`  📍 URL: ${SUPABASE_URL}`);
    } else {
      console.log(
        "  ⚠️  Supabase not configured! Set SUPABASE_URL and SUPABASE_ANON_KEY in .env"
      );
      console.log(
        "  📝 Users will need to provide resume/cover letter in each request"
      );
    }
  });
}
