/**
 * Storage is injected so /core never touches localStorage, the filesystem,
 * or any other concrete storage API. Web supplies a localStorage-backed
 * implementation; a future mobile shell supplies one backed by device
 * storage / SecureStore. Values are always pre-serialized strings so the
 * adapter itself stays a dumb key/value store.
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  listKeys(prefix: string): Promise<string[]>;
}

/** In-memory StorageAdapter for tests and as a reference implementation. */
export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async listKeys(prefix: string): Promise<string[]> {
    return [...this.store.keys()].filter((k) => k.startsWith(prefix));
  }
}
