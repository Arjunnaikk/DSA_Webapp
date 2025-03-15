import { ChevronLast } from 'lucide-react';
import React from 'react';

interface MediaPlayerProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (step: number) => void;
  nextStep: () => void;
  isAnimating: boolean;
  state: SortState;
}


interface SortState {
  array: number[];
  currentIndex: number;
  minIndex: number;
  sortedIndices: number[];
  completed: boolean; // Use `completed` instead of `isCompleted`
  initialArray: number[];
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  nextStep,
  state,
  isAnimating
}) => {
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseInt(e.target.value));
  };

  return (
    <div className="w-full max-w-xl ">
      <div className="flex items-center space-x-4">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="px-2 py-1 h-10 w-10 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full focus:outline-none "
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>

        <button
    onClick={nextStep}
    disabled={isAnimating || state.completed || state.sortedIndices.length >= state.array.length || isPlaying}
    className="px-2 py-1 h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 
               text-white rounded-full shadow-md hover:from-blue-600 
               hover:to-blue-700 disabled:opacity-50 
               disabled:cursor-not-allowed"
  >
    <ChevronLast />
  </button>
        
        <div className="flex-1">
          <input 
            type="range"
            min="0"
            max={totalSteps - 1}
            value={currentStep}
            onChange={handleProgressChange}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer 
                     disabled:opacity-50 transition-all duration-200 ease-in-out"
            style={{
              background: `linear-gradient(to right, #3B82F6 ${(currentStep / (totalSteps - 1)) * 100}%, #D1D5DB ${(currentStep / (totalSteps - 1)) * 100}%)`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;