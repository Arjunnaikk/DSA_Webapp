import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Code, GripHorizontal } from 'lucide-react';

const DraggableCard = ({ showCode, showRuntimeCode, algorithms, currentAlgo, currentLine }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 450, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const newX = Math.max(0, Math.min(e.clientX - offset.current.x, window.innerWidth - cardRef.current.offsetWidth));
      const newY = Math.max(0, Math.min(e.clientY - offset.current.y, window.innerHeight - cardRef.current.offsetHeight));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  };

  if (!showCode) return null;

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        display: showCode ? 'block' : 'none'
      }}
      className="transition-transform duration-200 ease-in-out"
    >
      <Card className="w-96 shadow-xl">
        <div
          className="bg-gray-100 p-2 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Algorithm Code</span>
          </div>
        </div>
        <CardContent className="p-3">
          {showRuntimeCode && (
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <pre className="text-sm overflow-x-auto">
                <code className="text-gray-700">
                  {algorithms[currentAlgo].implementation
                    .split('\n')
                    .map((line, index) => (
                      <div
                        key={index}
                        className={`${
                          currentLine === index
                            ? 'bg-yellow-100 border-l-4 border-yellow-500'
                            : ''
                        } pl-2`}
                      >
                        {line}
                      </div>
                    ))}
                </code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DraggableCard;