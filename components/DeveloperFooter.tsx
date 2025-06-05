import React from 'react';

interface DeveloperFooterProps {
  narrativeFocus: string;
  currentActTitle: string;
  currentSceneTitle: string;
  currentMicroArcNumber: number;
  isCurrentSceneEnd: boolean;
  isCurrentMicroArcEnd: boolean;
  isCurrentActEnd: boolean;
}

const DeveloperFooter: React.FC<DeveloperFooterProps> = ({ currentActTitle, currentSceneTitle }) => {
  return (
    <footer className="bg-andor-slate-800/60 px-4 py-2 rounded-lg mt-3 text-center">
      <div className="text-xs text-andor-slate-400">
        <span className="text-andor-amber-400">{currentActTitle}</span>
        <span className="mx-2">•</span>
        <span className="text-andor-slate-300">{currentSceneTitle}</span>
      </div>
    </footer>
  );
};

export default DeveloperFooter;