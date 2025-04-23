"use client";
import React, { useEffect, useState } from "react";
import SelectionSortViz from "@/components/SelectionSortViz";
import InsertionSortViz from "@/components/InsertionSortViz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import {
  ArrowDownUp,
  RefreshCw,
  Copy,
  User,
  BarChart,
  Timer,
  Settings,
  ChevronRight,
} from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SpeedControlSlider from "./SpeedControlSlider";
import BFSVisualization from "./BFSVisualization";
import LinearSearchViz from "./LinearSearchViz";
import DFSVisualization from "./DFSVisualization";
import BinarySearchViz from "./BinarySearchViz";
import StackViz from "./StackViz";
import QueueViz from "./QueueViz";
import LinkedListViz from "./LinkedListViz";

// Algorithm categories
const ALGORITHM_CATEGORIES = {
  sorting: ["selection", "insertion"],
  searching: ["linear", "binary"],
  traversal: ["bfs", "dfs"],
  dataStructure: ["stack", "queue", "linked"]
};

// Algorithm display names
const ALGORITHM_NAMES = {
  selection: "Selection Sort",
  insertion: "Insertion Sort",
  linear: "Linear Search",
  binary: "Binary Search",
  bfs: "BFS Graph Traversal",
  dfs: "DFS Graph Traversal",
  stack: "Stack",
  queue: "Queue",
  linked: "Linked List"
};

// Function to get category based on algorithm
const getAlgorithmCategory = (algo: string) => {
  for (const [category, algorithms] of Object.entries(ALGORITHM_CATEGORIES)) {
    if (algorithms.includes(algo)) {
      return category;
    }
  }
  return "sorting"; // Default category
};

interface FunctionsProps {
  initialAlgorithm?: string;
  initialCategory?: string;
}

