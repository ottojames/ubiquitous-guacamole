import express from "express";
import OpenAI from "openai";

const router = express.Router();

// Lazy initialize OpenAI client only when needed
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Hugging Face Inference API (free tier available)
async function generateWithHuggingFace(text: string): Promise<string> {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  // Use a simpler, more reliable model
  const HF_MODEL = "facebook/bart-large-cnn"; // Summarization-specific, always available

  if (!HF_API_KEY) {
    throw new Error("Hugging Face API key not configured");
  }

  // BART expects just the text for summarization
  const inputText = `UK Licensing Application Summary Request:

Create a 10-word summary focusing on application type and licensable activities.

Application types: Premises licence, Variation, Club certificate, Review
Activities: alcohol sales, late night refreshment, music, entertainment

Document text:
${text.slice(0, 2000)}`;

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${HF_MODEL}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: inputText,
        parameters: {
          max_length: 20, // Target ~10 words
          min_length: 5,
          do_sample: false, // Deterministic output
        },
      }),
      // Add timeout and retry logic
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    // Check if model is loading
    if (response.status === 503 || errorText.includes("loading")) {
      throw new Error("Model is loading, try again in a moment");
    }

    throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // BART returns array with summary_text
  const summary = data[0]?.summary_text?.trim() || data.summary_text?.trim() || "";

  if (!summary) {
    throw new Error("No summary generated");
  }

  // Clean up and limit to reasonable length
  return summary.slice(0, 150);
}

/**
 * POST /api/ai-summary
 * Generate a 10-word summary of a licensing notice using AI
 * Tries: 1) Hugging Face (free), 2) OpenAI (paid), 3) Heuristic fallback
 */
router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text content is required" });
    }

    let summary = "";
    let method = "";

    // Hugging Face BART doesn't follow instructions - it just summarizes generically
    // Disable it for now until we can use an instruction-following model
    // if (process.env.HUGGINGFACE_API_KEY) {
    //   try {
    //     console.log("[AI_SUMMARY] Attempting Hugging Face...");
    //     summary = await generateWithHuggingFace(text);
    //     method = "huggingface";
    //     console.log(`[AI_SUMMARY] Hugging Face generated: "${summary}"`);
    //   } catch (hfError: any) {
    //     console.warn(`[AI_SUMMARY] Hugging Face failed: ${hfError.message}`);
    //   }
    // }

    // If Hugging Face failed or unavailable, try OpenAI
    if (!summary) {
      const openai = getOpenAIClient();
      if (openai) {
        try {
          console.log("[AI_SUMMARY] Attempting OpenAI...");
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are an expert at summarizing UK licensing applications under the Licensing Act 2003. Your task is to create extremely concise, readable summaries that help residents quickly understand what is being applied for.

CRITICAL REQUIREMENTS:
1. Maximum 10 words total - this is STRICT
2. Focus ONLY on the application type and licensable activities
3. Use plain, simple language that any resident can understand
4. Never include: applicant names, business names, addresses, dates, or procedural details
5. Be specific about what activities are being licensed

APPLICATION TYPES (use these exact terms when applicable):
- "Premises licence" (for new applications)
- "Variation of premises licence" (for changes to existing licences)
- "Club premises certificate" (for members' clubs)
- "Review of premises licence" (for review applications)

LICENSABLE ACTIVITIES (use these concise terms):
- Alcohol sales (specify: "on premises", "off premises", or "on and off premises")
- Late night refreshment
- Live music
- Recorded music
- Entertainment (for other regulated entertainment)

EXAMPLE SUMMARIES:
- "Premises licence for alcohol sales and late night refreshment"
- "Variation to add live music and extend hours"
- "Club premises certificate for alcohol and entertainment"
- "Premises licence for off premises alcohol sales only"

FORMAT RULES:
- Start with the application type
- Follow with "for" + activities
- Use commas for 3+ activities: "alcohol, late night refreshment and music"
- Keep it grammatically correct and natural
- Every word counts - be economical`,
              },
              {
                role: "user",
                content: `Read the following UK licensing notice carefully and generate a summary in EXACTLY 10 words or less. Focus on what type of licence/certificate is being applied for and what activities it covers.

${text}

Generate a concise summary (maximum 10 words):`,
              },
            ],
            temperature: 0.2,
            max_tokens: 60,
          });

          summary = completion.choices[0]?.message?.content?.trim() || "";
          method = "openai";
          console.log(`[AI_SUMMARY] OpenAI generated: "${summary}"`);
        } catch (openaiError: any) {
          console.warn(`[AI_SUMMARY] OpenAI failed: ${openaiError.message}`);
          const statusCode = openaiError.status || openaiError.statusCode || 500;
          if (statusCode === 429 || statusCode === 401 || statusCode === 503) {
            // Quota/auth error - fall through to heuristic
          } else {
            throw openaiError; // Re-throw unexpected errors
          }
        }
      }
    }

    // If both AI methods failed, return fallback flag
    if (!summary) {
      console.warn("[AI_SUMMARY] All AI methods unavailable, falling back to heuristic");
      return res.status(503).json({
        error: "AI summary service not configured",
        fallback: true
      });
    }

    res.json({ summary, method });
  } catch (error: any) {
    console.error("[AI_SUMMARY] Unexpected error:", error.message);
    res.status(500).json({
      error: "Failed to generate AI summary",
      details: error.message,
      fallback: true
    });
  }
});

export default router;
