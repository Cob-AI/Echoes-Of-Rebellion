
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { RawStoryResponse, StoryResponse, Choice } from '../types';
import { GEMINI_MODEL_NAME, INITIAL_SYSTEM_PROMPT, CONTINUE_GAME_USER_PROMPT_TEMPLATE } from '../constants';

let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

// New return type for service functions
export interface GeminiServiceResponse {
  rawText: string | null;
  storyResponse: StoryResponse | null;
  error?: string;
}

const initializeAi = (apiKey: string): GoogleGenAI => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const parseGeminiResponse = (rawJson: string): StoryResponse | null => {
  let cleanedJson = rawJson.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanedJson.match(fenceRegex);
  if (match && match[1]) {
    cleanedJson = match[1].trim();
  }

  try {
    const rawResponse: RawStoryResponse = JSON.parse(cleanedJson);

    // Validate core fields
    if (
      typeof rawResponse.description !== 'string' ||
      !Array.isArray(rawResponse.choices) || // Choices can be empty on game end
      !rawResponse.choices.every(c => typeof c === 'string') ||
      typeof rawResponse.suggestedFocus !== 'string' ||
      typeof rawResponse.actTitle !== 'string' ||
      typeof rawResponse.sceneTitle !== 'string' ||
      typeof rawResponse.isSceneEnd !== 'boolean' ||
      typeof rawResponse.isActEnd !== 'boolean' ||
      typeof rawResponse.isMicroArcEnd !== 'boolean'
    ) {
      console.error("Parsed Gemini response has incorrect core structure:", rawResponse);
      return null; 
    }

    // Validate optional game end flags
    const isPlayerDefeated = typeof rawResponse.isPlayerDefeated === 'boolean' ? rawResponse.isPlayerDefeated : false;
    const isGameWon = typeof rawResponse.isGameWon === 'boolean' ? rawResponse.isGameWon : false;

    // Ensure exactly 3 choices, unless game has ended.
    let finalChoices = rawResponse.choices;
    if (!isPlayerDefeated && !isGameWon) {
        if (finalChoices.length < 3 && finalChoices.length > 0) { 
            console.warn(`AI provided ${finalChoices.length} choices. Padding to 3 choices.`);
            while(finalChoices.length < 3) finalChoices.push("Consider your next move carefully.");
        } else if (finalChoices.length > 3) {
            console.warn(`AI provided ${finalChoices.length} choices. Truncating to 3 choices.`);
            finalChoices = finalChoices.slice(0, 3);
        } else if (finalChoices.length === 0) { // Should not happen if game not over
             console.warn("AI provided 0 choices while game is ongoing. Padding to 3 choices.");
             finalChoices = [
                "Proceed cautiously.",
                "Assess the situation.",
                "Look for opportunities."
             ];
        }
    }


    const processedChoices: Choice[] = finalChoices.map((text, index) => ({
      id: `choice-${Date.now()}-${index}`,
      text: text,
    }));

    return {
      description: rawResponse.description,
      choices: processedChoices,
      suggestedFocus: rawResponse.suggestedFocus,
      actTitle: rawResponse.actTitle,
      sceneTitle: rawResponse.sceneTitle,
      isSceneEnd: rawResponse.isSceneEnd,
      isActEnd: rawResponse.isActEnd,
      isMicroArcEnd: rawResponse.isMicroArcEnd,
      isPlayerDefeated,
      isGameWon,
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", error, "Raw JSON:", rawJson);
    return null; // Indicates parsing failure
  }
};


export const startNewGame = async (apiKey: string): Promise<GeminiServiceResponse> => {
  const genAI = initializeAi(apiKey);
  chat = genAI.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      systemInstruction: INITIAL_SYSTEM_PROMPT,
    }
  });

  try {
    const result: GenerateContentResponse = await chat.sendMessage({ message: "Begin adventure." });
    const responseText = result.text;
    
    const parsedData = parseGeminiResponse(responseText);
    if (!parsedData) {
      // Parsing failed, but we have the raw text
      return { rawText: responseText, storyResponse: null, error: "Failed to parse initial story data from AI." };
    }
    return { rawText: responseText, storyResponse: parsedData };
  } catch (e: any) {
    console.error("Error starting new game with Gemini:", e);
    // Network or other API error before getting text
    return { rawText: null, storyResponse: null, error: e.message || "API error during new game." };
  }
};

export const sendChoiceAndGetResponse = async (
  playerChoice: string,
  previousFocus: string,
  currentAct: string,
  currentScene: string,
  currentMicroArc: number,
  isPrevSceneEnd: boolean,
  isPrevMicroArcEnd: boolean,
  isPrevActEnd: boolean
): Promise<GeminiServiceResponse> => {
  if (!chat) {
    // This case should ideally be prevented by App logic, but as a safeguard:
    return { rawText: null, storyResponse: null, error: "Chat session not initialized. Call startNewGame first."};
  }

  const userPrompt = CONTINUE_GAME_USER_PROMPT_TEMPLATE(
    playerChoice,
    previousFocus,
    currentAct,
    currentScene,
    currentMicroArc,
    isPrevSceneEnd,
    isPrevMicroArcEnd,
    isPrevActEnd
  );

  try {
    const result: GenerateContentResponse = await chat.sendMessage({ message: userPrompt });
    const responseText = result.text;
    const parsedData = parseGeminiResponse(responseText);
    if (!parsedData) {
      // Parsing failed, but we have the raw text
      return { rawText: responseText, storyResponse: null, error: "Failed to parse subsequent story data from AI." };
    }
    return { rawText: responseText, storyResponse: parsedData };
  } catch (e: any) {
    console.error("Error sending choice to Gemini:", e);
    // Network or other API error
    return { rawText: null, storyResponse: null, error: e.message || "API error sending choice." };
  }
};
