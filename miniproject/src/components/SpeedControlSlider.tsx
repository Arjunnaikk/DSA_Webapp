// SpeedControlSlider.tsx
import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';

type SpeedControlSliderProps = {
  speed: number;
  setSpeed: (speed: number) => void;
  defaultValue?: number;
};

const SpeedControlSlider = ({
  speed,
  setSpeed,
  defaultValue = 1,
}: SpeedControlSliderProps) => {
  
  
  // Convert logarithmic scale to linear for slider (0.5 to 10)
  const logToLinear = (logValue: number) => {
    const minLog = Math.log(0.5);
    const maxLog = Math.log(10);
    const scale = (Math.log(logValue) - minLog) / (maxLog - minLog);
    return scale * 100;
  };
  
  // Convert linear scale from slider to logarithmic value
  const linearToLog = (linearValue: number) => {
    const minLog = Math.log(0.5);
    const maxLog = Math.log(10);
    const value = linearValue / 100;
    return Math.exp(minLog + value * (maxLog - minLog));
  };
  
  // Initial conversion
  const [sliderValue, setSliderValue] = useState(logToLinear(defaultValue));
  
  const handleSliderChange = (value: number[]) => {
    const linearValue = value[0];
    setSliderValue(linearValue);
    const logValue = linearToLog(linearValue);
    const roundedSpeed = Math.round(logValue * 10) / 10;
    setSpeed(roundedSpeed); // This will update the speed in Function.tsx
  };
  
  // Format the speed for display
  const formatSpeed = (speed: number) => {
    return speed.toFixed(1) + 'x';
  };
  
  useEffect(() => {
    if (defaultValue !== speed) {
      setSpeed(defaultValue);
      setSliderValue(logToLinear(defaultValue));
    }
  }, [defaultValue]);
  
  return (
    <div className={`w-full max-w-xl mx-auto space-y-2`}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">0.5x</span>
        <span className="text-sm font-medium">{formatSpeed(speed)}</span>
        <span className="text-sm text-gray-500">10x</span>
      </div>
      
      <Slider
        min={0}
        max={100}
        step={1}
        value={[sliderValue]}
        onValueChange={handleSliderChange}
      />
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Slower</span>
        <span>Faster</span>
      </div>
    </div>
  );
};

export default SpeedControlSlider;