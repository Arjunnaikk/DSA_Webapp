"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { RotateCcw, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import DraggableCard from "./DraggableCard";

interface Node {
  id: string;
  value: string;
  next: string | null;
}

interface LinkedListState {
  nodes: Node[];
  head: string | null;
  tail: string | null;
  operation: "insert" | "delete" | "search" | "idle";
  isAnimating: boolean;
  highlightNode?: string;
  highlightArrow?: string;
  tempNode?: {
    id: string;
    value: string;
    x: number;
    y: number;
    opacity: number;
  };
  newArrow?: {
    from: string;
    to: string;
    progress: number;
  };
  removeArrow?: {
    from: string;
    to: string;
    progress: number;
  };
}

const LinkedListViz: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [positionValue, setPositionValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [showInsertPopup, setShowInsertPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [insertPosition, setInsertPosition] = useState<
    "start" | "end" | "between"
  >("start");
  const [deletePosition, setDeletePosition] = useState<
    "start" | "end" | "between"
  >("start");
  const [showRuntimeCode, setShowRuntimeCode] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [operationMessage, setOperationMessage] = useState(
    "Linked List Operations"
  );

  // Initialize with sample nodes
  const initialNodes: Node[] = [
    { id: "node-0", value: "61", next: "node-1" },
    { id: "node-1", value: "22", next: "node-2" },
    { id: "node-2", value: "39", next: "node-3" },
    { id: "node-3", value: "77", next: null },
  ];

  const [state, setState] = useState<LinkedListState>({
    nodes: initialNodes,
    head: "node-0",
    tail: "node-3",
    operation: "idle",
    isAnimating: false,
  });

  const width = 1200;
  const height = 500;
  const margin = { top: 50, right: 50, bottom: 80, left: 50 };
  const nodeWidth = 80;
  const nodeHeight = 60;
  const arrowLength = 50;
  const centerY = height / 2;
  const animationDuration = 1000;

  const currentAlgo = `CLASS Node:
    PROPERTY value, next = null

CLASS LinkedList:
    PROPERTY head = null

    FUNCTION insertStart(value):
        Create newNode with value
        Set newNode.next to current head
        Set head to newNode

    FUNCTION insertEnd(value):
        IF head is null THEN set head to new Node with value and RETURN
        Find last node by traversing list
        Set last node's next to new Node with value

    FUNCTION deleteStart():
        IF head exists THEN set head to head.next

    FUNCTION deleteEnd():
        IF head is null THEN RETURN
        IF head.next is null THEN set head to null and RETURN
        Find second-to-last node
        Set second-to-last node's next to null

    FUNCTION search(value):
        Traverse list, return true if value found, false otherwise
        
        `;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Draw nodes and arrows
    let currentX = margin.left;
    let currentNodeId = state.head;
    let nodePositions: Record<string, { x: number; y: number }> = {};

    // First pass: Calculate and draw all nodes to get their positions
    while (currentNodeId) {
      const node = state.nodes.find((n) => n.id === currentNodeId);
      if (!node) break;

      const isHighlighted = state.highlightNode === node.id;
      const isHead = node.id === state.head;
      const isTail = node.id === state.tail;

      // Store node position for arrow drawing
      nodePositions[node.id] = {
        x: currentX,
        y: centerY,
      };

      // Draw node (only if it's not the temp node)
      if (!state.tempNode || node.id !== state.tempNode.id) {
        svg
          .append("rect")
          .attr("x", currentX)
          .attr("y", centerY - nodeHeight / 2)
          .attr("width", nodeWidth)
          .attr("height", nodeHeight)
          .attr("rx", 4)
          .attr(
            "fill",
            isHighlighted ? "#FCD34D" : isHead ? "#4ADE80" : "#60A5FA"
          )
          .attr("stroke", "#E5E7EB")
          .attr("stroke-width", 2);

        // Draw node value
        svg
          .append("text")
          .attr("x", currentX + nodeWidth / 2)
          .attr("y", centerY)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "white")
          .attr("font-weight", "bold")
          .text(node.value);

        // Draw node labels
        if (isHead) {
          svg
            .append("text")
            .attr("x", currentX + nodeWidth / 2)
            .attr("y", centerY - nodeHeight / 2 - 10)
            .attr("text-anchor", "middle")
            .attr("fill", "#16A34A")
            .text("head");
        }
        if (isTail) {
          svg
            .append("text")
            .attr("x", currentX + nodeWidth / 2)
            .attr("y", centerY + nodeHeight / 2 + 20)
            .attr("text-anchor", "middle")
            .attr("fill", "#16A34A")
            .text("tail");
        }
      }

      currentX += nodeWidth + arrowLength;
      currentNodeId = node.next;
    }

    // Second pass: Draw all arrows (except the one being removed)
    currentNodeId = state.head;
    while (currentNodeId) {
      const node = state.nodes.find((n) => n.id === currentNodeId);
      if (!node || !node.next) break;

      const startPosition = nodePositions[node.id];
      const endPosition = nodePositions[node.next];

      // Skip drawing if this is the arrow being removed
      if (
        state.removeArrow &&
        state.removeArrow.from === node.id &&
        state.removeArrow.to === node.next
      ) {
        currentNodeId = node.next;
        continue;
      }

      if (startPosition && endPosition) {
        const arrowStartX = startPosition.x + nodeWidth;
        const arrowEndX = endPosition.x;

        // Check if this is a new arrow being drawn
        const isNewArrow =
          state.newArrow?.from === node.id && state.newArrow?.to === node.next;

        const arrowProgress = isNewArrow ? state.newArrow.progress : 1;

        // Arrow line
        svg
          .append("line")
          .attr("x1", arrowStartX)
          .attr("y1", startPosition.y)
          .attr("x2", arrowStartX + (arrowEndX - arrowStartX) * arrowProgress)
          .attr("y2", endPosition.y)
          .attr("stroke", isNewArrow ? "#F59E0B" : "#6B7280")
          .attr("stroke-width", 2)
          .attr("marker-end", arrowProgress === 1 ? "url(#arrowhead)" : "");

        // Arrow head marker
        svg
          .append("defs")
          .append("marker")
          .attr("id", "arrowhead")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 10)
          .attr("refY", 0)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-5L10,0L0,5")
          .attr("fill", isNewArrow ? "#F59E0B" : "#6B7280");
      }

      currentNodeId = node.next;
    }

    // Draw the arrow being removed (with fade out effect)
    if (state.removeArrow) {
      const startPosition = nodePositions[state.removeArrow.from];
      const endPosition = nodePositions[state.removeArrow.to];

      if (startPosition && endPosition) {
        const arrowStartX = startPosition.x + nodeWidth;
        const arrowEndX = endPosition.x;

        svg
          .append("line")
          .attr("x1", arrowStartX)
          .attr("y1", startPosition.y)
          .attr("x2", arrowEndX)
          .attr("y2", endPosition.y)
          .attr("stroke", "#6B7280")
          .attr("stroke-width", 2)
          .attr("opacity", 1 - state.removeArrow.progress)
          .attr("marker-end", "url(#fading-arrowhead)");

        // Fading arrow head marker
        svg
          .append("defs")
          .append("marker")
          .attr("id", "fading-arrowhead")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 10)
          .attr("refY", 0)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-5L10,0L0,5")
          .attr("fill", "#6B7280")
          .attr("opacity", 1 - state.removeArrow.progress);
      }
    }

    // Draw special arrows for animation (connecting to/from temp node)
    if (state.newArrow) {
      let startX, startY, endX, endY;

      // Find start position (could be regular node or temp node)
      if (nodePositions[state.newArrow.from]) {
        startX = nodePositions[state.newArrow.from].x + nodeWidth;
        startY = nodePositions[state.newArrow.from].y;
      } else if (state.tempNode && state.tempNode.id === state.newArrow.from) {
        startX = state.tempNode.x + nodeWidth;
        startY = state.tempNode.y + nodeHeight / 2;
      }

      // Find end position (could be regular node or temp node)
      if (nodePositions[state.newArrow.to]) {
        endX = nodePositions[state.newArrow.to].x;
        endY = nodePositions[state.newArrow.to].y;
      } else if (state.tempNode && state.tempNode.id === state.newArrow.to) {
        endX = state.tempNode.x;
        endY = state.tempNode.y + nodeHeight / 2;
      }

      if (startX !== undefined && endX !== undefined) {
        // Calculate the progress of the arrow
        const actualEndX = startX + (endX - startX) * state.newArrow.progress;
        const actualEndY = startY + (endY - startY) * state.newArrow.progress;

        // Draw the animating arrow
        svg
          .append("line")
          .attr("x1", startX)
          .attr("y1", startY)
          .attr("x2", actualEndX)
          .attr("y2", actualEndY)
          .attr("stroke", "#F59E0B")
          .attr("stroke-width", 2)
          .attr(
            "marker-end",
            state.newArrow.progress === 1 ? "url(#animarrow)" : ""
          );

        // Arrow head marker for animation
        svg
          .append("defs")
          .append("marker")
          .attr("id", "animarrow")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 10)
          .attr("refY", 0)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-5L10,0L0,5")
          .attr("fill", "#F59E0B");
      }
    }

    // Draw temp node (for animations)
    if (state.tempNode) {
      svg
        .append("rect")
        .attr("x", state.tempNode.x)
        .attr("y", state.tempNode.y)
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr("rx", 4)
        .attr("fill", "#FCD34D")
        .attr("stroke", "#E5E7EB")
        .attr("stroke-width", 2)
        .attr(
          "opacity",
          state.tempNode.opacity !== undefined ? state.tempNode.opacity : 1
        );

      svg
        .append("text")
        .attr("x", state.tempNode.x + nodeWidth / 2)
        .attr("y", state.tempNode.y + nodeHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr(
          "opacity",
          state.tempNode.opacity !== undefined ? state.tempNode.opacity : 1
        )
        .text(state.tempNode.value);
    }

    // Null indicator at end
    if (state.nodes.length > 0 && state.tail) {
      const tailNode = state.nodes.find((n) => n.id === state.tail);
      if (tailNode) {
        const tailX = nodePositions[tailNode.id]?.x || 0;

        svg
          .append("text")
          .attr("x", tailX + nodeWidth + 20)
          .attr("y", centerY)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "#6B7280")
          .text("null");
      }
    }

    // Operation message
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top - 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#4B5563")
      .text(operationMessage);

    // Linked List label
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - margin.bottom + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#6B7280")
      .text("Linked List");
  }, [state, operationMessage]);

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const insertNode = async (position: "start" | "end" | "between") => {
    if (!inputValue.trim()) return;
    if (state.isAnimating) return;

    setState((prev) => ({ ...prev, isAnimating: true, operation: "insert" }));
    setShowInsertPopup(false);

    const newNode: Node = {
      id: `node-${Date.now()}`,
      value: inputValue,
      next: null,
    };

    // Calculate positions and relationships
    let insertIndex = 0;
    let prevNodeId: string | null = null;
    let nextNodeId: string | null = null;
    let oldArrowFrom: string | null = null;
    let oldArrowTo: string | null = null;
    let message = "";

    if (position === "start") {
      insertIndex = 0;
      nextNodeId = state.head;
      newNode.next = nextNodeId;
      message = `Inserting "${inputValue}" at head...`;
    } else if (position === "end") {
      insertIndex = state.nodes.length;
      prevNodeId = state.tail;
      message = `Inserting "${inputValue}" at tail...`;
    } else if (position === "between") {
      const pos = parseInt(positionValue);
      if (isNaN(pos) || pos < 1 || pos > state.nodes.length + 1) {
        setOperationMessage("Invalid position");
        setState((prev) => ({ ...prev, isAnimating: false }));
        return;
      }

      insertIndex = pos - 1;
      if (pos > 1) {
        prevNodeId = state.nodes[pos - 2].id;
        nextNodeId = state.nodes[pos - 2].next;
        newNode.next = nextNodeId;

        // Track the arrow that will be replaced
        oldArrowFrom = prevNodeId;
        oldArrowTo = nextNodeId;
      } else {
        nextNodeId = state.head;
        newNode.next = nextNodeId;
      }
      message = `Inserting "${inputValue}" at position ${pos}...`;
    }

    // Calculate x position for the new node
    const targetX = margin.left + insertIndex * (nodeWidth + arrowLength);
    const elevatedY = centerY - nodeHeight / 2 - 100;
    setOperationMessage(message);

    // PHASE 1: Add the node in elevated position
    setState((prev) => ({
      ...prev,
      tempNode: {
        id: newNode.id,
        value: newNode.value,
        x: targetX,
        y: elevatedY,
        opacity: 1,
      },
      highlightNode: newNode.id,
    }));

    await sleep(500);

    // PHASE 2: If inserting between, animate the old arrow fading out
    if (oldArrowFrom && oldArrowTo) {
      setState((prev) => ({
        ...prev,
        removeArrow: {
          from: oldArrowFrom,
          to: oldArrowTo,
          progress: 0,
        },
      }));

      // Animate the fade out
      for (let i = 0; i <= 10; i++) {
        setState((prev) => ({
          ...prev,
          removeArrow: prev.removeArrow
            ? {
                ...prev.removeArrow,
                progress: i / 10,
              }
            : undefined,
        }));
        await sleep(50);
      }
    }

    // PHASE 3: Connect previous node to new node (if applicable)
    if (prevNodeId) {
      setState((prev) => ({
        ...prev,
        newArrow: {
          from: prevNodeId!,
          to: newNode.id,
          progress: 0,
        },
      }));

      // Slow, smooth arrow animation
      for (let i = 0; i <= 20; i++) {
        setState((prev) => ({
          ...prev,
          newArrow: prev.newArrow
            ? {
                ...prev.newArrow,
                progress: i / 20,
              }
            : undefined,
        }));
        await sleep(100);
      }

      await sleep(500);
    }

    // PHASE 4: Connect new node to next node (if applicable)
    if (nextNodeId) {
      setState((prev) => ({
        ...prev,
        newArrow: {
          from: newNode.id,
          to: nextNodeId!,
          progress: 0,
        },
      }));

      // Slow, smooth arrow animation
      for (let i = 0; i <= 20; i++) {
        setState((prev) => ({
          ...prev,
          newArrow: prev.newArrow
            ? {
                ...prev.newArrow,
                progress: i / 20,
              }
            : undefined,
        }));
        await sleep(100);
      }

      await sleep(500);
    }

    // PHASE 5: Update the actual linked list structure
    let updatedNodes = [...state.nodes];

    if (position === "start") {
      updatedNodes = [newNode, ...updatedNodes];
      setState((prev) => ({
        ...prev,
        nodes: updatedNodes,
        head: newNode.id,
        tail: updatedNodes.length === 1 ? newNode.id : state.tail,
        tempNode: undefined,
        newArrow: undefined,
        removeArrow: undefined,
      }));
    } else if (position === "end") {
      if (prevNodeId) {
        updatedNodes = updatedNodes.map((n) =>
          n.id === prevNodeId ? { ...n, next: newNode.id } : n
        );
        updatedNodes.push(newNode);
      } else {
        updatedNodes = [newNode];
      }

      setState((prev) => ({
        ...prev,
        nodes: updatedNodes,
        head: updatedNodes.length === 1 ? newNode.id : state.head,
        tail: newNode.id,
        tempNode: undefined,
        newArrow: undefined,
        removeArrow: undefined,
      }));
    } else if (position === "between") {
      updatedNodes.splice(insertIndex, 0, newNode);

      // Update previous node's next pointer
      if (insertIndex > 0) {
        updatedNodes[insertIndex - 1] = {
          ...updatedNodes[insertIndex - 1],
          next: newNode.id,
        };
      } else {
        // If inserting at beginning
        setState((prev) => ({
          ...prev,
          head: newNode.id,
        }));
      }

      setState((prev) => ({
        ...prev,
        nodes: updatedNodes,
        tempNode: undefined,
        newArrow: undefined,
        removeArrow: undefined,
      }));
    }

    setOperationMessage(message.replace("Inserting", "Inserted"));
    setInputValue("");
    setPositionValue("");

    await sleep(500);

    setState((prev) => ({
      ...prev,
      isAnimating: false,
      operation: "idle",
      highlightNode: undefined,
    }));
  };

  // ... rest of the component code remains the same

  const deleteNode = async (position: "start" | "end" | "between") => {
    if (state.isAnimating || !state.head) return;

    setState((prev) => ({ ...prev, isAnimating: true, operation: "delete" }));
    setShowDeletePopup(false);

    let nodeToDelete: Node | null = null;
    let prevNode: Node | null = null;
    let message = "";

    if (position === "start") {
      // Delete head
      nodeToDelete = state.nodes.find((n) => n.id === state.head) || null;
      message = `Deleting "${nodeToDelete?.value}" from start...`;
    } else if (position === "end") {
      // Delete tail
      if (state.nodes.length === 1) {
        nodeToDelete = state.nodes[0];
      } else {
        // Find second to last node
        for (const node of state.nodes) {
          if (
            node.next &&
            state.nodes.find((n) => n.id === node.next)?.next === null
          ) {
            prevNode = node;
            nodeToDelete = state.nodes.find((n) => n.id === node.next) || null;
          }
        }
      }
      message = `Deleting "${nodeToDelete?.value}" from end...`;
    } else if (position === "between") {
      // Delete at position
      const pos = parseInt(positionValue) - 1;
      if (isNaN(pos) || pos < 0 || pos >= state.nodes.length) {
        setOperationMessage("Invalid position");
        setState((prev) => ({ ...prev, isAnimating: false }));
        return;
      }

      if (pos === 0) {
        // Same as delete start
        nodeToDelete = state.nodes.find((n) => n.id === state.head) || null;
      } else {
        let currentPos = 0;

        for (const node of state.nodes) {
          if (currentPos === pos - 1) {
            prevNode = node;
            nodeToDelete = state.nodes.find((n) => n.id === node.next) || null;
            break;
          }
          currentPos++;
        }
      }
      message = `Deleting from position ${pos + 1}...`;
    }

    if (!nodeToDelete) {
      setOperationMessage("Node not found");
      setState((prev) => ({ ...prev, isAnimating: false }));
      return;
    }

    setOperationMessage(message);

    // Highlight the node to be deleted
    setState((prev) => ({
      ...prev,
      highlightNode: nodeToDelete?.id,
      highlightArrow: prevNode?.id,
    }));
    await sleep(500);

    // For delete at between, animate arrow change first
    if (prevNode && position === "between") {
      const arrowSteps = 20;
      for (let i = 0; i <= arrowSteps; i++) {
        const progress = i / arrowSteps;
        setState((prev) => ({
          ...prev,
          arrowProgress: 1 - progress, // Reverse animation
        }));
        await sleep(animationDuration / arrowSteps / 2);
      }
    }

    // Animate node moving up (easeInBack for smooth lift)
    const startX =
      margin.left +
      state.nodes.findIndex((n) => n.id === nodeToDelete?.id) *
        (nodeWidth + arrowLength);
    const startY = centerY - nodeHeight / 2;
    const steps = 30;

    setState((prev) => ({
      ...prev,
      tempNode: {
        id: nodeToDelete?.id || "",
        value: nodeToDelete?.value || "",
        x: startX,
        y: startY,
      },
    }));

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const easedProgress = d3.easeBackIn(progress);
      const currentY = startY - 150 * easedProgress;

      setState((prev) => ({
        ...prev,
        tempNode: prev.tempNode
          ? {
              ...prev.tempNode,
              y: currentY,
            }
          : undefined,
      }));
      await sleep(animationDuration / steps);
    }

    // Remove the node from the list
    if (position === "start") {
      setState((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((n) => n.id !== state.head),
        head: nodeToDelete?.next || null,
        tempNode: undefined,
      }));
    } else if (position === "end") {
      if (prevNode) {
        const updatedNodes = state.nodes
          .map((n) => (n.id === prevNode?.id ? { ...n, next: null } : n))
          .filter((n) => n.id !== nodeToDelete?.id);

        setState((prev) => ({
          ...prev,
          nodes: updatedNodes,
          tempNode: undefined,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          nodes: [],
          head: null,
          tempNode: undefined,
        }));
      }
    } else if (position === "between") {
      if (prevNode && nodeToDelete) {
        const updatedNodes = state.nodes
          .map((n) =>
            n.id === prevNode?.id
              ? { ...n, next: nodeToDelete?.next || null }
              : n
          )
          .filter((n) => n.id !== nodeToDelete?.id);

        setState((prev) => ({
          ...prev,
          nodes: updatedNodes,
          tempNode: undefined,
        }));
      }
    }

    setOperationMessage(message.replace("Deleting", "Deleted"));
    setPositionValue("");
    await sleep(500);
    setState((prev) => ({
      ...prev,
      isAnimating: false,
      operation: "idle",
      highlightNode: undefined,
      highlightArrow: undefined,
    }));
  };

  const searchNode = async () => {
    if (!searchValue.trim() || state.isAnimating) return;

    setState((prev) => ({ ...prev, isAnimating: true, operation: "search" }));
    setShowSearchPopup(false);

    let currentNodeId = state.head;
    let found = false;
    let position = 1;

    while (currentNodeId) {
      const node = state.nodes.find((n) => n.id === currentNodeId);
      if (!node) break;

      // Highlight current node during search
      setState((prev) => ({ ...prev, highlightNode: node.id }));
      await sleep(500);

      if (node.value === searchValue) {
        found = true;
        setOperationMessage(`Found "${searchValue}" at position ${position}`);
        await sleep(1000);
        break;
      }

      currentNodeId = node.next;
      position++;
    }

    if (!found) {
      setOperationMessage(`"${searchValue}" not found in list`);
      await sleep(1000);
    }

    setSearchValue("");
    setState((prev) => ({
      ...prev,
      isAnimating: false,
      operation: "idle",
      highlightNode: undefined,
    }));
  };

  const resetList = async () => {
    setState((prev) => ({ ...prev, isAnimating: true }));
    setOperationMessage("Resetting linked list...");

    await sleep(500);

    const newNodes: Node[] = Array.from({ length: 3 }, (_, i) => ({
      id: `node-${i}`,
      value: Math.floor(Math.random() * 90 + 10).toString(),
      next: i < 2 ? `node-${i + 1}` : null,
    }));

    setState({
      nodes: newNodes,
      head: "node-0",
      operation: "idle",
      isAnimating: false,
    });

    setOperationMessage("Linked list reset");
  };
  // (deleteNode, searchNode, resetList, and the JSX return)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg ref={svgRef} width={width} height={height} className="" />
      </div>

      <div className="flex flex-col gap-4 w-full max-w-4xl">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={resetList} size="icon" variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Insert Buttons */}
          <Popover open={showInsertPopup} onOpenChange={setShowInsertPopup}>
            <PopoverTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                Insert
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setInsertPosition("start")}
                    variant={insertPosition === "start" ? "default" : "outline"}
                  >
                    Start
                  </Button>
                  <Button
                    onClick={() => setInsertPosition("end")}
                    variant={insertPosition === "end" ? "default" : "outline"}
                  >
                    End
                  </Button>
                  <Button
                    onClick={() => setInsertPosition("between")}
                    variant={
                      insertPosition === "between" ? "default" : "outline"
                    }
                  >
                    Between
                  </Button>
                </div>

                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter value"
                  autoFocus
                />

                {insertPosition === "between" && (
                  <Input
                    value={positionValue}
                    onChange={(e) => setPositionValue(e.target.value)}
                    placeholder="Position (1-based)"
                    type="number"
                  />
                )}

                <Button
                  onClick={() => insertNode(insertPosition)}
                  disabled={
                    !inputValue.trim() ||
                    (insertPosition === "between" && !positionValue.trim())
                  }
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Insert
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Delete Buttons */}
          <Popover open={showDeletePopup} onOpenChange={setShowDeletePopup}>
            <PopoverTrigger asChild>
              <Button
                disabled={!state.head}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setDeletePosition("start")}
                    variant={deletePosition === "start" ? "default" : "outline"}
                  >
                    Start
                  </Button>
                  <Button
                    onClick={() => setDeletePosition("end")}
                    variant={deletePosition === "end" ? "default" : "outline"}
                  >
                    End
                  </Button>
                  <Button
                    onClick={() => setDeletePosition("between")}
                    variant={
                      deletePosition === "between" ? "default" : "outline"
                    }
                  >
                    Between
                  </Button>
                </div>

                {deletePosition === "between" && (
                  <Input
                    value={positionValue}
                    onChange={(e) => setPositionValue(e.target.value)}
                    placeholder="Position (1-based)"
                    type="number"
                  />
                )}

                <Button
                  onClick={() => deleteNode(deletePosition)}
                  disabled={
                    !state.head ||
                    (deletePosition === "between" && !positionValue.trim())
                  }
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Search Button */}
          <Popover open={showSearchPopup} onOpenChange={setShowSearchPopup}>
            <PopoverTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">Search</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <div className="flex flex-col gap-4">
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Value to search"
                  autoFocus
                />
                <Button
                  onClick={searchNode}
                  disabled={!searchValue.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Search
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Code Button */}
          <Button
            onClick={() => setShowCode(!showCode)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Code className="h-4 w-4 mr-2" />
            Code
          </Button>
        </div>
      </div>

      <DraggableCard
        showCode={showCode}
        showRuntimeCode={showRuntimeCode}
        currentAlgo={currentAlgo}
        currentLine={
          state.operation === "insert"
            ? [7, 8]
            : state.operation === "delete"
            ? [12, 13]
            : state.operation === "search"
            ? [17, 18]
            : []
        }
      />
    </div>
  );
};