const Functions = ({ initialAlgorithm, initialCategory }: FunctionsProps) => {
  const router = useRouter();
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [algorithm, setAlgorithm] = useState(initialAlgorithm || "selection");
  const [category, setCategory] = useState(initialCategory || getAlgorithmCategory(initialAlgorithm || "selection"));
  const [arraySize, setArraySize] = useState("6");
  const [userArray, setUserArray] = useState(
    Array.from({ length: 6 }, () => Math.floor(Math.random() * 100) + 1).join(
      ", "
    )
  );
  const [sortOrder, setSortOrder] = useState("ascending");
  const [shouldSort, setShouldSort] = useState(false);
  const [showVisualization, setShowVisualization] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [currentArray, setCurrentArray] = useState(() => {
    return userArray.split(",").map((num) => parseInt(num.trim()));
  });

  const handleGoClick = () => {
    const newArray = userArray.split(",").map((num) => parseInt(num.trim()));
    setCurrentArray(newArray);
    setShowVisualization(true);
  };

  const handleAlgorithmChange = (value: string) => {
    setAlgorithm(value);
    router.push(`/${value}`);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    // Select the first algorithm from the new category
    const newAlgo = ALGORITHM_CATEGORIES[value as keyof typeof ALGORITHM_CATEGORIES][0];
    setAlgorithm(newAlgo);
    router.push(`/${newAlgo}`);
  };

  const arraySizeCheck = parseInt(arraySize) <= 100 && parseInt(arraySize) > 0;

  const toggleSortOrder = () => {
    setShouldSort(true);
    setSortOrder(sortOrder === "ascending" ? "descending" : "ascending");
  };

  const generateRandomArray = () => {
    const size = parseInt(arraySize);
    if (!isNaN(size) && size > 0 && size <= 100) {
      const randomArray = Array.from(
        { length: size },
        () => Math.floor(Math.random() * 50) + 1
      );
      setUserArray(randomArray.join(", "));
      setCurrentArray(randomArray);
      setShowVisualization(true);
    }
  };

  const duplicateArray = () => {
    if (parseInt(arraySize) < 51 && userArray) {
      setUserArray(`${userArray}, ${userArray}`);
      setShouldSort(false);
    }
  };

  const handleArrayInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserArray(e.target.value);
    setShouldSort(false);
  };

  const createRandomDuplicates = () => {
    const size = parseInt(arraySize);
    if (!isNaN(size) && size > 0 && size <= 100) {
      const array = Array.from(
        { length: size },
        () => Math.floor(Math.random() * 100) + 1
      );
      const iterations = Math.floor(Math.random() * array.length) + 1;

      for (let i = 0; i < iterations; i++) {
        const pos1 = Math.floor(Math.random() * array.length);
        const pos2 = Math.floor(Math.random() * array.length);
        array[pos2] = array[pos1];
      }

      setUserArray(array.join(", "));
      setCurrentArray(array);
      setShouldSort(false);
      setShowVisualization(true);
    }
  };

  useEffect(() => {
    if (shouldSort && userArray) {
      const array = userArray.split(",").map(Number);
      const sortedArray = [...array].sort((a, b) =>
        sortOrder === "ascending" ? b - a : a - b
      );
      setUserArray(sortedArray.join(", "));
      setShouldSort(false);
      setCurrentArray(sortedArray);
      setShowVisualization(true);
    }
  }, [sortOrder, userArray, shouldSort]);

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="h-[50px] w-full bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              EzzAlgo
            </span>
          </Link>
          
          {/* Category Selector */}
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-48 bg-white border-2 border-gray-200 hover:border-indigo-400 text-gray-800 h-[30px] w-[10rem] transition-colors">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sorting">Sorting Algorithms</SelectItem>
              <SelectItem value="searching">Searching Algorithms</SelectItem>
              <SelectItem value="traversal">Graph Traversal</SelectItem>
              <SelectItem value="dataStructure">Data Structures</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Algorithm Selector - Now filtered by category */}
          <Select value={algorithm} onValueChange={handleAlgorithmChange}>
            <SelectTrigger className="w-48 bg-white border-2 border-gray-200 hover:border-indigo-400 text-gray-800 h-[30px] w-[10rem] transition-colors">
              <SelectValue placeholder="Select Algorithm" />
            </SelectTrigger>
            <SelectContent>
              {ALGORITHM_CATEGORIES[category as keyof typeof ALGORITHM_CATEGORIES].map((algo) => (
                <SelectItem key={algo} value={algo}>
                  {ALGORITHM_NAMES[algo as keyof typeof ALGORITHM_NAMES]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Rest of the navbar */}
        <div className="flex items-center gap-4">
          <ModeToggle />
          <Button
            variant="outline"
            className="flex items-center h-[33px] w-[90px] p-0 gap-2 border-2 border-zinc-400 bg-zinc-100 hover:bg-zinc-900 text-gray-800 hover:text-gray-100"
          >
            <User className="h-5 w-5" />
            <span className="font-small">Login</span>
          </Button>
        </div>
      </nav>

      {/* Fixed Layout Container */}
      <div className="flex pt-[50px] min-h-screen">
        {/* Sidebar */}

        <div
          id="check"
          className={`fixed left-0 top-[50px] h-[calc(100vh-50px)] bg-white transition-all duration-500 ease-in-out ${
            isControlsOpen ? "w-60" : "w-12"
          } ${algorithm == "bfs" ? "hidden" : ""} ${
            algorithm == "dfs" ? "hidden" : ""
          } border-r border-gray-200 shadow-lg`}
          onMouseEnter={() => setIsControlsOpen(true)}
          onMouseLeave={() => setIsControlsOpen(false)}
        >
          <div className="relative h-full">
            {/* Collapsed Sidebar */}
            <div
              className={`py-6 space-y-8 flex flex-col items-center ${
                isControlsOpen ? "hidden" : "block"
              }`}
            >
              <div className="hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                <BarChart className="h-5 w-5 text-indigo-700" />
              </div>
              <div className="hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                <Settings className="h-5 w-5 text-indigo-700" />
              </div>
              <div className="hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                <Timer className="h-5 w-5 text-indigo-700" />
              </div>
            </div>

            {/* Expanded Sidebar */}
            <div
              className={`p-6 flex flex-col gap-8 space-y-6 h-full ${
                isControlsOpen ? "block" : "hidden"
              }`}
            >
              {/* Array Size Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-850 text-base font-semibold bg-indigo-200 p-2 rounded-lg h-8 w-50">
                  <BarChart className="h-5 w-5" />
                  <span>Array Size</span>
                </div>
                <div className="space-y-1 pl-3 h-8 w-50">
                  <Input
                    type="number"
                    placeholder="Array size"
                    value={arraySize}
                    onChange={(e) => {
                      setArraySize(e.target.value);
                      // generateRandomArray();
                    }}
                    className="w-full border-2 focus:ring-2 focus:ring-indigo-200 h-8"
                  />
                  {!arraySizeCheck && (
                    <span className="text-red-400 text-sm">
                      Allowed (1-100)
                    </span>
                  )}
                </div>
              </div>

              {/* Array Controls Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-950 font-semibold bg-indigo-200 p-2 rounded-lg h-8 w-50 text-base">
                  <Settings className="h-5 w-5" />
                  <span>Array Controls</span>
                </div>
                <div className="grid grid-cols-1 gap-2 pl-3">
                  <Button
                    onClick={generateRandomArray}
                    variant="outline"
                    className="w-full justify-start hover:bg-indigo-50 border-2 h-8"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Random Array
                  </Button>
                  <Button
                    onClick={toggleSortOrder}
                    variant="outline"
                    className="w-full justify-start hover:bg-indigo-50 border-2 h-8"
                  >
                    <ArrowDownUp className="h-4 w-4 mr-2" />
                    {sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)}
                  </Button>
                  <Button
                    onClick={createRandomDuplicates}
                    variant="outline"
                    className="w-full justify-start hover:bg-indigo-50 border-2 h-8"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Random Duplicates
                  </Button>
                </div>
              </div>

              {/* Speed Control Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-950 font-semibold bg-indigo-200 p-2 rounded-lg h-8 w-50 text-base">
                  <Timer className="h-5 w-5" />
                  <span>Animation Speed</span>
                </div>
                <div className="px-2">
                  <SpeedControlSlider speed={speed} setSpeed={setSpeed} />
                </div>
              </div>
            </div>

            {/* Expand/Collapse Handle */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 -right-3 bg-white border-2 border-gray-200 rounded-full p-1 cursor-pointer shadow-md ${
                isControlsOpen ? "rotate-180" : ""
              } transition-transform duration-300`}
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Main Content - Now with fixed margin */}
        <div className="flex-1 ml-16">
          {/* Visualization */}
          {showVisualization && (
            <div className="w-full flex justify-center items-center">
              {algorithm === "selection" ? (
                <SelectionSortViz
                  key={currentArray.join(",")}
                  array={currentArray}
                  speed={speed}
                />
              ) : algorithm === "insertion" ? (
                <InsertionSortViz
                  key={currentArray.join(",")}
                  array={currentArray}
                  speed={speed}
                />
              ) : algorithm === "bfs" ? (
                <BFSVisualization />
              ) : algorithm === "dfs" ? (
                <DFSVisualization />
              ) : algorithm === "binary" ? (
                <BinarySearchViz array={currentArray} speed={speed} />
              ) : algorithm === "stack" ? (
                <StackViz />
              ) : algorithm === "queue" ? (
                <QueueViz />
              ) : algorithm === "linked" ? (
                <LinkedListViz />
              ) : (
                <LinearSearchViz array={currentArray} speed={speed} />
              )}
            </div>
          )}

          {/* Main Page Controls */}
          {algorithm !== "bfs" && algorithm !== "dfs" && algorithm !== "stack" &&  algorithm !== "queue" && algorithm !== "linked" && (
            <div className=" space-y-8 left-[30%] w-[40vw] max-w-3xl mx-auto p-2 ">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Enter your custom array (e.g. 3, 1, 4, 1, 5, 9)"
                  value={userArray}
                  onChange={handleArrayInput}
                  className="flex-grow"
                />
                <Button
                  variant="outline"
                  onClick={duplicateArray}
                  title="Duplicate Array"
                  className="min-w-[40px]"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  onClick={handleGoClick}
                  className="bg-blue-500 hover:bg-blue-600 text-white min-w-[60px]"
                >
                  Go
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Functions;
