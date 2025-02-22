"use client"
import SelectionSortViz from '@/components/SelectionSortViz'
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownUp, RefreshCw, Copy } from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import SpeedControlSlider from './SpeedControlSlider';
import InsertionSortViz from '@/components/InsertionSortViz';

const Funtions = () => {
  const [algorithm, setAlgorithm] = useState('selection');
  const [arraySize, setArraySize] = useState('6');
  const [userArray, setUserArray] = useState(Array.from({ length: 6 }, () => Math.floor(Math.random() * 100) + 1).join(', '));  
  const [sortOrder, setSortOrder] = useState('ascending');
  const [shouldSort, setShouldSort] = useState(false);
  const [showVisualization, setShowVisualization] = useState(true); // Start with visualization shown
  const [speed , setSpeed] = useState(1); 
  // const [change , setChange] = useState(false);
  const [currentArray, setCurrentArray] = useState(() => {
  // Initialize with random array on page load
  // const initialSize = 6;
  return userArray.split(',').map(num => parseInt(num.trim()));
});

console.log(shouldSort);


const handleGoClick = async () => {
  // Parse and validate the array
  const newArray = userArray.split(',').map(num => parseInt(num.trim()));
  setCurrentArray(prev => newArray);
  setShowVisualization(true);
  // setChange(true);
};
  let arraySizeCheck = true;

  if(parseInt(arraySize) > 100 || parseInt(arraySize) < 0){
    arraySizeCheck = false;
  }

  const toggleSortOrder = () => {
    setShouldSort(true);
    setSortOrder(sortOrder === 'ascending' ? 'descending' : 'ascending');
  };

  const generateRandomArray = async () => {
    const size = parseInt(arraySize);
    if (!isNaN(size) && size > 0 && size <= 100) {
      const randomArray = Array.from({ length: size }, 
        () => Math.floor(Math.random() * 100) + 1);
      setUserArray(randomArray.join(', '));
      // handleGoClick();
      // setShouldSort(false);
      setCurrentArray(prev => randomArray);
      setShowVisualization(true);
      // setChange(true);
    }
  };

  const duplicateArray = () => {
    if(parseInt(arraySize) < 51){
      if (userArray) {
        setUserArray(`${userArray}, ${userArray}`);
        setShouldSort(false);
      }
    } 
  };

  const handleArrayInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserArray(e.target.value);
    setShouldSort(false);
  };

  const createRandomDuplicates = () => {
    const size = parseInt(arraySize);
    if (!isNaN(size) && size > 0 && size <= 100) {
      const array = Array.from({ length: size }, 
        () => Math.floor(Math.random() * 100) + 1);
      const iterations = Math.floor(Math.random() * array.length) + 1;
      
      for (let i = 0; i < iterations; i++) {
        const pos1 = Math.floor(Math.random() * array.length);
        const pos2 = Math.floor(Math.random() * array.length);
        array[pos2] = array[pos1];
      }
      
      setUserArray(array.join(', '));
      setCurrentArray(array);
      setShouldSort(false);
      setShowVisualization(true);
    }
  };  

  // useEffect(() => {
  //   const initializeNewArray = async () => {
  //     try {
        
  //       if(change){
          
  //         const response = await fetch('http://localhost:8080/api/sorting/selection', {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify({
  //               array: currentArray
  //           })
  //         });

  //         setChange(false);
  //       }
  //     } catch (error) {
  //       console.error('Error initializing new array:', error);
  //     }
  //   };
  
  //   initializeNewArray();
  // }, [change]);

  useEffect(() => {
    if (shouldSort && userArray) {
      const array = userArray.split(',').map(Number);
      const sortedArray = [...array].sort((a, b) => {
        if (sortOrder === 'ascending') {
          return b - a;
        } else {
          return a - b;
        }
      });
      setUserArray(sortedArray.join(', '));
      setShouldSort(false);
      setCurrentArray(sortedArray);
      setShowVisualization(true);
    }
  }, [sortOrder, userArray, shouldSort]);
    
  return (

          <>
          <ModeToggle/>
          <Button 
  variant="outline" 
  onClick={() => setAlgorithm(algorithm === 'selection' ? 'insertion' : 'selection')}
  className='mt-2'
>
  <span className="ml-2">{algorithm === 'selection' ? 'Selection Sort' : 'Insertion Sort'}</span>
</Button>
{showVisualization && (
  algorithm === 'selection' ? (
    <SelectionSortViz 
      key={currentArray.join(',')}
      array={currentArray}
      speed={speed}
    />
  ) : (
    <InsertionSortViz 
      key={currentArray.join(',')}
      array={currentArray}
      speed={speed}
    />
  )
)}

        <div className="space-y-4 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center space-x-2">
            <div className={arraySizeCheck ? 'relative translate-y-1' : 'relative -translate-y-2'}>
              <span className={arraySizeCheck ? 'hidden' : 'text-red-400 text-sm font-small italic'}>Allowed (1-100)</span>
              <Input
                type="number"
                placeholder="Array size"
                value={arraySize}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArraySize(e.target.value)}
                className="w-32"
              />
            </div>

            <Button 
              variant="outline" 
              onClick={generateRandomArray}
              title="Generate Random Array"
              className='mt-2'
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2">Random</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={toggleSortOrder}
              title={`Toggle to ${sortOrder === 'ascending' ? 'Descending' : 'Ascending'} Sort`}
              className='mt-2'
            >
              <ArrowDownUp className="h-4 w-4" />
              <span className="ml-2">{sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)}</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={createRandomDuplicates}
              title="Create Random Duplicates"
              className='mt-2'
            >
              <Copy className="h-4 w-4" />
              <span className="ml-2">Many Duplicates</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter your custom array (e.g. 3, 1, 4, 1, 5, 9)"
              value={userArray}
              onChange={handleArrayInput}
              className="flex-grow"
            />
            <Button 
              variant="outline" 
              onClick={duplicateArray}
              title="Duplicate Array"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              onClick={handleGoClick}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Go
            </Button>
          </div>
        </div>
        <SpeedControlSlider speed = {speed} setSpeed = {setSpeed}/>
      </>
    );
  
};

export default Funtions;













