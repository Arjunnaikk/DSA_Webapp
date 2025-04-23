"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { RotateCcw, Code, Search } from "lucide-react";
import DraggableCard from "./DraggableCard";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    currentLine: 0,
  });

  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalSteps, setTotalSteps] = useState(
    Math.ceil(Math.log2(sortedArray.length)) + 1
  );
  const [search, setSearch] = useState("");

  const [animatingSplit, setAnimatingSplit] = useState(false);
  const [splitDirection, setSplitDirection] = useState<"left" | "right" | null>(
    null
  );
  const [splitProgress, setSplitProgress] = useState(0);
  const animationGroupRef = useRef<SVGGElement | null>(null);

  const currentAlgo = `function binarySearch(arr, x) {
  let low = 0;
  let high = arr.length - 1;
  
  while (low <= high) {
      let mid = Math.floor((low + high) / 2);
    
      if (arr[mid] === x) 
          return mid;    // Found x at index mid
    
      if (arr[mid] < x) 
          low = mid + 1; // x is in right half
      else 
          high = mid - 1; // x is in left half

  return -1;         // x not found in array
`;

  const width = 1450;
  const height = 360;
  const margin = {
    top: 180,
    right: 100,
    bottom: 100,
    left: 100,
  };

  const tooltipWidth = 480;
  const tooltipHeight = 29;
  const boxSize = Math.min(
    60,
    (width - margin.left - margin.right) / sortedArray.length
  );

  const explainLines = [
    "Initializing search for value " + state.searchValue,
    `Checking if ${state.mid >= 0 ? state.array[state.mid] : ""} equals ${
      state.searchValue
    }`,
    `Found ${state.searchValue} at index ${state.foundIndex}!`,
    `${state.searchValue} not found in the array`,
    `${state.array[state.mid]} < ${state.searchValue}, searching right half`,
    `${state.array[state.mid]} > ${state.searchValue}, searching left half`,
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

    const boxContainer = svg
      .append("g")
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

      boxContainer
        .append("rect")
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
      const boxGroup = boxContainer
        .append("g")
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
      boxGroup
        .append("rect")
        .attr("width", boxSize)
        .attr("height", boxSize)
        .attr("rx", 4)
        .attr("fill", boxFill)
        .attr("stroke", borderColor)
        .attr("stroke-width", index === state.mid ? 2 : 1)
        .style(
          "filter",
          index === state.mid
            ? "drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
            : "none"
        );

      // Value text
      boxGroup
        .append("text")
        .attr("x", boxSize / 2)
        .attr("y", boxSize / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", index === state.mid ? "bold" : "normal")
        .attr("fill", textColor)
        .text(value);

      // Index text below
      boxGroup
        .append("text")
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
        { label: "high", index: state.high, color: "#DC2626" },
      ];

      indicators.forEach((indicator) => {
        const x = offsetX + indicator.index * boxSize + boxSize / 2;

        // Arrow pointing to the box
        const arrowGroup = boxContainer
          .append("g")
          .attr("transform", `translate(${x}, ${boxSize + 30})`);

        arrowGroup
          .append("path")
          .attr(
            "d",
            `M0,0 L${-arrowSize},${arrowSize} L${arrowSize},${arrowSize} Z`
          )
          .attr("fill", indicator.color);

        // Label text
        arrowGroup
          .append("text")
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

      boxContainer
        .append("line")
        .attr("x1", midX)
        .attr("y1", boxSize + 60)
        .attr("x2", midX)
        .attr("y2", boxSize + splitLineHeight)
        .attr("stroke", "#2563EB")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2");

      // Add left half label if searching in left half
      if (state.array[state.mid] > state.searchValue) {
        boxContainer
          .append("text")
          .attr("x", offsetX + ((state.low + state.mid) * boxSize) / 2)
          .attr("y", boxSize + splitLineHeight + 20)
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .attr("fill", "#4B5563")
          .text("Search Here Next");
      }

      // Add right half label if searching in right half
      if (state.array[state.mid] < state.searchValue) {
        boxContainer
          .append("text")
          .attr("x", offsetX + ((state.mid + 1 + state.high) * boxSize) / 2)
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
        .attr(
          "stroke",
          i === 0
            ? "#E5E7EB"
            : i === 1
            ? "#9CA3AF"
            : i === 2
            ? "#2563EB"
            : "#16A34A"
        )
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
    // const infoY = buttonY + 30;

    // Create search value indicator
    // const searchValueGroup = svg.append("g")
    //   .attr("class", "search-value-indicator")
    //   .attr("transform", `translate(${centerX - 70}, ${infoY + 25})`);

    // searchValueGroup.append("text")
    //   .attr("font-size", "18px")
    //   .attr("font-weight", "bold")
    //   .attr("fill", "#36454F")
    //   .text(`Searching for: ${state.searchValue}`);

    // // Add toggle button for legend
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

  // // Use a ref to track animation status to avoid state updates during updates
  // const animationRef = useRef({
  //   isPlaying: false,
  //   isAnimating: false,
  // });

  useEffect(() => {
    let animationId: number;
    let isMounted = true;

    const runAnimation = async () => {
      if (!isMounted || !isPlaying || state.completed || isAnimating) return;

      await playNextStep();

      if (isMounted && isPlaying && !state.completed) {
        animationId = requestAnimationFrame(runAnimation);
      }
    };

    if (isPlaying) {
      runAnimation();
    }

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, state.completed, isAnimating]);
  const handlePlay = async () => {
    if (currentStep === 0 || state.completed) {
      await resetSearch(false);
    }
    setIsPlaying(true);
  };
  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = async () => {
    await resetSearch(false);
  };

  const playNextStep = async (): Promise<void> => {
    if (isAnimating || state.completed) return;

    setIsAnimating(true);

    try {
      // Initial step - calculate first mid point
      if (state.mid === -1) {
        const mid = Math.floor((state.low + state.high) / 2);
        setState((prev) => ({
          ...prev,
          mid,
          steps: prev.steps + 1,
          currentLine: 1,
        }));
        setCurrentStep((prev) => prev + 1);
        await sleep(800 / (speed || 1));
        return;
      }

      // Found the value
      if (state.array[state.mid] === state.searchValue) {
        setState((prev) => ({
          ...prev,
          foundIndex: prev.mid,
          completed: true,
          steps: prev.steps + 1,
          currentLine: 2,
        }));
        setCurrentStep((prev) => prev + 1);
        return;
      }

      // Value is in right half
      if (state.array[state.mid] < state.searchValue) {
        const newLow = state.mid + 1;
        setSplitDirection("right");

        if (newLow > state.high) {
          setState((prev) => ({
            ...prev,
            low: newLow,
            completed: true,
            steps: prev.steps + 1,
            currentLine: 3,
          }));
        } else {
          // Animate the split
          await animateSplit("right");
          const newMid = Math.floor((newLow + state.high) / 2);
          setState((prev) => ({
            ...prev,
            low: newLow,
            mid: newMid,
            steps: prev.steps + 1,
            currentLine: 4,
          }));
        }
      }
      // Value is in left half
      else {
        const newHigh = state.mid - 1;
        setSplitDirection("left");

        if (state.low > newHigh) {
          setState((prev) => ({
            ...prev,
            high: newHigh,
            completed: true,
            steps: prev.steps + 1,
            currentLine: 3,
          }));
        } else {
          // Animate the split
          await animateSplit("left");
          const newMid = Math.floor((state.low + newHigh) / 2);
          setState((prev) => ({
            ...prev,
            high: newHigh,
            mid: newMid,
            steps: prev.steps + 1,
            currentLine: 5,
          }));
        }
      }

      setCurrentStep((prev) => prev + 1);
      await sleep(300 / (speed || 1));
    } catch (error) {
      console.error("Error during search step:", error);
    } finally {
      setIsAnimating(false);
      setSplitDirection(null);
      setSplitProgress(0);
    }
  };

  const animateSplit = async (direction: "left" | "right") => {
    setAnimatingSplit(true);
    setSplitDirection(direction);

    // Animate the split progress from 0 to 1
    const duration = 800 / (speed || 1);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setSplitProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    await new Promise<void>((resolve) => {
      requestAnimationFrame(animate);
      setTimeout(resolve, duration);
    });

    setAnimatingSplit(false);
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
          currentLine: 0,
        });
      } else {
        // Just reset the search progress, keep the search value
        setState((prev) => ({
          ...prev,
          low: 0,
          mid: -1,
          high: sortedArray.length - 1,
          foundIndex: null,
          completed: false,
          steps: 0,
          currentLine: 0,
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
  const handleCustomSearch = () => {
    const searchValue = parseInt(search, 10);

    if (isNaN(searchValue)) {
      alert("Please enter a valid number");
      return;
    }

    setState((prev) => ({
      ...prev,
      low: 0,
      mid: -1,
      high: sortedArray.length - 1,
      foundIndex: null,
      searchValue: searchValue,
      completed: false,
      steps: 0,
      currentLine: 0,
    }));

    setCurrentStep(0);
    setIsPlaying(false);
    setIsAnimating(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg ref={svgRef} width={width} height={height} className="" />
      </div>

      {/* Custom search input field */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Input
          type="text"
          placeholder="Enter search value"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
          disabled={isAnimating || isPlaying}
        />
        <Button
          onClick={handleCustomSearch}
          disabled={isAnimating || isPlaying}
          className="flex items-center gap-1"
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>

      <div className="absolute bottom-[15vh] bg-white p-2 rounded-lg shadow-md my-auto">
        {isPlaying || state.mid >= 0 ? (
          <p>
            {state.currentLine === 0
              ? explainLines[0]
              : state.currentLine === 1
              ? explainLines[1]
              : state.currentLine === 2
              ? explainLines[2]
              : state.currentLine === 3
              ? explainLines[3]
              : state.currentLine === 4
              ? explainLines[4]
              : explainLines[5]}
          </p>
        ) : (
          <p></p>
        )}
      </div>

      <div className="flex gap-4 w-full justify-center bottom-0 fixed bg-white py-3 px-5 left-0">
        {/* Simple media player controls matching the image */}
        <Button
          onClick={handleReset}
          className="h-10 w-10 bg-white hover:bg-gray-100 text-gray-800 rounded-md  border-[2px] border-gray-400"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button
          onClick={() => {}}
          disabled={true}
          className="h-10 w-10 bg-white hover:bg-gray-100 text-gray-800 rounded-md border-[2px] border-gray-400"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="11 17 6 12 11 7"></polyline>
          </svg>
        </Button>

        <Button
          onClick={isPlaying ? handlePause : handlePlay}
          className="h-10 w-10 bg-black hover:bg-gray-900 text-white rounded-md"
          disabled={state.completed}
        >
          {isPlaying ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </Button>

        <Button
          onClick={playNextStep}
          disabled={isAnimating || state.completed || isPlaying}
          className="h-10 w-10 bg-white hover:bg-gray-100 text-gray-800 rounded-md border-[2px] border-gray-400"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="13 17 18 12 13 7"></polyline>
          </svg>
        </Button>
        {/* Code Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setShowCode(!showCode)}
              className="h-10 px-4 bg-black hover:bg-gray-900 text-white font-medium text-lg rounded-md flex items-center gap-2"
            >
              <Code className="h-5 w-5" />
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
            state.mid < 0
              ? 1
              : state.foundIndex !== null
              ? 6
              : state.array[state.mid] < state.searchValue
              ? 10
              : state.array[state.mid] > state.searchValue
              ? 12
              : 8
          }
          onClose={() => setShowCode(false)}
        />
      </div>
    </div>
  );
};

export default BinarySearchViz;