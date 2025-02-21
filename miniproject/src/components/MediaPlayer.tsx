'use client';

interface MediaPlayerProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (step: number) => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
}) => {
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseInt(e.target.value));

  
  };

  // console.log(currentStep, totalSteps);
  return (
    <div className="w-full max-w-xl mx-auto p-4 bg-gray-100 rounded-lg shadow">
      <div className="flex items-center space-x-4">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full focus:outline-none"
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
          
          {/* <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Step {currentStep}</span>
            <span>Total Steps: {totalSteps}</span>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
