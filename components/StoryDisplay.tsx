
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface StoryDisplayProps {
  description: string;
  imageUrl: string | null;
  isLoadingImage: boolean;
  sceneTitle: string;
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ description, imageUrl, isLoadingImage, sceneTitle }) => {
  return (
    <div className="bg-andor-slate-800 p-6 rounded-lg shadow-xl mb-6">
      <h2 className="font-display text-2xl text-andor-amber-400 mb-3">{sceneTitle}</h2>
      <div className="mb-4 h-52 sm:h-64 w-full bg-andor-slate-700 rounded flex items-center justify-center overflow-hidden"> {/* Adjusted height for mobile */}
        {isLoadingImage && <LoadingSpinner text="Generating scene visualization..." />}
        {!isLoadingImage && imageUrl && (
          <img src={imageUrl} alt={sceneTitle || 'Scene visual'} className="w-full h-full object-cover" />
        )}
        {!isLoadingImage && !imageUrl && (
          <div className="text-andor-slate-300 p-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-andor-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Visuals currently unavailable. The story continues...
          </div>
        )}
      </div>
      <p className="text-andor-slate-200 leading-relaxed whitespace-pre-line">{description}</p>
    </div>
  );
};

export default StoryDisplay;
