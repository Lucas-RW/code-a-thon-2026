import * as SecureStore from 'expo-secure-store';

/**
 * Clerk TokenCache interface — mirrors @clerk/clerk-expo's internal type
 * without importing from the private dist path.
 */
interface TokenCache {
  getToken: (key: string) => Promise<string | undefined | null>;
  saveToken: (key: string, token: string) => Promise<void>;
  clearToken?: (key: string) => void | Promise<void>;
}

/**
 * Clerk token cache backed by expo-secure-store.
 * Follows the official Clerk Expo Quickstart pattern.
 */
export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore write errors silently
    }
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};

