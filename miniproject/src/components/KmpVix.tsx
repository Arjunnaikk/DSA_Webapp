import React, { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

interface KMPVisualizationProps {
  width?: number;
  height?: number;
}

const KMPVisualization: React.FC<KMPVisualizationProps> = ({
  width = 800,
  height = 280,
}) => {
  const [text, setText] = useState<string>("ABABDABACDABABCABAB");
  const [pattern, setPattern] = useState<string>("ABABCABAB");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(500);
  const [step, setStep] = useState<number>(0);
  const [lps, setLps] = useState<number[]>([]);
  const [matches, setMatches] = useState<number[]>([]);
  const [currentComparison, setCurrentComparison] = useState<{
    i: number;
    j: number;
  }>({ i: 0, j: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | null>(null);
  const stepsRef = useRef<{ i: number; j: number; matches: number[] }[]>([]);

  // Compute LPS array (Longest Prefix Suffix)
  const computeLPSArray = useCallback((pat: string): number[] => {
    const lpsArr = new Array(pat.length).fill(0);
    let len = 0;
    let i = 1;

    while (i < pat.length) {
      if (pat[i] === pat[len]) {
        len++;
        lpsArr[i] = len;
        i++;
      } else {
        if (len !== 0) {
          len = lpsArr[len - 1];
        } else {
          lpsArr[i] = 0;
          i++;
        }
      }
    }

    return lpsArr;
  }, []);

  // KMP Search Algorithm
  const KMPSearch = useCallback(
    (txt: string, pat: string) => {
      const M = pat.length;
      const N = txt.length;
      const lpsArr = computeLPSArray(pat);
      setLps(lpsArr);

      let i = 0; // index for txt[]
      let j = 0; // index for pat[]
      const foundMatches: number[] = [];

      const steps: { i: number; j: number; matches: number[] }[] = [];

      while (i < N) {
        if (pat[j] === txt[i]) {
          i++;
          j++;
        }

        if (j === M) {
          foundMatches.push(i - j);
          steps.push({ i, j, matches: [...foundMatches] });
          j = lpsArr[j - 1];
        } else if (i < N && pat[j] !== txt[i]) {
          if (j !== 0) {
            steps.push({ i, j, matches: [...foundMatches] });
            j = lpsArr[j - 1];
          } else {
            steps.push({ i: i + 1, j, matches: [...foundMatches] });
            i++;
          }
        } else {
          steps.push({ i, j, matches: [...foundMatches] });
        }
      }

      return steps;
    },
    [computeLPSArray]
  );

  // Update steps when text or pattern changes
  useEffect(() => {
    stepsRef.current = KMPSearch(text, pattern);
    setStep(0);
    setMatches([]);
    setCurrentComparison({ i: 0, j: 0 });
  }, [text, pattern, KMPSearch]);

  // Animation logic
  useEffect(() => {
    if (!isAnimating || step >= stepsRef.current.length) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = () => {
      if (step < stepsRef.current.length) {
        const { i, j, matches } = stepsRef.current[step];
        setCurrentComparison({ i, j });
        setMatches(matches);
        setStep(step + 1);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = window.setTimeout(animate, speed);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isAnimating, step, speed]);

  // Draw visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Set up dimensions
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Text display
    const textChars = text.split("");
    const patternChars = pattern.split("");
    const charWidth = Math.min(
      30,
      innerWidth / Math.max(text.length, pattern.length)
    );
    const charHeight = 30;

    // Draw text
    g.selectAll(".text-char")
      .data(textChars)
      .enter()
      .append("rect")
      .attr("class", "text-char")
      .attr("x", (d, i) => i * charWidth + 30)
      .attr("y", 0 + 20)
      .attr("width", charWidth)
      .attr("height", charHeight)
      .attr("fill", (d, i) => {
        if (matches.includes(i)) return "#a1d76a"; // green for matches
        if (
          i >= currentComparison.i - currentComparison.j &&
          i < currentComparison.i
        ) {
          return "#e9a3c9"; // pink for current comparison
        }
        return "#f7f7f7";
      })
      .attr("stroke", "#333");

    g.selectAll(".text-char-label")
      .data(textChars)
      .enter()
      .append("text")
      .attr("class", "text-char-label")
      .attr("x", (d, i) => i * charWidth + charWidth / 2 + 30)
      .attr("y", charHeight / 2 + 20)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .text((d) => d);

    // Draw pattern
    g.selectAll(".pattern-char")
      .data(patternChars)
      .enter()
      .append("rect")
      .attr("class", "pattern-char")
      .attr(
        "x",
        (d, i) =>
          (currentComparison.i - currentComparison.j + i) * charWidth + 30
      )
      .attr("y", charHeight + 10 + 20)
      .attr("width", charWidth)
      .attr("height", charHeight)
      .attr("fill", (d, i) => (i < currentComparison.j ? "#e9a3c9" : "#f7f7f7"))
      .attr("stroke", "#333");

    g.selectAll(".pattern-char-label")
      .data(patternChars)
      .enter()
      .append("text")
      .attr("class", "pattern-char-label")
      .attr(
        "x",
        (d, i) =>
          (currentComparison.i - currentComparison.j + i) * charWidth +
          charWidth / 2 +
          30
      )
      .attr("y", charHeight + 10 + charHeight / 2 + 20)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .text((d) => d);

    // Draw LPS array
    if (lps.length > 0) {
      g.selectAll(".lps-char")
        .data(patternChars)
        .enter()
        .append("rect")
        .attr("class", "lps-char")
        .attr("x", (d, i) => i * charWidth + 30)
        .attr("y", 2 * charHeight + 20 + 20)
        .attr("width", charWidth)
        .attr("height", charHeight)
        .attr("fill", "#f7f7f7")
        .attr("stroke", "#333");

      g.selectAll(".lps-char-label")
        .data(lps)
        .enter()
        .append("text")
        .attr("class", "lps-char-label")
        .attr("x", (d, i) => i * charWidth + charWidth / 2 + 30)
        .attr("y", 2 * charHeight + 20 + charHeight / 2 + 20)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text((d) => d);

      g.append("text")
        .attr("x", 20)
        .attr("y", 2 * charHeight + 20 + charHeight / 2 + 20)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .text("LPS:");
    }

    // Add index labels
    g.selectAll(".text-index")
      .data(textChars)
      .enter()
      .append("text")
      .attr("class", "text-index")
      .attr("x", (d, i) => i * charWidth + charWidth / 2 + 30)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .text((d, i) => i);

    g.selectAll(".pattern-index")
      .data(patternChars)
      .enter()
      .append("text")
      .attr("class", "pattern-index")
      .attr("x", (d, i) => i * charWidth + charWidth / 2 + 30)
      .attr("y", 3 * charHeight + 60)
      .attr("text-anchor", "middle")
      .text((d, i) => i);

    // Add legend
    const legend = g
      .append("g")
      .attr("transform", `translate(${200}, ${3 * charHeight + 90})`);

    legend
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#a1d76a");

    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 10)
      .text("Match")
      .attr("dominant-baseline", "middle");

    legend
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#e9a3c9")
      .attr("x", 100);

    legend
      .append("text")
      .attr("x", 120)
      .attr("y", 10)
      .text("Current Comparison")
      .attr("dominant-baseline", "middle");

    // Add status text
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .text(`Step ${step} of ${stepsRef.current.length}`);
  }, [text, pattern, currentComparison, matches, lps, step, width, height]);

  const handleStart = () => {
    setStep(0);
    setMatches([]);
    setCurrentComparison({ i: 0, j: 0 });
    setIsAnimating(true);
  };

  const handlePause = () => {
    setIsAnimating(false);
  };

  const handleReset = () => {
    setIsAnimating(false);
    setStep(0);
    setMatches([]);
    setCurrentComparison({ i: 0, j: 0 });
  };

  const handleStep = () => {
    if (step < stepsRef.current.length) {
      const { i, j, matches } = stepsRef.current[step];
      setCurrentComparison({ i, j });
      setMatches(matches);
      setStep(step + 1);
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        {/* Control Panel */}
        <div
          style={{
            flex: "1",
            minWidth: "300px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            padding: "15px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <label
              style={{
                fontWeight: "bold",
                marginRight: "10px",
                minWidth: "60px",
              }}
            >
              Text:
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isAnimating}
              style={{
                height: "30px",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                flex: "1",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <label
              style={{
                fontWeight: "bold",
                marginRight: "10px",
                minWidth: "60px",
              }}
            >
              Pattern:
            </label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              disabled={isAnimating}
              style={{
                height: "30px",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                flex: "1",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "5px",
              }}
            >
              Animation Speed: {speed}ms
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              style={{
                width: "100%",
                marginBottom: "5px",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleStart}
              disabled={isAnimating}
              style={{
                height: "30px",
                // padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background-color 0.3s",
                flex: "1",
                minWidth: "100px",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#218838")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#28a745")
              }
            >
              Start
            </button>
            <button
              onClick={handlePause}
              disabled={!isAnimating}
              style={{
                height: "30px",
                // padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background-color 0.3s",
                flex: "1",
                minWidth: "100px",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#c82333")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#dc3545")
              }
            >
              Pause
            </button>
            <button
              onClick={handleReset}
              style={{
                height: "30px",
                // padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background-color 0.3s",
                flex: "1",
                minWidth: "100px",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#5a6268")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#6c757d")
              }
            >
              Reset
            </button>
            <button
              onClick={handleStep}
              disabled={isAnimating || step >= stepsRef.current.length}
              style={{
                // padding: "8px 16px",
                height: "30px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background-color 0.3s",
                flex: "1",
                minWidth: "100px",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#138496")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#17a2b8")
              }
            >
              Step
            </button>
          </div>
        </div>

        {/* Status Panel */}
        <div
          style={{
            flex: "1",
            minWidth: "300px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            padding: "15px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ marginTop: "0", color: "#333" }}>Algorithm Status</h3>
          <div style={{ marginBottom: "15px" }}>
            <strong style={{ display: "block", marginBottom: "5px" }}>
              Current State:
            </strong>
            <div
              style={{
                // padding: "10px",
                paddingLeft: "10px",
                paddingTop: "3px",
                height: "30px",
                backgroundColor: "white",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            >
              {step === 0
                ? "Not started"
                : step >= stepsRef.current.length
                ? "Completed"
                : `Comparing text[${currentComparison.i}] with pattern[${currentComparison.j}]`}
            </div>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <strong style={{ display: "block", marginBottom: "5px" }}>
              Matches found:
            </strong>
            <div
              style={{
                // padding: "10px",
                paddingLeft: "10px",
                paddingTop: "3px",
                height: "30px",
                backgroundColor: "white",
                borderRadius: "4px",
                border: "1px solid #ddd",
                minHeight: "20px",
              }}
            >
              {matches.length > 0 ? matches.join(", ") : "None yet"}
            </div>
          </div>
          <div>
            <strong style={{ display: "block", marginBottom: "5px" }}>
              LPS Array:
            </strong>
            <div
              style={{
                // padding: "10px",
                paddingLeft: "10px",
                paddingTop: "3px",
                height: "30px",
                backgroundColor: "white",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontFamily: "monospace",
              }}
            >
              {lps.length > 0 ? `[${lps.join(", ")}]` : "Not calculated yet"}
            </div>
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{
            display: "block",
            margin: "0 auto",
            backgroundColor: "white",
            borderRadius: "4px",
            border: "1px solid #ddd",
          }}
        ></svg>
      </div>
    </div>
  );
};

export default KMPVisualization;
