import type { UiAdapter, UiChoice } from "@core/adapters/UiAdapter.js";

/** Browser implementation of /core's UiAdapter: a scrolling log plus a controls strip below it. */
export class DomUiAdapter implements UiAdapter {
  constructor(
    private readonly logEl: HTMLElement,
    private readonly controlsEl: HTMLElement
  ) {}

  async print(text: string): Promise<void> {
    const p = document.createElement("p");
    p.className = "log-entry";
    p.textContent = text;
    this.logEl.appendChild(p);
    this.scrollToBottom();
  }

  private async echo(text: string): Promise<void> {
    const p = document.createElement("p");
    p.className = "log-entry log-entry--player";
    p.textContent = text;
    this.logEl.appendChild(p);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  private clearControls(): void {
    this.controlsEl.innerHTML = "";
  }

  async ask(question: string, opts?: { placeholder?: string }): Promise<string> {
    await this.print(question);
    return new Promise<string>((resolve) => {
      this.clearControls();
      const form = document.createElement("form");
      form.className = "ask-form";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = opts?.placeholder ?? "";
      input.autocomplete = "off";

      const button = document.createElement("button");
      button.type = "submit";
      button.textContent = "Continue";

      form.append(input, button);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const value = input.value.trim();
        this.clearControls();
        void this.echo(`> ${value || "(blank)"}`);
        resolve(value);
      });

      this.controlsEl.appendChild(form);
      input.focus();
    });
  }

  async choose<T extends string>(question: string, options: readonly UiChoice<T>[]): Promise<T> {
    await this.print(question);
    return new Promise<T>((resolve) => {
      this.clearControls();
      const list = document.createElement("div");
      list.className = "choice-list";

      for (const option of options) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-button";
        button.textContent = option.label;
        if (option.hint) button.title = option.hint;
        button.addEventListener("click", () => {
          this.clearControls();
          void this.echo(`> ${option.label}`);
          resolve(option.id);
        });
        list.appendChild(button);
      }

      this.controlsEl.appendChild(list);
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
