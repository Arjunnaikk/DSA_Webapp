"use client"
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { ArrowRight, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';

const InsertionSortViz = () => {
  const d3Container = useRef(null);
  const [sortSteps, setSortSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [inputArray, setInputArray] = useState('21, 5, 6, 10, 1');
  const [speed, setSpeed] = useState(1);
  const animationRef = useRef(null);

  // Constants for visualization
  const BAR_COLORS = {
    default: '#3b82f6', // blue-500
    comparing: '#f59e0b', // amber-500
    current: '#ef4444', // red-500
    sorted: '#10b981', // emerald-500
    swapping: '#8b5cf6', // violet-500
  };

  const fetchSortSteps = async () => {
    try {
      // First initialize the sort with the input array
      const array = inputArray.split(',').map(num => parseInt(num.trim()));
      
      const initResponse = await fetch('http://localhost:8080/api/sort/insertion/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ array }),
      });
      
      const initData = await initResponse.json();
      
      // Then fetch all steps
      const stepsResponse = await fetch('http://localhost:8080/api/sort/insertion/steps');
      const stepsData = await stepsResponse.json();
      
      setSortSteps(stepsData);
      setCurrentStepIndex(0);
      setIsComplete(false);
      setIsPaused(true);
    } catch (error) {
      console.error('Error fetching sort steps:', error);
    }
  };

  const resetVisualization = () => {
    setCurrentStepIndex(0);
    setIsComplete(false);
    setIsPaused(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    renderChart(sortSteps[0]);
  };

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  const stepForward = () => {
    if (currentStepIndex < sortSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      renderChart(sortSteps[nextIndex]);
      
      if (nextIndex === sortSteps.length - 1) {
        setIsComplete(true);
      }
    }
  };

  const skipToEnd = () => {
    const lastIndex = sortSteps.length - 1;
    setCurrentStepIndex(lastIndex);
    renderChart(sortSteps[lastIndex]);
    setIsComplete(true);
    setIsPaused(true);
  };

  // Animation loop
  useEffect(() => {
    if (!isPaused && !isComplete && sortSteps.length > 0) {
      const animateStep = () => {
        if (currentStepIndex < sortSteps.length - 1) {
          const nextIndex = currentStepIndex + 1;
          setCurrentStepIndex(nextIndex);
          
          if (nextIndex === sortSteps.length - 1) {
            setIsComplete(true);
            setIsPaused(true);
          } else {
            // Adjust timing based on speed setting
            const delay = 1000 / speed;
            animationRef.current = setTimeout(() => {
              animationRef.current = requestAnimationFrame(animateStep);
            }, delay);
          }
        } else {
          setIsComplete(true);
          setIsPaused(true);
        }
      };
      
      animationRef.current = requestAnimationFrame(animateStep);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          clearTimeout(animationRef.current);
        }
      };
    }
  }, [isPaused, currentStepIndex, sortSteps.length, isComplete, speed]);

  // Render chart for current step
  useEffect(() => {
    if (sortSteps.length > 0 && currentStepIndex < sortSteps.length) {
      renderChart(sortSteps[currentStepIndex]);
    }
  }, [currentStepIndex, sortSteps]);

  // Initialize chart on first load or when input array changes
  useEffect(() => {
    if (sortSteps.length > 0) {
      renderChart(sortSteps[0]);
    }
  }, [sortSteps]);

  const renderChart = (stepData) => {
    if (!d3Container.current || !stepData) return;

    const containerWidth = d3Container.current.clientWidth;
    const containerHeight = 400;
    const margin = { top: 40, right: 20, bottom: 60, left: 20 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Clear previous SVG
    d3.select(d3Container.current).selectAll("*").remove();

    // Create SVG
    const svg = d3.select(d3Container.current)
      .append("svg")
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract data from the step
    const array = stepData.array || [];
    const currentIndex = stepData.currentIndex;
    const comparingIndex = stepData.comparingIndex;
    const sortedIndices = stepData.sortedIndices || [];
    const animation = stepData.animation || "";
    const completed = stepData.completed || false;

    // Create scales
    const xScale = d3.scaleBand()
      .domain(array.map((_, i) => i))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(array) * 1.2])
      .range([height, 0]);

    // Define colors based on state
    const getBarColor = (index) => {
      if (completed) return BAR_COLORS.sorted;
      if (index === currentIndex) return BAR_COLORS.current;
      if (index === comparingIndex) return BAR_COLORS.comparing;
      if (sortedIndices.includes(index)) return BAR_COLORS.sorted;
      return BAR_COLORS.default;
    };

    // Create bars
    const bars = svg.selectAll(".bar")
      .data(array)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d, i) => xScale(i))
      .attr("width", xScale.bandwidth())
      .attr("y", d => yScale(d))
      .attr("height", d => height - yScale(d))
      .attr("fill", (d, i) => getBarColor(i))
      .attr("rx", 4)
      .attr("ry", 4);

    // Add values on top of bars
    svg.selectAll(".bar-value")
      .data(array)
      .enter()
      .append("text")
      .attr("class", "bar-value")
      .attr("x", (d, i) => xScale(i) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d) - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text(d => d);

    // Add index below bars
    svg.selectAll(".index-label")
      .data(array)
      .enter()
      .append("text")
      .attr("class", "index-label")
      .attr("x", (d, i) => xScale(i) + xScale.bandwidth() / 2)
      .attr("y", height + 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#666")
      .text((d, i) => i);

    // Add step info
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text(`Step ${currentStepIndex + 1} of ${sortSteps.length} - ${completed ? "Sorted!" : animation || "Comparing"}`);

    // If there's a current animation happening, show it
    if (animation === "swap" && currentIndex !== null && comparingIndex !== null) {
      svg.append("path")
        .attr("d", d3.line()([
          [xScale(comparingIndex) + xScale.bandwidth() / 2, yScale(array[comparingIndex]) - 25],
          [xScale(currentIndex) + xScale.bandwidth() / 2, yScale(array[currentIndex]) - 25]
        ]))
        .attr("stroke", BAR_COLORS.swapping)
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .attr("marker-end", "url(#arrow)");

      // Add arrowhead marker
      svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 5)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", BAR_COLORS.swapping);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <div className="flex flex-col space-y-4 mb-4">
        <h2 className="text-2xl font-bold text-center text-gray-800">Insertion Sort Visualization</h2>
        
        <div className="flex space-x-2">
          <input 
            type="text" 
            value={inputArray} 
            onChange={(e) => setInputArray(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Enter numbers separated by commas"
          />
          <Button onClick={fetchSortSteps} className="bg-blue-500 hover:bg-blue-600">
            Sort
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button 
              onClick={togglePlayPause} 
              variant="outline" 
              disabled={sortSteps.length === 0 || isComplete}
              className="flex items-center gap-1"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isPaused ? "Play" : "Pause"}
            </Button>
            <Button 
              onClick={stepForward} 
              variant="outline" 
              disabled={sortSteps.length === 0 || isComplete || currentStepIndex >= sortSteps.length - 1}
              className="flex items-center gap-1"
            >
              <ArrowRight className="h-4 w-4" />
              Step
            </Button>
            <Button 
              onClick={skipToEnd} 
              variant="outline" 
              disabled={sortSteps.length === 0 || isComplete || currentStepIndex >= sortSteps.length - 1}
              className="flex items-center gap-1"
            >
              <SkipForward className="h-4 w-4" />
              Complete
            </Button>
            <Button 
              onClick={resetVisualization} 
              variant="outline" 
              disabled={sortSteps.length === 0}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Speed:</span>
            <input 
              type="range" 
              min="0.5" 
              max="5" 
              step="0.5" 
              value={speed} 
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm font-medium">{speed}x</span>
          </div>
        </div>
      </div>
      
      {sortSteps.length > 0 ? (
        <div 
          className="w-full h-[400px] border border-gray-200 rounded-lg bg-gray-50" 
          ref={d3Container}
        ></div>
      ) : (
        <div className="w-full h-[400px] border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Click Sort to visualize insertion sort</p>
        </div>
      )}
      
      {sortSteps.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Step Info:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Step:</span> {currentStepIndex + 1} of {sortSteps.length}
            </div>
            <div>
              <span className="font-medium">Current Index:</span> {sortSteps[currentStepIndex]?.currentIndex}
            </div>
            <div>
              <span className="font-medium">Comparing Index:</span> {sortSteps[currentStepIndex]?.comparingIndex}
            </div>
            <div>
              <span className="font-medium">Animation:</span> {sortSteps[currentStepIndex]?.animation || "None"}
            </div>
            <div>
              <span className="font-medium">Status:</span> {sortSteps[currentStepIndex]?.completed ? "Completed" : "In Progress"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsertionSortViz;