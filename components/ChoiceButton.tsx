import React from 'react';
import { Choice } from '../types';

interface ChoiceButtonProps {
  choice: Choice;
  onClick: (choiceText: string) => void;
  disabled?: boolean;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ choice, onClick, disabled }) => {
  return (
    <button
      onClick={() => onClick(choice.text)}
      disabled={disabled}
      className="w-full text-left px-4 py-2.5 bg-andor-slate-700 hover:bg-andor-slate-600 text-andor-slate-100 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-andor-amber-400 focus:ring-offset-2 focus:ring-offset-andor-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm sm:text-base"
    >
      {choice.text}
    </button>
  );
};

export default ChoiceButton;