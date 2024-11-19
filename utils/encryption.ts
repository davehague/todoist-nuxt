// utils/encryption.ts
export class EncryptionUtils {
  private readonly storagePrefix: string;
  private readonly encryptionKeyName: string;

  constructor(namespace: string = "app") {
    this.storagePrefix = `${namespace}_`;
    this.encryptionKeyName = `${this.storagePrefix}encryption_key`;
  }

  private async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    const storedKey = localStorage.getItem(this.encryptionKeyName);

    if (!storedKey) {
      const newKey = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );

      const exportedKey = await crypto.subtle.exportKey("raw", newKey);
      localStorage.setItem(
        this.encryptionKeyName,
        Array.from(new Uint8Array(exportedKey)).join(",")
      );

      return newKey;
    }

    const keyData = Uint8Array.from(storedKey.split(",").map(Number));
    return await crypto.subtle.importKey("raw", keyData, "AES-GCM", true, [
      "encrypt",
      "decrypt",
    ]);
  }

  async encrypt(data: string): Promise<string> {
    const key = await this.getOrCreateEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encoded
    );

    const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
    return btoa(String.fromCharCode(...combined));
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      const combined = Uint8Array.from(atob(encryptedData), (c) =>
        c.charCodeAt(0)
      );
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
        },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error("Decryption error:", error);
      return "";
    }
  }
}

// Create a secure storage wrapper
export class SecureStorage {
  private encryption: EncryptionUtils;

  constructor(namespace: string = "app") {
    this.encryption = new EncryptionUtils(namespace);
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this.encryption.encrypt(value);
    localStorage.setItem(key, encrypted);
  }

  async getItem(key: string): Promise<string> {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return "";
    return await this.encryption.decrypt(encrypted);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}

// Create a composable for Vue projects
export const useSecureStorage = (namespace?: string) => {
  const storage = new SecureStorage(namespace);

  return {
    setSecureItem: storage.setItem.bind(storage),
    getSecureItem: storage.getItem.bind(storage),
    removeSecureItem: storage.removeItem.bind(storage),
    clearSecureStorage: storage.clear.bind(storage),
  };
};
