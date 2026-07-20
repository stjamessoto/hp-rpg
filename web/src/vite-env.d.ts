/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional. If set, /web wires up a GeminiNarratorAdapter for personalized scene enrichment. See web/.env.example. */
  readonly VITE_GEMINI_API_KEY?: string;
  /** Optional. Defaults to gemini-flash-latest if unset. */
  readonly VITE_GEMINI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
