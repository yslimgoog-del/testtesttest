
import { GoogleGenAI } from "@google/genai";
import { encrypt, decrypt } from './cryptoService';

const API_KEY_STORAGE_KEY = 'gemini-api-key-encrypted';

export const saveApiKey = async (apiKey: string): Promise<void> => {
  try {
    const encryptedKey = await encrypt(apiKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, encryptedKey);
  } catch (error) {
    console.error("Failed to save API key:", error);
  }
};

export const getApiKey = async (): Promise<string | null> => {
  try {
    const encryptedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!encryptedKey) {
      return null;
    }
    return await decrypt(encryptedKey);
  } catch (error) {
    console.error("Failed to retrieve or decrypt API key, deleting corrupted key:", error);
    // If decryption fails, the key or crypto key might be corrupt.
    // It's better to remove it.
    deleteApiKey();
    return null;
  }
};

export const deleteApiKey = async (): Promise<void> => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
};

export const testApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey || !apiKey.trim()) {
    return false;
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use a very simple and low-cost model/method for testing
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'hello',
    });
    // Check if we got a response. The actual content doesn't matter.
    return !!response.text;
  } catch (error) {
    console.error("API Key test failed:", error);
    return false;
  }
};
