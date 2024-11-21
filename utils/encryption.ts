export interface EncryptedTokenData {
  encrypted_token: string;
  token_iv: string;
}

export async function importEncryptionKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(keyString.split(',').map(Number));
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}

export async function generateNewEncryptionKey(): Promise<string> {
  const newKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const exportedKey = await crypto.subtle.exportKey("raw", newKey);
  return Array.from(new Uint8Array(exportedKey)).join(",");
}

export async function encryptToken(token: string, encryptionKey: string): Promise<EncryptedTokenData> {
  const key = await importEncryptionKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedToken = new TextEncoder().encode(token);
  const encryptedToken = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedToken
  );
  return {
    encrypted_token: btoa(String.fromCharCode(...new Uint8Array(encryptedToken))),
    token_iv: btoa(String.fromCharCode(...iv))
  };
}

export async function decryptToken(
  encryptedToken: EncryptedTokenData,
  encryptionKey: string
): Promise<string> {
  try {
    const key = await importEncryptionKey(encryptionKey);
    const combined = Uint8Array.from(
      atob(encryptedToken.encrypted_token),
      (c) => c.charCodeAt(0)
    );
    const iv = Uint8Array.from(atob(encryptedToken.token_iv), (c) =>
      c.charCodeAt(0)
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      combined
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}
