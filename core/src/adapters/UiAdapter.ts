/**
 * All player-facing I/O in /core goes through this interface. Core never
 * calls document/DOM APIs, alert/prompt, or any Node console — it only
 * knows how to ask questions and print narration. Web implements this
 * with DOM elements; a future mobile shell implements it with native
 * views; tests implement it with a scripted queue of answers.
 */
export interface UiChoice<T extends string = string> {
  id: T;
  label: string;
  hint?: string;
}

export interface UiAdapter {
  /** Print a block of narration/prose. May be called many times per scene. */
  print(text: string): Promise<void>;
  /** Ask a free-text question (name entry, backstory free text, etc). */
  ask(question: string, opts?: { placeholder?: string }): Promise<string>;
  /** Ask the player to pick exactly one option from a small set. */
  choose<T extends string>(question: string, options: readonly UiChoice<T>[]): Promise<T>;
  /** Ask a yes/no question. */
  confirm(question: string): Promise<boolean>;
}

/**
 * Scripted UiAdapter for tests: answers are provided up front and consumed
 * in call order. Throws if the flow asks more questions than were scripted,
 * which turns "the flow changed shape" into an immediate test failure.
 */
export class ScriptedUiAdapter implements UiAdapter {
  readonly printed: string[] = [];
  private answers: (string | boolean)[];

  constructor(answers: (string | boolean)[]) {
    this.answers = [...answers];
  }

  async print(text: string): Promise<void> {
    this.printed.push(text);
  }

  private consume(kind: string): string | boolean {
    if (this.answers.length === 0) {
      throw new Error(`ScriptedUiAdapter: ran out of scripted answers at a "${kind}" call`);
    }
    return this.answers.shift()!;
  }

  async ask(question: string): Promise<string> {
    const value = this.consume(`ask(${question})`);
    return String(value);
  }

  async choose<T extends string>(question: string, options: readonly UiChoice<T>[]): Promise<T> {
    const value = String(this.consume(`choose(${question})`)) as T;
    if (!options.some((o) => o.id === value)) {
      throw new Error(
        `ScriptedUiAdapter: answer "${value}" is not one of the offered options [${options
          .map((o) => o.id)
          .join(", ")}] for "${question}"`
      );
    }
    return value;
  }

  async confirm(question: string): Promise<boolean> {
    const value = this.consume(`confirm(${question})`);
    return typeof value === "boolean" ? value : value === "true" || value === "yes";
  }
}
