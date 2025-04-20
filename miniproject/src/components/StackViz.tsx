"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { RotateCcw, Code } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import DraggableCard from "./DraggableCard";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface StackState {
  array: string[];
  top: number;
  maxSize: number;
  operation: "push" | "pop" | "peek" | "idle";
  operationValue?: string;
  isAnimating: boolean;
}

const StackViz: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showPushPopup, setShowPushPopup] = useState(false);

  // Initialize with 4 random elements (numbers 10-99)
  const initialArray = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 90 + 10).toString()
  );

  const [state, setState] = useState<StackState>({
    array: initialArray,
    top: initialArray.length - 1,
    maxSize: 7,
    operation: "idle",
    isAnimating: false,
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showRuntimeCode, setShowRuntimeCode] = useState(true);
  const [operationMessage, setOperationMessage] = useState(
    `Stack Size: ${state.array.length}`
  );
  const [animatingBlock, setAnimatingBlock] = useState<{
    value: string;
    x: number;
    y: number;
  } | null>(null);

  const width = 1450;
  const height = 500;
  const margin = { top: 50, right: 50, bottom: 100, left: 50 };
  const stackBoxWidth = 120;
  const stackBoxHeight = 300;
  const blockSize = 40;
  const blockWidth = 110; // Wider rectangle
  const blockHeight = 40; // Same height as before
  const centerX = width / 2;
  const stackBoxX = centerX - stackBoxWidth / 2;
  const stackBoxY = height - margin.bottom - stackBoxHeight;

  const currentAlgo = `class Stack {
  constructor() {
    this.items = [];
    this.top = -1;
    this.maxSize = 7;
  }

  push(value) {
    if (this.top >= this.maxSize - 1) return false;
    this.items[++this.top] = value;
    return true;
  }

  pop() {
    if (this.top < 0) return null;
    return this.items[this.top--];
  }

  peek() {
    if (this.top < 0) return null;
    return this.items[this.top];
  }
}`;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Draw stack items
    state.array.forEach((item, i) => {
      const itemY = stackBoxY + stackBoxHeight - (i + 1) * blockSize;
      const isTopItem = i === state.top;
      const isOperationItem = state.operation !== "idle" && i === state.top;

      if (itemY >= stackBoxY) {
        // Stack block
        svg
          .append("rect")
          .attr("x", stackBoxX + (stackBoxWidth - blockSize) / 2)
          .attr("y", itemY)
          .attr("width", blockWidth)
          .attr("height", blockHeight)
          .attr(
            "fill",
            isTopItem ? "#4ADE80" : isOperationItem ? "#FCD34D" : "#60A5FA"
          )
          .attr("rx", 4)
          .attr("stroke", "#E5E7EB")
          .attr("stroke-width", 1);

        // Value text
        svg
          .append("text")
          .attr("x", stackBoxX + stackBoxWidth / 2)
          .attr("y", itemY + blockHeight / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "white")
          .attr("font-weight", "bold")
          .attr("font-size", "14px")
          .text(item);
      }
    });

    // Draw animating block if exists
    if (animatingBlock) {
      svg
        .append("rect")
        .attr("x", animatingBlock.x)
        .attr("y", animatingBlock.y)
        .attr("width", blockSize)
        .attr("height", blockSize)
        .attr("fill", "#FCD34D")
        .attr("rx", 4)
        .attr("stroke", "#E5E7EB")
        .attr("stroke-width", 1);

      svg
        .append("text")
        .attr("x", animatingBlock.x + blockSize / 2)
        .attr("y", animatingBlock.y + blockSize / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("font-size", "14px")
        .text(animatingBlock.value);
    }

    // Top indicator
    if (state.top >= 0) {
      const topItemY = stackBoxY + stackBoxHeight - (state.top + 1) * blockSize;
      if (topItemY >= stackBoxY) {
        svg
          .append("text")
          .attr("x", stackBoxX + stackBoxWidth + 10)
          .attr("y", topItemY + blockSize / 2)
          .attr("text-anchor", "start")
          .attr("fill", "#16A34A")
          .attr("font-weight", "bold")
          .attr("font-size", "20px")
          .text("← Top");
      }
    }

    // Operation message
    svg
      .append("text")
      .attr("x", centerX)
      .attr("y", stackBoxY - 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#4B5563")
      .attr("font-size", "16px")
      .text(operationMessage);

    // Stack label
    svg
      .append("text")
      .attr("x", centerX)
      .attr("y", stackBoxY + stackBoxHeight + 30)
      .attr("text-anchor", "middle")
      .attr("fill", "#6B7280")
      .attr("font-size", "14px")
      .text("Stack");
  }, [state, operationMessage, animatingBlock]);

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const pushItem = async () => {
    if (!inputValue.trim()) return;
    if (state.isAnimating || state.top >= state.maxSize - 1) {
      setOperationMessage("Stack is full!");
      return;
    }

    setState((prev) => ({ ...prev, isAnimating: true, operation: "push" }));
    setOperationMessage(`Pushing "${inputValue}" to stack...`);
    setShowPushPopup(false);

    // Animation: Block comes in from left
    const startX = stackBoxX - 100;
    const startY = stackBoxY + stackBoxHeight - (state.top + 2) * blockHeight;
    const endX = stackBoxX + (stackBoxWidth - blockSize) / 2;
    // const endY = startY;

    // Animate the block moving in
    setAnimatingBlock({ value: inputValue, x: startX, y: startY });
    await sleep(200);

    // Animate movement
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentX = startX + (endX - startX) * progress;
      setAnimatingBlock({ value: inputValue, x: currentX, y: startY });
      await sleep(50);
    }

    // Add to stack
    setState((prev) => ({
      ...prev,
      array: [...prev.array, inputValue],
      top: prev.top + 1,
      operationValue: inputValue,
    }));
    setAnimatingBlock(null);

    setOperationMessage(`Pushed "${inputValue}". Stack Size: ${state.top + 2}`);
    setInputValue("");
    await sleep(500);

    setState((prev) => ({ ...prev, isAnimating: false, operation: "idle" }));
  };

  const popItem = async () => {
    if (state.isAnimating || state.top < 0) return;

    setState((prev) => ({ ...prev, isAnimating: true, operation: "pop" }));
    setOperationMessage(`Popping from stack...`);

    const poppedValue = state.array[state.top];
    const startX = stackBoxX + (stackBoxWidth - blockSize) / 2;
    const startY = stackBoxY + stackBoxHeight - (state.top + 1) * blockSize;
    const endX = stackBoxX + stackBoxWidth + 100;

    // Show the block being popped
    setAnimatingBlock({ value: poppedValue, x: startX, y: startY });
    await sleep(200);

    // Animate movement to right
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentX = startX + (endX - startX) * progress;
      setAnimatingBlock({ value: poppedValue, x: currentX, y: startY });
      await sleep(50);
    }

    // Remove from stack
    setState((prev) => ({
      ...prev,
      array: prev.array.slice(0, -1),
      top: prev.top - 1,
      operationValue: poppedValue,
    }));
    setAnimatingBlock(null);

    setOperationMessage(
      `Popped "${poppedValue}". Stack Size: ${state.top + 1}`
    );
    await sleep(500);

    if (state.top < 0) {
      setOperationMessage("Stack is empty");
    }

    setState((prev) => ({ ...prev, isAnimating: false, operation: "idle" }));
  };

  const peekItem = async () => {
    if (state.isAnimating || state.top < 0) return;

    setState((prev) => ({ ...prev, isAnimating: true, operation: "peek" }));
    setOperationMessage(`Peeking at top item...`);

    await sleep(500);

    const topValue = state.array[state.top];
    setOperationMessage(`Top item is "${topValue}"`);
    await sleep(1000);

    setState((prev) => ({ ...prev, isAnimating: false, operation: "idle" }));
  };

  const resetStack = async () => {
    setState((prev) => ({ ...prev, isAnimating: true }));
    setOperationMessage("Resetting stack...");

    // Reset with 4 new random elements
    const newArray = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 90 + 10).toString()
    );

    await sleep(500);

    setState({
      array: newArray,
      top: newArray.length - 1,
      maxSize: 7,
      operation: "idle",
      isAnimating: false,
    });

    setOperationMessage(`Stack reset. Size: ${state.array.length}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      pushItem();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg ref={svgRef} width={width} height={height} className="" />
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <div className="flex gap-4 justify-center">
          <Button onClick={resetStack} size="icon" variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Popover open={showPushPopup} onOpenChange={setShowPushPopup}>
            <PopoverTrigger asChild>
              <Button
                disabled={state.isAnimating || state.top >= state.maxSize - 1}
                className="bg-black hover:bg-black-700"
              >
                Push
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2">
              <div className="flex flex-col gap-4">
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter value to push"
                  autoFocus
                  maxLength={10}
                />
                <Button
                  onClick={pushItem}
                  disabled={!inputValue.trim()}
                  className="w-full bg-black hover:bg-black-700"
                >
                  Confirm Push
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            onClick={popItem}
            disabled={state.isAnimating || state.top < 0}
            className="bg-black hover:bg-black-700"
          >
            Pop
          </Button>

          <Button
            onClick={peekItem}
            disabled={state.isAnimating || state.top < 0}
            className="bg-black hover:bg-black-700"
          >
            Peek
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setShowCode(!showCode)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Code className="h-4 w-4 mr-2" />
                Code
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Code View</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <DraggableCard
        showCode={showCode}
        showRuntimeCode={showRuntimeCode}
        currentAlgo={currentAlgo}
        currentLine={
          state.operation === "push"
            ? [7, 8]
            : state.operation === "pop"
            ? [12, 13]
            : state.operation === "peek"
            ? [17, 18]
            : []
        }
      />
    </div>
  );
};

export default StackViz;
