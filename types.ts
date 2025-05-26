
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
}

export enum GameState {
  START_SCREEN,
  LOADING_STORY,
  SHOWING_STORY,
  ERROR,
  API_KEY_MISSING,
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
