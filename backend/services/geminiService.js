import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    ".env"
  )
});

const API_KEY = process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY;
const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "google/gemma-4-31b-it";
const STREAM = false;
const REQUEST_TIMEOUT_MS = 90000;
const MAX_RETRIES = 2;

function extractJsonText(rawText) {
  if (!rawText) return "";

  const text = String(rawText).trim();

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  return text;
}

// =========================
// VERIFY ITEM
// =========================

export async function verifyItem(item) {

  console.log("Sending item to NVIDIA verification API...");
  console.log("Part Number:", item.partNumber);
  console.log("Manufacturer:", item.manufacturer);
  console.log("Component Type:", item.componentType);

  if (!API_KEY) {
    throw new Error("NVIDIA API key is missing. Set NVIDIA_API_KEY in backend/.env");
  }

  const prompt = `
Verify this engineering component using the manufacturer and part number.
Return valid JSON only with this structure:
{
  "componentType": "string",
  "verifiedProperties": [
    {
      "name": "string",
      "existingValue": "string",
      "verifiedValue": "string",
      "status": "MATCH" | "MISMATCH" | "NOT_VERIFIED",
      "source": "string",
      "explanation": "string"
    }
  ]
}

Alias ID: ${item.aliasId}
Part Number: ${item.partNumber}
Manufacturer: ${item.manufacturer}
Component Type: ${item.componentType}
Properties: ${JSON.stringify(item.properties, null, 2)}

Rules:
1. Only include relevant properties.
2. Preserve existingValue exactly.
3. If not reliably verifiable, use "NOT_VERIFIED" with empty verifiedValue.
4. No markdown fences, no extra text.
`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Accept": STREAM ? "text/event-stream" : "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 512,
          stream: STREAM,
          temperature: 0.2,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          seed: 0,
          messages: [
            {
              role: "system",
              content: "You are a careful engineering verifier. Return valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        }),
        signal: controller.signal
      });

      const rawResponseText = await response.text();

      let responseJson;
      try {
        responseJson = JSON.parse(rawResponseText);
      } catch (error) {
        throw new Error(`NVIDIA API returned invalid JSON: ${rawResponseText.slice(0, 500)}`, {
          cause: error
        });
      }

      if (!response.ok) {
        const errorMessage = responseJson?.error?.message || responseJson?.message || `NVIDIA API error: ${response.status}`;
        const transientError = response.status === 429 || response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504;

        if (transientError && attempt < MAX_RETRIES) {
          console.warn(`NVIDIA transient error on attempt ${attempt + 1}: ${errorMessage}. Retrying...`);
          continue;
        }

        throw new Error(errorMessage);
      }

      const content = responseJson?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("NVIDIA API response did not include message content.");
      }

      const jsonText = extractJsonText(content);

      try {
        const verifiedData = JSON.parse(jsonText);
        return verifiedData;
      } catch (error) {
        console.error("Failed to parse NVIDIA verification JSON:", jsonText);
        throw new Error("NVIDIA verification response was not valid JSON.", {
          cause: error
        });
      }
    } catch (error) {
      if (error.name === "AbortError") {
        if (attempt < MAX_RETRIES) {
          console.warn(`NVIDIA request timed out on attempt ${attempt + 1}. Retrying...`);
          continue;
        }
        throw new Error("NVIDIA API request timed out after 90 seconds.");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("NVIDIA API verification failed after retries.");
}