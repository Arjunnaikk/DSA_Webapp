import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import MediaPlayer from './MediaPlayer';

interface SortState {
  array: number[];
  currentIndex: number;
  compareIndex: number;
  sortedIndices: number[];
  isCompleted: boolean;
  initialArray: number[];
}

interface InsertionSortVizProps {
  array: number[];
  speed: number;
}

const InsertionSortViz: React.FC<InsertionSortVizProps> = ({ array, speed }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [state, setState] = useState<SortState>({
    array: array,
    currentIndex: 1,
    compareIndex: 0,
    sortedIndices: [0],
    isCompleted: false,
    initialArray: array
  });

  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [comparingIndex, setComparingIndex] = useState<number | null>(null);
  const [currentElement, setCurrentElement] = useState<number | null>(null);
  const [targetPosition, setTargetPosition] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(array.length - 1);
  const [showTooltip, setShowTooltip] = useState(false);

  const arrayLength = state.array.length;
  const width = 1300;
  const height = 500;
  const margin = { 
    top: (Math.max(...state.initialArray)) <= 75 ? (200 - (Math.max(...state.initialArray) * 1.5)) : 80, 
    right: (642 - (arrayLength * 16)) > 260 ? (642 - (arrayLength * 16)) : 260, 
    bottom: 120, 
    left: (642 - (arrayLength * 16)) > 260 ? (642 - (arrayLength * 16)) : 260 
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const xScale = d3.scaleBand()
      .domain(state.array.map((_, i) => i.toString()))
      .range([margin.left, width - margin.right])
      .padding(arrayLength <= 18 ? 0.2 : 0.6);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(state.array) || 0])
      .range([height - margin.bottom, margin.top]);

    // Create gradients
    const defs = svg.append("defs");
    const gradients = {
      default: ["#9CA3AF", "#4B5563"],
      current: ["#60A5FA", "#2563EB"],
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

    // Create and update bars with enhanced animations
    const updateBars = (selection: d3.Selection<SVGGElement, number, any, any>) => {
      selection.transition()
        .duration(500 / speed)
        .attr("transform", (_, i) => {
          let x = xScale(i.toString()) || 0;
          let y = 0;
          
          // Apply vertical shift only to current element
          if (i === currentElement) {
            y = 100;
          }
          
          // Apply horizontal shift for elements being compared
          if (targetPosition !== null && i >= targetPosition && i <= currentElement) {
            x = xScale(((i + 1).toString())) || 0;
          }
          
          return `translate(${x}, ${y})`;
        });

      // Update bar appearance
      selection.select("path")
        .transition()
        .duration(500 / speed)
        .attr("d", (d) => {
          const x = 0;
          const y = yScale(d);
          const width = xScale.bandwidth();
          const barHeight = yScale.range()[0] - yScale(d);
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
        .attr("fill", (_, i) => {
          if (state.sortedIndices.includes(i)) return "url(#gradient-sorted)";
          if (i === currentElement) return "url(#gradient-current)";
          if (i === comparingIndex) return "url(#gradient-comparing)";
          return "url(#gradient-default)";
        })
        .style("filter", (_, i) => 
          (i === currentElement || i === comparingIndex) ? 
          "brightness(1.1) drop-shadow(0 4px 6px rgba(0,0,0,0.1))" : 
          "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

      // Update labels
      if (arrayLength <= 18) {
        selection.select(".value-label")
          .transition()
          .duration(500 / speed)
          .attr("x", xScale.bandwidth() / 2)
          .text(d => d);

        selection.select(".index-label")
          .transition()
          .duration(500 / speed)
          .attr("x", xScale.bandwidth() / 2)
          .text((_, i) => i);
      }
    };

    // Create bars
    const bars = svg.selectAll<SVGGElement, number>(".bar")
      .data(state.array, (d, i) => `${d}-${i}`);

    // Enter new bars
    const barsEnter = bars.enter()
      .append("g")
      .attr("class", "bar")
      .attr("transform", (_, i) => `translate(${xScale(i.toString()) || 0}, 0)`);

    barsEnter.append("path");

    if (arrayLength <= 18) {
      barsEnter.append("text")
        .attr("class", "value-label")
        .attr("x", xScale.bandwidth() / 2)
        .attr("y", height - margin.bottom + 20)
        .attr("text-anchor", "middle")
        .attr("fill", "#4B5563")
        .attr("font-weight", "600");

      barsEnter.append("text")
        .attr("class", "index-label")
        .attr("x", xScale.bandwidth() / 2)
        .attr("y", height - margin.bottom + 45)
        .attr("text-anchor", "middle")
        .attr("fill", "#6B7280")
        .attr("font-size", "16px");
    }

    // Update all bars
    updateBars(barsEnter.merge(bars));

    // Remove old bars
    bars.exit()
      .transition()
      .duration(500 / speed)
      .style("opacity", 0)
      .remove();

  }, [state, comparingIndex, currentElement, targetPosition]);

  const insertionSortStep = async () => {
    if (isAnimating || state.isCompleted) return;
    setIsAnimating(true);

    try {
      let array = [...state.array];
      let currentIndex = state.currentIndex;
      let compareIndex = currentIndex;
      let key = array[currentIndex];

      // Select current element
      setCurrentElement(currentIndex);
      await sleep(500 / speed);

      while (compareIndex > 0 && array[compareIndex - 1] > key) {
        // Set comparing element
        setComparingIndex(compareIndex - 1);
        setTargetPosition(compareIndex - 1);
        await sleep(500 / speed);

        // Shift element right
        array[compareIndex] = array[compareIndex - 1];
        compareIndex--;

        setState(prev => ({
          ...prev,
          array: array,
          compareIndex: compareIndex
        }));

        await sleep(500 / speed);
      }

      // Place element in correct position
      array[compareIndex] = key;
      setComparingIndex(null);
      setCurrentElement(null);
      setTargetPosition(null);

      setState(prev => ({
        ...prev,
        array: array,
        currentIndex: currentIndex + 1,
        sortedIndices: [...Array(currentIndex + 1).keys()],
        isCompleted: currentIndex + 1 >= array.length
      }));

      await sleep(500 / speed);
    } catch (error) {
      console.error('Error during sorting step:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  const resetSort = async () => {
    setIsAnimating(true);
    setIsPlaying(false);
    try {
      setState({
        array: [...state.initialArray],
        currentIndex: 1,
        compareIndex: 0,
        sortedIndices: [0],
        isCompleted: false,
        initialArray: [...state.initialArray]
      });
      setComparingIndex(null);
      setCurrentElement(null);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error resetting sort:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  useEffect(() => {
    if (isPlaying && !state.isCompleted && !isAnimating) {
      insertionSortStep();
      setCurrentStep(prev => prev + 1);
    }
    
    if (state.isCompleted && isPlaying) {
      setIsPlaying(false);
      setCurrentStep(0);
    }
  }, [isPlaying, state.isCompleted, isAnimating]);

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
          onClick={insertionSortStep}
          disabled={isAnimating || state.isCompleted || isPlaying}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 
                     text-white rounded-lg shadow-md hover:from-blue-600 
                     hover:to-blue-700 disabled:opacity-50 
                     disabled:cursor-not-allowed"
        >
          Next Step
        </button>
        <button
          onClick={resetSort}
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
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onSeek={handleSeek}
      />
    </div>
  );
};

export default InsertionSortViz;