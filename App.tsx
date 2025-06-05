import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Choice, StoryResponse } from './types';
import { startNewGame, sendChoiceAndGetResponse, parseGeminiResponse, GeminiServiceResponse } from './services/geminiService';
import { generateAndorImage } from './services/imagenService';
import StoryDisplay from './components/StoryDisplay';
import ChoiceButton from './components/ChoiceButton';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import DeveloperFooter from './components/DeveloperFooter';
import ApiKeyInput from './components/ApiKeyInput';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START_SCREEN);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [openaiApiKey, setOpenaiApiKey] = useState<string | null>(null); 

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

  const [cachedRawResponse, setCachedRawResponse] = useState<string | null>(null);
  const [lastPlayerChoice, setLastPlayerChoice] = useState<string | null>(null);
  const [retryActionCallback, setRetryActionCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Check for API key from environment (for local dev)
    const keyFromImportMeta = import.meta.env.VITE_GEMINI_API_KEY;
    const keyFromProcessEnv = process.env.GEMINI_API_KEY;

    let effectiveApiKey = null;

    if (typeof keyFromImportMeta === 'string' && keyFromImportMeta.trim() !== '') {
      effectiveApiKey = keyFromImportMeta;
    } else if (typeof keyFromProcessEnv === 'string' && keyFromProcessEnv.trim() !== '') {
      effectiveApiKey = keyFromProcessEnv;
    }
    
    if (effectiveApiKey) {
      // Developer mode - has built-in API key
      setApiKey(effectiveApiKey);
      setGameState(GameState.START_SCREEN);
    } else {
      // Production mode - user needs to provide key
      setGameState(GameState.API_KEY_INPUT);
    }
  }, []);

  const handleApiKeySubmit = useCallback((userGeminiKey: string, userOpenaiKey: string | null) => {
    setApiKey(userGeminiKey);
    setOpenaiApiKey(userOpenaiKey);
    setGameState(GameState.START_SCREEN);
  }, []);

  const handleFatalError = useCallback((message: string, specificRetryAction?: () => void) => {
    setErrorMessage(message);
    setGameState(GameState.ERROR);
    if (specificRetryAction) {
      setRetryActionCallback(() => specificRetryAction);
    } else {
      setRetryActionCallback(specificRetryAction ? () => specificRetryAction : () => triggerStartGame);
    }
  }, []); 
  
  const fetchAndSetImage = useCallback(async (description: string, sceneTitle: string) => {
    if (!apiKey) return;
    
    setIsLoadingImage(true);
    setCurrentImageUrl(null);
    try {
      const imagePrompt = gameState === GameState.GAME_OVER_DEFEAT || gameState === GameState.GAME_OVER_VICTORY 
        ? description 
        : `${sceneTitle}. ${description}`;
      
      // Use our hybrid image service
      const { generateGameImage } = await import('./services/imageService');
      const imageUrl = await generateGameImage(imagePrompt, openaiApiKey);
      setCurrentImageUrl(imageUrl);
    } catch (error) {
      console.error("Failed to fetch image:", error);
      setCurrentImageUrl(null);
    } finally {
      setIsLoadingImage(false);
    }
  }, [apiKey, openaiApiKey, gameState]); 

  const processStoryResponse = useCallback((storyData: StoryResponse) => {
    setCurrentDescription(storyData.description);
    setNarrativeFocus(storyData.suggestedFocus);
    setCurrentActTitle(storyData.actTitle);
    setCurrentSceneTitle(storyData.sceneTitle);
    
    setCachedRawResponse(null);
    setRetryActionCallback(null);
    setErrorMessage(null);

    if (storyData.isPlayerDefeated) {
      setGameState(GameState.GAME_OVER_DEFEAT);
      setCurrentChoices([]); 
    } else if (storyData.isGameWon) {
      setGameState(GameState.GAME_OVER_VICTORY);
      setCurrentChoices([]); 
    } else {
      setCurrentChoices(storyData.choices);
      setIsCurrentSceneEnd(storyData.isSceneEnd);
      setIsCurrentActEnd(storyData.isActEnd);
      setIsCurrentMicroArcEnd(storyData.isMicroArcEnd);

      if (storyData.isActEnd) {
        setCurrentMicroArcNumber(1);
      } else if (storyData.isMicroArcEnd) {
        setCurrentMicroArcNumber(prev => prev + 1);
      }
      setGameState(GameState.SHOWING_STORY);
    }

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
    await new Promise(resolve => setTimeout(resolve, 50));
    const parsedData = parseGeminiResponse(cachedRawResponse);

    if (parsedData) {
      processStoryResponse(parsedData);
    } else {
      setCachedRawResponse(null); 
      handleFatalError(
        "Re-parsing the AI's previous response failed. The data might be corrupted. Try starting a new game or retrying your last choice if applicable.",
        lastPlayerChoice ? () => handleChoice(lastPlayerChoice) : () => triggerStartGame
      );
    }
  }, [cachedRawResponse, processStoryResponse, handleFatalError, lastPlayerChoice]); 

  const triggerStartGame = useCallback(async () => {
    if (!apiKey) {
      handleFatalError("API Key is not available.", undefined);
      return;
    }
    setGameState(GameState.LOADING_STORY);
    setErrorMessage(null);
    setCachedRawResponse(null);
    setLastPlayerChoice(null);
    setCurrentMicroArcNumber(1);
    setCurrentImageUrl(null); 

    const result: GeminiServiceResponse = await startNewGame(apiKey);

    if (result.storyResponse) {
      processStoryResponse(result.storyResponse);
    } else if (result.rawText && result.error) { 
      setCachedRawResponse(result.rawText);
      handleFatalError(result.error || "Failed to parse initial story data. You can retry processing this response.", () => attemptReparseAndContinue());
    } else { 
      handleFatalError(result.error || "Failed to start the game due to an API or network error.", () => triggerStartGame());
    }
  }, [apiKey, processStoryResponse, handleFatalError, attemptReparseAndContinue]);
  
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
    } else if (result.rawText && result.error) { 
      setCachedRawResponse(result.rawText);
      handleFatalError(result.error || "Failed to parse story update. You can retry processing this response.", () => attemptReparseAndContinue());
    } else { 
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
  
  const renderEndScreenBase = (title: string, titleColor: string) => (
    <div className="text-center flex flex-col justify-center flex-grow items-center p-4 sm:p-6 bg-andor-slate-800 rounded-lg shadow-xl animate-fadeIn">
      <h1 className={`font-display text-3xl sm:text-4xl ${titleColor} mb-4 sm:mb-6`}>{title}</h1>
      
      <div className="mb-4 h-52 sm:h-64 w-full max-w-lg bg-andor-slate-700 rounded flex items-center justify-center overflow-hidden">
        {isLoadingImage && <LoadingSpinner text="Loading final image..." />}
        {!isLoadingImage && currentImageUrl && (
          <img src={currentImageUrl} alt="Final scene" className="w-full h-full object-cover" />
        )}
        {!isLoadingImage && !currentImageUrl && (
          <div className="text-andor-slate-300 p-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-andor-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            The final scene remains unvisualized.
          </div>
        )}
      </div>
      
      <p className="text-andor-slate-200 mb-6 sm:mb-8 text-base sm:text-lg max-w-xl mx-auto whitespace-pre-line leading-relaxed">
        {currentDescription}
      </p>
      <button
        onClick={triggerStartGame}
        aria-label="Play Again"
        className="px-6 py-3 sm:px-8 sm:py-3 bg-andor-amber-400 hover:bg-andor-amber-500 text-andor-slate-900 font-bold text-lg sm:text-xl rounded-md transition-colors duration-150 transform hover:scale-105 self-center"
      >
        Play Again?
      </button>
    </div>
  );

  const renderContent = () => {
    switch (gameState) {
      case GameState.API_KEY_INPUT:
        return <ApiKeyInput onSubmit={handleApiKeySubmit} />;
      case GameState.API_KEY_MISSING:
        return <ErrorDisplay message={errorMessage!} onRetry={retryActionCallback || undefined} />;
      case GameState.START_SCREEN:
        return (
          <div className="text-center flex flex-col justify-center flex-grow">
            <h1 className="font-display text-4xl sm:text-5xl text-andor-amber-400 mb-4">Andor: Echoes of Rebellion</h1>
            <p className="text-andor-slate-300 mb-8 text-md sm:text-lg max-w-2xl mx-auto">
              The galaxy is on the brink. The Empire's grip tightens daily. You are a reluctant operative, caught in the gears of a burgeoning rebellion. Your choices will shape your destiny and echo through the stars.
            </p>
            <button
              onClick={triggerStartGame}
              aria-label="Begin Your Story"
              className="px-8 py-3 bg-andor-amber-400 hover:bg-andor-amber-500 text-andor-slate-900 font-bold text-xl rounded-md transition-colors duration-150 transform hover:scale-105 self-center"
            >
              Begin Your Story
            </button>
          </div>
        );
      case GameState.LOADING_STORY:
        return <div className="flex-grow flex items-center justify-center"><LoadingSpinner text="The story unfolds..." size="lg" /></div>;
      case GameState.SHOWING_STORY:
        return (
          <>
          <StoryDisplay
            description={currentDescription}
            imageUrl={currentImageUrl}
            isLoadingImage={isLoadingImage}
            sceneTitle={currentSceneTitle}
          />
          <div className="mt-2 flex flex-col gap-1">
            {currentChoices.map((choice) => (
              <ChoiceButton key={choice.id} choice={choice} onClick={handleChoice} disabled={gameState === GameState.LOADING_STORY} />
            ))}
          </div>
        </>
        );
      case GameState.ERROR:
        return <div className="flex-grow flex items-center justify-center"><ErrorDisplay message={errorMessage || "An unknown error occurred."} onRetry={retryActionCallback || undefined} /></div>;
      
      case GameState.GAME_OVER_DEFEAT:
        return renderEndScreenBase("Your Echo Fades...", "text-andor-red-500");

      case GameState.GAME_OVER_VICTORY:
        return renderEndScreenBase("A Legacy Forged in Rebellion!", "text-andor-amber-400");

      default:
        return <p className="flex-grow flex items-center justify-center">Unknown game state.</p>;
    }
  };

  const relevantStatesForFooter: GameState[] = [GameState.SHOWING_STORY, GameState.LOADING_STORY];
  const shouldDisplayDeveloperFooter =
    !!apiKey && relevantStatesForFooter.includes(gameState);

  return (
    <div className="min-h-screen bg-andor-slate-900 text-andor-slate-100 flex flex-col items-center p-4 pt-6 sm:pt-8 pb-8 selection:bg-andor-amber-400 selection:text-andor-slate-900 overflow-x-hidden">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
      <main className="container mx-auto max-w-2xl w-full flex flex-col flex-grow pb-8">
        {renderContent()}
        { shouldDisplayDeveloperFooter && (
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
      </main>
    </div>
  );
};

export default App;