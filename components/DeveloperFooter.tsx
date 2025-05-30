
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

const StatusPill: React.FC<{label: string; value: string | number | boolean}> = ({label, value}) => (
  <span className="mr-3 mb-1 inline-block bg-andor-slate-700 px-2 py-0.5 rounded text-xs">
    <span className="font-semibold text-andor-amber-300">{label}: </span>
    <span className="text-andor-slate-200">{String(value)}</span>
  </span>
);

const DeveloperFooter: React.FC<DeveloperFooterProps> = (props) => {
  return (
    <footer className="bg-andor-slate-800/80 p-2 text-xs text-andor-slate-300 border-t border-andor-slate-700 mt-12"> {/* Removed fixed positioning, added margin-top */}
      <div className="container mx-auto max-w-4xl">
        <p className="font-bold text-andor-amber-400 mb-1">Dev Info:</p>
        <div>
          <StatusPill label="Focus" value={props.narrativeFocus} />
          <StatusPill label="Act" value={props.currentActTitle} />
          <StatusPill label="Scene" value={props.currentSceneTitle} />
          <StatusPill label="Micro-Arc #" value={props.currentMicroArcNumber} />
        </div>
        <div>
          <StatusPill label="Scene End" value={props.isCurrentSceneEnd} />
          <StatusPill label="Micro-Arc End" value={props.isCurrentMicroArcEnd} />
          <StatusPill label="Act End" value={props.isCurrentActEnd} />
        </div>
      </div>
    </footer>
  );
};

export default DeveloperFooter;