export default LinkedListViz;

// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import * as d3 from "d3";
// import { RotateCcw, Code } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import DraggableCard from "./DraggableCard";

// interface Node {
//   id: string;
//   value: string;
//   next: string | null;
// }

// interface LinkedListState {
//   nodes: Node[];
//   head: string | null;
//   tail: string | null;
//   operation: "insert" | "delete" | "search" | "idle";
//   isAnimating: boolean;
//   highlightNode?: string;
//   highlightArrow?: string;
//   tempNode?: {
//     id: string;
//     value: string;
//     x: number;
//     y: number;
//     opacity: number;
//   };
//   newArrow?: {
//     from: string;
//     to: string;
//     progress: number;
//   };
// }

// const LinkedListViz: React.FC = () => {
//   const svgRef = useRef<SVGSVGElement | null>(null);
//   const [inputValue, setInputValue] = useState("");
//   const [positionValue, setPositionValue] = useState("");
//   const [searchValue, setSearchValue] = useState("");
//   const [showInsertPopup, setShowInsertPopup] = useState(false);
//   const [showDeletePopup, setShowDeletePopup] = useState(false);
//   const [showSearchPopup, setShowSearchPopup] = useState(false);
//   const [insertPosition, setInsertPosition] = useState<
//     "start" | "end" | "between"
//   >("start");
//   const [deletePosition, setDeletePosition] = useState<
//     "start" | "end" | "between"
//   >("start");
//   const [showRuntimeCode, setShowRuntimeCode] = useState(true);
//   const [showCode, setShowCode] = useState(false);
//   const [operationMessage, setOperationMessage] = useState(
//     "Linked List Operations"
//   );

//   // Initialize with sample nodes
//   const initialNodes: Node[] = [
//     { id: "node-0", value: "61", next: "node-1" },
//     { id: "node-1", value: "22", next: "node-2" },
//     { id: "node-2", value: "39", next: "node-3" },
//     { id: "node-3", value: "77", next: null },
//   ];

//   const [state, setState] = useState<LinkedListState>({
//     nodes: initialNodes,
//     head: "node-0",
//     tail: "node-3",
//     operation: "idle",
//     isAnimating: false,
//   });

//   const width = 1200;
//   const height = 500;
//   const margin = { top: 50, right: 50, bottom: 80, left: 50 };
//   const nodeWidth = 80;
//   const nodeHeight = 60;
//   const arrowLength = 50;
//   const centerY = height / 2;
//   const animationDuration = 1000;

//   const currentAlgo = `class Node {
//   constructor(value) {
//     this.value = value;
//     this.next = null;
//   }
// }

// class LinkedList {
//   constructor() {
//     this.head = null;
//   }

//   insertStart(value) {
//     const newNode = new Node(value);
//     newNode.next = this.head;
//     this.head = newNode;
//   }

//   insertEnd(value) {
//     // ... implementation
//   }

//   insertAt(value, position) {
//     // ... implementation
//   }

//   deleteStart() {
//     // ... implementation
//   }

//   deleteEnd() {
//     // ... implementation
//   }

//   deleteAt(position) {
//     // ... implementation
//   }

//   search(value) {
//     // ... implementation
//   }
// }`;

//   useEffect(() => {
//     if (!svgRef.current) return;

//     const svg = d3.select(svgRef.current);
//     svg.selectAll("*").remove();

//     // Draw nodes and arrows
//     let currentX = margin.left;
//     let currentNodeId = state.head;
//     let nodePositions: Record<string, { x: number; y: number }> = {};

//     // First pass: Calculate and draw all nodes to get their positions
//     while (currentNodeId) {
//       const node = state.nodes.find((n) => n.id === currentNodeId);
//       if (!node) break;

//       const isHighlighted = state.highlightNode === node.id;
//       const isHead = node.id === state.head;
//       const isTail = node.id === state.tail;

//       // Store node position for arrow drawing
//       nodePositions[node.id] = {
//         x: currentX,
//         y: centerY, // All regular nodes are at centerY
//       };

//       // Draw node (only if it's not the temp node)
//       if (!state.tempNode || node.id !== state.tempNode.id) {
//         svg
//           .append("rect")
//           .attr("x", currentX)
//           .attr("y", centerY - nodeHeight / 2)
//           .attr("width", nodeWidth)
//           .attr("height", nodeHeight)
//           .attr("rx", 4)
//           .attr(
//             "fill",
//             isHighlighted ? "#FCD34D" : isHead ? "#4ADE80" : "#60A5FA"
//           )
//           .attr("stroke", "#E5E7EB")
//           .attr("stroke-width", 2);

//         // Draw node value
//         svg
//           .append("text")
//           .attr("x", currentX + nodeWidth / 2)
//           .attr("y", centerY)
//           .attr("text-anchor", "middle")
//           .attr("dominant-baseline", "middle")
//           .attr("fill", "white")
//           .attr("font-weight", "bold")
//           .text(node.value);

//         // Draw node labels
//         if (isHead) {
//           svg
//             .append("text")
//             .attr("x", currentX + nodeWidth / 2)
//             .attr("y", centerY - nodeHeight / 2 - 10)
//             .attr("text-anchor", "middle")
//             .attr("fill", "#16A34A")
//             .text("head");
//         }
//         if (isTail) {
//           svg
//             .append("text")
//             .attr("x", currentX + nodeWidth / 2)
//             .attr("y", centerY + nodeHeight / 2 + 20)
//             .attr("text-anchor", "middle")
//             .attr("fill", "#16A34A")
//             .text("tail");
//         }
//       }

//       currentX += nodeWidth + arrowLength;
//       currentNodeId = node.next;
//     }

//     // Second pass: Draw all arrows
//     currentNodeId = state.head;
//     while (currentNodeId) {
//       const node = state.nodes.find((n) => n.id === currentNodeId);
//       if (!node || !node.next) break;

//       const startPosition = nodePositions[node.id];
//       const endPosition = nodePositions[node.next];

//       if (startPosition && endPosition) {
//         const arrowStartX = startPosition.x + nodeWidth;
//         const arrowEndX = endPosition.x;

//         // Check if this is a new arrow being drawn
//         const isNewArrow =
//           state.newArrow?.from === node.id && state.newArrow?.to === node.next;

//         const arrowProgress = isNewArrow ? state.newArrow.progress : 1;

//         // Arrow line
//         svg
//           .append("line")
//           .attr("x1", arrowStartX)
//           .attr("y1", startPosition.y)
//           .attr("x2", arrowStartX + (arrowEndX - arrowStartX) * arrowProgress)
//           .attr("y2", endPosition.y)
//           .attr("stroke", isNewArrow ? "#F59E0B" : "#6B7280")
//           .attr("stroke-width", 2)
//           .attr("marker-end", arrowProgress === 1 ? "url(#arrowhead)" : "");

//         // Arrow head marker
//         svg
//           .append("defs")
//           .append("marker")
//           .attr("id", "arrowhead")
//           .attr("viewBox", "0 -5 10 10")
//           .attr("refX", 10)
//           .attr("refY", 0)
//           .attr("markerWidth", 6)
//           .attr("markerHeight", 6)
//           .attr("orient", "auto")
//           .append("path")
//           .attr("d", "M0,-5L10,0L0,5")
//           .attr("fill", isNewArrow ? "#F59E0B" : "#6B7280");
//       }

//       currentNodeId = node.next;
//     }

//     // Draw special arrows for animation (connecting to/from temp node)
//     if (state.newArrow) {
//       let startX, startY, endX, endY;

//       // Find start position (could be regular node or temp node)
//       if (nodePositions[state.newArrow.from]) {
//         startX = nodePositions[state.newArrow.from].x + nodeWidth;
//         startY = nodePositions[state.newArrow.from].y;
//       } else if (state.tempNode && state.tempNode.id === state.newArrow.from) {
//         startX = state.tempNode.x + nodeWidth;
//         startY = state.tempNode.y + nodeHeight / 2;
//       }

//       // Find end position (could be regular node or temp node)
//       if (nodePositions[state.newArrow.to]) {
//         endX = nodePositions[state.newArrow.to].x;
//         endY = nodePositions[state.newArrow.to].y;
//       } else if (state.tempNode && state.tempNode.id === state.newArrow.to) {
//         endX = state.tempNode.x;
//         endY = state.tempNode.y + nodeHeight / 2;
//       }

//       if (startX !== undefined && endX !== undefined) {
//         // Calculate the progress of the arrow
//         const actualEndX = startX + (endX - startX) * state.newArrow.progress;
//         const actualEndY = startY + (endY - startY) * state.newArrow.progress;

//         // Draw the animating arrow
//         svg
//           .append("line")
//           .attr("x1", startX)
//           .attr("y1", startY)
//           .attr("x2", actualEndX)
//           .attr("y2", actualEndY)
//           .attr("stroke", "#F59E0B")
//           .attr("stroke-width", 2)
//           .attr(
//             "marker-end",
//             state.newArrow.progress === 1 ? "url(#animarrow)" : ""
//           );

//         // Arrow head marker for animation
//         svg
//           .append("defs")
//           .append("marker")
//           .attr("id", "animarrow")
//           .attr("viewBox", "0 -5 10 10")
//           .attr("refX", 10)
//           .attr("refY", 0)
//           .attr("markerWidth", 6)
//           .attr("markerHeight", 6)
//           .attr("orient", "auto")
//           .append("path")
//           .attr("d", "M0,-5L10,0L0,5")
//           .attr("fill", "#F59E0B");
//       }
//     }

//     // Draw temp node (for animations) - now positioned above
//     if (state.tempNode) {
//       svg
//         .append("rect")
//         .attr("x", state.tempNode.x)
//         .attr("y", state.tempNode.y)
//         .attr("width", nodeWidth)
//         .attr("height", nodeHeight)
//         .attr("rx", 4)
//         .attr("fill", "#FCD34D") // Highlight color
//         .attr("stroke", "#E5E7EB")
//         .attr("stroke-width", 2)
//         .attr(
//           "opacity",
//           state.tempNode.opacity !== undefined ? state.tempNode.opacity : 1
//         );

//       svg
//         .append("text")
//         .attr("x", state.tempNode.x + nodeWidth / 2)
//         .attr("y", state.tempNode.y + nodeHeight / 2)
//         .attr("text-anchor", "middle")
//         .attr("dominant-baseline", "middle")
//         .attr("fill", "white")
//         .attr("font-weight", "bold")
//         .attr(
//           "opacity",
//           state.tempNode.opacity !== undefined ? state.tempNode.opacity : 1
//         )
//         .text(state.tempNode.value);
//     }

//     // Null indicator at end
//     if (state.nodes.length > 0 && state.tail) {
//       const tailNode = state.nodes.find((n) => n.id === state.tail);
//       if (tailNode) {
//         const tailX = nodePositions[tailNode.id]?.x || 0;

//         svg
//           .append("text")
//           .attr("x", tailX + nodeWidth + 20)
//           .attr("y", centerY)
//           .attr("text-anchor", "middle")
//           .attr("dominant-baseline", "middle")
//           .attr("fill", "#6B7280")
//           .text("null");
//       }
//     }

//     // Operation message
//     svg
//       .append("text")
//       .attr("x", width / 2)
//       .attr("y", margin.top - 20)
//       .attr("text-anchor", "middle")
//       .attr("fill", "#4B5563")
//       .text(operationMessage);

//     // Linked List label
//     svg
//       .append("text")
//       .attr("x", width / 2)
//       .attr("y", height - margin.bottom + 40)
//       .attr("text-anchor", "middle")
//       .attr("fill", "#6B7280")
//       .text("Linked List");
//   }, [state, operationMessage]);

//   const sleep = (ms: number): Promise<void> =>
//     new Promise((resolve) => setTimeout(resolve, ms));

//   // Modified insertNode function with improved animation
//   const insertNode = async (position: "start" | "end" | "between") => {
//     if (!inputValue.trim()) return;
//     if (state.isAnimating) return;

//     setState((prev) => ({ ...prev, isAnimating: true, operation: "insert" }));
//     setShowInsertPopup(false);

//     const newNode: Node = {
//       id: `node-${Date.now()}`,
//       value: inputValue,
//       next: null,
//     };

//     // Calculate positions and relationships
//     let insertIndex = 0;
//     let prevNodeId: string | null = null;
//     let nextNodeId: string | null = null;
//     let message = "";

//     if (position === "start") {
//       insertIndex = 0;
//       nextNodeId = state.head;
//       newNode.next = nextNodeId;
//       message = `Inserting "${inputValue}" at head...`;
//     } else if (position === "end") {
//       insertIndex = state.nodes.length;
//       prevNodeId = state.tail;
//       message = `Inserting "${inputValue}" at tail...`;
//     } else if (position === "between") {
//       const pos = parseInt(positionValue);
//       if (isNaN(pos) || pos < 1 || pos > state.nodes.length + 1) {
//         setOperationMessage("Invalid position");
//         setState((prev) => ({ ...prev, isAnimating: false }));
//         return;
//       }

//       insertIndex = pos - 1;
//       if (pos > 1) {
//         prevNodeId = state.nodes[pos - 2].id;
//         nextNodeId = state.nodes[pos - 2].next;
//         newNode.next = nextNodeId;
//       } else {
//         nextNodeId = state.head;
//         newNode.next = nextNodeId;
//       }
//       message = `Inserting "${inputValue}" at position ${pos}...`;
//     }

//     // Calculate x position for the new node
//     const targetX = margin.left + insertIndex * (nodeWidth + arrowLength);
//     const elevatedY = centerY - nodeHeight / 2 - 100; // Position above the list
//     setOperationMessage(message);

//     // PHASE 1: Add the node in elevated position
//     setState((prev) => ({
//       ...prev,
//       tempNode: {
//         id: newNode.id,
//         value: newNode.value,
//         x: targetX,
//         y: elevatedY,
//         opacity: 1,
//       },
//       highlightNode: newNode.id,
//     }));

//     // Small pause to let the node appear
//     await sleep(500);

//     // PHASE 2: Connect previous node to new node (if applicable)
//     if (prevNodeId) {
//       setState((prev) => ({
//         ...prev,
//         newArrow: {
//           from: prevNodeId!,
//           to: newNode.id,
//           progress: 0,
//         },
//       }));

//       // Slow, smooth arrow animation
//       for (let i = 0; i <= 20; i++) {
//         setState((prev) => ({
//           ...prev,
//           newArrow: prev.newArrow
//             ? {
//                 ...prev.newArrow,
//                 progress: i / 20,
//               }
//             : undefined,
//         }));
//         await sleep(100);
//       }

//       // Let the completed arrow be visible for a moment
//       await sleep(500);
//     }

//     // PHASE 3: Connect new node to next node (if applicable)
//     if (nextNodeId) {
//       setState((prev) => ({
//         ...prev,
//         newArrow: {
//           from: newNode.id,
//           to: nextNodeId!,
//           progress: 0,
//         },
//       }));

//       // Slow, smooth arrow animation
//       for (let i = 0; i <= 20; i++) {
//         setState((prev) => ({
//           ...prev,
//           newArrow: prev.newArrow
//             ? {
//                 ...prev.newArrow,
//                 progress: i / 20,
//               }
//             : undefined,
//         }));
//         await sleep(100);
//       }

//       // Let the completed arrow be visible for a moment
//       await sleep(500);
//     }

//     // PHASE 4: Update the actual linked list structure
//     let updatedNodes = [...state.nodes];

//     if (position === "start") {
//       updatedNodes = [newNode, ...updatedNodes];
//       setState((prev) => ({
//         ...prev,
//         nodes: updatedNodes,
//         head: newNode.id,
//         tail: updatedNodes.length === 1 ? newNode.id : state.tail,
//         tempNode: undefined,
//         newArrow: undefined,
//       }));
//     } else if (position === "end") {
//       if (prevNodeId) {
//         updatedNodes = updatedNodes.map((n) =>
//           n.id === prevNodeId ? { ...n, next: newNode.id } : n
//         );
//         updatedNodes.push(newNode);
//       } else {
//         updatedNodes = [newNode];
//       }

//       setState((prev) => ({
//         ...prev,
//         nodes: updatedNodes,
//         head: updatedNodes.length === 1 ? newNode.id : state.head,
//         tail: newNode.id,
//         tempNode: undefined,
//         newArrow: undefined,
//       }));
//     } else if (position === "between") {
//       updatedNodes.splice(insertIndex, 0, newNode);

//       // Update previous node's next pointer
//       if (insertIndex > 0) {
//         updatedNodes[insertIndex - 1] = {
//           ...updatedNodes[insertIndex - 1],
//           next: newNode.id,
//         };
//       } else {
//         // If inserting at beginning
//         setState((prev) => ({
//           ...prev,
//           head: newNode.id,
//         }));
//       }

//       setState((prev) => ({
//         ...prev,
//         nodes: updatedNodes,
//         tempNode: undefined,
//         newArrow: undefined,
//       }));
//     }

//     setOperationMessage(message.replace("Inserting", "Inserted"));
//     setInputValue("");
//     setPositionValue("");

//     await sleep(500);

//     setState((prev) => ({
//       ...prev,
//       isAnimating: false,
//       operation: "idle",
//       highlightNode: undefined,
//     }));
//   };

//   const deleteNode = async (position: "start" | "end" | "between") => {
//     if (state.isAnimating || !state.head) return;

//     setState((prev) => ({ ...prev, isAnimating: true, operation: "delete" }));
//     setShowDeletePopup(false);

//     let nodeToDelete: Node | null = null;
//     let prevNode: Node | null = null;
//     let message = "";

//     if (position === "start") {
//       // Delete head
//       nodeToDelete = state.nodes.find((n) => n.id === state.head) || null;
//       message = `Deleting "${nodeToDelete?.value}" from start...`;
//     } else if (position === "end") {
//       // Delete tail
//       if (state.nodes.length === 1) {
//         nodeToDelete = state.nodes[0];
//       } else {
//         // Find second to last node
//         for (const node of state.nodes) {
//           if (
//             node.next &&
//             state.nodes.find((n) => n.id === node.next)?.next === null
//           ) {
//             prevNode = node;
//             nodeToDelete = state.nodes.find((n) => n.id === node.next) || null;
//           }
//         }
//       }
//       message = `Deleting "${nodeToDelete?.value}" from end...`;
//     } else if (position === "between") {
//       // Delete at position
//       const pos = parseInt(positionValue) - 1;
//       if (isNaN(pos) || pos < 0 || pos >= state.nodes.length) {
//         setOperationMessage("Invalid position");
//         setState((prev) => ({ ...prev, isAnimating: false }));
//         return;
//       }

//       if (pos === 0) {
//         // Same as delete start
//         nodeToDelete = state.nodes.find((n) => n.id === state.head) || null;
//       } else {
//         let currentPos = 0;

//         for (const node of state.nodes) {
//           if (currentPos === pos - 1) {
//             prevNode = node;
//             nodeToDelete = state.nodes.find((n) => n.id === node.next) || null;
//             break;
//           }
//           currentPos++;
//         }
//       }
//       message = `Deleting from position ${pos + 1}...`;
//     }

//     if (!nodeToDelete) {
//       setOperationMessage("Node not found");
//       setState((prev) => ({ ...prev, isAnimating: false }));
//       return;
//     }

//     setOperationMessage(message);

//     // Highlight the node to be deleted
//     setState((prev) => ({
//       ...prev,
//       highlightNode: nodeToDelete?.id,
//       highlightArrow: prevNode?.id,
//     }));
//     await sleep(500);

//     // For delete at between, animate arrow change first
//     if (prevNode && position === "between") {
//       const arrowSteps = 20;
//       for (let i = 0; i <= arrowSteps; i++) {
//         const progress = i / arrowSteps;
//         setState((prev) => ({
//           ...prev,
//           arrowProgress: 1 - progress, // Reverse animation
//         }));
//         await sleep(animationDuration / arrowSteps / 2);
//       }
//     }

//     // Animate node moving up (easeInBack for smooth lift)
//     const startX =
//       margin.left +
//       state.nodes.findIndex((n) => n.id === nodeToDelete?.id) *
//         (nodeWidth + arrowLength);
//     const startY = centerY - nodeHeight / 2;
//     const steps = 30;

//     setState((prev) => ({
//       ...prev,
//       tempNode: {
//         id: nodeToDelete?.id || "",
//         value: nodeToDelete?.value || "",
//         x: startX,
//         y: startY,
//       },
//     }));

//     for (let i = 0; i <= steps; i++) {
//       const progress = i / steps;
//       const easedProgress = d3.easeBackIn(progress);
//       const currentY = startY - 150 * easedProgress;

//       setState((prev) => ({
//         ...prev,
//         tempNode: prev.tempNode
//           ? {
//               ...prev.tempNode,
//               y: currentY,
//             }
//           : undefined,
//       }));
//       await sleep(animationDuration / steps);
//     }

//     // Remove the node from the list
//     if (position === "start") {
//       setState((prev) => ({
//         ...prev,
//         nodes: prev.nodes.filter((n) => n.id !== state.head),
//         head: nodeToDelete?.next || null,
//         tempNode: undefined,
//       }));
//     } else if (position === "end") {
//       if (prevNode) {
//         const updatedNodes = state.nodes
//           .map((n) => (n.id === prevNode?.id ? { ...n, next: null } : n))
//           .filter((n) => n.id !== nodeToDelete?.id);

//         setState((prev) => ({
//           ...prev,
//           nodes: updatedNodes,
//           tempNode: undefined,
//         }));
//       } else {
//         setState((prev) => ({
//           ...prev,
//           nodes: [],
//           head: null,
//           tempNode: undefined,
//         }));
//       }
//     } else if (position === "between") {
//       if (prevNode && nodeToDelete) {
//         const updatedNodes = state.nodes
//           .map((n) =>
//             n.id === prevNode?.id
//               ? { ...n, next: nodeToDelete?.next || null }
//               : n
//           )
//           .filter((n) => n.id !== nodeToDelete?.id);

//         setState((prev) => ({
//           ...prev,
//           nodes: updatedNodes,
//           tempNode: undefined,
//         }));
//       }
//     }

//     setOperationMessage(message.replace("Deleting", "Deleted"));
//     setPositionValue("");
//     await sleep(500);
//     setState((prev) => ({
//       ...prev,
//       isAnimating: false,
//       operation: "idle",
//       highlightNode: undefined,
//       highlightArrow: undefined,
//     }));
//   };

//   const searchNode = async () => {
//     if (!searchValue.trim() || state.isAnimating) return;

//     setState((prev) => ({ ...prev, isAnimating: true, operation: "search" }));
//     setShowSearchPopup(false);

//     let currentNodeId = state.head;
//     let found = false;
//     let position = 1;

//     while (currentNodeId) {
//       const node = state.nodes.find((n) => n.id === currentNodeId);
//       if (!node) break;

//       // Highlight current node during search
//       setState((prev) => ({ ...prev, highlightNode: node.id }));
//       await sleep(500);

//       if (node.value === searchValue) {
//         found = true;
//         setOperationMessage(`Found "${searchValue}" at position ${position}`);
//         await sleep(1000);
//         break;
//       }

//       currentNodeId = node.next;
//       position++;
//     }

//     if (!found) {
//       setOperationMessage(`"${searchValue}" not found in list`);
//       await sleep(1000);
//     }

//     setSearchValue("");
//     setState((prev) => ({
//       ...prev,
//       isAnimating: false,
//       operation: "idle",
//       highlightNode: undefined,
//     }));
//   };

//   const resetList = async () => {
//     setState((prev) => ({ ...prev, isAnimating: true }));
//     setOperationMessage("Resetting linked list...");

//     await sleep(500);

//     const newNodes: Node[] = Array.from({ length: 3 }, (_, i) => ({
//       id: `node-${i}`,
//       value: Math.floor(Math.random() * 90 + 10).toString(),
//       next: i < 2 ? `node-${i + 1}` : null,
//     }));

//     setState({
//       nodes: newNodes,
//       head: "node-0",
//       operation: "idle",
//       isAnimating: false,
//     });

//     setOperationMessage("Linked list reset");
//   };

//   return (
//     <div className="flex flex-col items-center gap-4">
//       <div className="relative">
//         <svg ref={svgRef} width={width} height={height} className="" />
//       </div>

//       <div className="flex flex-col gap-4 w-full max-w-4xl">
//         <div className="flex flex-wrap gap-2 justify-center">
//           <Button onClick={resetList} size="icon" variant="outline">
//             <RotateCcw className="h-4 w-4" />
//           </Button>

//           {/* Insert Buttons */}
//           <Popover open={showInsertPopup} onOpenChange={setShowInsertPopup}>
//             <PopoverTrigger asChild>
//               <Button className="bg-green-600 hover:bg-green-700">
//                 Insert
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-64 p-4">
//               <div className="flex flex-col gap-4">
//                 <div className="flex gap-2">
//                   <Button
//                     onClick={() => setInsertPosition("start")}
//                     variant={insertPosition === "start" ? "default" : "outline"}
//                   >
//                     Start
//                   </Button>
//                   <Button
//                     onClick={() => setInsertPosition("end")}
//                     variant={insertPosition === "end" ? "default" : "outline"}
//                   >
//                     End
//                   </Button>
//                   <Button
//                     onClick={() => setInsertPosition("between")}
//                     variant={
//                       insertPosition === "between" ? "default" : "outline"
//                     }
//                   >
//                     Between
//                   </Button>
//                 </div>

//                 <Input
//                   value={inputValue}
//                   onChange={(e) => setInputValue(e.target.value)}
//                   placeholder="Enter value"
//                   autoFocus
//                 />

//                 {insertPosition === "between" && (
//                   <Input
//                     value={positionValue}
//                     onChange={(e) => setPositionValue(e.target.value)}
//                     placeholder="Position (1-based)"
//                     type="number"
//                   />
//                 )}

//                 <Button
//                   onClick={() => insertNode(insertPosition)}
//                   disabled={
//                     !inputValue.trim() ||
//                     (insertPosition === "between" && !positionValue.trim())
//                   }
//                   className="w-full bg-green-600 hover:bg-green-700"
//                 >
//                   Insert
//                 </Button>
//               </div>
//             </PopoverContent>
//           </Popover>

//           {/* Delete Buttons */}
//           <Popover open={showDeletePopup} onOpenChange={setShowDeletePopup}>
//             <PopoverTrigger asChild>
//               <Button
//                 disabled={!state.head}
//                 className="bg-red-600 hover:bg-red-700"
//               >
//                 Delete
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-64 p-4">
//               <div className="flex flex-col gap-4">
//                 <div className="flex gap-2">
//                   <Button
//                     onClick={() => setDeletePosition("start")}
//                     variant={deletePosition === "start" ? "default" : "outline"}
//                   >
//                     Start
//                   </Button>
//                   <Button
//                     onClick={() => setDeletePosition("end")}
//                     variant={deletePosition === "end" ? "default" : "outline"}
//                   >
//                     End
//                   </Button>
//                   <Button
//                     onClick={() => setDeletePosition("between")}
//                     variant={
//                       deletePosition === "between" ? "default" : "outline"
//                     }
//                   >
//                     Between
//                   </Button>
//                 </div>

//                 {deletePosition === "between" && (
//                   <Input
//                     value={positionValue}
//                     onChange={(e) => setPositionValue(e.target.value)}
//                     placeholder="Position (1-based)"
//                     type="number"
//                   />
//                 )}

//                 <Button
//                   onClick={() => deleteNode(deletePosition)}
//                   disabled={
//                     !state.head ||
//                     (deletePosition === "between" && !positionValue.trim())
//                   }
//                   className="w-full bg-red-600 hover:bg-red-700"
//                 >
//                   Delete
//                 </Button>
//               </div>
//             </PopoverContent>
//           </Popover>

//           {/* Search Button */}
//           <Popover open={showSearchPopup} onOpenChange={setShowSearchPopup}>
//             <PopoverTrigger asChild>
//               <Button className="bg-blue-600 hover:bg-blue-700">Search</Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-64 p-4">
//               <div className="flex flex-col gap-4">
//                 <Input
//                   value={searchValue}
//                   onChange={(e) => setSearchValue(e.target.value)}
//                   placeholder="Value to search"
//                   autoFocus
//                 />
//                 <Button
//                   onClick={searchNode}
//                   disabled={!searchValue.trim()}
//                   className="w-full bg-blue-600 hover:bg-blue-700"
//                 >
//                   Search
//                 </Button>
//               </div>
//             </PopoverContent>
//           </Popover>

//           {/* Code Button */}
//           <Button
//             onClick={() => setShowCode(!showCode)}
//             className="bg-indigo-600 hover:bg-indigo-700"
//           >
//             <Code className="h-4 w-4 mr-2" />
//             Code
//           </Button>
//         </div>
//       </div>

//       <DraggableCard
//         showCode={showCode}
//         showRuntimeCode={showRuntimeCode}
//         currentAlgo={currentAlgo}
//         currentLine={
//           state.operation === "insert"
//             ? [7, 8]
//             : state.operation === "delete"
//             ? [12, 13]
//             : state.operation === "search"
//             ? [17, 18]
//             : []
//         }
//       />
//     </div>
//   );
// };

// export default LinkedListViz;
