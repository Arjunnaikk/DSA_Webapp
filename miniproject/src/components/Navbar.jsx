import React from 'react'
import { motion } from "framer-motion";
import { useState } from "react";
import { 
    Github, 
    BookOpenIcon, 
    CodeIcon,
  } from "lucide-react";

  const Navbar = ({ algorithms, currentAlgo, setCurrentAlgo }) => {
    return (
      <nav className="fixed top-0 w-full backdrop-blur-md bg-black/30 border-b border-purple-500/20 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                EzzAlgo
              </span>
              <div className="hidden md:flex space-x-1">
                {algorithms.map((algo) => (
                  <motion.button
                    key={algo}
                    onClick={() => setCurrentAlgo(algo)} // ✅ Update SortingVisualizer state
                    className={`px-4 py-1.5 rounded-sm relative group ${
                      currentAlgo === algo
                        ? "text-purple-400"
                        : "text-gray-400 hover:text-white"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {algo}
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  };
  
  export default Navbar;
  