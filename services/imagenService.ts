
import { GoogleGenAI } from "@google/genai";
import { IMAGEN_MODEL_NAME, IMAGEN_PROMPT_SUFFIX } from '../constants';

let ai: GoogleGenAI | null = null;

const initializeAi = (apiKey: string): GoogleGenAI => {
  if (!ai) {
    // Ensure only one instance for Imagen service, potentially different from Gemini service if keys differ
    // For this app, assuming the same API key is used.
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const generateAndorImage = async (apiKey: string, description: string): Promise<string | null> => {
  const genAI = initializeAi(apiKey);
  const fullPrompt = `${description.substring(0, 700)} ${IMAGEN_PROMPT_SUFFIX}`; // Limit description length for prompt

  try {
    const response = await genAI.models.generateImages({
      model: IMAGEN_MODEL_NAME,
      prompt: fullPrompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error: any) {
    console.error("Error generating image with Imagen:", error);
    // Specific error handling for 429 (Quota Exceeded) could be added here if needed
    // For now, just log and return null for any error.
    // if (error.message && error.message.includes('429')) {
    //   console.warn("Imagen quota likely exceeded.");
    // }
    return null;
  }
};
