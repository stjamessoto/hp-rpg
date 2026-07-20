import type { NarratorAdapter, NarratorContext } from "@core/adapters/NarratorAdapter.js";

// "gemini-2.5-flash" (an earlier guess) 404s as of this build — Google
// retired it for new API keys. "gemini-flash-latest" is an auto-updating
// alias (currently resolving to gemini-3.5-flash) so this doesn't need to
// keep chasing whichever specific version is current; override via
// VITE_GEMINI_MODEL if you want to pin one.
const DEFAULT_MODEL = "gemini-flash-latest";
const MAX_OUTPUT_TOKENS = 220;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/**
 * Browser implementation of /core's NarratorAdapter, calling the Gemini
 * API's generateContent REST endpoint directly. This is a plain `fetch`
 * call — no SDK — which is why mobile/src/adapters/GeminiNarratorAdapter.ts
 * is a byte-for-byte copy of this file with nothing changed: only the
 * caller (main.ts vs. App.tsx) differs in how it reads the API key.
 *
 * Security note: calling a generative-AI API directly from browser code
 * means the API key ships in every request the browser makes, visible to
 * anyone who opens dev tools. That's an acceptable tradeoff for local,
 * personal use (this is how the key is meant to be used here) but is NOT
 * safe for a publicly deployed build — a public deployment should proxy
 * this call through a small backend that holds the key server-side.
 */
export class GeminiNarratorAdapter implements NarratorAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL
  ) {}

  async generate(context: NarratorContext): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const prompt =
      `${context.instruction}\n\n` +
      `Grounding facts (use only these; do not invent beyond them):\n` +
      JSON.stringify(context.groundingFacts, null, 2);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: context.systemPrompt }] },
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            // A one-paragraph reaction doesn't need Gemini 3's extended
            // reasoning — leaving it on burned ~15x more tokens (and
            // latency) than the actual output for no quality difference
            // in testing. Harmless on older/other models that ignore it.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      });

      if (!res.ok) {
        console.warn(`[narrator] Gemini request failed: ${res.status} ${res.statusText}`);
        return null;
      }

      const json = (await res.json()) as GeminiResponse;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      return typeof text === "string" && text.trim().length > 0 ? text.trim() : null;
    } catch (err) {
      console.warn("[narrator] Gemini request errored:", err);
      return null;
    }
  }
}
