import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Code2, Copy, Play } from 'lucide-react';

const CodePanel = ({ 
  rightSidebarRef, 
  isCodeOpen, 
  setIsCodeOpen, 
  algorithms, 
  currentAlgo, 
  showRuntimeCode, 
  setShowRuntimeCode, 
  currentLine 
}) => {
  return (
    <div
      ref={rightSidebarRef}
      className={`absolute top-0 right-0 z-5 h-full bg-white border-l border-gray-200 
        transition-all duration-300 shadow-lg ${isCodeOpen ? 'w-96' : 'w-14'} 
        overflow-hidden mb-10`}
      onMouseEnter={() => setIsCodeOpen(true)}
      onMouseLeave={() => setIsCodeOpen(false)}
    >
      <div className="flex flex-col h-full">
        {/* <button
          onClick={() => setIsCodeOpen(!isCodeOpen)}
          className="w-full h-12 flex items-center justify-center text-gray-700 
            hover:bg-gray-50 transition-colors duration-200"
        >
          {isCodeOpen ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button> */}



        {isCodeOpen && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {algorithms[currentAlgo].name}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRuntimeCode(!showRuntimeCode)}
                    className="border hover:border-indigo-500 hover:bg-gray-50 
                      transition-all duration-200"
                  >
                    <Code2 className="h-4 w-4 text-gray-700 mr-2" />
                    {showRuntimeCode ? 'Hide Code' : 'Show Code'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {showRuntimeCode && (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg border-2 border-gray-200 
                    overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 
                      bg-gray-100 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-700">
                      <h2 className='font-bold'>Time Complexity : {algorithms[currentAlgo].timeComplexity} </h2>
                      </span>
                      <div className="flex gap-2">
                        <Button
                          
                          size="sm"
                          className="bg-zinc-800 hover:bg-zinc-600"
                          onClick={() => navigator.clipboard.writeText(
                            algorithms[currentAlgo].implementation
                          )}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <pre className="text-sm p-4 overflow-x-auto">
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
                              } pl-2 transition-colors duration-200`}
                            >
                              {line}
                            </div>
                          ))}
                      </code>
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Explanation
                </h3>
                <div className="text-gray-700">
                  {algorithms[currentAlgo].explaination}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodePanel;