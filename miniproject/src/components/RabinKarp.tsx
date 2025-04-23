import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

interface RabinKarpStep {
  patternPosition: number;
  textPosition: number;
  currentHash: number;
  patternHash: number;
  match: boolean;
  description: string;
}

const PRIME = 101; // A prime number for hash calculation

const RabinKarpVisualization: React.FC = () => {
  const [text, setText] = useState<string>("AABAACAADAABAABA");
  const [pattern, setPattern] = useState<string>("AABA");
  const [steps, setSteps] = useState<RabinKarpStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate hash for a string
  const calculateHash = (str: string, length: number): number => {
    let hash = 0;
    for (let i = 0; i < length; i++) {
      hash = (hash * 256 + str.charCodeAt(i)) % PRIME;
    }
    return hash;
  };

  // Recalculate hash when sliding the window
  const recalculateHash = (
    oldHash: number,
    oldChar: string,
    newChar: string,
    patternLength: number,
    power: number
  ): number => {
    let hash = oldHash - oldChar.charCodeAt(0) * power;
    hash = (hash * 256 + newChar.charCodeAt(0)) % PRIME;
    return hash < 0 ? hash + PRIME : hash;
  };

  // Generate all steps of Rabin-Karp algorithm
  const generateSteps = (): RabinKarpStep[] => {
    const steps: RabinKarpStep[] = [];
    const n = text.length;
    const m = pattern.length;
    const patternHash = calculateHash(pattern, m);
    let textHash = calculateHash(text, m);

    // Precompute power for hash recalculation: 256^(m-1) % PRIME
    let power = 1;
    for (let i = 0; i < m - 1; i++) {
      power = (power * 256) % PRIME;
    }

    steps.push({
      patternPosition: 0,
      textPosition: 0,
      currentHash: textHash,
      patternHash: patternHash,
      match: false,
      description: `Initializing: Pattern hash = ${patternHash}, Initial text window hash = ${textHash}`,
    });

    for (let i = 0; i <= n - m; i++) {
      const match = textHash === patternHash;
      let description = `Comparing hashes at position ${i}: Text hash = ${textHash}, Pattern hash = ${patternHash}. `;

      if (match) {
        // Verify character by character
        let j;
        for (j = 0; j < m; j++) {
          if (text[i + j] !== pattern[j]) {
            break;
          }
        }

        if (j === m) {
          description += `Hash match confirmed! Pattern found at position ${i}.`;
          steps.push({
            patternPosition: 0,
            textPosition: i,
            currentHash: textHash,
            patternHash: patternHash,
            match: true,
            description: description,
          });
        } else {
          description += `Hash collision detected but characters don't match.`;
          steps.push({
            patternPosition: 0,
            textPosition: i,
            currentHash: textHash,
            patternHash: patternHash,
            match: false,
            description: description,
          });
        }
      } else {
        description += `Hashes don't match.`;
        steps.push({
          patternPosition: 0,
          textPosition: i,
          currentHash: textHash,
          patternHash: patternHash,
          match: false,
          description: description,
        });
      }

      // Calculate hash for next window
      if (i < n - m) {
        textHash = recalculateHash(textHash, text[i], text[i + m], m, power);

        steps.push({
          patternPosition: 0,
          textPosition: i + 1,
          currentHash: textHash,
          patternHash: patternHash,
          match: false,
          description: `Sliding window: New hash = ${textHash} for next position.`,
        });
      }
    }

    steps.push({
      patternPosition: 0,
      textPosition: n - m,
      currentHash: 0,
      patternHash: patternHash,
      match: false,
      description: `Algorithm completed.`,
    });

    return steps;
  };

  // Run the algorithm and generate steps
  const runAlgorithm = () => {
    const generatedSteps = generateSteps();
    setSteps(generatedSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Play/pause the animation
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Go to next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsPlaying(false);
    }
  };

  // Go to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Auto-play the animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && steps.length > 0) {
      interval = setInterval(() => {
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, steps.length]);

  // Draw the visualization
  useEffect(() => {
    if (!svgRef.current || steps.length === 0 || currentStep >= steps.length)
      return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = 200;
    const margin = { top: 40, right: 20, bottom: 40, left: 40 };

    const step = steps[currentStep];
    const patternLength = pattern.length;
    const textLength = text.length;

    // Create groups
    const textGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    const patternGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top + 50})`);
    const infoGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top + 120})`);

    // Draw text characters
    textGroup
      .selectAll("rect")
      .data(text.split(""))
      .enter()
      .append("rect")
      .attr("x", (d, i) => i * 35 + 30)
      .attr("y", 0)
      .attr("width", 32)
      .attr("height", 32)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", (d, i) => {
        if (i >= step.textPosition && i < step.textPosition + patternLength) {
          return step.match ? "#10B981" : "#F59E0B";
        }
        return "#E5E7EB";
      })
      .attr("stroke", "#6B7280")
      .attr("stroke-width", 1.5);

    textGroup
      .selectAll("text")
      .data(text.split(""))
      .enter()
      .append("text")
      .attr("x", (d, i) => i * 35 + 16 + 30)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-family", "monospace")
      .attr("font-size", "16px")
      .attr("font-weight", "600")
      .attr("fill", "#111827")
      .text((d) => d);

    // Draw text indices
    textGroup
      .selectAll(".index")
      .data(text.split(""))
      .enter()
      .append("text")
      .attr("x", (d, i) => i * 35 + 16 + 30)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("class", "index")
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", "#4B5563")
      .text((d, i) => i);

    // Draw pattern characters
    patternGroup
      .selectAll("rect")
      .data(pattern.split(""))
      .enter()
      .append("rect")
      .attr("x", (d, i) => (step.textPosition + i) * 35 + 30)
      .attr("y", 0)
      .attr("width", 32)
      .attr("height", 32)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", step.match ? "#10B981" : "#F59E0B")
      .attr("stroke", "#6B7280")
      .attr("stroke-width", 1.5);

    patternGroup
      .selectAll("text")
      .data(pattern.split(""))
      .enter()
      .append("text")
      .attr("x", (d, i) => (step.textPosition + i) * 35 + 16 + 30)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-family", "monospace")
      .attr("font-size", "16px")
      .attr("font-weight", "600")
      .attr("fill", "#111827")
      .text((d) => d);

    // Add hash information
    infoGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-family", "sans-serif")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .attr("fill", "#1F2937")
      .text(`Pattern Hash: ${step.patternHash}`);

    infoGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 25)
      .attr("font-family", "sans-serif")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .attr("fill", "#1F2937")
      .text(`Current Window Hash: ${step.currentHash}`);

    infoGroup
      .append("text")
      .attr("x", 0)
      .attr("y", 50)
      .attr("font-family", "sans-serif")
      .attr("font-size", "13px")
      .attr("fill", "#374151")
      .text(step.description)
      .call(wrap, width - margin.left - margin.right);

    // Add labels
    textGroup
      .append("text")
      .attr("x", -30)
      .attr("y", 20)
      .attr("font-family", "sans-serif")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .attr("fill", "#4B5563")
      .text("Text:");

    patternGroup
      .append("text")
      .attr("x", -30)
      .attr("y", 20)
      .attr("font-family", "sans-serif")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .attr("fill", "#4B5563")
      .text("Pattern:");
  }, [currentStep, steps, text, pattern]);

  // Text wrapping function for long descriptions
  function wrap(
    text: d3.Selection<SVGTextElement, unknown, null, undefined>,
    width: number
  ) {
    text.each(function () {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let word;
      let line: string[] = [];
      let lineNumber = 0;
      const lineHeight = 1.4; // ems
      const y = text.attr("y");
      const dy = parseFloat(text.attr("dy") || "0");
      let tspan = text
        .text(null)
        .append("tspan")
        .attr("x", 0)
        .attr("y", y)
        .attr("dy", dy + "px");

      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));
        if (
          tspan.node()?.getComputedTextLength() &&
          tspan.node()!.getComputedTextLength() > width
        ) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text
            .append("tspan")
            .attr("x", 0)
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "px")
            .text(word);
        }
      }
    });
  }

  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        width: "1000px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#F9FAFB",
        borderRadius: "12px",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div
        style={{
          marginBottom: "24px",
          backgroundColor: "#FFFFFF",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4B5563",
                marginBottom: "8px",
              }}
            >
              Text:
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4B5563",
                marginBottom: "8px",
              }}
            >
              Pattern:
            </label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
        <button
          onClick={runAlgorithm}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background-color 0.2s",
            display: "block",
            width: "100%",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#2563EB")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#3B82F6")
          }
        >
          Run Algorithm
        </button>
      </div>

      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="200"
          style={{ display: "block" }}
        ></svg>
      </div>

      {steps.length > 0 && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <button
              onClick={togglePlay}
              style={{
                padding: "8px 16px",
                backgroundColor: isPlaying ? "#EF4444" : "#10B981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s",
                flex: "1",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = isPlaying
                  ? "#DC2626"
                  : "#059669")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = isPlaying
                  ? "#EF4444"
                  : "#10B981")
              }
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              style={{
                padding: "8px 16px",
                backgroundColor: currentStep === 0 ? "#E5E7EB" : "#3B82F6",
                color: currentStep === 0 ? "#9CA3AF" : "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: currentStep === 0 ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
                flex: "1",
              }}
              onMouseOver={(e) =>
                currentStep > 0 &&
                (e.currentTarget.style.backgroundColor = "#2563EB")
              }
              onMouseOut={(e) =>
                currentStep > 0 &&
                (e.currentTarget.style.backgroundColor = "#3B82F6")
              }
            >
              Previous Step
            </button>
            <button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              style={{
                padding: "8px 16px",
                backgroundColor:
                  currentStep === steps.length - 1 ? "#E5E7EB" : "#3B82F6",
                color: currentStep === steps.length - 1 ? "#9CA3AF" : "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor:
                  currentStep === steps.length - 1 ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
                flex: "1",
              }}
              onMouseOver={(e) =>
                currentStep < steps.length - 1 &&
                (e.currentTarget.style.backgroundColor = "#2563EB")
              }
              onMouseOut={(e) =>
                currentStep < steps.length - 1 &&
                (e.currentTarget.style.backgroundColor = "#3B82F6")
              }
            >
              Next Step
            </button>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "8px",
              backgroundColor: "#F3F4F6",
              borderRadius: "6px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#4B5563",
              }}
            >
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RabinKarpVisualization;
