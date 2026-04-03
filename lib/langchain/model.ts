const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

interface GeminiGenerationOptions {
  model?: string;
  temperature?: number;
  responseMimeType?: string;
  responseJsonSchema?: Record<string, unknown>;
}

function getGeminiApiKey() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY or GEMINI_API_KEY");
  }

  return apiKey;
}

function extractTextFromGeminiResponse(payload: any) {
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    const blockReason = payload?.promptFeedback?.blockReason;
    throw new Error(blockReason ? `Gemini blocked the request: ${blockReason}` : "Gemini returned an empty response");
  }

  return text;
}

export async function generateGeminiText(
  prompt: string,
  options: GeminiGenerationOptions = {}
) {
  const response = await fetch(
    `${GEMINI_API_BASE}/${options.model ?? DEFAULT_GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getGeminiApiKey(),
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: options.temperature ?? 0,
          responseMimeType: options.responseMimeType,
          responseJsonSchema: options.responseJsonSchema,
        },
      }),
      cache: "no-store",
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Gemini request failed");
  }

  return extractTextFromGeminiResponse(payload);
}

export async function generateGeminiJson<T>(
  prompt: string,
  responseJsonSchema: Record<string, unknown>,
  options: Omit<GeminiGenerationOptions, "responseMimeType" | "responseJsonSchema"> = {}
) {
  const text = await generateGeminiText(prompt, {
    ...options,
    responseMimeType: "application/json",
    responseJsonSchema,
  });

  const sanitized = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  return JSON.parse(sanitized) as T;
}
