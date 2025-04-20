"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { ChevronFirst, RotateCcw, Code } from "lucide-react";
import MediaPlayer from "./MediaPlayer";
import DraggableCard from "./DraggableCard";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { Button } from "@/components/ui/button";

interface SearchState {
  array: number[];
  low: number;
  mid: number;
  high: number;
  foundIndex: number | null;
  searchValue: number;
  completed: boolean;
  steps: number;
  currentLine: number;
}

interface BinarySearchVizProps {
  array: number[];
  speed: number;
}

const BinarySearchViz: React.FC<BinarySearchVizProps> = ({ array, speed }) => {
  // Ensure array is sorted for binary search - only do this once
  const [sortedArray] = useState(() => [...array].sort((a, b) => a - b));
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [state, setState] = useState<SearchState>({
    array: sortedArray,
    low: 0,
    mid: -1,
    high: sortedArray.length - 1,
    foundIndex: null,
    searchValue: sortedArray[Math.floor(Math.random() * sortedArray.length)], // Set initial search value
    completed: false,
    steps: 0,
    currentLine: 0
  });

  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalSteps, setTotalSteps] = useState(Math.ceil(Math.log2(sortedArray.length)) + 1);

  const currentAlgo = `function binarySearch(arr, x) {
  let low = 0;
  let high = arr.length - 1;
  
  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    
    if (arr[mid] === x) {
      return mid;    // Found x at index mid
    }
    
    if (arr[mid] < x) {
      low = mid + 1; // x is in right half
    } else {
      high = mid - 1; // x is in left half
    }
  }
  
  return -1;         // x not found in array
}`;

  const width = 1450;
  const height = 450;
  const margin = {
    top: 80,
    right: 100,
    bottom: 160,
    left: 100,
  };
  
  const tooltipWidth = 480;
  const tooltipHeight = 29;
  const boxSize = Math.min(60, (width - margin.left - margin.right) / sortedArray.length);
  
  const explainLines = [
    "Initializing search for value " + state.searchValue,
    `Checking if ${state.mid >= 0 ? state.array[state.mid] : ''} equals ${state.searchValue}`,
    `Found ${state.searchValue} at index ${state.foundIndex}!`,
    `${state.searchValue} not found in the array`,
    `${state.array[state.mid]} < ${state.searchValue}, searching right half`,
    `${state.array[state.mid]} > ${state.searchValue}, searching left half`
  ];

  const centerX = width / 2;
  const buttonY = height - margin.bottom + 70;

  // Initialize the search once - this replaces the useEffect dependent on sortedArray
  // to prevent unnecessary re-initialization
  useEffect(() => {
    // Total steps calculation is moved here to avoid unnecessary updates
    setTotalSteps(Math.ceil(Math.log2(sortedArray.length)) + 1);
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    if (!svgRef.current) return;
  
    const svg: d3.Selection<SVGSVGElement, unknown, null, undefined> =
      d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const boxContainer = svg.append("g")
      .attr("class", "box-container")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    // Calculate total width needed for all boxes
    const totalBoxWidth = state.array.length * boxSize;
    // Center the boxes horizontally
    const offsetX = (width - margin.left - margin.right - totalBoxWidth) / 2;
    
    // Current search range highlight
    if (state.mid >= 0) {
      const searchRangeWidth = (state.high - state.low + 1) * boxSize;
      const searchRangeX = offsetX + state.low * boxSize;
      
      boxContainer.append("rect")
        .attr("x", searchRangeX)
        .attr("y", -10)
        .attr("width", searchRangeWidth)
        .attr("height", boxSize + 20)
        .attr("rx", 8)
        .attr("fill", "#E5E7EB")
        .attr("opacity", 0.5);
    }
    
    // Draw boxes for each array element
    state.array.forEach((value, index) => {
      const x = offsetX + index * boxSize;
      const boxGroup = boxContainer.append("g")
        .attr("transform", `translate(${x}, 0)`);
      
      // Determine box color based on search state
      let boxFill = "#F9FAFB"; // default
      let borderColor = "#D1D5DB"; // default border
      let textColor = "#4B5563"; // default text
      
      if (state.foundIndex === index) {
        boxFill = "#DCFCE7";
        borderColor = "#16A34A";
        textColor = "#166534";
      } else if (index === state.mid) {
        boxFill = "#DBEAFE";
        borderColor = "#2563EB";
        textColor = "#1E40AF";
      } else if (index >= state.low && index <= state.high && state.mid >= 0) {
        boxFill = "#F3F4F6";
        borderColor = "#9CA3AF";
      } else if (state.mid >= 0) {
        // Excluded from search range
        boxFill = "#F9FAFB";
        borderColor = "#E5E7EB";
        textColor = "#9CA3AF";
      }
      
      // Box
      boxGroup.append("rect")
        .attr("width", boxSize)
        .attr("height", boxSize)
        .attr("rx", 4)
        .attr("fill", boxFill)
        .attr("stroke", borderColor)
        .attr("stroke-width", index === state.mid ? 2 : 1)
        .style("filter", index === state.mid ? "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" : "none");
      
      // Value text
      boxGroup.append("text")
        .attr("x", boxSize / 2)
        .attr("y", boxSize / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", index === state.mid ? "bold" : "normal")
        .attr("fill", textColor)
        .text(value);
      
      // Index text below
      boxGroup.append("text")
        .attr("x", boxSize / 2)
        .attr("y", boxSize + 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#6B7280")
        .text(index);
    });
    
    // Add arrows or indicators for low, mid, high
    if (state.mid >= 0) {
      const arrowSize = 8;
      const indicators = [
        { label: "low", index: state.low, color: "#059669" },
        { label: "mid", index: state.mid, color: "#2563EB" },
        { label: "high", index: state.high, color: "#DC2626" }
      ];
      
      indicators.forEach(indicator => {
        const x = offsetX + indicator.index * boxSize + boxSize / 2;
        
        // Arrow pointing to the box
        const arrowGroup = boxContainer.append("g")
          .attr("transform", `translate(${x}, ${boxSize + 30})`);
        
        arrowGroup.append("path")
          .attr("d", `M0,0 L${-arrowSize},${arrowSize} L${arrowSize},${arrowSize} Z`)
          .attr("fill", indicator.color);
        
        // Label text
        arrowGroup.append("text")
          .attr("x", 0)
          .attr("y", arrowSize + 15)
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .attr("font-weight", "bold")
          .attr("fill", indicator.color)
          .text(indicator.label);
      });
    }
    
    // Split visualization - lines showing division
    if (state.mid >= 0 && !state.completed) {
      const midX = offsetX + state.mid * boxSize + boxSize / 2;
      const splitLineHeight = 120;
      
      boxContainer.append("line")
        .attr("x1", midX)
        .attr("y1", boxSize + 60)
        .attr("x2", midX)
        .attr("y2", boxSize + splitLineHeight)
        .attr("stroke", "#2563EB")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2");
        
      // Add left half label if searching in left half
      if (state.array[state.mid] > state.searchValue) {
        boxContainer.append("text")
          .attr("x", offsetX + (state.low + state.mid) * boxSize / 2)
          .attr("y", boxSize + splitLineHeight + 20)
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .attr("fill", "#4B5563")
          .text("Search Here Next");
      }
      
      // Add right half label if searching in right half
      if (state.array[state.mid] < state.searchValue) {
        boxContainer.append("text")
          .attr("x", offsetX + (state.mid + 1 + state.high) * boxSize / 2)
          .attr("y", boxSize + splitLineHeight + 20)
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .attr("fill", "#4B5563")
          .text("Search Here Next");
      }
    }
  
    // Add tooltip container aligned with the button
    const tooltipContainer = svg
      .append("g")
      .attr("class", "tooltip-container")
      .attr(
        "transform",
        `translate(${centerX - tooltipWidth / 2}, ${buttonY - 14})`
      )
      .style("opacity", showTooltip ? 1 : 0)
      .on("mouseleave", () => setShowTooltip(false));
  
    tooltipContainer
      .append("rect")
      .attr("width", tooltipWidth)
      .attr("height", tooltipHeight)
      .attr("rx", 8)
      .style("fill", "transparent");
  
    tooltipContainer
      .append("rect")
      .attr("width", tooltipWidth)
      .attr("height", tooltipHeight)
      .attr("rx", 8)
      .attr("fill", "white")
      .attr("stroke", "#E5E7EB")
      .attr("stroke-width", 1)
      .style("pointer-events", "none");
  
    // Smooth tooltip fade animation
    tooltipContainer
      .transition()
      .delay(100)
      .duration(200)
      .style("opacity", showTooltip ? 1 : 0);
  
    const legendData = [
      { label: "Excluded", color: "#F9FAFB", textColor: "#9CA3AF" },
      { label: "Search Range", color: "#F3F4F6", textColor: "#4B5563" },
      { label: "Mid Element", color: "#DBEAFE", textColor: "#1E40AF" },
      { label: "Found", color: "#DCFCE7", textColor: "#166534" },
    ];
  
    const legendWidth = tooltipWidth / legendData.length;
  
    legendData.forEach((item, i) => {
      const legendGroup = tooltipContainer
        .append("g")
        .attr("transform", `translate(${i * legendWidth + 20}, 10)`);
  
      legendGroup
        .append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("rx", 4)
        .attr("y", -3)
        .attr("fill", item.color)
        .attr("stroke", i === 0 ? "#E5E7EB" : i === 1 ? "#9CA3AF" : i === 2 ? "#2563EB" : "#16A34A")
        .attr("stroke-width", 1);
  
      legendGroup
        .append("text")
        .attr("x", 22)
        .attr("y", 8)
        .attr("fill", "#4B5563")
        .attr("font-size", "12px")
        .text(item.label);
    });
  
    // Define the search value info position
    const infoY = buttonY + 30;
  
    // Create search value indicator
    const searchValueGroup = svg.append("g")
      .attr("class", "search-value-indicator")
      .attr("transform", `translate(${centerX - 70}, ${infoY + 25})`);
  
    searchValueGroup.append("text")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .attr("fill", "#36454F")
      .text(`Searching for: ${state.searchValue}`);
  
    // Add toggle button for legend
    const buttonGroup = svg
      .append("g")
      .attr("class", "button-group")
      .attr(
        "transform",
        `translate(${showTooltip ? centerX - 260 : centerX}, ${buttonY})`
      )
      .style("cursor", "pointer")
      .on("mouseenter", () => setShowTooltip(true));
  
    // Add transition for button position
    buttonGroup
      .transition()
      .duration(200)
      .attr(
        "transform",
        `translate(${showTooltip ? centerX - 260 : centerX}, ${buttonY})`
      );
  
    buttonGroup
      .append("circle")
      .attr("r", 12)
      .attr("fill", "white")
      .attr("stroke", "#E5E7EB")
      .attr("stroke-width", 1);
  
    buttonGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 1)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#4B5563")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text(">");
  }, [state, showTooltip]); // Removed speed from dependencies to reduce renders

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Use a ref to track animation status to avoid state updates during updates
  const animationRef = useRef({
    isPlaying: false,
    isAnimating: false
  });

  useEffect(() => {
    // Update ref when state changes
    animationRef.current.isPlaying = isPlaying;
    animationRef.current.isAnimating = isAnimating;

    // Cleanup function to handle component unmount
    let isMounted = true;

    // Start animation loop if playing
    const runAnimation = async () => {
      if (!isMounted) return;
      
      if (animationRef.current.isPlaying && !state.completed && !animationRef.current.isAnimating) {
        await playNextStep();
      }
      
      // Continue animation loop if still playing and component is mounted
      if (isMounted && animationRef.current.isPlaying && !state.completed) {
        setTimeout(runAnimation, 100); // Use setTimeout instead of requestAnimationFrame for better control
      }
    };

    if (isPlaying && !state.completed) {
      runAnimation();
    }

    // Stop playing if completed
    if (state.completed && isPlaying) {
      setIsPlaying(false);
    }

    // Cleanup on unmount or dependency change
    return () => {
      isMounted = false;
    };
  }, [isPlaying, state.completed]);

  const handlePlay = async () => {
    if (currentStep === 0 || state.completed) {
      await resetSearch();
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleSeek = async (step: number) => {
    // Prevent seeking during animation
    if (isAnimating) return;
    
    setIsPlaying(false);
    setIsAnimating(true);
    
    try {
      // Reset if seeking to beginning
      if (step === 0) {
        await resetSearch();
        setCurrentStep(0);
        setIsAnimating(false);
        return;
      }
      
      // Reset and then advance to the requested step
      await resetSearch(false);
      
      let low = 0;
      let high = state.array.length - 1;
      let stepCounter = 0;
      
      while (stepCounter < step && low <= high) {
        const mid = Math.floor((low + high) / 2);
        stepCounter++;
        
        // Check if found
        if (state.array[mid] === state.searchValue) {
          setState(prev => ({
            ...prev,
            low,
            mid,
            high,
            foundIndex: mid,
            completed: true,
            steps: stepCounter,
            currentLine: 2
          }));
          setCurrentStep(stepCounter);
          break;
        } 
        // Value is in right half
        else if (state.array[mid] < state.searchValue) {
          setState(prev => ({
            ...prev,
            low: mid + 1,
            mid,
            high,
            steps: stepCounter,
            currentLine: 4
          }));
          low = mid + 1;
        } 
        // Value is in left half
        else {
          setState(prev => ({
            ...prev,
            low,
            mid,
            high: mid - 1,
            steps: stepCounter,
            currentLine: 5
          }));
          high = mid - 1;
        }
        
        // If this is the final step or value not found
        if (low > high) {
          setState(prev => ({
            ...prev,
            low,
            mid,
            high,
            completed: true,
            steps: stepCounter,
            currentLine: 3
          }));
        }
        
        // If we've reached our target step, calculate the mid
        if (stepCounter === step && low <= high) {
          const nextMid = Math.floor((low + high) / 2);
          setState(prev => ({
            ...prev,
            mid: nextMid
          }));
        }
      }
      
      setCurrentStep(Math.min(step, stepCounter));
    } catch (error) {
      console.error("Error during seek:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  const playNextStep = async (): Promise<void> => {
    // Use ref to check if already animating
    if (animationRef.current.isAnimating || state.completed) return;
    
    setIsAnimating(true);
    animationRef.current.isAnimating = true;

    try {
      // Calculate next mid point if first step
      if (state.mid === -1) {
        const mid = Math.floor((state.low + state.high) / 2);
        setState(prev => ({
          ...prev,
          mid,
          steps: prev.steps + 1,
          currentLine: 1
        }));
        setCurrentStep(prev => prev + 1);
        await sleep(800 / (speed || 1));
        setIsAnimating(false);
        animationRef.current.isAnimating = false;
        return;
      }
      
      // Check if we found the value
      if (state.array[state.mid] === state.searchValue) {
        setState(prev => ({
          ...prev,
          foundIndex: prev.mid,
          completed: true,
          steps: prev.steps + 1,
          currentLine: 2
        }));
        setCurrentStep(prev => prev + 1);
        setIsPlaying(false);
      } 
      // Value is in right half
      else if (state.array[state.mid] < state.searchValue) {
        const newLow = state.mid + 1;
        const newHigh = state.high;
        
        // Check if search space is exhausted
        if (newLow > newHigh) {
          setState(prev => ({
            ...prev,
            low: newLow,
            high: newHigh,
            completed: true,
            steps: prev.steps + 1,
            currentLine: 3
          }));
          setCurrentStep(prev => prev + 1);
          setIsPlaying(false);
        } else {
          const newMid = Math.floor((newLow + newHigh) / 2);
          setState(prev => ({
            ...prev,
            low: newLow,
            mid: newMid,
            steps: prev.steps + 1,
            currentLine: 4
          }));
          setCurrentStep(prev => prev + 1);
        }
      } 
      // Value is in left half
      else {
        const newLow = state.low;
        const newHigh = state.mid - 1;
        
        // Check if search space is exhausted
        if (newLow > newHigh) {
          setState(prev => ({
            ...prev,
            low: newLow,
            high: newHigh,
            completed: true,
            steps: prev.steps + 1,
            currentLine: 3
          }));
          setCurrentStep(prev => prev + 1);
          setIsPlaying(false);
        } else {
          const newMid = Math.floor((newLow + newHigh) / 2);
          setState(prev => ({
            ...prev,
            high: newHigh,
            mid: newMid,
            steps: prev.steps + 1,
            currentLine: 5
          }));
          setCurrentStep(prev => prev + 1);
        }
      }

      await sleep(800 / (speed || 1));
    } catch (error) {
      console.error("Error during search step:", error);
    } finally {
      setIsAnimating(false);
      animationRef.current.isAnimating = false;
    }
  };

  const previousStep = async (): Promise<void> => {
    if (isAnimating || currentStep <= 1) return;
    
    setIsAnimating(true);
    try {
      // We'll use a simpler approach - just go back to the previous step
      // Reset to beginning and replay up to previous step
      const targetStep = currentStep - 1;
      
      // Store the current search value
      const currentSearchValue = state.searchValue;
      
      // Reset the state
      setState(prev => ({
        ...prev,
        low: 0,
        mid: -1,
        high: sortedArray.length - 1,
        foundIndex: null,
        completed: false,
        steps: 0,
        currentLine: 0
      }));
      
      // Wait a moment for the reset to apply
      await sleep(100);
      
      if (targetStep === 0) {
        setCurrentStep(0);
      } else {
        // Perform binary search up to the target step
        let low = 0;
        let high = sortedArray.length - 1;
        let stepCounter = 0;
        
        while (stepCounter < targetStep && low <= high) {
          stepCounter++;
          const mid = Math.floor((low + high) / 2);
          
          // Check if value is found
          if (sortedArray[mid] === currentSearchValue) {
            setState({
              array: sortedArray,
              low,
              mid,
              high,
              foundIndex: mid,
              searchValue: currentSearchValue,
              completed: true,
              steps: stepCounter,
              currentLine: 2
            });
            break;
          }
          // If value is in right half
          else if (sortedArray[mid] < currentSearchValue) {
            low = mid + 1;
            setState({
              array: sortedArray,
              low,
              mid,
              high,
              foundIndex: null,
              searchValue: currentSearchValue,
              completed: false,
              steps: stepCounter,
              currentLine: 4
            });
          }
          // If value is in left half
          else {
            high = mid - 1;
            setState({
              array: sortedArray,
              low,
              mid,
              high,
              foundIndex: null,
              searchValue: currentSearchValue,
              completed: false,
              steps: stepCounter, 
              currentLine: 5
            });
          }
          
          // If search space is exhausted
          if (low > high) {
            setState({
              array: sortedArray,
              low,
              mid,
              high,
              foundIndex: null,
              searchValue: currentSearchValue,
              completed: true,
              steps: stepCounter,
              currentLine: 3
            });
          }
        }
        
        setCurrentStep(targetStep);
      }
    } catch (error) {
      console.error("Error during previous step:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  const resetSearch = async (resetUI = true): Promise<void> => {
    setIsAnimating(true);
    setIsPlaying(false);

    try {
      if (resetUI) {
        // Generate a new random search value
        const randomIndex = Math.floor(Math.random() * sortedArray.length);
        const searchValue = sortedArray[randomIndex];
        
        setState({
          array: sortedArray,
          low: 0,
          mid: -1,
          high: sortedArray.length - 1,
          foundIndex: null,
          searchValue: searchValue,
          completed: false,
          steps: 0,
          currentLine: 0
        });
      } else {
        // Just reset the search progress, keep the search value
        setState(prev => ({
          ...prev,
          low: 0,
          mid: -1,
          high: sortedArray.length - 1,
          foundIndex: null,
          completed: false,
          steps: 0,
          currentLine: 0
        }));
      }
      
      setCurrentStep(0);
      await sleep(300 / (speed || 1));
    } catch (error) {
      console.error("Error resetting search:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg ref={svgRef} width={width} height={height} className="" />
      </div>
      <div className="absolute bottom-[15vh] bg-white p-2 rounded-lg shadow-md my-auto">
        {isPlaying || state.mid >= 0 ? (
          <p>{
            state.currentLine === 0 ? explainLines[0] : 
            state.currentLine === 1 ? explainLines[1] : 
            state.currentLine === 2 ? explainLines[2] : 
            state.currentLine === 3 ? explainLines[3] :
            state.currentLine === 4 ? explainLines[4] :
            explainLines[5]
          }</p>
        ) : (
          <p></p>
        )}
      </div>
      <div className="flex gap-4 w-full justify-center bottom-0 fixed bg-black py-3 px-5 left-0">
        <button
          onClick={() => resetSearch()}
          className="px-2 py-1 h-10 w-10 bg-gradient-to-r from-gray-500 to-gray-600
                     text-white rounded-full shadow-md hover:from-gray-600
                     hover:to-gray-700 disabled:opacity-50
                     disabled:cursor-not-allowed"
        >
          <RotateCcw />
        </button>
        <button
          onClick={previousStep}
          disabled={isAnimating || currentStep <= 1 || isPlaying}
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
          nextStep={playNextStep}
          isAnimating={isAnimating}
          state={{
            array: state.array,
            currentIndex: state.mid,
            minIndex: 0,
            sortedIndices: [],
            completed: state.completed,
            initialArray: state.array
          }}
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
          showRuntimeCode={true}
          currentAlgo={currentAlgo}
          currentLine={
            state.mid < 0 ? 1 : 
            state.foundIndex !== null ? 6 : 
            state.array[state.mid] < state.searchValue ? 10 : 
            state.array[state.mid] > state.searchValue ? 12 : 8
          }
          onClose={() => setShowCode(false)}
        />
      </div>
    </div>
  );
};

export default BinarySearchViz;