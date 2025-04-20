"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import MediaPlayer from "./MediaPlayer";
import { ChevronFirst, RotateCcw } from "lucide-react";
import DraggableCard from "./DraggableCard";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";

interface SortState {
  array: number[];
  currentIndex: number;
  comparingIndex: number | null;
  sortedIndices: number[];
  completed: boolean;
  initialArray: number[];
  currentLine: number;
  shifting: boolean;
  shiftingIndex: number | null;
  shiftingValue: number | null;
  phase?: string;
  activeValue?: number | null;
  targetIndex?: number | null;
}

interface SortStep {
  array: number[];
  currentIndex: number;
  comparingIndex: number | null;
  sortedIndices: number[];
  completed: boolean;
  currentLine: number;
  shifting: boolean;
  shiftingIndex: number | null;
  shiftingValue: number | null;
  phase?: string;
  activeValue?: number | null;
  targetIndex?: number | null;
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
    array: [...array],
    currentIndex: 1,
    comparingIndex: null,
    sortedIndices: [0],
    completed: false,
    initialArray: [...array],
    currentLine: 0,
    shifting: false,
    shiftingIndex: null,
    shiftingValue: null,
    phase: "ready",
    activeValue: null,
    targetIndex: null,
  });

  const arrayLength = state.array.length;

  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showRuntimeCode, setShowRuntimeCode] = useState(true);
  const [countStep, setCountStep] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalSteps, setTotalSteps] = useState(array.length * array.length); // Rough estimate

  const currentAlgo = `for (let i = 1; i < n; i++) {
    let current = arr[i];
    let j = i - 1;
    
    while (j >= 0 && arr[j] > current) {
      arr[j + 1] = arr[j];
      j--;
    }
    
    arr[j + 1] = current;
}`;

  const width = 1450;
  const height = 450;
  const margin = {
    top:
      Math.max(...state.initialArray) <= 50
        ? 100 - Math.max(...state.initialArray) * 1
        : 60,
    right: 750 - arrayLength * 15 > 260 ? 750 - arrayLength * 15 : 260,
    bottom: 250,
    left: 750 - arrayLength * 15 > 260 ? 750 - arrayLength * 15 : 260,
  };
  const barPadding = 10;
  const tooltipWidth = 480;
  const tooltipHeight = 29;
  const verticalShift = 150;
  const barWidth = 30;

  const transitionDuration = speed * 0.6;

  const explainLines = [
    `Start with second element (index 1)`,
    `Selecting element ${
      state.activeValue ?? state.array[state.currentIndex]
    } at index ${state.currentIndex}`,
    `Comparing ${state.activeValue ?? state.array[state.currentIndex]} with ${
      state.comparingIndex !== null ? state.array[state.comparingIndex] : ""
    } at index ${state.comparingIndex}`,
    `Found position for ${
      state.activeValue ?? state.array[state.currentIndex]
    } at index ${state.targetIndex ?? state.currentIndex}`,
    `Sorting complete`,
  ];

  const centerX = width / 2;
  const buttonY = height - margin.bottom + 70;

  // Fix the simulateAllSteps function to correctly track the algorithm steps
  const simulateAllSteps = (arr: number[]): SortStep[] => {
    const steps: SortStep[] = [];
    const n = arr.length;

    // Create a fresh copy of the input array
    let sortingArray = [...arr];

    // Initial state
    steps.push({
      array: [...sortingArray],
      currentIndex: 1,
      comparingIndex: null,
      sortedIndices: [0],
      completed: false,
      currentLine: 0,
      shifting: false,
      shiftingIndex: null,
      shiftingValue: null,
      phase: "ready",
    });

    for (let i = 1; i < n; i++) {
      // Remember the current value that we're inserting
      const currentValue = sortingArray[i];

      // Step: Moving down phase - selecting an element to insert
      steps.push({
        array: [...sortingArray], // Create a new copy of the array
        currentIndex: i,
        comparingIndex: null,
        sortedIndices: Array.from({ length: i }, (_, idx) => idx),
        completed: false,
        currentLine: 1,
        shifting: false,
        shiftingIndex: null,
        shiftingValue: currentValue,
        phase: "moving-down",
        activeValue: currentValue,
      });

      console.log("1 - " , steps);

      let j = i - 1;
      let insertPosition = i; // Default position is where it already is

      // For visualization purposes, create a temporary array that will show the shifting
      // but won't affect the actual sorting algorithm
      let tempArray = [...sortingArray];

      while (j >= 0 && sortingArray[j] > currentValue) {
        // Create a snapshot for the comparison step
        steps.push({
          array: [...tempArray], // Use the temporary array for visualization
          currentIndex: i,
          comparingIndex: j,
          sortedIndices: Array.from({ length: i }, (_, idx) => idx),
          completed: false,
          currentLine: 2,
          shifting: false,
          shiftingIndex: null,
          shiftingValue: currentValue,
          phase: "comparing",
          activeValue: currentValue,
        });

        console.log("2 - " , steps);

        // Update the temp array to show the shift
        // tempArray[j + 1] = tempArray[j];
        insertPosition = j;

        // Add a step to show the shifting
        // steps.push({
        //   array: [...tempArray], // Use a fresh copy of the temp array
        //   currentIndex: i,
        //   comparingIndex: j,
        //   sortedIndices: Array.from({ length: i }, (_, idx) => idx),
        //   completed: false,
        //   currentLine: 2,
        //   shifting: true,
        //   shiftingIndex: j,
        //   shiftingValue: currentValue,
        //   phase: "shifting",
        //   activeValue: currentValue,
        // });

        console.log("3 - " , steps);

        // In the actual algorithm, we're shifting the element
        sortingArray[j + 1] = sortingArray[j];
        j--;
      }

      // Insert the value at the correct position in both arrays
      sortingArray[insertPosition] = currentValue;
      tempArray[insertPosition] = currentValue;

      // Add a step to show the insertion
      // steps.push({
      //   array: [...sortingArray], // Use the updated sorted array
      //   currentIndex: i + 1,
      //   comparingIndex: null,
      //   sortedIndices: Array.from({ length: i + 1 }, (_, idx) => idx),
      //   completed: i === n - 1,
      //   currentLine: 3,
      //   shifting: false,
      //   shiftingIndex: null,
      //   shiftingValue: currentValue,
      //   phase: "found-position",
      //   activeValue: currentValue,
      //   targetIndex: insertPosition,
      // });

      console.log("4 - " , steps);
    }

    
    // Final state - sorting is complete
    steps.push({
      array: [...sortingArray],
      currentIndex: n,
      comparingIndex: null,
      sortedIndices: Array.from({ length: n }, (_, idx) => idx),
      completed: true,
      currentLine: 4,
      shifting: false,
      shiftingIndex: null,
      shiftingValue: null,
      phase: "done",
    });

    return steps;
  };

  const [allSteps, setAllSteps] = useState<SortStep[]>(simulateAllSteps(array));

  useEffect(() => {
    setAllSteps(simulateAllSteps(array));
    setTotalSteps(simulateAllSteps(array).length);
  }, [array]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Calculate positions and dimensions
    const arrayWidth =
      state.array.length * (barWidth + barPadding) - barPadding;
    const startX = (width - arrayWidth) / 2;

    // Scale for bar heights
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(state.array) || 0])
      .range([0, height - margin.top - margin.bottom]);

    // Create a title for the visualization
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text("Insertion Sort Visualization");

    // Create array representation
    const mainArray = svg
      .append("g")
      .attr("class", "main-array")
      .attr("transform", `translate(${startX}, ${margin.top})`);

    // Add status text container
    svg
      .append("text")
      .attr("class", "status-text")
      .attr("x", width / 2)
      .attr("y", height - margin.bottom / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      // .text(getStatusText(state));

    // Make a deep copy of data to work with
    const displayData = [...state.array];
    const originalValues = new Map(
      state.array.map((value, index) => [index, value])
    );

    // Debug the data before any manipulation
    console.log("Original display data:", [...displayData]);

    // If there's a sorting state and we have a value being moved
    const activeValue = state.shiftingValue;
    const activeIdx = state.currentIndex;
    const compareIdx = state.comparingIndex;
    const shiftedElements: number[] = [];

    // Create a map to track which elements are being displayed
    const elementPositions = new Map();

    if (
      state.phase === "moving-down" ||
      state.phase === "comparing" ||
      state.phase === "shifting"
    ) {
      // Remove the active element from its original position ONLY FOR VISUALIZATION
      if (activeIdx >= 0 && activeIdx < displayData.length) {
        displayData[activeIdx] = null as unknown as number;
      }

      if (state.phase === "comparing" || state.phase === "shifting") {
        if (compareIdx !== null) {
          // Track elements that need to shift right - 
          // don't modify the values
          for (let i = compareIdx + 1; i <= activeIdx; i++) {
            shiftedElements.push(i);
            // Mark the position as shifted
            elementPositions.set(i, "shifted");
          }
          // Mark the comparing position
          elementPositions.set(compareIdx, "comparing");
        }
      }
    } else if (state.phase === "found-position") {
      if (state.targetIndex !== null && state.shiftingValue !== null) {
        // Insert the element at its final position
        displayData[state.targetIndex as number] = state.shiftingValue;
        elementPositions.set(state.targetIndex, "inserted");
      }
    }

    // Add another debug statement after the modifications

    // Debug the data after manipulation
    console.log("Modified display data:", [...displayData]);
    console.log("Shifted elements:", shiftedElements);
    console.log("Element positions:", Object.fromEntries(elementPositions));

    // Create bars with unique keys that persist through the animation
    // Use a more reliable key function for data binding
    const bars = mainArray
      .selectAll<SVGGElement, number | null>("g.bar")
      .data(displayData, (d, i) => {
        // Create a truly unique key for each element by combining:
        // 1. The element's value
        // 2. Its index position
        // 3. The current phase
        // 4. A timestamp to ensure uniqueness in edge cases
        if (d === null) return `placeholder-${i}-${state.phase}-${Date.now()}`;
        const position = elementPositions.get(i) || "normal";
        return `element-${d}-pos${i}-${position}-${state.phase}-${Date.now()}`;
      });

    // Remove old elements with smooth fade-out
    bars
      .exit()
      .transition()
      .duration(transitionDuration / 2)
      .style("opacity", 0)
      .remove();

    // Add new elements
    const enterBars = bars
      .enter()
      .append("g")
      .attr("class", "bar")
      .style("opacity", 0)
      .attr("transform", (d, i) => {
        const isShifted = shiftedElements.includes(i);
        const baseX = i * (barWidth + barPadding);
        const shiftOffset = isShifted ? barWidth + barPadding : 0;
        return `translate(${baseX + shiftOffset}, 0)`;
      });

    // Add rectangles and text to new elements
    enterBars.each(function (d) {
      const group = d3.select(this);

      if (d === null) {
        // This is a placeholder for the removed element
        group
          .append("rect")
          .attr("class", "placeholder-rect")
          .attr("width", barWidth)
          .attr("height", 0)
          .attr("y", height - margin.bottom)
          .attr("rx", 3)
          .attr("fill", "none")
          // .attr("stroke", "#ff6b6b")
          // .attr("stroke-width", 2)
          // .attr("stroke-dasharray", "5,3");
      } else {
        // Determine color based on comparison state
        const fillColor = "#6c5ce7"; // Default

        group
          .append("rect")
          .attr("class", "bar-rect")
          .attr("width", barWidth)
          .attr("height", 0)
          .attr("y", height - margin.bottom)
          .attr("rx", 3)
          .attr("fill", fillColor);

        group
          .append("text")
          .attr("class", "bar-text")
          .text(d)
          .attr("x", barWidth / 2)
          .attr("y", height - margin.bottom)
          .attr("text-anchor", "middle")
          .attr("fill", "black")
          .attr("font-size", "14px")
          .attr("font-weight", "bold")
          .style("opacity", 0);
      }
    });

    // Merge enter and update selections
    const allBars = bars.merge(enterBars);

    // Update all elements with smooth transitions
    allBars
      .transition()
      .duration(transitionDuration)
      .style("opacity", 1)
      .attr("transform", (d, i) => {
        const isShifted = shiftedElements.includes(i);
        const baseX = i * (barWidth + barPadding);
        const shiftOffset = isShifted ? barWidth + barPadding : 0;
        return `translate(${baseX + shiftOffset}, 0)`;
      });

    // Update rectangles and text in all bars
    allBars.each(function (d, i) {
      const group = d3.select(this);

      if (d === null) {
        // Update placeholder rectangle
        group
          .select(".placeholder-rect")
          .transition()
          .duration(transitionDuration)
          .attr("height", activeValue ? yScale(activeValue) : 0)
          .attr(
            "y",
            height - margin.bottom - (activeValue ? yScale(activeValue) : 0)
          );
      } else {
        // Determine color based on comparison state
        let fillColor = "#9CA3AF"; // Default -  dark blue

        if (state.phase === "comparing" && i === compareIdx) {
          fillColor = "#4ecdc4"; // Element being compared with - turquise
        } else if (
          state.phase === "found-position" &&
          i === state.targetIndex
        ) {
          fillColor = "#ffd166"; // Target position - yellow
        } else if (shiftedElements.includes(i)) {
          fillColor = "#9381ff"; // Elements that have been shifted right - purple
        } else if (state.sortedIndices.includes(i)) {
          fillColor = "#4ADE80"; // Sorted elements - green
        }

        const barHeight = yScale(d);

        // Update rectangle
        group
          .select(".bar-rect")
          .transition()
          .duration(transitionDuration)
          .attr("height", barHeight)
          .attr("y", height - margin.bottom - barHeight)
          .attr("fill", fillColor);

        // Update text
        group
          .select(".bar-text")
          .text((d) => d as string)
          .transition()
          .duration(transitionDuration)
          .attr("y", height - margin.bottom - barHeight - 5)
          .style("opacity", 1);
      }
    });

    // Handle the active element being moved
    const activeElementGroup = svg
      .selectAll<SVGGElement, number>("g.active-element")
      .data(
        state.phase === "moving-down" ||
          state.phase === "comparing" ||
          state.phase === "shifting"
          ? [state.shiftingValue || 0]
          : [],
        (d) => `active-${d}-${state.phase}`
      );

    // Remove old active element with animation
    activeElementGroup
      .exit()
      .transition()
      .duration(transitionDuration / 2)
      .style("opacity", 0)
      .remove();

    // Add new active element
    const enterActiveElement = activeElementGroup
      .enter()
      .append("g")
      .attr("class", "active-element")
      .style("opacity", 0);

    // Calculate position for active element
    let activeX = 0;
    if (state.phase === "moving-down") {
      // If just moving down, position it below its original index
      activeX = activeIdx * (barWidth + barPadding);
    } else if (state.phase === "comparing" || state.phase === "shifting") {
      // If comparing, position it according to the comparison index
      activeX = compareIdx !== null ? compareIdx * (barWidth + barPadding) : 0;
    }

    // Setup active element
    enterActiveElement.attr(
      "transform",
      `translate(${startX + activeX}, ${100})`
    );

    enterActiveElement
      .append("rect")
      .attr("width", barWidth)
      .attr("height", 0)
      .attr("y", height - margin.bottom)
      .attr("rx", 3)
      .attr("fill", "#ff6b6b");

    enterActiveElement
      .append("text")
      .text(state.shiftingValue || "")
      .attr("x", barWidth / 2)
      .attr("y", height - margin.bottom - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .style("opacity", 0);

    // Update active element with animations
    const allActiveElements = activeElementGroup.merge(enterActiveElement);

    allActiveElements
      .transition()
      .duration(transitionDuration)
      .style("opacity", 1)
      .attr(
        "transform",
        `translate(${startX + activeX}, ${100 + yScale(activeValue)})`
      );

    allActiveElements
      .select("rect")
      .transition()
      .duration(transitionDuration)
      .attr("height", activeValue ? yScale(activeValue) : 0)
      .attr(
        "y",
        height - margin.bottom - (activeValue ? yScale(activeValue) : 0)
      );

    allActiveElements
      .select("text")
      .transition()
      .duration(transitionDuration)
      .attr(
        "y",
        height - margin.bottom - (activeValue ? yScale(activeValue) : 0) - 5
      )
      .style("opacity", 1);

    // Update status text
    svg
      .select(".status-text")
      // .text(getStatusText(state))
      .style("opacity", 0)
      .transition()
      .duration(transitionDuration / 2)
      .style("opacity", 1);

    // Add legend
    const legendData = [
      { label: "Unsorted", color: "#6c5ce7" },
      { label: "Current", color: "#ff6b6b" },
      { label: "Comparing", color: "#4ecdc4" },
      { label: "Sorted", color: "#4ADE80" },
      { label: "Shifting", color: "#9381ff" },
      { label: "Target", color: "#ffd166" },
    ];

    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 200}, 30)`);

    legendData.forEach((item, i) => {
      const legendItem = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 25})`);

      legendItem
        .append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("rx", 3)
        .attr("fill", item.color);

      legendItem
        .append("text")
        .attr("x", 30)
        .attr("y", 15)
        .attr("font-size", "14px")
        .text(item.label);
    });
  }, [state, speed]);

  // const getStatusText = (state: SortState): string => {
  //   if (state.phase === "moving-down") {
  //     return `Selecting element ${
  //       state.activeValue ?? state.array[state.currentIndex]
  //     } at index ${state.currentIndex}`;
  //   } else if (state.phase === "comparing") {
  //     return `Comparing ${
  //       state.activeValue ?? state.array[state.currentIndex]
  //     } with ${
  //       state.comparingIndex !== null ? state.array[state.comparingIndex] : ""
  //     } at index ${state.comparingIndex}`;
  //   } else if (state.phase === "shifting") {
  //     return `Shifting elements to make space for ${
  //       state.activeValue ?? state.array[state.currentIndex]
  //     }`;
  //   } else if (state.phase === "found-position") {
  //     return `Found position for ${
  //       state.activeValue ?? state.array[state.currentIndex]
  //     } at index ${state.targetIndex ?? state.currentIndex}`;
  //   } else if (state.phase === "done") {
  //     return "Sorting complete!";
  //   } else if (state.currentLine === 0) {
  //     return "Starting insertion sort...";
  //   }

  //   return "";
  // };

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
    const response = await fetch(
      `http://localhost:8080/api/sort/selection/step/${step}`
    );
    // console.log(step);

    const stepData = await response.json();
    setState(stepData.state);
    setCountStep(step);
    setCurrentStep(step);

    setIsPlaying(false);
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    const runAnimation = async () => {
      if (isPlaying && !state.completed && !isAnimating) {
        await nextStep();
      }
    };

    if (isPlaying) {
      runAnimation();
    }

    if (currentStep >= totalSteps - 1 && isPlaying) {
      setCurrentStep(0);
      handlePause();
    }
  }, [isPlaying, countStep, state.completed, isAnimating, currentStep]);

  const nextStep = async (): Promise<void> => {
    if (isAnimating || state.completed) return;
    setIsAnimating(true);

    try {
      const nextStep = Math.min(countStep + 1, allSteps.length - 1);
      setState({
        ...allSteps[nextStep],
        initialArray: [...state.initialArray],
      });
      setCountStep(nextStep);
      setCurrentStep(nextStep);
      await sleep(800 / speed);
    } catch (error) {
      console.error("Error during animation step:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  const previousStep = async (): Promise<void> => {
    if (isAnimating || countStep <= 0) return;
    setIsAnimating(true);

    try {
      const prevStep = Math.max(countStep - 1, 0);
      setState({
        ...allSteps[prevStep],
        initialArray: [...state.initialArray],
      });
      setCountStep(prevStep);
      setCurrentStep(prevStep);
      await sleep(800 / speed);
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
      const initialSteps = simulateAllSteps(array);
      setAllSteps(initialSteps);
      setTotalSteps(initialSteps.length);
      setState({
        ...initialSteps[0],
        initialArray: [...array],
      });
      setCountStep(0);
      setCurrentStep(0);
    } catch (error) {
      console.error("Error resetting sort:", error);
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
        <p>
          {state.currentLine === 0
            ? explainLines[0]
            : state.currentLine === 1
            ? explainLines[1]
            : state.currentLine === 2
            ? explainLines[2]
            : state.currentLine === 3
            ? explainLines[3]
            : explainLines[4]}
        </p>
      </div>
      <div className="flex gap-4 w-full justify-center bottom-0 fixed bg-black py-3 px-5 left-0">
        <button
          onClick={resetSort}
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
          state={{ ...state, minIndex: state.currentIndex }}
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
          currentLine={
            state.currentLine === 1
              ? [1, 2]
              : state.currentLine === 2
              ? [3, 4]
              : state.currentLine === 3
              ? [5]
              : [0]
          }
        />
      </div>
    </div>
  );
};

export default InsertionSortViz;
