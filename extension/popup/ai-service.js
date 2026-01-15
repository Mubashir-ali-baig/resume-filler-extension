// AI Service Integration
// This file handles AI API calls for generating interview answers

// Configuration is loaded from config.js (see config.example.js for setup)
// Make sure config.js is loaded before this script in popup.html

// Get configuration from window (set by config.js)
// Use a local variable to avoid redeclaration errors
const aiConfig = window.AI_CONFIG || {
  // Option 1: Use your backend API
  apiEndpoint: null,
  apiKey: null,

  // Option 2: Direct OpenAI API (requires API key)
  openaiApiKey: null,
  openaiModel: "gpt-3.5-turbo", // or 'gpt-4', 'gpt-4-turbo'

  // Option 3: Direct Anthropic Claude API
  claudeApiKey: null,
  claudeModel: "claude-3-sonnet-20240229",

  // Option 4: Direct Google Gemini API
  geminiApiKey: null,
  geminiModel: "gemini-1.5-flash", // Options: "gemini-1.5-flash" (fast), "gemini-1.5-pro" (more capable)
};

// Get stored resume and cover letter (if available)
async function getStoredUserData() {
  try {
    // First, try to get from backend API (if authenticated)
    const client = window.backend || window.supabase;
    if (client) {
      try {
        const session = await client.getSession();
        if (session && session.user) {
          const profile = await client.getUserProfile();
          if (profile && profile.length > 0) {
            const data = profile[0];

            // Get resume text (if stored as text)
            let resumeText = (data.resume_text || "").trim();
            let coverLetterText = (data.cover_letter_text || "").trim();
            const executiveSummaryText = (data.executive_summary || "").trim();

            // Log what we found
            console.log("[AI Service] Retrieved from database:", {
              resumeLength: resumeText.length,
              coverLetterLength: coverLetterText.length,
              executiveSummaryLength: executiveSummaryText.length,
              hasResumeFile: !!data.resume_file_url,
            });

            // If no resume text but there's a resume file URL, try to extract text
            if (!resumeText && data.resume_file_url) {
              try {
                console.log(
                  "[AI Service] Attempting to extract text from existing resume file..."
                );
                // Use the new method that downloads directly from backend
                if (
                  window.FileTextExtractor &&
                  window.FileTextExtractor.extractTextFromSupabaseFile &&
                  client
                ) {
                  const extractedText =
                    await window.FileTextExtractor.extractTextFromSupabaseFile(
                      data.resume_file_url,
                      client
                    );
                  if (extractedText && extractedText.trim()) {
                    resumeText = extractedText.trim();
                    console.log(
                      `[AI Service] ✓ Extracted ${resumeText.length} characters from resume file`
                    );
                    // Optionally save it back to database (async, don't wait)
                    client
                      .updateUserProfile({ resume_text: resumeText })
                      .catch((err) => {
                        console.log(
                          "[AI Service] Could not save extracted text to database:",
                          err
                        );
                      });
                  }
                }
              } catch (error) {
                console.warn(
                  "[AI Service] ⚠️ Could not extract text from resume file:",
                  error.message,
                  "\nPlease add your resume text manually in the Profile tab for personalized AI responses."
                );
              }
            }

            // If no cover letter text but there's a cover letter file URL, try to extract text
            if (!coverLetterText && data.cover_letter_file_url) {
              try {
                console.log(
                  "[AI Service] Attempting to extract text from existing cover letter file..."
                );
                // Use the new method that downloads directly from backend
                if (
                  window.FileTextExtractor &&
                  window.FileTextExtractor.extractTextFromSupabaseFile &&
                  client
                ) {
                  const extractedText =
                    await window.FileTextExtractor.extractTextFromSupabaseFile(
                      data.cover_letter_file_url,
                      client
                    );
                  if (extractedText && extractedText.trim()) {
                    coverLetterText = extractedText.trim();
                    console.log(
                      `[AI Service] ✓ Extracted ${coverLetterText.length} characters from cover letter file`
                    );
                    // Optionally save it back to database (async, don't wait)
                    client
                      .updateUserProfile({ cover_letter_text: coverLetterText })
                      .catch((err) => {
                        console.log(
                          "[AI Service] Could not save extracted text to database:",
                          err
                        );
                      });
                  }
                }
              } catch (error) {
                console.warn(
                  "[AI Service] ⚠️ Could not extract text from cover letter file:",
                  error.message
                );
              }
            }

            // If we have resume text, log a summary
            if (resumeText) {
              const preview = resumeText.substring(0, 100).replace(/\n/g, " ");
              console.log(
                `[AI Service] ✓ Resume context loaded: "${preview}..."`
              );
            }

            return {
              resume: resumeText,
              coverLetter: coverLetterText,
              executiveSummary: executiveSummaryText,
            };
          } else {
            console.log("[AI Service] No profile found in database");
          }
        } else {
          console.log("[AI Service] No active session, trying local storage");
        }
      } catch (error) {
        console.log(
          "[AI Service] Error fetching from database, using local storage:",
          error
        );
      }
    }

    // Fallback to local storage
    const data = await chrome.storage.local.get([
      "resume",
      "coverLetter",
      "executiveSummary",
    ]);

    const localResume = (data.resume || "").trim();
    const localCoverLetter = (data.coverLetter || "").trim();
    const localExecutiveSummary = (data.executiveSummary || "").trim();

    if (localResume || localCoverLetter || localExecutiveSummary) {
      console.log("[AI Service] Retrieved from local storage:", {
        resumeLength: localResume.length,
        coverLetterLength: localCoverLetter.length,
        executiveSummaryLength: localExecutiveSummary.length,
      });
    }

    return {
      resume: localResume,
      coverLetter: localCoverLetter,
      executiveSummary: localExecutiveSummary,
    };
  } catch (error) {
    console.error("[AI Service] Error getting stored data:", error);
    return { resume: "", coverLetter: "", executiveSummary: "" };
  }
}

