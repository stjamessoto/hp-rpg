import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StorageAdapter } from "@core/adapters/StorageAdapter.js";

/**
 * Native implementation of /core's StorageAdapter, backed by
 * @react-native-async-storage/async-storage — the direct device-storage
 * counterpart to /web's LocalStorageAdapter. Same three methods, same
 * contract, zero changes needed in /core.
 */
export class AsyncStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async listKeys(prefix: string): Promise<string[]> {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter((key) => key.startsWith(prefix));
  }
}
