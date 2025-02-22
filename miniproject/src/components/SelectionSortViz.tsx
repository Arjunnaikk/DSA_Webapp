"use client"
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import MediaPlayer from './MediaPlayer';

interface SortState {
  array: number[];
  currentIndex: number;
  minIndex: number;
  sortedIndices: number[];
  isCompleted: boolean;
  initialArray: number[];
}

interface SortingResult {
  message: string;
  originalArray: number[];
  sortedArray: number[];
  totalSteps: number;
}

interface SortStep {
  message: string;
  state: {
    array: number[];
    currentIndex: number;
    minIndex: number;
    sortedIndices: number[];
    initialArray: number[];
    completed: boolean;
  };
  stepNumber: number;
}

interface SelectionSortVizProps {
  array: number[];
  speed: number;
}

const SelectionSortViz: React.FC<SelectionSortVizProps> = ({ array , speed }) => {  const svgRef = useRef<SVGSVGElement | null>(null);
  const [state, setState] = useState<SortState>({
    array: array,
    currentIndex: 0,
    minIndex: 0,
    sortedIndices: [],
    isCompleted: false,
    initialArray: array

  });

  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [comparingIndex, setComparingIndex] = useState<number | null>(null);
  const [swappingPairs, setSwappingPairs] = useState<{from: number, to: number} | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [countStep , setCountStep] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
    // const [sortingSteps, setSortingSteps] = useState<SortStep[]>([]);
  const [totalSteps, setTotalSteps] = useState(0);
  // const [tooltipPosition, setTooltipPosition] = useState({ x: 1300 / 2, y:  500 - 120 + 70});

  const arrayLength = state.array.length;

  const width = 1300;
  const height = 500;
  const margin = { top: (Math.max(...state.initialArray)) <= 75 ? (200 - (Math.max(...state.initialArray) * 1.5)) : 80, right: (642 - (arrayLength * 16)) > 260 ? (642 - (arrayLength * 16)) : 260, bottom: 120, left: (642 - (arrayLength * 16)) > 260 ? (642 - (arrayLength * 16)) : 260 };
  const barPadding = 0.2;
  const tooltipWidth = 480; // Increased fixed width for tooltip
  const tooltipHeight = 29;

const centerX = width / 2;
const buttonY = height - margin.bottom + 70;

console.log(state.array);

// useEffect(() => {
//   const runAnimation = async () => {
//     if (isPlaying && !isAnimating && !state.isCompleted) {

//       // try{

      
//       // nextStep();
      
//       // await sleep(800);
//       setIsAnimating(true);
//       try {
//         const response = await fetch(`http://localhost:8080/api/sorting/step/${countStep}`, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         });

//         const stepData = await response.json();
        
//         // Set comparing index for visual feedback
//         // for (let i = state.currentIndex + 1; i < state.array.length; i++) {
//           const comparisons = [];
//           const current = [];
          
    
//           for (let i = 0; i < arrayLength - 1; i++) {
//               for (let j = i + 1; j < arrayLength; j++) {
//                   comparisons.push(j);
//                   current.push(i);
//               }
//               comparisons.push(0);
//               current.push(i+1);
//               // comparisons.push(0);
//           }
//           // comparisons.pop();
// // Output: [0, 1, 2, 3, 4, 5, 0, 2, 3, 4, 5, 0, 3, 4, 5, 0, 4, 5, 0, 5]
//           setComparingIndex(comparisons[countStep])

//         // Update state with API response
//         setState({
//           array: stepData.state.array,
//           currentIndex: stepData.state.currentIndex,
//           minIndex: stepData.state.minIndex,
//           sortedIndices: stepData.state.sortedIndices,
//           isCompleted: stepData.state.completed,
//           initialArray: stepData.state.initialArray
//         }); 
//         await sleep(2000);
//         console.log(stepData.state.currentIndex ,  comparisons[countStep] , stepData.state.minIndex , countStep);
//         // }
//         setComparingIndex(null);
          
        
//         setCountStep(prev => prev + 1);
//         // setComparingIndex(null);
//         console.log(stepData , countStep);

        
//       } catch (error) {
//         console.error('Error during animation step:', error);
//       } finally {
//         setIsAnimating(false);
//       }
//     }
//   };
//   runAnimation();
// }, [isPlaying, countStep]);


const handlePlay = async () => {
  // Add this check
  // console.log(speed);

  if(currentStep === 0) {
    setCountStep(0);
    await resetSort(); // Ensure state is reset when starting from beginning
  }
  setIsPlaying(true);
  setCurrentStep(countStep);
}

const handlePause = () => {
  setIsPlaying(false);
};

const handleSeek = async (step: number) => {

  const response = await fetch(`http://localhost:8080/api/sort/selection/step/${step}`);
  // console.log(step);
  const stepData = await response.json();
  setState(stepData.state);
  setCountStep(step);
  setCurrentStep(step);

  setIsPlaying(false);
};


useEffect(() => {
  const initializeNewArray = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/sort/selection/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            array: array
        })
      });

      const newState: SortingResult = await response.json();
      setState(prev => ({
        ...prev,
        array: newState.originalArray,
        initialArray: newState.originalArray,
        currentIndex: 0,
        minIndex: 0,
        sortedIndices: [],
        isCompleted: false,

      }));
      setTotalSteps(newState.totalSteps);
      setComparingIndex(null);
      setSwappingPairs(null);
    } catch (error) {
      console.error('Error initializing new array:', error);
    }
  };

  initializeNewArray();
}, [array]);


  useEffect(() => {
    const isComparing = comparingIndex !== null;

    if (!svgRef.current) return;
    
    const svg: d3.Selection<SVGSVGElement, unknown, null, undefined> = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const xScale = d3.scaleBand()
      .domain(state.array.map((_, i) => i.toString()))
      .range([margin.left, width - margin.right])
      .padding(
        arrayLength <= 18 ? 
        barPadding : 0.6 
      );

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(state.array) || 0])
      .range([height - margin.bottom, margin.top]);

    // Create gradient definitions
    const defs = svg.append("defs");
    
    const gradients: Record<string, [string, string]> = {
      default: ["#9CA3AF", "#4B5563"],
      current: ["#60A5FA", "#2563EB"],
      minimum: ["#FB923C", "#EA580C"],
      comparing: ["#FCD34D", "#F59E0B"],
      sorted: ["#4ADE80", "#16A34A"]
    };

    Object.entries(gradients).forEach(([key, [start, end]]) => {
      const gradient = defs.append("linearGradient")
        .attr("id", `gradient-${key}`)
        .attr("gradientTransform", "rotate(90)");

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", start);

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", end);
    });


    // Create bars with data join
    const bars = svg.selectAll<SVGGElement, number>(".bar")
      .data(state.array, (d, i) => `${d}-${i}`);

    // Handle enter selection
    const barsEnter = bars.enter()
      .append("g")
      .attr("class", "bar")
      .attr("transform", (_, i) => `translate(${xScale(i.toString()) || 0}, 0)`);

      barsEnter.append("path")
      .attr("d", (d) => {
        const x = 0;
        const y = yScale(d+2);
        const width = xScale.bandwidth();
        const barHeight = (yScale.range()[0]) - yScale(d+2);
        const radius = 6;
    
        return arrayLength <= 18 ? 
          `
            M ${x + radius} ${y}
            L ${x + width - radius} ${y}
            Q ${x + width} ${y} ${x + width} ${y + radius}
            L ${x + width} ${y + barHeight}
            L ${x} ${y + barHeight}
            L ${x} ${y + radius}
            Q ${x} ${y} ${x + radius} ${y}
            Z
          ` :
          `
            M ${x} ${y}
            L ${x + width} ${y}
            L ${x + width} ${y + barHeight}
            L ${x} ${y + barHeight}
            Z
          `;
      })
      .attr('clip-path', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)');
      
    // Create rectangles in enter selection
    // barsEnter.append("rect")
    //   .attr("y", d => yScale(d))
    //   .attr("width", xScale.bandwidth())
    //   .attr("height", d => height - margin.bottom - yScale(d))
    //   .attr("rx", 8)
    //   .attr('clip-path', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)');

    // Create value labels in enter selection
    if (arrayLength <= 18) {
    barsEnter.append("text")
      .attr("class", "value-label")
      .attr("x", xScale.bandwidth() / 2)
      .attr("y", height - margin.bottom + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#4B5563")
      .attr("font-weight", "600")
      .text(d => d);

    // Create index labels in enter selection
    barsEnter.append("text")
      .attr("class", "index-label")
      .attr("x", xScale.bandwidth() / 2)
      .attr("y", height - margin.bottom + 45)
      .attr("text-anchor", "middle")
      .attr("fill", "#6B7280")
      .attr("font-size", "16px")
      .text((_, i) => i);
    }
    // Merge enter + update selections
    const barsUpdate = barsEnter.merge(bars);

    // Add tooltip container aligned with the button
    const tooltipContainer = svg.append("g")
    .attr("class", "tooltip-container")
    .attr("transform", `translate(${centerX - tooltipWidth/2}, ${buttonY - 14})`)
    .style("opacity", showTooltip ? 1 : 0)  // Removed pointer-events: all    
    .on("mouseleave", () => setShowTooltip(false));

    tooltipContainer.append("rect")
    .attr("width", tooltipWidth)
    .attr("height", tooltipHeight)
    .attr("rx", 8)
    .style("fill", "transparent");  // Make it invisible
    // .style("pointer-events", "all")  // Only this element catches mouse events
    

    tooltipContainer.append("rect")
    .attr("width", tooltipWidth)
    .attr("height", tooltipHeight)
    .attr("rx", 8)
    .attr("fill", "white")
    .attr("stroke", "#E5E7EB")
    .attr("stroke-width", 1)
    .style("pointer-events", "none");
  // Smooth tooltip fade animation
  tooltipContainer.transition()
  .delay(100)
  .duration(200)
  .style("opacity", showTooltip ? 1 : 0);

  const legendData = [
    { label: "Unsorted", gradient: "default" },
    { label: "Current", gradient: "current" },
    { label: "Minimum", gradient: "minimum" },
    { label: "Comparing", gradient: "comparing" },
    { label: "Sorted", gradient: "sorted" }
  ];
  
  const legendWidth = tooltipWidth / legendData.length;
  
  legendData.forEach((item, i) => {
    const legendGroup = tooltipContainer.append("g")
      .attr("transform", `translate(${i * legendWidth + 20}, 10)`);
  
    legendGroup.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("rx", 4)
     
      .attr("y", -3)
      .attr("fill", `url(#gradient-${item.gradient})`);
  
    legendGroup.append("text")
      .attr("x", 22)
      .attr("y", 8)
      .attr("fill", "#4B5563")
      .attr("font-size", "12px")
      .text(item.label);
  });

  // Add toggle button
  const buttonGroup = svg.append("g")
  .attr("class", "button-group")
  .attr("transform", `translate( ${ showTooltip ? centerX - 260 : centerX}, ${buttonY})`)
  .style("cursor", "pointer")
  .on("mouseenter", () => setShowTooltip(true));

// Add transition for button position
buttonGroup.transition()
.duration(200)
.attr("transform", `translate( ${ showTooltip ? centerX - 260 : centerX}, ${buttonY})`);

buttonGroup.append("circle")
.attr("r", 12)
.attr("fill", "white")
.attr("stroke", "#E5E7EB")
.attr("stroke-width", 1);

buttonGroup.append("text")
.attr("x", 0)
.attr("y", 1)
.attr("text-anchor", "middle")
.attr("dominant-baseline", "middle")
.attr("fill", "#4B5563")
.attr("font-size", "14px")
.attr("font-weight", "bold")
.text(">");

    // Handle swapping animation with longer duration
    const getTargetX = (index: number) => {
      if (swappingPairs) {
        if (index === swappingPairs.from) return xScale(swappingPairs.to.toString());
        if (index === swappingPairs.to) return xScale(swappingPairs.from.toString());
      }
      return xScale(index.toString());
    };

    // Update bar positions with slower animation for swaps
    barsUpdate.transition()
      .duration(swappingPairs ? 1000 / speed: 500/ speed) // Longer duration for swaps
      .ease(d3.easeCubicInOut) // Smoother easing for swaps
      .attr("transform", (_, i) => `translate(${getTargetX(i) || 0}, 0)`);

    // Update rectangles with preserved scale animation
    barsUpdate.select("path")
      .transition()
      .duration(500/ speed)
      .attr("y", d => yScale(d))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - margin.bottom - yScale(d))
      .attr("fill", (_, i) => {
        if (state.sortedIndices.includes(i)) return "url(#gradient-sorted)";
        if (i === state.minIndex) return "url(#gradient-minimum)";
        if (i === state.currentIndex) return "url(#gradient-current)";
        if (i === comparingIndex) return "url(#gradient-comparing)";
        return "url(#gradient-default)";
      })
      .style("transform-origin", "center bottom")
      .attr("transform", (_, i) => {
        if ((i === comparingIndex || (i === state.minIndex && isComparing)) && isComparing) {
          const scale = 1.05;
          return `translate(${30.5 * scale}, 0) scale(${scale})`;
        }
        return "scale(1)";
      })
      .style("filter", (_, i) => 
        ((i === comparingIndex || (i === state.minIndex && comparingIndex !== null)) && comparingIndex !== null) ? 
        "brightness(1.1) drop-shadow(0 4px 6px rgba(0,0,0,0.1))" : 
        "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

    // Update labels
    barsUpdate.select(".value-label")
      .transition()
      .duration(swappingPairs ? 1000 : 500)
      .ease(d3.easeCubicInOut)
      .attr("x", xScale.bandwidth() / 2)
      .text(d => d);

    barsUpdate.select(".index-label")
      .transition()
      .duration(swappingPairs ? 1000 / speed : 500 / speed)
      .ease(d3.easeCubicInOut)
      .attr("x", xScale.bandwidth() / 2)
      .text((_, i) => i);

    // Remove any exiting elements
    bars.exit()
      .transition()
      .duration(500 / speed)
      .style("opacity", 0)
      .remove();
  }, [state, comparingIndex, swappingPairs, showTooltip]);

  const sleep = (ms: number): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, ms));

