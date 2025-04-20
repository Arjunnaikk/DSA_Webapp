"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";

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
  discoveryTime?: number; // For DFS
  finishTime?: number; // For DFS
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

interface DFSState {
  currentStep: number;
  visited: string[];
  stack: string[];
  currentNode: string | null;
  exploringEdge: { source: string; target: string } | null;
  completed: boolean;
}

const DFSVisualization: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [nodeCount, setNodeCount] = useState<number>(6);
  const [graph, setGraph] = useState<Graph>(createRandomGraph(6));
  const [dfsStates, setDfsStates] = useState<DFSState[]>([]);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [startNode, setStartNode] = useState("A");

  // Create a random graph with specified node count
  function createRandomGraph(count: number): Graph {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // DFS-optimized 4-level hierarchy
    const levels = 4;
    const rootNodeY = margin.top + 50;
    const levelHeight = (height - margin.top - margin.bottom - 100) / levels;
    const maxBranches = 2; // Fewer branches for clearer DFS paths

    // Create root node (Level 0)
    nodes.push({
      id: letters[0],
      x: width / 2,
      y: rootNodeY,
      visited: false,
      level: 0,
      parent: null,
    });

    // Track nodes at each level
    const levelNodes: number[][] = [[0]]; // Level 0 contains root
    let nodeIndex = 1;

    // Create nodes for levels 1-3 with DFS-friendly structure
    for (let level = 1; level < levels && nodeIndex < count; level++) {
      levelNodes[level] = [];
      const parentLevel = level - 1;
      const levelY = rootNodeY + level * levelHeight;

      // Calculate positions - DFS prefers deeper paths
      const nodesInLevel = Math.min(
        count - nodeIndex,
        levelNodes[parentLevel].length * maxBranches
      );
      const nodeSpacing = width / (nodesInLevel + 1);

      for (let i = 0; i < nodesInLevel && nodeIndex < count; i++) {
        const parentIdx = Math.floor(i / maxBranches);
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

        // Create primary edge
        edges.push({
          source: letters[parentNodeIdx],
          target: letters[nodeIndex],
          visited: false,
        });

        levelNodes[level].push(nodeIndex);
        nodeIndex++;
      }
    }

    // Add DFS-specific connections only if levels exist
    if (levelNodes.length > 3 && levelNodes[2] && levelNodes[2].length > 0) {
      // 1. Cross edges (show backtracking)
      if (levelNodes[1] && levelNodes[1].length > 0) {
        edges.push({
          source: letters[levelNodes[2][0]],
          target: letters[levelNodes[1][0]],
          visited: false,
        });
      }

      // 2. Forward edges (show deeper exploration)
      if (
        levelNodes[3] &&
        levelNodes[3].length > 1 &&
        levelNodes[1] &&
        levelNodes[1].length > 0
      ) {
        edges.push({
          source: letters[levelNodes[1][0]],
          target: letters[levelNodes[3][1]],
          visited: false,
        });
      }

      // 3. Self-loop on one node (optional)
      if (levelNodes[3] && levelNodes[3].length > 0) {
        edges.push({
          source: letters[levelNodes[3][0]],
          target: letters[levelNodes[3][0]],
          visited: false,
        });
      }
    }

    // Add discovery/finish time visualization markers
    nodes.forEach((node) => {
      node.discoveryTime = 0;
      node.finishTime = 0;
    });

    return { nodes, edges };
  }

  // Simulate DFS and generate all states
  function simulateDFS(): DFSState[] {
    const states: DFSState[] = [];
    const visited = new Set<string>();
    const stack: string[] = [startNode];
    const inStack = new Set<string>([startNode]); // Track nodes currently in stack
    const parents: Record<string, string | null> = { [startNode]: null };

    // Initial state
    states.push({
      currentStep: 0,
      visited: Array.from(visited),
      stack: [...stack],
      currentNode: null,
      exploringEdge: null,
      completed: false,
    });

    let step = 1;

    while (stack.length > 0) {
      const currentNode = stack.pop()!;
      inStack.delete(currentNode);

      if (!visited.has(currentNode)) {
        visited.add(currentNode);

        // State when we visit a node
        states.push({
          currentStep: step++,
          visited: Array.from(visited),
          stack: [...stack],
          currentNode,
          exploringEdge: null,
          completed: false,
        });

        // Get all neighbors in reverse order to maintain left-to-right exploration
        // Get neighbors in reverse order
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
          )
          .reverse();

        for (const neighbor of neighbors) {
          parents[neighbor] = currentNode;

          // State: Edge exploration
          states.push({
            currentStep: states.length,
            visited: [...visited],
            stack: [...stack],
            currentNode,
            exploringEdge: { source: currentNode, target: neighbor },
            completed: false,
          });

          if (!inStack.has(neighbor)) {
            // Only push if not already in stack
            stack.push(neighbor);
            inStack.add(neighbor);

            // State: Node added to stack
            states.push({
              currentStep: states.length,
              visited: [...visited],
              stack: [...stack],
              currentNode,
              exploringEdge: null,
              completed: false,
            });
          }
        }

        // State: Node processing complete
        states.push({
          currentStep: states.length,
          visited: [...visited],
          stack: [...stack],
          currentNode: null, // Clear current
          exploringEdge: null,
          completed: false,
        });
      }
    }

    // Final state
    if (states.length > 0) {
      states[states.length - 1].completed = true;
    }

    return states;
  }

  // Initialize DFS states
  useEffect(() => {
    const states = simulateDFS();
    setDfsStates(states);
    setCurrentStateIndex(0);
  }, [graph, startNode]);

  // Animation effect
  useEffect(() => {
    if (!svgRef.current || dfsStates.length === 0) return;

    const currentState = dfsStates[currentStateIndex];
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const currentPath: string[] = [];
    let currentNode = currentState.currentNode;
    while (currentNode) {
      currentPath.push(currentNode);
      const parentEdge = graph.edges.find((e) => e.target === currentNode);
      currentNode = parentEdge?.source || null;
    }

    // Create scales
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(["unvisited", "visited", "current", "stack"])
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
        if (currentState.stack.includes(d.id)) return colorScale("stack");
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

    // Add stack visualization
    const stackGroup = svg
      .append("g")
      .attr("class", "stack")
      .attr("transform", `translate(${width - 300}, 10)`);

    stackGroup
      .append("rect")
      .attr("width", 130)
      .attr("height", 30)
      .attr("fill", "#f0f0f0")
      .attr("stroke", "#333")
      .attr("rx", 5);

    stackGroup
      .append("text")
      .attr("x", 65)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text("Stack");

    const stackItems = stackGroup
      .selectAll(".stack-item")
      .data([...currentState.stack].reverse()) // Show stack in correct order
      .enter()
      .append("g")
      .attr("class", "stack-item")
      .attr("transform", (d, i) => `translate(${10 + i * 30}, 60)`);

    stackItems
      .append("circle")
      .attr("r", 15)
      .attr("fill", "#ffd166")
      .attr("stroke", "#333");

    stackItems
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
  }, [currentStateIndex, dfsStates, graph]);

  function getStatusText(state: DFSState): string {
    if (state.completed) return "DFS Traversal Complete!";
    if (state.exploringEdge) {
      return `Exploring edge ${state.exploringEdge.source}-${state.exploringEdge.target}`;
    }
    if (state.currentNode) {
      return `Processing node ${state.currentNode}`;
    }
    return "Starting DFS traversal...";
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
    if (currentStateIndex < dfsStates.length - 1) {
      setIsAnimating(true);
      setCurrentStateIndex(currentStateIndex + 1);
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
    if (!isPlaying || currentStateIndex >= dfsStates.length - 1) {
      setIsPlaying(false);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    const timer = setTimeout(() => {
      setCurrentStateIndex((prev) => {
        const newIndex = Math.min(prev + 1, dfsStates.length - 1);
        if (newIndex >= dfsStates.length - 1) {
          setIsAnimating(false);
        }
        return newIndex;
      });
    }, 1000 / speed);

    return () => {
      clearTimeout(timer);
      setIsAnimating(false);
    };
  }, [isPlaying, currentStateIndex, dfsStates.length, speed]);

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
            disabled={currentStateIndex >= dfsStates.length - 1}
            size="icon"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={currentStateIndex >= dfsStates.length - 1}
          size="icon"
          variant="outline"
        >
          <ChevronLast className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DFSVisualization;
