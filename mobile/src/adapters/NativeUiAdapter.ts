import type { UiAdapter, UiChoice } from "@core/adapters/UiAdapter.js";

export interface LogEntry {
  id: number;
  text: string;
  isPlayer: boolean;
}

export type PendingRequest =
  | { kind: "ask"; question: string; placeholder?: string; resolve: (value: string) => void }
  | { kind: "choose"; question: string; options: readonly UiChoice[]; resolve: (value: string) => void };

export interface NativeUiState {
  log: LogEntry[];
  pending: PendingRequest | null;
}

/**
 * Native implementation of /core's UiAdapter. /core awaits `print` /
 * `ask` / `choose` / `confirm` imperatively, but React Native has no DOM
 * to append elements to the way /web's DomUiAdapter does — so instead this
 * adapter is a tiny observable store: each call updates `state` and
 * notifies subscribers, and `ask`/`choose` return a Promise that only
 * resolves once a React component calls back with the player's answer
 * (see App.tsx's `useUiAdapterState` hook, which subscribes via
 * useSyncExternalStore).
 */
export class NativeUiAdapter implements UiAdapter {
  private listeners = new Set<() => void>();
  private nextId = 0;

  state: NativeUiState = { log: [], pending: null };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): NativeUiState => this.state;

  private setState(next: NativeUiState): void {
    this.state = next;
    this.listeners.forEach((listener) => listener());
  }

  private appendLog(text: string, isPlayer: boolean): void {
    this.setState({
      ...this.state,
      log: [...this.state.log, { id: this.nextId++, text, isPlayer }],
    });
  }

  async print(text: string): Promise<void> {
    this.appendLog(text, false);
  }

  async ask(question: string, opts?: { placeholder?: string }): Promise<string> {
    this.appendLog(question, false);
    return new Promise<string>((resolve) => {
      this.setState({
        ...this.state,
        pending: {
          kind: "ask",
          question,
          placeholder: opts?.placeholder,
          resolve: (value) => {
            this.setState({ ...this.state, pending: null });
            this.appendLog(`> ${value || "(blank)"}`, true);
            resolve(value);
          },
        },
      });
    });
  }

  async choose<T extends string>(question: string, options: readonly UiChoice<T>[]): Promise<T> {
    this.appendLog(question, false);
    return new Promise<T>((resolve) => {
      this.setState({
        ...this.state,
        pending: {
          kind: "choose",
          question,
          options,
          resolve: (value) => {
            const chosen = options.find((o) => o.id === value);
            this.setState({ ...this.state, pending: null });
            this.appendLog(`> ${chosen?.label ?? value}`, true);
            resolve(value as T);
          },
        },
      });
    });
  }

  async confirm(question: string): Promise<boolean> {
    const answer = await this.choose<"yes" | "no">(question, [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ]);
    return answer === "yes";
  }
}