useEffect(() => {
  
  
  const runAnimation = async () => {
    if (isPlaying && !state.isCompleted && !isAnimating) {
      await PlaySteps();
      
      // Matches your sleep duration
    }
  };

  if (isPlaying) {
    runAnimation();
  }

    
  if(currentStep == totalSteps - 1 && isPlaying){
    setCurrentStep(0);
    // resetSort();
    handlePause();
  }

}, [isPlaying, countStep , state.isCompleted, isAnimating , currentStep]);

const PlaySteps = async (): Promise<void> => {
  if (!isAnimating) {
    setIsAnimating(true);
    try {
      const response = await fetch(`http://localhost:8080/api/sort/selection/step/${countStep}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const stepData = await response.json();
        const comparisons = [];
        // const current = [];
        
        for (let i = 0; i < arrayLength - 1; i++) {
            for (let j = i + 1; j < arrayLength; j++) {
                comparisons.push(j);
                // current.push(i);
            }
            comparisons.push(0);
            
            // current.push(i+1);
            // comparisons.push(0);
        }
        comparisons.push(0);
        comparisons.push(0);


          // console.log(comparisons  , "hii");

      const swappingPairsList = [];

      swappingPairsList.push(0);

      for(let j = 0; j < arrayLength - 1 ; j++){
        for(let i = j; i < array.length - 1 ; i++){
          swappingPairsList.push(0);
          
        }
        swappingPairsList.push(1);
        
      }
      swappingPairsList.push(0);

      // console.log(swappingPairsList , stepData.state.currentIndex);

      if(swappingPairsList[countStep] === 1){
        // console.log(state.currentIndex , stepData.state.minIndex);

        if (state.array[state.currentIndex] !== state.array[state.minIndex]) {

          setSwappingPairs({
            from: state.currentIndex,
            to: state.minIndex
          });          
          await sleep(800/ speed); // Longer pause during swap
          setSwappingPairs(null);
        }
      }

        setState((prev: SortState) => ({
          array: stepData.state.array,
          currentIndex: stepData.state.currentIndex,
          minIndex: stepData.state.minIndex,
          sortedIndices: stepData.state.sortedIndices,
          isCompleted: stepData.state.completed,
          initialArray: stepData.state.initialArray
        }));  
        
        if(comparisons[countStep] !== 0){
          setComparingIndex(comparisons[countStep])
        }
        setCurrentStep(prev => countStep);
        await sleep(800/ speed);
        // console.log(stepData.state.currentIndex , stepData.state.minIndex)
      // Update state with API response
      // console.log(comparisons[countStep], swappingPairsList[countStep] , stepData.state.currentIndex , stepData.state.minIndex ,countStep , state.array , stepData.state.array);
      // }

      setComparingIndex(null);
      // await sleep(800);
      setCountStep(prev => prev + 1);

      
      // setComparingIndex(null);
      /// console.log(stepData , countStep);

      
    } catch (error) {
      console.error('Error during animation step:', error);
    } finally {
      setIsAnimating(false);
    }
  }
};

  const nextStep = async (): Promise<void> => {
      
    if (isAnimating || state.isCompleted) return;
    setIsAnimating(true);

    try {
      setCountStep((prev: number) => prev + arrayLength - state.currentIndex);
      setCurrentStep(countStep);
      let minIdx = state.currentIndex;
      
      setState(prev => ({
        ...prev,
        minIndex: minIdx
      }));
      for (let i = state.currentIndex + 1; i < state.array.length; i++) {
        setCurrentStep(prev => prev + 1);
        setComparingIndex(i);
        await sleep(800/ speed);
        
        if (state.array[i] < state.array[minIdx]) {
          minIdx = i;
          setState(prev => ({
            ...prev,
            minIndex: minIdx
          }));
          await sleep(800/ speed);
        }
      }
      setComparingIndex(null);

      const response = await fetch('http://localhost:8080/api/sort/selection/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          array: state.array,
          currentIndex: state.currentIndex,
          reset: false
        })
      });

      const newState: SortState = await response.json();
      

      if (state.array[state.currentIndex] !== state.array[newState.minIndex]) {
        setSwappingPairs({
          from: state.currentIndex,
          to: newState.minIndex
        });
        await sleep(800 / speed); // Longer pause during swap
        setSwappingPairs(null);
      }
      setCurrentStep(prev => prev + 1);
      
      setState(prev => ({
        ...newState,
        minIndex: newState.currentIndex,
        initialArray: [...prev.initialArray], // Use the initialArray to reset
      }));
    } catch (error) {
      console.error('Error during sorting step:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  const previousStep = async (): Promise<void> => {
    if (isAnimating || state.currentIndex <= 0) return;
    setIsAnimating(true);
  
    try {
      // let tempIndex = 0;
      // let tempArray = [...state.initialArray];
      // let currentState: SortState = state;

      // for (tempIndex = 0; tempIndex < state.currentIndex - 1; tempIndex++) {
      
        const response = await fetch(`http://localhost:8080/api/sort/selection/step/${countStep-1}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          
        });
    
        const newState: SortStep = await response.json();
        // tempIndex = currentState.currentIndex;
        // tempArray = currentState.array;
      // }

      if (newState && state.array[state.currentIndex - 1] !== state.array[state.minIndex]) {
        setSwappingPairs({
          from: state.currentIndex - 1,
          to: newState.state.minIndex
        });
        await sleep(800/ speed);
        setSwappingPairs(null);
      }

      if (newState) {
        setState(prev => ({
          array: newState.state.array,
          currentIndex: newState.state.currentIndex,
          minIndex: newState.state.currentIndex,
          sortedIndices: newState.state.sortedIndices,
          isCompleted: newState.state.completed,
          initialArray: newState.state.initialArray
        
        }));

      }
      setComparingIndex(null);

      setCountStep((prev: number) => prev - arrayLength + (state.currentIndex - 1));
      setCurrentStep((prev: number) => prev - arrayLength + (state.currentIndex - 2));
      console.log(countStep)  
    } catch (error) {
      console.error('Error during previous step:', error);
    } finally {
      setIsAnimating(false);
    }
  };  

  const resetSort = async (): Promise<void> => {
    setIsAnimating(true);
    setIsPlaying(false);
    try {
      const response = await fetch('http://localhost:8080/api/sort/selection/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          array: state.initialArray,
          currentIndex: 0,
          reset: true
        })
      });

      const newState: SortState = await response.json();
      
      setState(prev => ({
        ...newState,
        initialArray: [...prev.initialArray], // Use the initialArray to reset
      }));
      setComparingIndex(null);
      setSwappingPairs(null);
      setCountStep(0);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error resetting sort:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <svg 
        ref={svgRef}
        width={width}
        height={height}
        className="bg-white rounded-lg shadow-lg"
      />
      
      <div className="flex gap-4">
        <button
          onClick={previousStep}
          disabled={isAnimating || state.currentIndex <= 0 || isPlaying}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 
                     text-white rounded-lg shadow-md hover:from-blue-600 
                     hover:to-blue-700 disabled:opacity-50 
                     disabled:cursor-not-allowed"
        >
          Previous Step
        </button>
        <button
          onClick={nextStep}
          disabled={isAnimating || state.isCompleted || state.sortedIndices.length >= state.array.length || isPlaying}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 
                     text-white rounded-lg shadow-md hover:from-blue-600 
                     hover:to-blue-700 disabled:opacity-50 
                     disabled:cursor-not-allowed"
        >
          Next Step
        </button>
        <button
          onClick={resetSort}
          // disabled={}
          className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 
                     text-white rounded-lg shadow-md hover:from-gray-600 
                     hover:to-gray-700 disabled:opacity-50 
                     disabled:cursor-not-allowed"
        >
          Reset
        </button>
      </div>
      
      <MediaPlayer 
        currentStep={currentStep}
        totalSteps={totalSteps}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeek={handleSeek}
      />

    </div>
  );
};


export default SelectionSortViz;



























