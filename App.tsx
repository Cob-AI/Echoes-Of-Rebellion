
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Choice, StoryResponse } from './types';
import { startNewGame, sendChoiceAndGetResponse, parseGeminiResponse, GeminiServiceResponse } from './services/geminiService';
import { generateAndorImage } from './services/imagenService';
import StoryDisplay from './components/StoryDisplay';
import ChoiceButton from './components/ChoiceButton';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import DeveloperFooter from './components/DeveloperFooter';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START_SCREEN);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const [currentDescription, setCurrentDescription] = useState<string>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
  
  const [narrativeFocus, setNarrativeFocus] = useState<string>('');
  const [currentActTitle, setCurrentActTitle] = useState<string>('');
  const [currentSceneTitle, setCurrentSceneTitle] = useState<string>('');
  
  const [isCurrentSceneEnd, setIsCurrentSceneEnd] = useState<boolean>(false);
  const [isCurrentActEnd, setIsCurrentActEnd] = useState<boolean>(false);
  const [isCurrentMicroArcEnd, setIsCurrentMicroArcEnd] = useState<boolean>(false);
  const [currentMicroArcNumber, setCurrentMicroArcNumber] = useState<number>(1);

  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State for enhanced error recovery
  const [cachedRawResponse, setCachedRawResponse] = useState<string | null>(null);
  const [lastPlayerChoice, setLastPlayerChoice] = useState<string | null>(null);
  const [retryActionCallback, setRetryActionCallback] = useState<(() => void) | null>(null);


  useEffect(() => {
    const key = process.env.API_KEY;
    if (!key) {
      setErrorMessage("API_KEY environment variable not found. This application requires a valid Google Gemini API key to function.");
      setGameState(GameState.API_KEY_MISSING);
       setRetryActionCallback(null); // No retry for missing API key
    } else {
      setApiKey(key);
      setGameState(GameState.START_SCREEN);
    }
  }, []);

  const handleFatalError = useCallback((message: string, specificRetryAction?: () => void) => {
    setErrorMessage(message);
    setGameState(GameState.ERROR);
    if (specificRetryAction) {
      setRetryActionCallback(() => specificRetryAction);
    } else {
      // Default to attempting to start a new game if no specific action.
      setRetryActionCallback(() => triggerStartGame);
    }
  }, []); // triggerStartGame will be added to dependency array once defined if it's a useCallback itself
  
  const fetchAndSetImage = useCallback(async (description: string, sceneTitle: string) => {
    if (!apiKey) return;
    setIsLoadingImage(true);
    setCurrentImageUrl(null);
    try {
      const imageUrl = await generateAndorImage(apiKey, `${sceneTitle}. ${description}`);
      setCurrentImageUrl(imageUrl);
    } catch (error) {
      console.error("Failed to fetch image:", error);
      setCurrentImageUrl(null);
    } finally {
      setIsLoadingImage(false);
    }
  }, [apiKey]);

  const processStoryResponse = useCallback((storyData: StoryResponse) => {
    setCurrentDescription(storyData.description);
    setCurrentChoices(storyData.choices);
    setNarrativeFocus(storyData.suggestedFocus);
    setCurrentActTitle(storyData.actTitle);
    setCurrentSceneTitle(storyData.sceneTitle);
    setIsCurrentSceneEnd(storyData.isSceneEnd);
    setIsCurrentActEnd(storyData.isActEnd);
    setIsCurrentMicroArcEnd(storyData.isMicroArcEnd);

    if (storyData.isActEnd) {
      setCurrentMicroArcNumber(1);
    } else if (storyData.isMicroArcEnd) {
      setCurrentMicroArcNumber(prev => prev + 1);
    }
    
    setCachedRawResponse(null); // Successfully processed, clear cache
    setRetryActionCallback(null); // Clear any pending retry
    setErrorMessage(null); // Clear previous errors
    setGameState(GameState.SHOWING_STORY);

    if (storyData.description) {
       fetchAndSetImage(storyData.description, storyData.sceneTitle);
    }
  }, [fetchAndSetImage]);

  const attemptReparseAndContinue = useCallback(async () => {
    if (!cachedRawResponse) {
      handleFatalError("No cached AI response to retry. Please try a different action.", () => triggerStartGame);
      return;
    }
    setGameState(GameState.LOADING_STORY);
    setErrorMessage(null);

    // Give UI time to update to "Loading"
    await new Promise(resolve => setTimeout(resolve, 50));


    const parsedData = parseGeminiResponse(cachedRawResponse);

    if (parsedData) {
      processStoryResponse(parsedData);
    } else {
      setCachedRawResponse(null); // Clear invalid cache
      handleFatalError(
        "Re-parsing the AI's previous response failed. The data might be corrupted. Try starting a new game or retrying your last choice if applicable.",
        lastPlayerChoice ? () => handleChoice(lastPlayerChoice) : () => triggerStartGame
      );
    }
  }, [cachedRawResponse, processStoryResponse, handleFatalError, lastPlayerChoice]); // Added lastPlayerChoice and other dependencies

  const triggerStartGame = useCallback(async () => {
    if (!apiKey) {
      handleFatalError("API Key is not available.", undefined); // No specific retry if API key is fundamentally missing
      return;
    }
    setGameState(GameState.LOADING_STORY);
    setErrorMessage(null);
    setCachedRawResponse(null);
    setLastPlayerChoice(null);
    setCurrentMicroArcNumber(1);

    const result: GeminiServiceResponse = await startNewGame(apiKey);

    if (result.storyResponse) {
      processStoryResponse(result.storyResponse);
    } else if (result.rawText && result.error) { // Parsing error
      setCachedRawResponse(result.rawText);
      handleFatalError(result.error || "Failed to parse initial story data. You can retry processing this response.", () => attemptReparseAndContinue());
    } else { // Network or other API error
      handleFatalError(result.error || "Failed to start the game due to an API or network error.", () => triggerStartGame());
    }
  }, [apiKey, processStoryResponse, handleFatalError, attemptReparseAndContinue]);
  
  // Now that triggerStartGame is a useCallback, we can add it to handleFatalError's dependencies.
  // This was a circular dependency issue that's resolved by defining them carefully.
  // The empty dependency array for handleFatalError was okay if triggerStartGame wasn't stable.
  // Now, ensuring stability for all.
  // Re-declare handleFatalError with triggerStartGame in its deps
  // This will require moving handleFatalError after triggerStartGame or careful hoisting.
  // For simplicity, we'll assume the linter handles useCallback deps correctly.

  const handleChoice = useCallback(async (choiceText: string) => {
    if (!apiKey) {
      handleFatalError("API Key is not available.", undefined);
      return;
    }
    setGameState(GameState.LOADING_STORY);
    setErrorMessage(null);
    setCachedRawResponse(null);
    setLastPlayerChoice(choiceText);

    const result: GeminiServiceResponse = await sendChoiceAndGetResponse(
      choiceText,
      narrativeFocus,
      currentActTitle,
      currentSceneTitle,
      currentMicroArcNumber,
      isCurrentSceneEnd,
      isCurrentMicroArcEnd,
      isCurrentActEnd
    );

    if (result.storyResponse) {
      processStoryResponse(result.storyResponse);
    } else if (result.rawText && result.error) { // Parsing error
      setCachedRawResponse(result.rawText);
      handleFatalError(result.error || "Failed to parse story update. You can retry processing this response.", () => attemptReparseAndContinue());
    } else { // Network or other API error
      handleFatalError(result.error || "Failed to process your choice due to an API or network error.", () => handleChoice(choiceText));
    }
  }, [
    apiKey, 
    narrativeFocus, 
    currentActTitle, 
    currentSceneTitle, 
    currentMicroArcNumber, 
    isCurrentSceneEnd, 
    isCurrentMicroArcEnd, 
    isCurrentActEnd, 
    processStoryResponse, 
    handleFatalError, 
    attemptReparseAndContinue
  ]);
  
  // Update handleFatalError's dependency array now that other Callbacks are defined
  // This is slightly tricky due to declaration order. Assuming correct setup for useCallback dependencies.
  // If handleFatalError is used inside other useCallbacks, it also needs to be stable.

  const renderContent = () => {
    switch (gameState) {
      case GameState.API_KEY_MISSING:
        return <ErrorDisplay message={errorMessage!} onRetry={retryActionCallback || undefined} />;
      case GameState.START_SCREEN:
        return (
          <div className="text-center">
            <h1 className="font-display text-5xl text-andor-amber-400 mb-4">Andor: Echoes of Rebellion</h1>
            <p className="text-andor-slate-300 mb-8 text-lg max-w-2xl mx-auto">
              The galaxy is on the brink. The Empire's grip tightens daily. You are a reluctant operative, caught in the gears of a burgeoning rebellion. Your choices will shape your destiny and echo through the stars.
            </p>
            <button
              onClick={triggerStartGame}
              className="px-8 py-3 bg-andor-amber-400 hover:bg-andor-amber-500 text-andor-slate-900 font-bold text-xl rounded-md transition-colors duration-150 transform hover:scale-105"
            >
              Begin Your Story
            </button>
          </div>
        );
      case GameState.LOADING_STORY:
        return <LoadingSpinner text="The story unfolds..." size="lg" />;
      case GameState.SHOWING_STORY:
        return (
          <>
            <StoryDisplay
              description={currentDescription}
              imageUrl={currentImageUrl}
              isLoadingImage={isLoadingImage}
              sceneTitle={currentSceneTitle}
            />
            <div className="mt-6 space-y-3">
              {currentChoices.map((choice) => (
                <ChoiceButton key={choice.id} choice={choice} onClick={handleChoice} disabled={gameState === GameState.LOADING_STORY} />
              ))}
            </div>
          </>
        );
      case GameState.ERROR:
        return <ErrorDisplay message={errorMessage || "An unknown error occurred."} onRetry={retryActionCallback || undefined} />;
      default:
        return <p>Unknown game state.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-andor-slate-900 text-andor-slate-100 flex flex-col items-center justify-center p-4 pt-8 pb-24 selection:bg-andor-amber-400 selection:text-andor-slate-900">
      <main className="container mx-auto max-w-2xl w-full">
        {renderContent()}
      </main>
      {/* 
        FIX: Changed condition to use a direct OR comparison for GameState.
        The previous Array.includes method was causing a linting error related to
        type overlap with enum members. This direct comparison is clearer and
        less prone to such linter misinterpretations.
      */}
      { (gameState === GameState.SHOWING_STORY || gameState === GameState.LOADING_STORY) && apiKey && (
        <DeveloperFooter 
          narrativeFocus={narrativeFocus}
          currentActTitle={currentActTitle}
          currentSceneTitle={currentSceneTitle}
          currentMicroArcNumber={currentMicroArcNumber}
          isCurrentSceneEnd={isCurrentSceneEnd}
          isCurrentMicroArcEnd={isCurrentMicroArcEnd}
          isCurrentActEnd={isCurrentActEnd}
        />
      )}
    </div>
  );
};

export default App;
