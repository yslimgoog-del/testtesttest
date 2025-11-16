
import { GoogleGenAI, Modality } from "@google/genai";
import { getApiKey } from './apiKeyService';

const getAiClient = async (): Promise<GoogleGenAI> => {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("API 키가 설정되지 않았습니다. 설정을 확인해주세요.");
  }
  return new GoogleGenAI({ apiKey });
}

export const generateWallpapers = async (prompt: string): Promise<string[]> => {
  try {
    const ai = await getAiClient();
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A beautiful, high-resolution mobile phone wallpaper with a 9:16 aspect ratio. The theme is: ${prompt}`,
      config: {
        numberOfImages: 4,
        outputMimeType: 'image/png',
        aspectRatio: '9:16',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
    }
    return [];
  } catch (error) {
    console.error("Error generating images:", error);
    throw new Error("이미지 생성에 실패했습니다. API 키가 유효한지 확인해주세요.");
  }
};

export const remixWallpaper = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    const ai = await getAiClient();
    const rawBase64 = base64Image.split(',')[1];
    if (!rawBase64) {
      throw new Error("Invalid image data format.");
    }

    const imagePart = {
      inlineData: {
        data: rawBase64,
        mimeType: 'image/png',
      },
    };

    const textPart = {
      text: prompt,
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    
    throw new Error("리믹스된 이미지를 찾을 수 없습니다.");

  } catch (error) {
    console.error("Error remixing image:", error);
    throw new Error("이미지 리믹스에 실패했습니다. API 키가 유효한지 확인해주세요.");
  }
};
