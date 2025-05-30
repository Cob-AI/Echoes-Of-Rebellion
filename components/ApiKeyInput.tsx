import React, { useState } from 'react';

interface ApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSubmit }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = inputKey.trim();
    
    if (!trimmedKey) {
      setError('Please enter an API key');
      return;
    }
    
    if (!trimmedKey.startsWith('AIza')) {
      setError('Invalid key format. Google API keys typically start with "AIza"');
      return;
    }
    
    onSubmit(trimmedKey);
  };

  return (
    <div className="text-center flex flex-col justify-center flex-grow max-w-2xl mx-auto px-4">
      <h1 className="font-display text-4xl sm:text-5xl text-andor-amber-400 mb-4">
        Andor: Echoes of Rebellion
      </h1>
      
      <div className="bg-andor-slate-800 p-6 rounded-lg shadow-xl mb-6">
        <h2 className="text-2xl text-andor-amber-400 mb-4">API Key Required</h2>
        
        <p className="text-andor-slate-200 mb-6">
          This game uses Google's Gemini AI to create your unique story. You'll need your own (free) API key to play.
        </p>
        
        <div className="bg-andor-slate-700 p-4 rounded-md mb-6 text-left">
          <h3 className="text-lg font-semibold text-andor-amber-300 mb-2">Quick Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-andor-slate-200 text-sm">
            <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-andor-amber-400 hover:text-andor-amber-300 underline">Google AI Studio</a></li>
            <li>Click "Get API key" button</li>
            <li>Choose "Create API key in new project" (or select key within existing project)</li>
            <li>Copy the API key that appears</li>
            <li>Paste it below and click "Start Game"</li>
          </ol>
          <p className="mt-3 text-xs text-andor-slate-400">
            Note: Your API key is stored only in your browser session and never sent anywhere except to Google's AI service.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setError('');
              }}
              placeholder="Paste your API key here (AIza...)"
              className="w-full px-4 py-3 bg-andor-slate-900 text-andor-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-andor-amber-400 placeholder-andor-slate-500"
            />
            {error && (
              <p className="text-andor-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full px-6 py-3 bg-andor-amber-400 hover:bg-andor-amber-500 text-andor-slate-900 font-bold text-lg rounded-md transition-colors duration-150 transform hover:scale-105"
          >
            Start Game with My API Key
          </button>
        </form>
        
        <p className="mt-4 text-xs text-andor-slate-400">
          <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer" className="hover:text-andor-amber-400 underline">
            Gemini API Pricing Info
          </a> • Free tier includes 2M tokens/month
        </p>
      </div>
    </div>
  );
};

export default ApiKeyInput;