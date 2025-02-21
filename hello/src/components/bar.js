import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const SelectionSortViz = () => {
  const svgRef = useRef();
  const [array, setArray] = useState([64, 34, 25, 12, 22, 11, 90]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [minIndex, setMinIndex] = useState(0);
  const [sorted, setSorted] = useState([]);
  
  const width = 600;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
    const xScale = d3.scaleBand()
      .domain(array.map((_, i) => i))
      .range([margin.left, width - margin.right])
      .padding(0.1);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(array)])
      .range([height - margin.bottom, margin.top]);
    
    // Add bars
    svg.selectAll("rect")
      .data(array)
      .enter()
      .append("rect")
      .attr("x", (d, i) => xScale(i))
      .attr("y", d => yScale(d))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - margin.bottom - yScale(d))
      .attr("fill", (d, i) => {
        if (sorted.includes(i)) return "#4CAF50"; // Sorted elements
        if (i === currentIndex) return "#2196F3"; // Current element
        if (i === minIndex) return "#FF5722"; // Minimum element found
        return "#9E9E9E"; // Unsorted elements
      });
    
    // Add value labels
    svg.selectAll(".value")
      .data(array)
      .enter()
      .append("text")
      .attr("class", "value")
      .attr("x", (d, i) => xScale(i) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d) - 5)
      .attr("text-anchor", "middle")
      .text(d => d);
    
    // Add x-axis
    const xAxis = d3.axisBottom(xScale);
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);
    
  }, [array, currentIndex, minIndex, sorted]);
  
  const nextStep = () => {
    if (currentIndex >= array.length - 1) {
      setSorted([...Array(array.length).keys()]);
      return;
    }
    
    let minIdx = currentIndex;
    for (let j = currentIndex + 1; j < array.length; j++) {
      if (array[j] < array[minIdx]) {
        minIdx = j;
      }
    }
    
    setMinIndex(minIdx);
    
    // Swap elements
    const newArray = [...array];
    [newArray[currentIndex], newArray[minIdx]] = [newArray[minIdx], newArray[currentIndex]];
    
    setArray(newArray);
    setSorted([...sorted, currentIndex]);
    setCurrentIndex(currentIndex + 1);
  };
  
  const resetSort = () => {
    setArray([64, 34, 25, 12, 22, 11, 90]);
    setCurrentIndex(0);
    setMinIndex(0);
    setSorted([]);
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      <svg ref={svgRef}></svg>
      <div className="flex gap-4">
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={sorted.length === array.length}
        >
          Next Step
        </button>
        <button
          onClick={resetSort}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
      <div className="text-sm text-gray-600">
        <span className="inline-block w-4 h-4 bg-gray-400 mr-2"></span> Unsorted
        <span className="inline-block w-4 h-4 bg-blue-500 mx-2"></span> Current
        <span className="inline-block w-4 h-4 bg-orange-500 mx-2"></span> Minimum
        <span className="inline-block w-4 h-4 bg-green-500 mx-2"></span> Sorted
      </div>
    </div>
  );
};

export default SelectionSortViz;