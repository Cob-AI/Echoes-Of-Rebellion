
export interface Choice {
  id: string;
  text: string;
}

// Corresponds to the JSON structure expected from the Gemini API
export interface RawStoryResponse {
  description: string;
  choices: string[];
  suggestedFocus: string;
  actTitle: string;
  sceneTitle: string;
  isSceneEnd: boolean;
  isActEnd: boolean;
  isMicroArcEnd: boolean;
  isPlayerDefeated?: boolean; // Optional: player is defeated
  isGameWon?: boolean;       // Optional: player achieves victory
}

// Processed story response used within the application
export interface StoryResponse {
  description: string;
  choices: Choice[];
  suggestedFocus: string;
  actTitle: string;
  sceneTitle: string;
  isSceneEnd: boolean;
  isActEnd: boolean;
  isMicroArcEnd: boolean;
  isPlayerDefeated: boolean; // Non-optional after processing, defaults to false
  isGameWon: boolean;       // Non-optional after processing, defaults to false
}

export enum GameState {
  START_SCREEN,
  LOADING_STORY,
  SHOWING_STORY,
  ERROR,
  API_KEY_MISSING,
  GAME_OVER_DEFEAT,
  GAME_OVER_VICTORY,
}

// For Gemini Chat (simplified)
export interface ChatMessagePart {
  text?: string;
  // inlineData?: { mimeType: string; data: string }; // Not used in this version
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: ChatMessagePart[];
}
