import React, { useState } from 'react';

interface ApiKeyInputProps {
  onSubmit: (geminiKey: string, openaiKey: string | null) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSubmit }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiField, setShowOpenaiField] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedGeminiKey = geminiKey.trim();
    
    if (!trimmedGeminiKey) {
      setError('Please enter a Gemini API key');
      return;
    }
    
    if (!trimmedGeminiKey.startsWith('AIza')) {
      setError('Invalid Gemini key format. Google API keys typically start with "AIza"');
      return;
    }
    
    const trimmedOpenaiKey = openaiKey.trim() || null;
    if (trimmedOpenaiKey && !trimmedOpenaiKey.startsWith('sk-')) {
      setError('Invalid OpenAI key format. OpenAI keys start with "sk-"');
      return;
    }
    
    onSubmit(trimmedGeminiKey, trimmedOpenaiKey);
  };

  return (
    <div className="text-center flex flex-col justify-center flex-grow max-w-2xl mx-auto px-4">
      <h1 className="font-display text-4xl sm:text-5xl text-andor-amber-400 mb-4">
        Andor: Echoes of Rebellion
      </h1>
      
      <div className="bg-andor-slate-800 p-6 rounded-lg shadow-xl mb-6">
        <h2 className="text-2xl text-andor-amber-400 mb-4">Getting Started</h2>
        
        <p className="text-andor-slate-200 mb-6">
          This game uses AI to create your unique Star Wars story. You'll need a Gemini API key for the story generation. Images are included free!
        </p>
        
        <div className="bg-andor-slate-700 p-4 rounded-md mb-6 text-left">
          <h3 className="text-lg font-semibold text-andor-amber-300 mb-2">Quick Setup (1 minute):</h3>
          <ol className="list-decimal list-inside space-y-2 text-andor-slate-200 text-sm">
            <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-andor-amber-400 hover:text-andor-amber-300 underline">Google AI Studio</a></li>
            <li>Click "Get API key" → "Create API key"</li>
            <li>Copy the key and paste it below</li>
            <li>Start playing! (Free AI-generated images included)</li>
          </ol>
          
          <div className="mt-4 p-3 bg-andor-slate-600 rounded text-xs text-andor-slate-300">
            <p className="font-semibold text-andor-amber-300 mb-1">✨ About Images:</p>
            <p>• <strong>Free images</strong> are automatically included using AI generation</p>
            <p>• <strong>Premium images</strong> available with optional OpenAI key ($0.04/image)</p>
            <p className="mt-1 text-andor-slate-400">Your API key is only stored in this browser session.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-andor-amber-300 text-sm mb-1 text-left">
              Gemini API Key <span className="text-andor-red-400">*</span>
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value);
                setError('');
              }}
              placeholder="Paste your key here (AIza...)"
              className="w-full px-4 py-3 bg-andor-slate-900 text-andor-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-andor-amber-400 placeholder-andor-slate-500"
            />
          </div>
          
          {!showOpenaiField ? (
            <button
              type="button"
              onClick={() => setShowOpenaiField(true)}
              className="text-andor-slate-400 hover:text-andor-amber-400 text-sm underline"
            >
              + Add OpenAI key for premium images (optional)
            </button>
          ) : (
            <div>
              <label className="block text-andor-amber-300 text-sm mb-1 text-left">
                OpenAI API Key (Optional - Premium Images)
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => {
                  setOpenaiKey(e.target.value);
                  setError('');
                }}
                placeholder="sk-... (for higher quality images)"
                className="w-full px-4 py-3 bg-andor-slate-900 text-andor-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-andor-amber-400 placeholder-andor-slate-500"
              />
              <button
                type="button"
                onClick={() => {
                  setShowOpenaiField(false);
                  setOpenaiKey('');
                }}
                className="text-andor-slate-400 hover:text-andor-slate-300 text-xs mt-1"
              >
                × Remove premium images
              </button>
            </div>
          )}
          
          {error && (
            <p className="text-andor-red-500 text-sm">{error}</p>
          )}
          
          <button
            type="submit"
            className="w-full px-6 py-3 bg-andor-amber-400 hover:bg-andor-amber-500 text-andor-slate-900 font-bold text-lg rounded-md transition-colors duration-150 transform hover:scale-105"
          >
            Begin Your Story
          </button>
        </form>
        
        <p className="mt-4 text-xs text-andor-slate-400">
          <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer" className="hover:text-andor-amber-400 underline">
            Gemini: Free tier includes 15 requests/minute
          </a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeyInput;