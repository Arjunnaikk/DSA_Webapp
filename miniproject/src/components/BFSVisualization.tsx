"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Button } from "@/components/ui/button";
import DraggableCard from "./DraggableCard";
import { Code } from "lucide-react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";

// Dimensions
const width = 1450;
const height = 500;
const margin = { top: 20, right: 20, bottom: 20, left: 20 };

interface Node {
  id: string;
  x: number;
  y: number;
  visited: boolean;
  level: number;
  parent: string | null;
}

interface Edge {
  source: string;
  target: string;
  visited: boolean;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
}

interface BFSState {
  currentStep: number;
  visited: string[];
  queue: string[];
  currentNode: string | null;
  exploringEdge: { source: string; target: string } | null;
  phase: 'init' | 'dequeue' | 'check' | 'explore' | 'enqueue' | 'found' | 'notFound';
  completed: boolean;
}

const BFSVisualization: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodeCount, setNodeCount] = useState<number>(6); // Default number of nodes
  const [isAnimating, setIsAnimating] = useState(false);
  const [graph, setGraph] = useState<Graph>(createRandomGraph(6));
  const [bfsStates, setBfsStates] = useState<BFSState[]>([]);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const [showRuntimeCode, setShowRuntimeCode] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [startNode, setStartNode] = useState("A");

  const currentAlgo = `function bfs(graph, startNode) {
    // Initialize queue with starting node
    const queue = [startNode];
    // Track visited nodes
    const visited = new Set();
    visited.add(startNode);
    
    while (queue.length > 0) {
      // Dequeue the first node
      const currentNode = queue.shift();
      
      // Process the current node (e.g., check if it's the target)
      if (currentNode === targetNode) {
        return currentNode; // Found the target
      }
      
      // Explore neighbors
      for (const neighbor of graph[currentNode]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    
    return null; // Target not found
  }`;

  const states: BFSState[] = [];

  function createRandomGraph(count: number): Graph {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Fixed 4-level hierarchy parameters
    const levels = 4;
    const rootNodeY = margin.top + 50;
    const levelHeight = (height - margin.top - margin.bottom - 100) / levels;
    const maxChildNodes = 3; // Maximum children per node

    // Create root node at the top center (Level 0)
    nodes.push({
      id: letters[0],
      x: width / 2,
      y: rootNodeY,
      visited: false,
      level: 0,
      parent: null,
    });

    // Track nodes at each level
    const levelNodes: number[][] = [[0]]; // Level 0 has just the root node
    let nodeIndex = 1;

    // Create nodes for levels 1 through 3
    for (let level = 1; level < levels && nodeIndex < count; level++) {
      levelNodes[level] = [];
      const parentLevel = level - 1;
      const levelY = rootNodeY + level * levelHeight;

      // Calculate positions for this level
      const nodesInLevel = Math.min(
        count - nodeIndex,
        levelNodes[parentLevel].length * maxChildNodes
      );
      const nodeSpacing = width / (nodesInLevel + 1);

      for (let i = 0; i < nodesInLevel && nodeIndex < count; i++) {
        const parentIdx = Math.floor(i / maxChildNodes);
        const parentNodeIdx = levelNodes[parentLevel][parentIdx];
        const x = margin.left + (i + 1) * nodeSpacing;

        nodes.push({
          id: letters[nodeIndex],
          x,
          y: levelY,
          visited: false,
          level: level,
          parent: letters[parentNodeIdx],
        });

        // Create edge from parent
        edges.push({
          source: letters[parentNodeIdx],
          target: letters[nodeIndex],
          visited: false,
        });

        levelNodes[level].push(nodeIndex);
        nodeIndex++;
      }
    }

    // Distribute remaining nodes (if any) across the levels
    while (nodeIndex < count) {
      // Find level with fewest nodes (but not level 0)
      let targetLevel = 1;
      for (let level = 2; level < levels; level++) {
        if (levelNodes[level].length < levelNodes[targetLevel].length) {
          targetLevel = level;
        }
      }

      const levelY = rootNodeY + targetLevel * levelHeight;
      const parentLevel = targetLevel - 1;
      const parentNodeIdx =
        levelNodes[parentLevel][
          Math.floor(Math.random() * levelNodes[parentLevel].length)
        ];

      // Find position between existing nodes
      const existingX = levelNodes[targetLevel].map((idx) => nodes[idx].x);
      const minX = Math.min(...existingX, width);
      const maxX = Math.max(...existingX, 0);
      const x = minX + (maxX - minX) * 0.5 * (0.5 + Math.random() * 0.5);
      

      nodes.push({
        id: letters[nodeIndex],
        x,
        y: levelY,
        visited: false,
        level: targetLevel,
        parent: letters[parentNodeIdx],
      });

      edges.push({
        source: letters[parentNodeIdx],
        target: letters[nodeIndex],
        visited: false,
      });

      levelNodes[targetLevel].push(nodeIndex);
      nodeIndex++;
    }

    // Add some random cross edges (optional)
    const extraEdges = Math.floor(count * 0.2);
    for (let i = 0; i < extraEdges; i++) {
      const sourceIdx = Math.floor(Math.random() * (count - 1));
      const targetIdx =
        Math.floor(Math.random() * (count - sourceIdx - 1)) + sourceIdx + 1;

      if (
        nodes[sourceIdx].level !== nodes[targetIdx].level &&
        !edges.some(
          (e) =>
            (e.source === letters[sourceIdx] &&
              e.target === letters[targetIdx]) ||
            (e.source === letters[targetIdx] && e.target === letters[sourceIdx])
        )
      ) {
        edges.push({
          source: letters[sourceIdx],
          target: letters[targetIdx],
          visited: false,
        });
      }
    }

    return { nodes, edges };
  }
  // Simulate BFS and generate all states
  function simulateBFS(): BFSState[] {
    
    const visited = new Set<string>();
    const queue = new Set<string>([startNode]);
    const nodeLevels: Record<string, number> = { [startNode]: 0 };
    const parents: Record<string, string | null> = { [startNode]: null };
  
    // Initial state - INIT phase
    states.push({
      currentStep: 0,
      visited: Array.from(visited),
      queue: Array.from(queue),
      currentNode: null,
      exploringEdge: null,
      completed: false,
      phase: 'init', // Initialization phase
    });
  
    let step = 1;
  
    while (queue.size > 0) {
      // Get first item from queue (FIFO) - DEQUEUE phase
      const currentNode = queue.values().next().value;
      queue.delete(currentNode);
      visited.add(currentNode);
  
      // State when we dequeue a node - DEQUEUE phase
      states.push({
        currentStep: step++,
        visited: Array.from(visited),
        queue: Array.from(queue),
        currentNode,
        exploringEdge: null,
        completed: false,
        phase: 'dequeue',
      });
  
      // // Check if current node is target - CHECK phase
      // if (currentNode === targetNode) {
      //   states.push({
      //     currentStep: step++,
      //     visited: Array.from(visited),
      //     queue: Array.from(queue),
      //     currentNode,
      //     exploringEdge: null,
      //     completed: true,
      //     phase: 'found',
      //   });
      //   return states;
      // }
  
      // Find all neighbors
      const neighbors = graph.edges
        .filter(
          (edge) =>
            (edge.source === currentNode || edge.target === currentNode) &&
            !visited.has(
              edge.source === currentNode ? edge.target : edge.source
            )
        )
        .map((edge) =>
          edge.source === currentNode ? edge.target : edge.source
        );
  
      for (const neighbor of neighbors) {
        // State when we explore an edge - EXPLORE phase
        states.push({
          currentStep: step++,
          visited: Array.from(visited),
          queue: Array.from(queue),
          currentNode,
          exploringEdge: { source: currentNode, target: neighbor },
          completed: false,
          phase: 'explore',
        });
  
        if (!visited.has(neighbor)) {
          nodeLevels[neighbor] = nodeLevels[currentNode] + 1;
          parents[neighbor] = currentNode;
          queue.add(neighbor);
  
          // State after adding to queue - ENQUEUE phase
          states.push({
            currentStep: step++,
            visited: Array.from(visited),
            queue: Array.from(queue),
            currentNode,
            exploringEdge: null,
            completed: false,
            phase: 'enqueue',
          });
        }
      }
    }
  
    // Final completed state - NOT_FOUND phase
    if (states.length > 0) {
      states[states.length - 1].completed = true;
      states[states.length - 1].phase = 'notFound';
    }
    return states;
  }
  // Initialize BFS states
  useEffect(() => {
    const states = simulateBFS();
    setBfsStates(states);
    setCurrentStateIndex(0);
  }, [graph, startNode]);

  // Animation effect
  useEffect(() => {
    if (!svgRef.current || bfsStates.length === 0) return;

    const currentState = bfsStates[currentStateIndex];
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create scales
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(["unvisited", "visited", "current", "queued"])
      .range(["#6c5ce7", "#4ADE80", "#ff6b6b", "#ffd166"]);

    // Draw edges
    svg
      .selectAll(".edge")
      .data(graph.edges)
      .enter()
      .append("line")
      .attr("class", "edge")
      .attr("x1", (d) => {
        const source = graph.nodes.find((n) => n.id === d.source)!;
        return source.x;
      })
      .attr("y1", (d) => {
        const source = graph.nodes.find((n) => n.id === d.source)!;
        return source.y;
      })
      .attr("x2", (d) => {
        const target = graph.nodes.find((n) => n.id === d.target)!;
        return target.x;
      })
      .attr("y2", (d) => {
        const target = graph.nodes.find((n) => n.id === d.target)!;
        return target.y;
      })
      .attr("stroke", (d) => {
        if (
          currentState.exploringEdge &&
          ((d.source === currentState.exploringEdge.source &&
            d.target === currentState.exploringEdge.target) ||
            (d.source === currentState.exploringEdge.target &&
              d.target === currentState.exploringEdge.source))
        ) {
          return "#ff6b6b";
        }
        return "#ccc";
      })
      .attr("stroke-width", (d) => {
        if (
          currentState.exploringEdge &&
          ((d.source === currentState.exploringEdge.source &&
            d.target === currentState.exploringEdge.target) ||
            (d.source === currentState.exploringEdge.target &&
              d.target === currentState.exploringEdge.source))
        ) {
          return 3;
        }
        return 1;
      });

    // Draw nodes
    svg
      .selectAll(".node")
      .data(graph.nodes)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 20)
      .attr("fill", (d) => {
        if (d.id === currentState.currentNode) return colorScale("current");
        if (currentState.visited.includes(d.id)) return colorScale("visited");
        if (currentState.queue.includes(d.id)) return colorScale("queued");
        return colorScale("unvisited");
      })
      .attr("stroke", "#333")
      .attr("stroke-width", 2);

    // Add node labels
    svg
      .selectAll(".node-label")
      .data(graph.nodes)
      .enter()
      .append("text")
      .attr("class", "node-label")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#fff")
      .text((d) => d.id);

    // Add queue visualization
    const queueGroup = svg
      .append("g")
      .attr("class", "queue")
      .attr("transform", `translate(${width - 300}, 10)`);

    queueGroup
      .append("rect")
      .attr("width", 130)
      .attr("height", 30)
      .attr("fill", "#f0f0f0")
      .attr("stroke", "#333")
      .attr("rx", 5);

    queueGroup
      .append("text")
      .attr("x", 65)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text("Queue");

    const queueItems = queueGroup
      .selectAll(".queue-item")
      .data(currentState.queue)
      .enter()
      .append("g")
      .attr("class", "queue-item")
      .attr("transform", (d, i) => `translate(${10 + i * 30}, 60)`);

    queueItems
      .append("circle")
      .attr("r", 15)
      .attr("fill", "#ffd166")
      .attr("stroke", "#333");

    queueItems
      .append("text")
      .attr("y", 5)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text((d) => d);

    // Add visited nodes visualization
    const visitedGroup = svg
      .append("g")
      .attr("class", "visited")
      .attr("transform", `translate(${width - 300}, 100)`);

    visitedGroup
      .append("rect")
      .attr("width", 130)
      .attr("height", 30)
      .attr("fill", "#f0f0f0")
      .attr("stroke", "#333")
      .attr("rx", 5);

    visitedGroup
      .append("text")
      .attr("x", 65)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text("Visited");

    const visitedItems = visitedGroup
      .selectAll(".visited-item")
      .data(currentState.visited)
      .enter()
      .append("g")
      .attr("class", "visited-item")
      .attr("transform", (d, i) => `translate(${10 + i * 30}, 60)`);

    visitedItems
      .append("circle")
      .attr("r", 15)
      .attr("fill", "#4ADE80")
      .attr("stroke", "#333");

    visitedItems
      .append("text")
      .attr("y", 5)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text((d) => d);

    // Add status text
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .text(getStatusText(currentState));
  }, [currentStateIndex, bfsStates, graph]);

  function getStatusText(state: BFSState): string {
    if (state.completed) return "BFS Traversal Complete!";
    if (state.exploringEdge) {
      return `Exploring edge ${state.exploringEdge.source}-${state.exploringEdge.target}`;
    }
    if (state.currentNode) {
      return `Processing node ${state.currentNode}`;
    }
    return "Starting BFS traversal...";
  }

  const handlePlay = () => {
    setIsPlaying(true);
    setIsAnimating(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    setIsAnimating(false);
  };

  const handleNext = () => {
    if (currentStateIndex < bfsStates.length - 1) {
      setIsAnimating(true);
      setCurrentStateIndex(currentStateIndex + 1);
      // Use setTimeout to allow animation to complete
      setTimeout(() => setIsAnimating(false), 1000 / speed);
    }
  };

  const handlePrevious = () => {
    if (currentStateIndex > 0) {
      setIsAnimating(true);
      setCurrentStateIndex(currentStateIndex - 1);
      setTimeout(() => setIsAnimating(false), 1000 / speed);
    }
  };

  const handleReset = () => {
    setCurrentStateIndex(0);
    setIsPlaying(false);
  };

  const handleGenerateNewGraph = () => {
    setGraph(createRandomGraph(nodeCount));
    setIsPlaying(false);
  };

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || currentStateIndex >= bfsStates.length - 1) {
      setIsPlaying(false);
      setIsAnimating(false); // Reset animating state when done
      return;
    }

    setIsAnimating(true); // Set animating when starting
    const timer = setTimeout(() => {
      setCurrentStateIndex((prev) => {
        const newIndex = Math.min(prev + 1, bfsStates.length - 1);
        if (newIndex >= bfsStates.length - 1) {
          setIsAnimating(false); // Reset when reaching end
        }
        return newIndex;
      });
    }, 1000 / speed);

    return () => {
      clearTimeout(timer);
      setIsAnimating(false); // Clean up
    };
  }, [isPlaying, currentStateIndex, bfsStates.length, speed]);

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="relative overflow-hidden">
        <svg ref={svgRef} width={width} height={height} className=""></svg>
      </div>

      <div className="flex gap-4 items-center">
        <label className="flex items-center gap-2">
          Nodes:
          <input
            type="number"
            min="2"
            max="20"
            value={nodeCount}
            onChange={(e) =>
              setNodeCount(
                Math.max(2, Math.min(20, parseInt(e.target.value) || 2))
              )
            }
            className="border rounded px-2 py-1 w-16"
          />
        </label>
        <label className="flex items-center gap-2">
          Start Node:
          <select
            value={startNode}
            onChange={(e) => setStartNode(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {graph.nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.id}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={handleGenerateNewGraph} variant="outline">
          Generate New Graph
        </Button>
      </div>

      <div className="flex gap-4 items-center mt-2">
        <Button onClick={handleReset} size="icon" variant="outline">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          onClick={handlePrevious}
          disabled={currentStateIndex === 0}
          size="icon"
          variant="outline"
        >
          <ChevronFirst className="h-4 w-4" />
        </Button>
        {isPlaying ? (
          <Button onClick={handlePause} size="icon">
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handlePlay}
            disabled={currentStateIndex >= bfsStates.length - 1}
            size="icon"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={currentStateIndex >= bfsStates.length - 1}
          size="icon"
          variant="outline"
        >
          <ChevronLast className="h-4 w-4" />
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setShowCode(!showCode)}
              className="h-10 w-21 px-4 bg-black hover:bg-indigo-700 text-white font-medium text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <Code className="h-6 w-6 mr-0" />
              Code
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle Code View</p>
          </TooltipContent>
        </Tooltip>

        {/* <DraggableCard
          showCode={showCode}
          showRuntimeCode={showRuntimeCode}
          currentAlgo={currentAlgo}
          currentLine={
            state.phase === "init"
              ? [0, 1] // Initialization phase
              : state.phase === "dequeue"
              ? [4, 5] // Dequeue phase
              : state.phase === "check"
              ? [6, 7] // Checking if target
              : state.phase === "explore"
              ? [9, 10] // Exploring neighbors
              : state.phase === "enqueue"
              ? [11, 12] // Enqueueing neighbors
              : [] // No highlight
          }
        /> */}
      </div>
    </div>
  );
};

export default BFSVisualization;
