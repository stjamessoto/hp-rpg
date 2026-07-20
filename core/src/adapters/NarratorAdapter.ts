/**
 * Optional LLM-backed prose enrichment, kept behind the same
 * injectable-adapter pattern as Storage/Rng/Ui: /core builds the prompt
 * and grounding facts (pure, no network), and a concrete adapter
 * (currently GeminiNarratorAdapter in /web) does the actual network call.
 * /core never imports a vendor SDK and never knows which model, if any,
 * is behind this — the game must play identically well with no
 * NarratorAdapter configured at all.
 */
export interface NarratorContext {
  /** The style-bible §6 injection block, filled in with current story state. */
  systemPrompt: string;
  /** What this specific call should produce. */
  instruction: string;
  /** JSON-serializable facts the model should ground its answer in and not go beyond. */
  groundingFacts: Record<string, unknown>;
}

export interface NarratorAdapter {
  /** Returns generated prose, or null if unavailable/disabled/failed — callers must treat null as "skip, no enrichment this time," never as an error. */
  generate(context: NarratorContext): Promise<string | null>;
}

/** Default no-op adapter: zero cost, zero network, zero behavior change from not having a narrator at all. */
export class NullNarratorAdapter implements NarratorAdapter {
  async generate(_context: NarratorContext): Promise<string | null> {
    return null;
  }
}
