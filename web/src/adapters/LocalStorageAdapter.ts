import type { StorageAdapter } from "@core/adapters/StorageAdapter.js";

/** Browser implementation of /core's StorageAdapter, backed by window.localStorage. */
export class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return window.localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  }

  async listKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    return keys;
  }
}
