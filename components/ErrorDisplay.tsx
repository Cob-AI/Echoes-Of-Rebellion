
import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="p-6 bg-andor-red-500/20 border border-andor-red-500 rounded-lg text-andor-slate-100 max-w-md mx-auto text-center">
      <h3 className="text-xl font-display font-semibold mb-2">Error Encountered</h3>
      <p className="mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-andor-amber-400 hover:bg-andor-amber-500 text-andor-slate-900 font-semibold rounded-md transition-colors duration-150"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
