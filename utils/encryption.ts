export async function encryptToken(token: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedToken = new TextEncoder().encode(token);
  const encryptedToken = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedToken
  );
  const combined = new Uint8Array([...iv, ...new Uint8Array(encryptedToken)]);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptToken(encryptedToken: string): Promise<string> {
  try {
    const key = await getOrCreateEncryptionKey();
    const combined = Uint8Array.from(atob(encryptedToken), (c) =>
      c.charCodeAt(0)
    );
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  const keyName = "todoistTokenKey";
  const storedKey = localStorage.getItem(keyName);

  if (storedKey) {
    const keyData = Uint8Array.from(storedKey.split(",").map(Number));
    return await crypto.subtle.importKey("raw", keyData, "AES-GCM", true, [
      "encrypt",
      "decrypt",
    ]);
  } else {
    const newKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const exportedKey = await crypto.subtle.exportKey("raw", newKey);
    localStorage.setItem(
      keyName,
      Array.from(new Uint8Array(exportedKey)).join(",")
    );
    return newKey;
  }
}