// Generate AI answer using configured service
async function generateAIAnswer(question, jobDescription, pageContext) {
  // Get user's resume and cover letter
  const userData = await getStoredUserData();

  // Log what we're working with
  console.log("[AI Service] generateAIAnswer called with userData:", {
    hasResume: !!userData.resume && userData.resume.length > 0,
    resumeLength: userData.resume?.length || 0,
    hasCoverLetter: !!userData.coverLetter && userData.coverLetter.length > 0,
    hasExecutiveSummary:
      !!userData.executiveSummary && userData.executiveSummary.length > 0,
  });

  // Try backend API first (recommended for production)
  if (aiConfig.apiEndpoint) {
    console.log("[AI Service] Using backend API:", aiConfig.apiEndpoint);
    return await generateViaBackendAPI(
      question,
      jobDescription,
      pageContext,
      userData
    );
  }

  // Fallback to direct API keys (only for local development)
  // Try OpenAI
  if (aiConfig.openaiApiKey) {
    console.log(
      "[AI Service] Using OpenAI API (direct - not recommended for production)"
    );
    return await generateViaOpenAI(
      question,
      jobDescription,
      pageContext,
      userData
    );
  }

  // Try Claude
  if (aiConfig.claudeApiKey) {
    console.log(
      "[AI Service] Using Claude API (direct - not recommended for production)"
    );
    return await generateViaClaude(
      question,
      jobDescription,
      pageContext,
      userData
    );
  }

  // Try Gemini
  if (aiConfig.geminiApiKey) {
    console.log(
      "[AI Service] Using Gemini API (direct - not recommended for production)"
    );
    return await generateViaGemini(
      question,
      jobDescription,
      pageContext,
      userData
    );
  }

  // No API configured - throw error instead of using mock
  throw new Error(
    "No AI service configured. Please set apiEndpoint in config.js to use backend API, or configure direct API keys for local development."
  );
}

