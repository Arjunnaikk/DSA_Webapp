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

interface QueueState {
  array: string[];
  front: number;
  rear: number;
  maxSize: number;
  operation: "enqueue" | "dequeue" | "peek" | "idle";
  operationValue?: string;
  isAnimating: boolean;
}

const QueueViz: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showEnqueuePopup, setShowEnqueuePopup] = useState(false);
  const [showRuntimeCode, setShowRuntimeCode] = useState(true);

  // Initialize with 4 random elements
  const initialArray = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 90 + 10).toString()
  );

  const [state, setState] = useState<QueueState>({
    array: initialArray,
    front: 0,
    rear: initialArray.length - 1,
    maxSize: 9,
    operation: "idle",
    isAnimating: false,
  });

  const [showCode, setShowCode] = useState(false);
  const [operationMessage, setOperationMessage] = useState(
    `Queue Size: ${state.array.length}`
  );
  const [animatingBlock, setAnimatingBlock] = useState<{
    value: string;
    x: number;
    y: number;
  } | null>(null);

  const width = 1450;
  const height = 500;
  const margin = { top: 50, right: 50, bottom: 80, left: 50 };
  const queueBoxWidth = 800;
  const queueBoxHeight = 100;
  const blockWidth = 80;
  const blockHeight = 60;
  const centerY = height / 2;
  const queueBoxX = (width - queueBoxWidth) / 2;
  const queueBoxY = centerY - queueBoxHeight / 2;

  const currentAlgo = `class Queue {
  constructor() {
    this.items = [];
    this.front = 0;
    this.rear = -1;
    this.maxSize = 9;
  }

  enqueue(value) {
    if (this.rear >= this.maxSize - 1) return false;
    this.items[++this.rear] = value;
    return true;
  }

  dequeue() {
    if (this.front > this.rear) return null;
    return this.items[this.front++];
  }

  peek() {
    if (this.front > this.rear) return null;
    return this.items[this.front];
  }
}`;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Draw queue items (horizontal)
    state.array.forEach((item, i) => {
      const itemX = queueBoxX + 10 + i * (blockWidth + 5);
      const isFrontItem = i === state.front;
      const isRearItem = i === state.rear;

      // Skip drawing the front item during dequeue animation
      if (
        state.operation === "dequeue" &&
        state.isAnimating &&
        i === state.front
      ) {
        return; // Skip this iteration - don't draw the front item at all
      }

      if (itemX + blockWidth <= queueBoxX + queueBoxWidth) {
        // Queue block
        svg
          .append("rect")
          .attr("x", itemX)
          .attr("y", centerY - blockHeight / 2 )
          .attr("width", blockWidth)
          .attr("height", blockHeight)
          .attr("fill", isFrontItem ? "#4ADE80" : "#60A5FA")
          .attr("rx", 4)
          .attr("stroke", "#E5E7EB")
          .attr("stroke-width", 1);

        // Value text
        svg
          .append("text")
          .attr("x", itemX + blockWidth / 2)
          .attr("y", queueBoxY + queueBoxHeight / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "white")
          .attr("font-weight", "bold")
          .text(item);

        // Front/Rear indicators
        if (isFrontItem) {
          svg
            .append("text")
            .attr("x", itemX + blockWidth / 2)
            .attr("y", queueBoxY + queueBoxHeight + 20)
            .attr("text-anchor", "middle")
            .attr("fill", "#16A34A")
            .text("Front");
        }
        if (isRearItem) {
          svg
            .append("text")
            .attr("x", itemX + blockWidth / 2)
            .attr("y", queueBoxY - 10)
            .attr("text-anchor", "middle")
            .attr("fill", "#16A34A")
            .text("Rear");
        }
      }
    });

    // Draw animating block if exists
    if (animatingBlock) {
      svg
        .append("rect")
        .attr("x", animatingBlock.x)
        .attr("y", animatingBlock.y)
        .attr("width", blockWidth)
        .attr("height", blockHeight)
        .attr("fill", "#FCD34D")
        .attr("rx", 4)
        .attr("stroke", "#E5E7EB")
        .attr("stroke-width", 1);

      svg
        .append("text")
        .attr("x", animatingBlock.x + blockWidth / 2)
        .attr("y", animatingBlock.y + blockHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .text(animatingBlock.value);
    }

    // Operation message
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", queueBoxY - 100)
      .attr("text-anchor", "middle")
      .attr("fill", "#4B5563")
      .text(operationMessage);

    // Queue label
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", queueBoxY + queueBoxHeight + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#6B7280")
      .text("Queue");
  }, [state, operationMessage, animatingBlock]);

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const enqueueItem = async () => {
    if (!inputValue.trim()) return;
    if (state.isAnimating || state.rear >= state.maxSize - 1) {
      setOperationMessage("Queue is full!");
      return;
    }

    setState((prev) => ({ ...prev, isAnimating: true, operation: "enqueue" }));
    setOperationMessage(`Enqueuing "${inputValue}"...`);
    setShowEnqueuePopup(false);

    // Animation: Block comes from top
    const startX = queueBoxX + 10 + (state.rear + 1) * (blockWidth + 5);
    const startY = queueBoxY - 100;
    const endY = queueBoxY + (queueBoxHeight - blockHeight) / 2;

    setAnimatingBlock({ value: inputValue, x: startX, y: startY });
    await sleep(200);

    // Animate movement down
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentY = startY + (endY - startY) * progress;
      setAnimatingBlock({ value: inputValue, x: startX, y: currentY });
      await sleep(50);
    }

    // Add to queue
    setState((prev) => ({
      ...prev,
      array: [...prev.array, inputValue],
      rear: prev.rear + 1,
    }));
    setAnimatingBlock(null);

    setOperationMessage(
      `Enqueued "${inputValue}". Size: ${state.array.length + 1}`
    );
    setInputValue("");
    await sleep(500);

    setState((prev) => ({ ...prev, isAnimating: false, operation: "idle" }));
  };

  const dequeueItem = async () => {
    if (state.isAnimating || state.front > state.rear) {
      setOperationMessage("Queue is empty!");
      return;
    }

    const dequeuedValue = state.array[state.front];
    setOperationMessage(`Dequeuing "${dequeuedValue}"...`);

    setState((prev) => ({
      ...prev,
      isAnimating: true,
      operation: "dequeue",
    }));

    // Animation positions
    const startX = queueBoxX + 10 + state.front * (blockWidth + 5);
    const startY = queueBoxY + (queueBoxHeight - blockHeight) / 2;
    const endY = startY - 100;

    setAnimatingBlock({ value: dequeuedValue, x: startX, y: startY });
    await sleep(200);

    // Animate movement up
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentY = startY + (endY - startY) * progress;
      setAnimatingBlock({ value: dequeuedValue, x: startX, y: currentY });
      await sleep(50);
    }

    // Remove from queue
    setState((prev) => ({
      ...prev,
      array: prev.array.slice(1),
      front: prev.front,
      rear: prev.rear - 1,
    }));
    setAnimatingBlock(null);

    if (state.front >= state.rear - 1) {
      setOperationMessage("Queue is empty");
    } else {
      setOperationMessage(
        `Dequeued "${dequeuedValue}". Size: ${state.array.length - 1}`
      );
    }
    await sleep(500);

    setState((prev) => ({ ...prev, isAnimating: false, operation: "idle" }));
  };

  const peekItem = async () => {
    if (state.isAnimating || state.front > state.rear) {
      setOperationMessage("Queue is empty!");
      return;
    }

    setState((prev) => ({ ...prev, isAnimating: true, operation: "peek" }));
    setOperationMessage(`Peeking at front item...`);

    await sleep(500);

    const frontValue = state.array[state.front];
    setOperationMessage(`Front item is "${frontValue}"`);
    await sleep(1000);

    setState((prev) => ({ ...prev, isAnimating: false, operation: "idle" }));
  };

  const resetQueue = async () => {
    setState((prev) => ({ ...prev, isAnimating: true }));
    setOperationMessage("Resetting queue...");

    const newArray = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 90 + 10).toString()
    );

    await sleep(500);

    setState({
      array: newArray,
      front: 0,
      rear: newArray.length - 1,
      maxSize: 7,
      operation: "idle",
      isAnimating: false,
    });

    setOperationMessage(`Queue reset. Size: ${newArray.length}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      enqueueItem();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg ref={svgRef} width={width} height={height} className="" />
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <div className="flex gap-4 justify-center">
          <Button onClick={resetQueue} size="icon" variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Popover open={showEnqueuePopup} onOpenChange={setShowEnqueuePopup}>
            <PopoverTrigger asChild>
              <Button
                disabled={state.isAnimating || state.rear >= state.maxSize - 1}
                className="bg-black hover:bg-black-700"
              >
                Enqueue
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2">
              <div className="flex flex-col gap-4">
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter value"
                  autoFocus
                  maxLength={10}
                />
                <Button
                  onClick={enqueueItem}
                  disabled={!inputValue.trim()}
                  className="w-full bg-black hover:bg-black-700"
                >
                  Confirm
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            onClick={dequeueItem}
            disabled={state.isAnimating || state.front > state.rear}
            className="bg-black hover:bg-black-700"
          >
            Dequeue
          </Button>

          <Button
            onClick={peekItem}
            disabled={state.isAnimating || state.front > state.rear}
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
          state.operation === "enqueue"
            ? [7, 8]
            : state.operation === "dequeue"
            ? [12, 13]
            : state.operation === "peek"
            ? [17, 18]
            : []
        }
      />
    </div>
  );
};

export default QueueViz;
