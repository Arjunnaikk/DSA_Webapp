"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import MediaPlayer from "./MediaPlayer";
import { ChevronFirst, RotateCcw } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";
import DraggableCard from "./DraggableCard";

interface SortState {
  array: number[];
  currentIndex: number;
  comparingIndex: number;
  sortedIndices: number[];
  completed: boolean;
  initialArray: number[];
  currentLine: number;
  animation: string;
}

interface SortingResult {
  message: string;
  originalArray: number[];
  sortedArray: number[];
  totalSteps: number;
}


interface SortStep {
  message: string;
  state: SortState;
  stepNumber: number;
}

interface InsertionSortVizProps {
  array: number[];
  speed: number;
}

const InsertionSortViz: React.FC<InsertionSortVizProps> = ({
  array,
  speed,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [state, setState] = useState<SortState>({
    array: array,
    currentIndex: 0,
    comparingIndex: 0,
    sortedIndices: [0],
    completed: false,
    initialArray: array,
    animation: "",
    currentLine: 0,
  });

  const arrayLength = state.array.length;

  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showRuntimeCode, setShowRuntimeCode] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [countStep, setCountStep] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalSteps, setTotalSteps] = useState(0);
  const [animationDirection, setAnimationDirection] = useState<string>("");

  const currentAlgo = `for i = 1 to length(arr) - 1:
  current = arr[i]
  j = i - 1
  while j >= 0 and arr[j] > current:
      arr[j + 1] = arr[j]
      j = j - 1
  arr[j + 1] = current
  `
      

  const width = 1450;
  const height = 450;
  
  // Constants for visualization
  const barPadding = 5;
  const verticalShift = 120;
  const barWidth = 40;
  const margin = 80;
  const transitionDuration = 800 / (speed || 1);

  useEffect(() => {
    const initializeNewArray = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/api/sort/insertion/init",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              array: array,
            }),
          }
        );

        const newState: SortingResult = await response.json();
        setState((prev) => ({
          ...prev,
          array: newState.originalArray,
          initialArray: newState.originalArray,
          currentIndex: 0,
          comparingIndex: 0,
          sortedIndices: [0],
          completed: false,
          animation: "",
          currentLine: 0,
        }));
        setTotalSteps(newState.totalSteps);
        setAnimationDirection("");
      } catch (error) {
        console.error("Error initializing new array:", error);
      }
    };

    initializeNewArray();
  }, [array]);

  useEffect(() => {
    if (!svgRef.current) return;
  
    const svg = d3.select(svgRef.current);
    
    // Calculate positions and dimensions
    const arrayWidth = state.array.length * (barWidth + barPadding) - barPadding;
    const startX = (width - arrayWidth) / 2;
    
    // Scale for bar heights
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(state.array) * 1.2 || 100])
      .range([0, height - 250]);
    
    // First render - create the structure if it doesn't exist
    if (svg.select('.main-array').empty()) {
      // Clear SVG first
      svg.selectAll("*").remove();
      
      // Create a title for the visualization
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .text("Insertion Sort Animation");
      
      // Create array representation
      svg.append("g")
        .attr("class", "main-array")
        .attr("transform", `translate(${startX}, 50)`);
      
      // Add a horizontal line to separate the main array from the element below
      svg.append("line")
        .attr("class", "separator-line")
        .attr("x1", margin)
        .attr("y1", 50 + verticalShift - 20)
        .attr("x2", width - margin)
        .attr("y2", 50 + verticalShift - 20)
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5");
      
      // Add status text container
      svg.append("text")
        .attr("class", "status-text")
        .attr("x", width / 2)
        .attr("y", height - 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px");
    }
    
    const mainArray = svg.select('.main-array');
    
    // Determine the current phase and active elements
    let sortingPhase = "normal";
    let activeValue = null;
    let activeIdx = null;
    let compareIdx = null;
    let shiftedElements: number[] = [];
    
    // Make a deep copy of data to work with
    let displayData = [...state.array];
    
    if (state.currentIndex > 0) {
      activeIdx = state.currentIndex;
      activeValue = state.array[activeIdx];
      compareIdx = state.comparingIndex;
      
      if (compareIdx >= 0) {
        sortingPhase = 'comparing';
        
        // For visualization, we need to create a modified array
        // that shows the current state correctly
        displayData = [...state.array];
        
        // The key fix: We need to ensure the active element is not duplicated
        // Remove the active element from its original position
        if (activeIdx < displayData.length) {
          // Create a visual gap where the active element would be
          displayData[activeIdx] = null;
        }
        
        // Track which elements need to be shifted right
        // These are elements between the comparison index and the active index
        for (let i = compareIdx + 1; i <= activeIdx; i++) {
          if (i < displayData.length) {
            shiftedElements.push(i);
          }
        }
      }
    } else if (state.completed) {
      sortingPhase = 'done';
    }
    
    // Create a key function that generates unique IDs for data points
    // This ensures stable animations
    const keyFn = (d: any, i: number) => d === null ? `placeholder-${i}` : `element-${d}-${i}`;
    
    // Join data for main array bars
    const bars = mainArray.selectAll("g.bar")
      .data(displayData.map((value, index) => ({ value, index })), 
            d => keyFn(d.value, d.index));
    
    // Remove old elements with smooth fade-out
    bars.exit()
      .transition()
      .duration(transitionDuration / 2)
      .style("opacity", 0)
      .remove();
    
    // Add new elements
    const enterBars = bars.enter()
      .append("g")
      .attr("class", "bar")
      .style("opacity", 0)
      .attr("transform", (d) => `translate(${d.index * (barWidth + barPadding)}, 0)`);
    
    // Add rectangles and text to new elements
    enterBars.each(function(d) {
      const group = d3.select(this);
      
      if (d.value === null) {
        // This is a placeholder for the removed element
        group.append("rect")
          .attr("class", "placeholder-rect")
          .attr("width", barWidth)
          .attr("height", 0) // Start with height 0, will animate
          .attr("y", height - 200)
          .attr("rx", 3)
          .attr("fill", "none")
          .attr("stroke", "#ff6b6b")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,3");
      } else {
        // Regular bar element
        group.append("rect")
          .attr("class", "bar-rect")
          .attr("width", barWidth)
          .attr("height", 0) // Start with height 0, will animate
          .attr("y", height - 200)
          .attr("rx", 3)
          .attr("fill", "#6c5ce7"); // Default color
          
        group.append("text")
          .attr("class", "bar-text")
          .text(d.value)
          .attr("x", barWidth / 2)
          .attr("y", height - 205)
          .attr("text-anchor", "middle")
          .attr("fill", "black")
          .attr("font-size", "14px")
          .attr("font-weight", "bold")
          .style("opacity", 0); // Start invisible
      }
    });
    
    // Merge enter and update selections
    const allBars = bars.merge(enterBars as any);
    
    // Update all elements with smooth transitions
    allBars.transition()
      .duration(transitionDuration)
      .style("opacity", 1)
      .attr("transform", (d) => {
        // If this element has been shifted right, adjust its position
        const isShifted = shiftedElements.includes(d.index);
        const shiftOffset = isShifted ? barWidth + barPadding : 0;
        return `translate(${d.index * (barWidth + barPadding) + shiftOffset}, 0)`;
      });
    
    // Update rectangles and text in all bars
    allBars.each(function(d) {
      const group = d3.select(this);
      
      if (d.value === null) {
        // Update placeholder rectangle
        group.select(".placeholder-rect")
          .transition()
          .duration(transitionDuration)
          .attr("height", activeValue ? yScale(activeValue) : 0)
          .attr("y", activeValue ? height - yScale(activeValue) - 200 : height - 200);
      } else {
        // Determine color based on comparison state
        let fillColor = "#6c5ce7"; // Default
        
        if (d.index === compareIdx) {
          fillColor = "#4ecdc4"; // Element being compared with
        } else if (state.sortedIndices.includes(d.index)) {
          fillColor = "#4ADE80"; // Sorted elements
        } else if (shiftedElements.includes(d.index)) {
          fillColor = "#9381ff"; // Elements that have been shifted right
        }
        
        // Update rectangle
        group.select(".bar-rect")
          .transition()
          .duration(transitionDuration)
          .attr("height", yScale(d.value))
          .attr("y", height - yScale(d.value) - 200)
          .attr("fill", fillColor);
          
        // Update text
        group.select(".bar-text")
          .text(d.value)
          .transition()
          .duration(transitionDuration)
          .attr("y", height - yScale(d.value) - 205)
          .style("opacity", 1);
      }
    });
    
    // Handle the active element being moved
    // This is the element that appears below the array
    const activeElementGroup = svg.selectAll("g.active-element")
      .data(activeValue !== null && sortingPhase === 'comparing' ? [activeValue] : []);
    
    // Remove old active element with animation
    activeElementGroup.exit()
      .transition()
      .duration(transitionDuration / 2)
      .style("opacity", 0)
      .remove();
    
    // Add new active element
    const enterActiveElement = activeElementGroup.enter()
      .append("g")
      .attr("class", "active-element")
      .style("opacity", 0);
    
    // Calculate position for active element
    let activeX = 0;
    if (compareIdx !== null) {
      // Position it according to the comparison index
      activeX = compareIdx * (barWidth + barPadding);
    } else if (activeIdx !== null) {
      // If just moving down, position it below its original index
      activeX = activeIdx * (barWidth + barPadding);
    }
    
    // Setup active element
    enterActiveElement.attr("transform", `translate(${startX + activeX}, ${50})`); // Start at the top
    
    enterActiveElement.append("rect")
      .attr("width", barWidth)
      .attr("height", 0) // Start with height 0
      .attr("y", height - 200)
      .attr("rx", 3)
      .attr("fill", "#ff6b6b");
      
    enterActiveElement.append("text")
      .text(activeValue)
      .attr("x", barWidth / 2)
      .attr("y", height - 205)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .style("opacity", 0);
    
    // Update active element with animations
    const allActiveElements = activeElementGroup.merge(enterActiveElement as any);
    
    allActiveElements.transition()
      .duration(transitionDuration)
      .style("opacity", 1)
      .attr("transform", `translate(${startX + activeX}, ${50 + verticalShift})`);
    
    allActiveElements.select("rect")
      .transition()
      .duration(transitionDuration)
      .attr("height", activeValue ? yScale(activeValue) : 0)
      .attr("y", activeValue ? height - yScale(activeValue) - 200 : height - 200);
      
    allActiveElements.select("text")
      .transition()
      .duration(transitionDuration)
      .attr("y", activeValue ? height - yScale(activeValue) - 205 : height - 205)
      .style("opacity", 1);
    
    // Update status text
    let statusText = "";
    if (sortingPhase === 'comparing' && activeValue !== null && compareIdx !== null) {
      statusText = `Comparing ${activeValue} with ${state.array[compareIdx]} at index ${compareIdx}`;
    } else if (sortingPhase === 'done') {
      statusText = "Sorting complete!";
    } else {
      statusText = `Current index: ${state.currentIndex}`;
    }
    
    svg.select(".status-text")
      .text(statusText)
      .style("opacity", 0)
      .transition()
      .duration(transitionDuration / 2)
      .style("opacity", 1);
      
  }, [state, width, height, speed]);
  

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    const runAnimation = async () => {
      if (isPlaying && !state.completed && !isAnimating) {
        await playStep();
      }
    };

    if (isPlaying) {
      runAnimation();
    }

    if (currentStep === totalSteps - 1 && isPlaying) {
      setCurrentStep(0);
      handlePause();
    }
  }, [isPlaying, countStep, state.completed, isAnimating, currentStep]);

  const playStep = async (): Promise<void> => {
    if (!isAnimating) {
      setIsAnimating(true);
      try {
        const response = await fetch(
          `http://localhost:8080/api/sort/insertion/step/${countStep}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const stepData: SortStep = await response.json();

        setState((prev: SortState) => ({
          ...prev,
          array: stepData.state.array,
          currentIndex: stepData.state.currentIndex,
          comparingIndex: stepData.state.comparingIndex,
          sortedIndices: stepData.state.sortedIndices,
          completed: stepData.state.completed,
          initialArray: stepData.state.initialArray,
          animation: stepData.state.animation,
        }));

        setCurrentStep(countStep);
        await sleep(800 / speed);

        setCountStep((prev) => prev + 1);
      } catch (error) {
        console.error("Error during animation step:", error);
      } finally {
        setIsAnimating(false);
      }
    }
  };

  const nextStep = async (): Promise<void> => {
    if (state.completed || isAnimating) return;
    
    setIsAnimating(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/sort/insertion/step/${countStep}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const stepData: SortStep = await response.json();

      setState((prev: SortState) => ({
        ...prev,
        array: stepData.state.array,
        currentIndex: stepData.state.currentIndex,
        comparingIndex: stepData.state.comparingIndex,
        sortedIndices: stepData.state.sortedIndices,
        completed: stepData.state.completed,
        initialArray: stepData.state.initialArray,
        animation: stepData.state.animation,
      }));

      setCurrentStep(countStep);
      setCountStep((prev) => prev + 1);
    } catch (error) {
      console.error("Error during next step:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  const previousStep = async (): Promise<void> => {
    if (isAnimating || countStep <= 0) return;

    setIsAnimating(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/sort/insertion/step/${countStep - 1}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const stepData: SortStep = await response.json();

      setAnimationDirection(stepData.state.animation);

      setState((prev) => ({
        ...prev,
        array: stepData.state.array,
        currentIndex: stepData.state.currentIndex,
        comparingIndex: stepData.state.comparingIndex,
        sortedIndices: stepData.state.sortedIndices,
        completed: stepData.state.completed,
        initialArray: stepData.state.initialArray,
        animation: stepData.state.animation,
      }));

      setCountStep((prev) => prev - 1);
      setCurrentStep((prev) => prev - 1);
    } catch (error) {
      console.error("Error during previous step:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  const resetSort = async (): Promise<void> => {
    setIsAnimating(true);
    setIsPlaying(false);

    try {
      const response = await fetch(
        "http://localhost:8080/api/sort/insertion/init",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            array: state.initialArray,
          }),
        }
      );

      const newState: SortingResult = await response.json();

      setState((prev) => ({
        ...prev,
        array: newState.originalArray,
        initialArray: newState.originalArray,
        currentIndex: 0,
        comparingIndex: 0,
        sortedIndices: [0],
        completed: false,
        animation: "",
      }));

      setAnimationDirection("");
      setCountStep(0);
      setCurrentStep(0);
    } catch (error) {
      console.error("Error resetting sort:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  const handlePlay = async () => {
    if (currentStep === 0) {
      setCountStep(0);
      await resetSort();
    }
    setIsPlaying(true);
    setCurrentStep(countStep);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleSeek = async (step: number) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/sort/insertion/step/${step}`
      );
      const stepData = await response.json();

      setAnimationDirection(stepData.state.animation);

      setState(stepData.state);
      setCountStep(step);
      setCurrentStep(step);
    } catch (error) {
      console.error("Error during seek:", error);
    } finally {
      setIsAnimating(false);
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg ref={svgRef} width={width} height={height} className="" />

      <div className="flex gap-4 w-full justify-center bottom-0 fixed bg-black py-3 px-5 left-0">
        <button
          onClick={resetSort}
          disabled={isAnimating}
          className="px-2 py-1 h-10 w-10 bg-gradient-to-r from-gray-500 to-gray-600
                     text-white rounded-full shadow-md hover:from-gray-600
                     hover:to-gray-700 disabled:opacity-50
                     disabled:cursor-not-allowed"
        >
          <RotateCcw />
        </button>
        <button
          onClick={previousStep}
          disabled={isAnimating || countStep <= 0 || isPlaying}
          className="px-2 py-1 h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600
                     text-white rounded-full shadow-md hover:from-blue-600
                     hover:to-blue-700 disabled:opacity-50
                     disabled:cursor-not-allowed"
        >
          <ChevronFirst />
        </button>

        <MediaPlayer
          currentStep={currentStep}
          totalSteps={totalSteps}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          nextStep={nextStep}
          isAnimating={isAnimating}
          state={{ ...state, minIndex: -1 }}
        />

        {/* Code Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setShowCode(!showCode)}
              className="h-10 w-21 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <Code className="h-6 w-6 mr-0" />
              Code
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle Code View</p>
          </TooltipContent>
        </Tooltip>
        <DraggableCard
          showCode={showCode}
          showRuntimeCode={showRuntimeCode}
          currentAlgo={currentAlgo}
          currentLine={state.currentLine}
        />
      </div>
    </div>
  );
};

export default InsertionSortViz;





//     for i = 1 to length(arr) - 1:
//         current = arr[i]
//         j = i - 1
//         while j >= 0 and arr[j] > current:
//             arr[j + 1] = arr[j]
//             j = j - 1
//         arr[j + 1] = current

