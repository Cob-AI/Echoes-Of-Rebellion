
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
      className="w-full text-left px-4 py-3 my-2 bg-andor-slate-700 hover:bg-andor-slate-500 text-andor-slate-100 rounded-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-andor-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
    >
      {choice.text}
    </button>
  );
};

export default ChoiceButton;