// Generate via your backend API
async function generateViaBackendAPI(
  question,
  jobDescription,
  pageContext,
  userData
) {
  try {
    // Get user ID and access token from backend session (if available)
    let userId = null;
    let accessToken = null;

    const client = window.backend || window.supabase;
    if (client) {
      try {
        const session = await client.getSession();
        if (session && session.user) {
          userId = session.user.id;
          accessToken = session.access_token;
        }
      } catch (error) {
        console.log(
          "[AI Service] Could not get session for backend API:",
          error
        );
      }
    }

    const requestBody = {
      question: question,
      jobDescription: jobDescription,
      pageContext: pageContext,
      resume: userData.resume,
      coverLetter: userData.coverLetter,
      executiveSummary: userData.executiveSummary,
    };

    // Include userId if available (backend can fetch from Supabase)
    if (userId) {
      requestBody.userId = userId;
    }

    const headers = {
      "Content-Type": "application/json",
    };

    // Include access token if available (for Supabase RLS)
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // Include API key if configured (optional - backend might not require it)
    if (aiConfig.apiKey) {
      headers["X-API-Key"] = aiConfig.apiKey;
    }

    const response = await fetch(aiConfig.apiEndpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.answer || data.response || data.text;
  } catch (error) {
    console.error("Backend API error:", error);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}

// Generate via OpenAI API
async function generateViaOpenAI(
  question,
  jobDescription,
  pageContext,
  userData
) {
  try {
    const prompt = buildPrompt(question, jobDescription, pageContext, userData);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.openaiModel,
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
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}

// Generate via Anthropic Claude API
async function generateViaClaude(
  question,
  jobDescription,
  pageContext,
  userData
) {
  try {
    const prompt = buildPrompt(question, jobDescription, pageContext, userData);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": aiConfig.claudeApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: aiConfig.claudeModel,
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
      throw new Error(error.error?.message || "Claude API error");
    }

    const data = await response.json();
    return data.content[0].text.trim();
  } catch (error) {
    console.error("Claude API error:", error);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}

// Helper function to list available Gemini models
async function listGeminiModels(apiKey) {
  const versions = ["v1beta", "v1"];
  const availableModels = [];

  for (const version of versions) {
    try {
      const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.models) {
          data.models.forEach((model) => {
            // Extract just the model name (remove "models/" prefix)
            const modelName = model.name.replace(/^models\//, "");
            availableModels.push({
              name: modelName,
              fullName: model.name,
              version: version,
              displayName: model.displayName,
            });
          });
        }
      }
    } catch (error) {
      console.log(`[Gemini] Could not fetch models from ${version}:`, error);
    }
  }

  return availableModels;
}

// Generate via Google Gemini API
async function generateViaGemini(
  question,
  jobDescription,
  pageContext,
  userData
) {
  try {
    if (!aiConfig.geminiApiKey) {
      throw new Error("Gemini API key not configured");
    }

    console.log(
      "[Gemini] Generating answer for question:",
      question.substring(0, 50) + "..."
    );
    const prompt = buildPrompt(question, jobDescription, pageContext, userData);

    // Use the new Interactions API (v1beta)
    // Default to newer models that support Interactions API
    let model = aiConfig.geminiModel || "gemini-3-flash-preview";

    // Map legacy model names to Interactions API compatible models
    const modelMap = {
      "gemini-pro": "gemini-2.5-flash",
      "gemini-1.5-flash": "gemini-2.5-flash",
      "gemini-1.5-pro": "gemini-2.5-pro",
    };

    if (modelMap[model]) {
      model = modelMap[model];
      console.log(`[Gemini] Mapped legacy model to: ${model}`);
    }

    // Use the new Interactions API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/interactions`;

    console.log(`[Gemini] Using model: ${model}`);
    console.log(`[Gemini] Using Interactions API: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": aiConfig.geminiApiKey,
      },
      body: JSON.stringify({
        model: model,
        input: prompt,
        generation_config: {
          max_output_tokens: 1000,
          temperature: 0.7,
        },
        store: false, // Don't store interactions to save on retention
      }),
    });

    if (!response.ok) {
      let errorMessage = "Gemini API error";
      try {
        const error = await response.json();
        errorMessage =
          error.error?.message || error.error?.status || errorMessage;
        console.error("Gemini API error details:", error);
      } catch (e) {
        errorMessage = `${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Handle Interactions API response structure
    // The response has an `outputs` array, get the last text output
    if (data.outputs && data.outputs.length > 0) {
      // Find the last text output (there might be thought blocks before it)
      const textOutputs = data.outputs.filter(
        (output) => output.type === "text"
      );
      if (textOutputs.length > 0) {
        return textOutputs[textOutputs.length - 1].text.trim();
      }

      // If no text output, try to get any text from outputs
      const lastOutput = data.outputs[data.outputs.length - 1];
      if (lastOutput.text) {
        return lastOutput.text.trim();
      }
    }

    throw new Error("Unexpected response format from Gemini Interactions API");
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Failed to generate answer with Gemini: ${error.message}`);
  }
}

// Build prompt for AI with personalized context
function buildPrompt(question, jobDescription, pageContext, userData) {
  let prompt = `You are helping a job candidate answer interview questions. Your task is to provide personalized, authentic answers based EXCLUSIVELY on the candidate's actual resume and background information provided below.\n\n`;

  // ========== CANDIDATE'S BACKGROUND INFORMATION ==========
  // Put resume FIRST so the LLM has full context before reading the question

  let hasResumeContext = false;

  // Include executive summary first (if available) - this is a high-level overview
  if (userData.executiveSummary && userData.executiveSummary.trim()) {
    prompt += `=== CANDIDATE'S EXECUTIVE SUMMARY ===\n${userData.executiveSummary}\n\n`;
    hasResumeContext = true;
  }

  // Include full resume content (increased limit for better context)
  if (userData.resume && userData.resume.trim()) {
    // Use more of the resume - up to 6000 characters for comprehensive context
    // This allows capturing full job descriptions, skills, education, etc.
    const resumeText =
      userData.resume.length > 6000
        ? userData.resume.substring(0, 6000) + "\n[... resume continues ...]"
        : userData.resume;
    prompt += `=== CANDIDATE'S COMPLETE RESUME ===\n${resumeText}\n\n`;
    hasResumeContext = true;
    console.log(
      `[AI Service] Using resume context (${userData.resume.length} chars, ${resumeText.length} chars included in prompt)`
    );
  } else {
    console.warn(
      "[AI Service] No resume text found in database. Answers will be generic."
    );
    prompt += `=== CANDIDATE'S RESUME ===\n[No resume information available]\n\n`;
  }

  // Include cover letter for additional context
  if (userData.coverLetter && userData.coverLetter.trim()) {
    prompt += `=== CANDIDATE'S COVER LETTER ===\n${userData.coverLetter.substring(
      0,
      2000
    )}\n\n`;
    hasResumeContext = true;
  }

  // ========== JOB CONTEXT ==========

  // Include job description for context
  if (jobDescription) {
    prompt += `=== JOB DESCRIPTION ===\n${jobDescription.substring(
      0,
      2500
    )}\n\n`;
  }

  // Include page context for additional job-specific information
  if (pageContext) {
    prompt += `=== ADDITIONAL PAGE CONTEXT ===\n${pageContext.substring(
      0,
      1000
    )}\n\n`;
  }

  // ========== QUESTION TO ANSWER ==========
  prompt += `=== QUESTION TO ANSWER ===\n${question}\n\n`;

  // ========== INSTRUCTIONS ==========
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

  prompt += `6. HANDLES MISSING EXPERIENCE: If the resume doesn't contain relevant experience for the question, acknowledge this honestly but frame it positively (e.g., "While I haven't worked directly with [technology], my experience with [related technology] has prepared me to learn quickly.").\n\n`;

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

// Note: Mock response removed - API must be configured for the extension to work

// Make functions available globally for popup.js
window.AIService = {
  generateAIAnswer,
  getStoredUserData,
};
