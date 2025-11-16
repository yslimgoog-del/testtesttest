
const KEY_STORAGE_KEY = 'gemini-app-crypto-key';
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits is recommended for AES-GCM

// --- Key Management ---

/**
 * Retrieves the encryption key from localStorage, or generates and stores a new one if not found.
 */
const getEncryptionKey = async (): Promise<CryptoKey> => {
  const storedKey = localStorage.getItem(KEY_STORAGE_KEY);
  if (storedKey) {
    try {
      const jwk = JSON.parse(storedKey);
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: ALGORITHM },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (e) {
      console.error("Failed to import stored key, generating a new one.", e);
    }
  }

  const newKey = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const jwk = await crypto.subtle.exportKey('jwk', newKey);
  localStorage.setItem(KEY_STORAGE_KEY, JSON.stringify(jwk));

  return newKey;
};

// --- Utility Functions ---

/**
 * Converts a string to an ArrayBuffer.
 */
const str2ab = (str: string): ArrayBuffer => {
  const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  const bufView = new Uint16Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

/**
 * Converts an ArrayBuffer to a string.
 */
const ab2str = (buf: ArrayBuffer): string => {
  return String.fromCharCode.apply(null, Array.from(new Uint16Array(buf)));
};

/**
 * Encodes an ArrayBuffer into a Base64 string.
 */
const encodeBase64 = (buf: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buf);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Decodes a Base64 string into an ArrayBuffer.
 */
const decodeBase64 = (str: string): ArrayBuffer => {
    const binary_string = window.atob(str);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// --- Public API ---

/**
 * Encrypts a plaintext string using AES-GCM.
 * The IV is prepended to the ciphertext for use during decryption.
 * @param plaintext The string to encrypt.
 * @returns A Base64 encoded string containing the IV and the ciphertext.
 */
export const encrypt = async (plaintext: string): Promise<string> => {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const data = str2ab(plaintext);

  const encryptedData = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return encodeBase64(combined.buffer);
};

/**
 * Decrypts a Base64 encoded string (containing IV + ciphertext) using AES-GCM.
 * @param encryptedBase64 The Base64 string to decrypt.
 * @returns The original plaintext string.
 */
export const decrypt = async (encryptedBase64: string): Promise<string> => {
  const key = await getEncryptionKey();
  const combinedBuffer = decodeBase64(encryptedBase64);

  const iv = combinedBuffer.slice(0, IV_LENGTH);
  const data = combinedBuffer.slice(IV_LENGTH);

  const decryptedData = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: new Uint8Array(iv) },
    key,
    data
  );

  return ab2str(decryptedData);
};
