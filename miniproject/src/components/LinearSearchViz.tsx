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
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchState {
  array: number[];
  currentIndex: number;
  foundIndex: number | null;
  searchValue: number;
  completed: boolean;
  steps: number;
  currentLine: number;
}

interface LinearSearchVizProps {
  array: number[];
  speed: number;
}

const LinearSearchViz: React.FC<LinearSearchVizProps> = ({ array, speed }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [state, setState] = useState<SearchState>({
    array: array,
    currentIndex: -1,
    foundIndex: null,
    searchValue: 0,
    completed: false,
    steps: 0,
    currentLine: 0,
  });

  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalSteps, setTotalSteps] = useState(array.length + 1);
  const [search, setSearch] = useState("");

  const currentAlgo = `function linearSearch(arr, x) {
  for(let i = 0; i < arr.length; i++) {
    if(arr[i] === x) {
      return i;    // Found x at index i
    }
  }
  return -1;       // x not found in array
}`;

  const width = 1450;
  const height = 350;
  const margin = {
    top: Math.max(...array) <= 50 ? 100 - Math.max(...array) * 1 : 60,
    right: 725 - array.length * 19 > 260 ? 725 - array.length * 19 : 260,
    bottom: 50,
    left: 725 - array.length * 19 > 260 ? 725 - array.length * 19 : 260,
  };
  const barPadding = 0.2;
  const tooltipWidth = 480;
  const tooltipHeight = 29;
  const explainLines = [
    "Initializing search for value " + state.searchValue,
    `Checking if ${
      state.currentIndex >= 0 ? state.array[state.currentIndex] : ""
    } equals ${state.searchValue}`,
    `Found ${state.searchValue} at index ${state.foundIndex}!`,
    `${state.searchValue} not found in the array`,
  ];

  const centerX = width / 2;
  const buttonY = height - margin.bottom + 70;

  useEffect(() => {
    // Initialize with a random search value from the array
    // const randomIndex = Math.floor(Math.random() * array.length);
    const searchValue = parseInt(search);

    setState({
      array: array,
      currentIndex: -1,
      foundIndex: null,
      searchValue: searchValue,
      completed: false,
      steps: 0,
      currentLine: 0,
    });

    setTotalSteps(array.length + 1);
    setCurrentStep(0);
    setIsPlaying(false);
    setIsAnimating(false);
  }, [array]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg: d3.Selection<SVGSVGElement, unknown, null, undefined> =
      d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const xScale = d3
      .scaleBand()
      .domain(state.array.map((_, i) => i.toString()))
      .range([margin.left, width - margin.right])
      .padding(state.array.length <= 18 ? barPadding : 0.6);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(state.array) || 0])
      .range([height - margin.bottom, margin.top]);

    // Create gradient definitions
    const defs = svg.append("defs");

    const gradients: Record<string, [string, string]> = {
      default: ["#9CA3AF", "#4B5563"],
      current: ["#60A5FA", "#2563EB"],
      searching: ["#FCD34D", "#F59E0B"],
      found: ["#4ADE80", "#16A34A"],
      notFound: ["#EF4444", "#B91C1C"],
      searchValue: ["#8B5CF6", "#6D28D9"],
    };

    Object.entries(gradients).forEach(([key, [start, end]]) => {
      const gradient = defs
        .append("linearGradient")
        .attr("id", `gradient-${key}`)
        .attr("gradientTransform", "rotate(90)");

      gradient.append("stop").attr("offset", "0%").attr("stop-color", start);

      gradient.append("stop").attr("offset", "100%").attr("stop-color", end);
    });

    // Create bars with data join
    const bars = svg
      .selectAll<SVGGElement, number>(".bar")
      .data(state.array, (d, i) => `${d}-${i}`);

    // Handle enter selection
    const barsEnter = bars
      .enter()
      .append("g")
      .attr("class", "bar")
      .attr(
        "transform",
        (_, i) => `translate(${xScale(i.toString()) || 0}, 0)`
      );

    // Add bar paths
    barsEnter
      .append("path")
      .attr("d", (d) => {
        const x = 0;
        const y = yScale(d);
        const width = xScale.bandwidth();
        const barHeight = yScale.range()[0] - yScale(d);
        const radius = 6;

        return state.array.length <= 18
          ? `
            M ${x + radius} ${y}
            L ${x + width - radius} ${y}
            Q ${x + width} ${y} ${x + width} ${y + radius}
            L ${x + width} ${y + barHeight}
            L ${x} ${y + barHeight}
            L ${x} ${y + radius}
            Q ${x} ${y} ${x + radius} ${y}
            Z
          `
          : `
            M ${x} ${y}
            L ${x + width} ${y}
            L ${x + width} ${y + barHeight}
            L ${x} ${y + barHeight}
            Z
          `;
      })
      .attr("clip-path", "polygon(0 0, 100% 0, 100% 100%, 0 100%)");

    // Add the "border bar" for search animation with consistent height for search value
    if (state.currentIndex >= 0) {
      const borderBarGroup = svg
        .append("g")
        .attr("class", "border-bar")
        .attr(
          "transform",
          `translate(${xScale(state.currentIndex.toString()) || 0}, 0)`
        );

      // Use the search value height instead of the current bar's height
      const searchValueHeight = yScale.range()[0] - yScale(state.searchValue);
      const searchValueY = yScale(state.searchValue);

      // Create the border bar with the height matching the search value
      borderBarGroup
        .append("path")
        .attr("d", () => {
          const x = 0;
          const y = searchValueY;
          const width = xScale.bandwidth();
          const radius = 6;

          return state.array.length <= 18
            ? `
              M ${x + radius} ${y}
              L ${x + width - radius} ${y}
              Q ${x + width} ${y} ${x + width} ${y + radius}
              L ${x + width} ${y + searchValueHeight}
              L ${x} ${y + searchValueHeight}
              L ${x} ${y + radius}
              Q ${x} ${y} ${x + radius} ${y}
              Z
            `
            : `
              M ${x} ${y}
              L ${x + width} ${y}
              L ${x + width} ${y + searchValueHeight}
              L ${x} ${y + searchValueHeight}
              Z
            `;
        })
        .attr("fill", "none");
      // .attr("stroke", state.foundIndex === state.currentIndex ? "#16A34A" : "#2563EB")
      // .attr("stroke-width", 3)
      // .attr("stroke-dasharray", "5,3")
      // .attr("opacity", 0.9);
    }

    // Create value labels in enter selection
    if (state.array.length <= 18) {
      barsEnter
        .append("text")
        .attr("class", "value-label")
        .attr("x", xScale.bandwidth() / 2)
        .attr("y", (d) => yScale(d) - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#4B5563")
        .attr("font-weight", "600")
        .text((d) => d);

      // Create index labels in enter selection
      barsEnter
        .append("text")
        .attr("class", "index-label")
        .attr("x", xScale.bandwidth() / 2)
        .attr("y", height - margin.bottom + 20)
        .attr("text-anchor", "middle")
        .attr("fill", "#6B7280")
        .attr("font-size", "16px")
        .text((_, i) => i);
    }

    // Merge enter + update selections
    const barsUpdate = barsEnter.merge(bars);

    // Update bar colors based on state - bars stay in place
    barsUpdate
      .select("path")
      .transition()
      .duration(300 / speed)
      .attr("fill", (d, i) => {
        if (state.foundIndex === i) return "url(#gradient-found)";
        if (d === state.searchValue) return "url(#gradient-searchValue)";
        if (i === state.currentIndex) return "url(#gradient-searching)";
        if (state.completed && state.foundIndex === null)
          return "url(#gradient-default)";
        return "url(#gradient-default)";
      })
      .style("transform-origin", "center bottom")
      .style("filter", (d, i) =>
        i === state.currentIndex || i === state.foundIndex
          ? "brightness(1.1) drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
          : "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
      );

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
      { label: "Unsearched", gradient: "default" },
      { label: "Searching", gradient: "searching" },
      { label: "Search Value", gradient: "searchValue" },
      { label: "Found", gradient: "found" },
      { label: "Not Found", gradient: "notFound" },
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
        .attr("fill", `url(#gradient-${item.gradient})`);

      legendGroup
        .append("text")
        .attr("x", 22)
        .attr("y", 8)
        .attr("fill", "#4B5563")
        .attr("font-size", "12px")
        .text(item.label);
    });

    // Define the status and search value info position - MOVED BELOW TOOLTIP
    const infoY = buttonY + 30; // Position it below the tooltip

    // Create search value indicator - REPOSITIONED
    // const searchValueGroup = svg.append("g")
    //   .attr("class", "search-value-indicator")
    //   .attr("transform", `translate(${centerX - 70}, ${infoY +  25})`);

    // searchValueGroup.append("text")
    //   .attr("font-size", "18px")
    //   .attr("font-weight", "bold")
    //   .attr("fill", " #36454F ")
    //   .text(`Searching for: ${state.searchValue}`);

    // Create status indicator - REPOSITIONED
    // const statusGroup = svg.append("g")
    //   .attr("class", "status-indicator")
    //   .attr("transform", `translate(${centerX + 60}, ${infoY})`);

    // let statusText = "Ready to search";
    // if (state.currentIndex >= 0 && !state.completed) {
    //   statusText = `Checking index ${state.currentIndex}`;
    // } else if (state.completed) {
    //   statusText = state.foundIndex !== null
    //     ? `Found at index ${state.foundIndex}!`
    //     : "Value not found";
    // }

    // statusGroup.append("text")
    //   .attr("font-size", "16px")
    //   .attr("font-weight", "bold")
    //   .attr("fill", state.foundIndex !== null ? "#16A34A" : state.completed ? "#B91C1C" : "#4B5563")
    //   .text(statusText);

    // Add toggle button
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

    // Remove any exiting elements
    bars
      .exit()
      .transition()
      .duration(500 / speed)
      .style("opacity", 0)
      .remove();
  }, [state, showTooltip, speed]);

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    const runAnimation = async () => {
      if (isPlaying && !state.completed && !isAnimating) {
        await playNextStep();
      }
    };

    if (isPlaying) {
      runAnimation();
    }

    if (state.completed && isPlaying) {
      handlePause();
    }
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

  const handleSeek = async (step: number) => {
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

      for (let i = 0; i < step; i++) {
        const nextIndex = i;

        // Check if found
        if (state.array[nextIndex] === state.searchValue) {
          setState((prev) => ({
            ...prev,
            currentIndex: nextIndex,
            foundIndex: nextIndex,
            completed: true,
            steps: i + 1,
            currentLine: 3,
          }));
          setCurrentStep(i + 1);
          break;
        }
        // Not found at this index
        else if (i === state.array.length - 1) {
          setState((prev) => ({
            ...prev,
            currentIndex: nextIndex,
            completed: true,
            steps: i + 1,
            currentLine: 4,
          }));
          setCurrentStep(i + 1);
        }
        // Still searching
        else {
          setState((prev) => ({
            ...prev,
            currentIndex: nextIndex,
            steps: i + 1,
            currentLine: 2,
          }));
        }
      }
    } catch (error) {
      console.error("Error during seek:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  const playNextStep = async (): Promise<void> => {
    if (isAnimating || state.completed) return;
    setIsAnimating(true);

    try {
      const nextIndex = state.currentIndex + 1;

      // Check if we've reached the end of the array
      if (nextIndex >= state.array.length) {
        setState((prev) => ({
          ...prev,
          completed: true,
          steps: prev.steps + 1,
          currentLine: 4,
        }));
        setCurrentStep((prev) => prev + 1);
        setIsPlaying(false);
        return;
      }

      // Check if we found the value
      if (state.array[nextIndex] === state.searchValue) {
        setState((prev) => ({
          ...prev,
          currentIndex: nextIndex,
          foundIndex: nextIndex,
          completed: true,
          steps: prev.steps + 1,
          currentLine: 3,
        }));
        setCurrentStep((prev) => prev + 1);
        setIsPlaying(false);
      } else {
        setState((prev) => ({
          ...prev,
          currentIndex: nextIndex,
          steps: prev.steps + 1,
          currentLine: 2,
        }));
        setCurrentStep((prev) => prev + 1);
      }

      await sleep(800 / speed);
    } catch (error) {
      console.error("Error during search step:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  const previousStep = async (): Promise<void> => {
    if (isAnimating || state.currentIndex <= 0) return;
    setIsAnimating(true);

    try {
      const prevIndex = state.currentIndex - 1;

      setState((prev) => ({
        ...prev,
        currentIndex: prevIndex,
        foundIndex: null,
        completed: false,
        steps: prev.steps - 1,
        currentLine: prevIndex >= 0 ? 2 : 1,
      }));

      setCurrentStep((prev) => prev - 1);
      await sleep(800 / speed);
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
        const randomIndex = Math.floor(Math.random() * array.length);
        const searchValue = array[randomIndex];

        setState((prev) => ({
          ...prev,
          currentIndex: -1,
          foundIndex: null,
          searchValue: searchValue,
          completed: false,
          steps: 0,
          currentLine: 0,
        }));
      } else {
        // Just reset the search progress, keep the search value
        setState((prev) => ({
          ...prev,
          currentIndex: -1,
          foundIndex: null,
          completed: false,
          steps: 0,
          currentLine: 0,
        }));
      }

      setCurrentStep(0);
      await sleep(300 / speed);
    } catch (error) {
      console.error("Error resetting search:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  // const handleCustomSearch = (value) => {
  //   const searchValue = parseInt(value, 10);

  //   if (isNaN(searchValue)) {
  //     alert("Please enter a valid number");
  //     return;
  //   }

  //   setState(prev => ({
  //     ...prev,
  //     currentIndex: -1,
  //     foundIndex: null,
  //     searchValue: searchValue,
  //     completed: false,
  //     steps: 0,
  //     currentLine: 0
  //   }));

  //   setCurrentStep(0);
  //   setIsPlaying(false);
  //   setIsAnimating(false);
  // };

  const handleSearch = () => {
    const searchValue = parseInt(search, 10);
    if (isNaN(searchValue)) {
      alert("Please enter a valid number");
      return;
    }

    setState((prev) => ({
      ...prev,
      currentIndex: -1,
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
          onClick={handleSearch}
          disabled={isAnimating || isPlaying}
          className="flex items-center gap-1"
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>

      <div className="absolute bottom-[15vh] bg-white p-2 rounded-lg shadow-md my-auto">
        {isPlaying || state.currentIndex >= 0 ? (
          <p>
            {state.currentLine === 0
              ? explainLines[0]
              : state.currentLine === 2
              ? explainLines[1]
              : state.currentLine === 3
              ? explainLines[2]
              : explainLines[3]}
          </p>
        ) : (
          <p></p>
        )}
      </div>
      <div className="flex gap-4 w-full justify-center bottom-0 fixed bg-white py-3 px-5 left-0">
        {/* Simple media player controls matching the image */}
        <Button
          onClick={() => resetSearch()}
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
          className="h-10 w-10 bg-black hover:bg-gray-900 text-white rounded-md "
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
          disabled={isAnimating || state.completed}
          className="h-10 w-10 bg-white hover:bg-gray-100 text-gray-800 rounded-md border-[2px] border-gray-400 "
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
            state.currentIndex >= 0 ? (state.foundIndex !== null ? 3 : 2) : 1
          }
        />
      </div>
    </div>
  );
};

export default LinearSearchViz;
