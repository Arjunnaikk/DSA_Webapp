import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

class BST {
  root: TreeNode | null = null;

  insert(value: number): void {
    const newNode: TreeNode = { value, left: null, right: null };
    if (this.root === null) {
      this.root = newNode;
    } else {
      this.insertNode(this.root, newNode);
    }
  }

  private insertNode(node: TreeNode, newNode: TreeNode): void {
    if (newNode.value < node.value) {
      if (node.left === null) {
        node.left = newNode;
      } else {
        this.insertNode(node.left, newNode);
      }
    } else {
      if (node.right === null) {
        node.right = newNode;
      } else {
        this.insertNode(node.right, newNode);
      }
    }
  }

  remove(value: number): void {
    this.root = this.removeNode(this.root, value);
  }

  private removeNode(node: TreeNode | null, value: number): TreeNode | null {
    if (node === null) return null;

    if (value < node.value) {
      node.left = this.removeNode(node.left, value);
      return node;
    } else if (value > node.value) {
      node.right = this.removeNode(node.right, value);
      return node;
    } else {
      if (node.left === null && node.right === null) {
        return null;
      }
      if (node.left === null) {
        return node.right;
      }
      if (node.right === null) {
        return node.left;
      }
      const minRight = this.findMinNode(node.right);
      node.value = minRight.value;
      node.right = this.removeNode(node.right, minRight.value);
      return node;
    }
  }

  private findMinNode(node: TreeNode): TreeNode {
    return node.left ? this.findMinNode(node.left) : node;
  }

  search(value: number): TreeNode | null {
    return this.searchNode(this.root, value);
  }

  private searchNode(node: TreeNode | null, value: number): TreeNode | null {
    if (node === null) return null;
    if (value < node.value) return this.searchNode(node.left, value);
    if (value > node.value) return this.searchNode(node.right, value);
    return node;
  }
}

const BSTPostfixVisualization: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [operation, setOperation] = useState<string>("");
  const [postfixNotation, setPostfixNotation] = useState<number[]>([]);
  const [isAnimatingPostfix, setIsAnimatingPostfix] = useState<boolean>(false);
  const [bst] = useState<BST>(new BST());
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const animationRef = useRef<any>(null);
  const postfixAnimationRef = useRef<any>(null);

  // Tree dimensions and layout
  const width = 1000; // Increased width to accommodate larger tree
  const height = 440; // Increased height
  const margin = { top: 80, right: 90, bottom: 50, left: 90 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Convert BST to D3 hierarchy format
  const bstToHierarchy = (node: TreeNode | null): any => {
    if (!node) return null;
    return {
      value: node.value,
      children: [bstToHierarchy(node.left), bstToHierarchy(node.right)].filter(
        (child) => child !== null
      ),
    };
  };

  // Initialize tree with the specified structure
  useEffect(() => {
    const initialValues = [50, 30, 70, 20, 40, 60, 80, 10, 35, 45, 55, 65];
    initialValues.forEach((val) => bst.insert(val));
    updateTree();

    return () => {
      // Cleanup animations on unmount
      if (animationRef.current) clearInterval(animationRef.current);
      if (postfixAnimationRef.current)
        clearInterval(postfixAnimationRef.current);
    };
  }, []);

  // Update tree visualization
  const updateTree = () => {
    const svg = d3.select(svgRef.current);
    let g = d3.select(gRef.current);

    // Create group if it doesn't exist
    if (g.empty()) {
      g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .attr("class", "tree-group");
      gRef.current = g.node() as SVGGElement;
    }

    // Clear previous tree
    g.selectAll("*").remove();

    if (!bst.root) return;

    // Convert BST to hierarchy
    const rootData = bstToHierarchy(bst.root);
    const root = d3.hierarchy(rootData);

    // Create tree layout with adjusted separation
    const treeLayout = d3
      .tree()
      .size([innerWidth, innerHeight])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.5)); // Adjust node separation

    const treeData = treeLayout(root);

    // Draw links (edges between nodes)
    g.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d: any) => d.x + 80)
          .y((d: any) => d.y + 40)
      );

    // Create node groups
    const node = g
      .selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.x + 80},${d.y + 40})`);

    // Add circles to nodes
    node.append("circle").attr("r", 15).attr("class", "node-circle"); // Smaller radius for more nodes

    // Add text to nodes
    node
      .append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text((d: any) => d.data.value)
      .style("font-size", "10px"); // Smaller font size
  };

  // [Rest of the code remains the same as previous implementation...]
  const getPathToValue = (value: number): TreeNode[] => {
    const path: TreeNode[] = [];
    let current = bst.root;

    while (current) {
      path.push(current);
      if (value === current.value) break;
      current = value < current.value ? current.left : current.right;
    }

    return path;
  };

  // Animate traversal path
  const animateTraversal = (path: TreeNode[], callback?: () => void) => {
    const g = d3.select(gRef.current);
    let i = 0;

    // Clear any existing animations
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    // Reset all traversal highlights
    g.selectAll(".node-circle").classed("traversing", false);

    animationRef.current = setInterval(() => {
      if (i >= path.length) {
        clearInterval(animationRef.current);
        if (callback) callback();
        return;
      }

      // Reset previous highlight
      if (i > 0) {
        g.selectAll(".node")
          .filter((d: any) => d.data.value === path[i - 1].value)
          .select(".node-circle")
          .classed("traversing", false);
      }

      // Highlight current node
      g.selectAll(".node")
        .filter((d: any) => d.data.value === path[i].value)
        .select(".node-circle")
        .classed("traversing", true);

      i++;
    }, 800);
  };

  // Collect nodes in postfix order
  const getPostfixOrder = (): TreeNode[] => {
    const nodes: TreeNode[] = [];

    const traverse = (node: TreeNode | null) => {
      if (!node) return;
      traverse(node.left);
      traverse(node.right);
      nodes.push(node);
    };

    traverse(bst.root);
    return nodes;
  };

  // Animate postfix traversal
  const animatePostfixTraversal = () => {
    if (!bst.root) return;

    setIsAnimatingPostfix(true);
    setPostfixNotation([]);
    const g = d3.select(gRef.current);
    const nodes = getPostfixOrder();

    if (nodes.length === 0) {
      setIsAnimatingPostfix(false);
      return;
    }

    // Clear any existing animations
    if (postfixAnimationRef.current) {
      clearInterval(postfixAnimationRef.current);
    }

    // Reset all traversal highlights
    g.selectAll(".node-circle").classed("postfix", false);

    let i = 0;

    const animateNextNode = () => {
      if (i >= nodes.length) {
        clearInterval(postfixAnimationRef.current);
        setIsAnimatingPostfix(false);
        return;
      }

      const currentNode = nodes[i];
      if (!currentNode) {
        i++;
        return;
      }

      // Reset previous highlight
      if (i > 0) {
        const prevNode = nodes[i - 1];
        if (prevNode) {
          g.selectAll(".node")
            .filter((d: any) => d.data.value === prevNode.value)
            .select(".node-circle")
            .classed("postfix", false);
        }
      }

      // Highlight current node
      g.selectAll(".node")
        .filter((d: any) => d.data.value === currentNode.value)
        .select(".node-circle")
        .classed("postfix", true);

      // Update postfix notation display
      setPostfixNotation((prev) => [...prev, currentNode.value]);

      i++;
    };

    // Start animation
    animateNextNode();
    postfixAnimationRef.current = setInterval(animateNextNode, 1000);
  };

  // Event handlers
  const handleInsert = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) return;

    setOperation("insert");
    const path = getPathToValue(value);
    if (path.length > 0 && path[path.length - 1].value === value) {
      // Value already exists
      animateTraversal(path, () => {
        const g = d3.select(gRef.current);
        g.selectAll(".node")
          .filter((d: any) => d.data.value === value)
          .select(".node-circle")
          .classed("duplicate", true)
          .transition()
          .duration(300)
          .style("fill", "#ffcc00")
          .transition()
          .duration(300)
          .style("fill", "#fff")
          .on("end", () => {
            g.selectAll(".node-circle").classed("duplicate", false);
          });
      });
      return;
    }

    animateTraversal(path, () => {
      bst.insert(value);
      updateTree();
    });
    setInputValue("");
  };

  const handleDelete = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) return;

    setOperation("delete");
    const path = getPathToValue(value);
    if (path.length === 0 || path[path.length - 1].value !== value) {
      // Value not found
      animateTraversal(path, () => {
        const g = d3.select(gRef.current);
        if (path.length > 0) {
          g.selectAll(".node")
            .filter((d: any) => d.data.value === path[path.length - 1].value)
            .select(".node-circle")
            .classed("not-found", true)
            .transition()
            .duration(300)
            .style("fill", "#ff6666")
            .transition()
            .duration(300)
            .style("fill", "#fff")
            .on("end", () => {
              g.selectAll(".node-circle").classed("not-found", false);
            });
        }
      });
      return;
    }

    animateTraversal(path, () => {
      const nodeToDelete = d3
        .select(gRef.current)
        .selectAll(".node")
        .filter((d: any) => d.data.value === value);

      nodeToDelete
        .select("circle")
        .classed("deleting", true)
        .transition()
        .duration(500)
        .attr("r", 0);

      nodeToDelete
        .select("text")
        .transition()
        .duration(500)
        .style("opacity", 0);

      setTimeout(() => {
        bst.remove(value);
        updateTree();
      }, 500);
    });
    setInputValue("");
  };

  const handleSearch = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) return;

    setOperation("search");
    const path = getPathToValue(value);
    const found = path.length > 0 && path[path.length - 1].value === value;

    animateTraversal(path, () => {
      const g = d3.select(gRef.current);
      const node = g
        .selectAll(".node")
        .filter(
          (d: any) =>
            d.data.value === (found ? value : path[path.length - 1]?.value)
        );

      if (found) {
        // Node found - pulse animation
        node
          .select(".node-circle")
          .classed("found", true)
          .transition()
          .duration(200)
          .attr("r", 25)
          .transition()
          .duration(200)
          .attr("r", 20)
          .transition()
          .duration(200)
          .attr("r", 25)
          .transition()
          .duration(200)
          .attr("r", 20)
          .on("end", () => {
            node.select(".node-circle").classed("found", false);
          });
      } else {
        // Node not found - show error
        node
          .select(".node-circle")
          .classed("not-found", true)
          .transition()
          .duration(300)
          .style("fill", "#ff6666")
          .transition()
          .duration(300)
          .style("fill", "#fff")
          .on("end", () => {
            node.select(".node-circle").classed("not-found", false);
          });
      }
    });
    setInputValue("");
  };

  const handleClear = () => {
    bst.root = null;
    setPostfixNotation([]);
    updateTree();
  };

  const handlePostfix = () => {
    setPostfixNotation([]);
    animatePostfixTraversal();
  };
  // All the other methods (getPathToValue, animateTraversal, getPostfixOrder,
  // animatePostfixTraversal, event handlers) remain unchanged

  return (
    <div className="bst-visualization">
      <div className="controls">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter value"
          className="input"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              if (operation === "insert") handleInsert();
              else if (operation === "delete") handleDelete();
              else if (operation === "search") handleSearch();
            }
          }}
        />
        <button onClick={handleInsert} className="button insert">
          Insert
        </button>
        <button onClick={handleDelete} className="button delete">
          Delete
        </button>
        <button onClick={handleSearch} className="button search">
          Search
        </button>
        <button
          onClick={handlePostfix}
          className="button postfix"
          disabled={isAnimatingPostfix}
        >
          {isAnimatingPostfix ? "Traversing..." : "Postfix Notation"}
        </button>
        <button onClick={handleClear} className="button clear">
          Clear
        </button>
      </div>

      <div className="postfix-display">
        <h3>Postfix Notation:</h3>
        <div className="postfix-values">
          {postfixNotation.map((value, index) => (
            <span
              key={index}
              className={`postfix-value ${
                index === postfixNotation.length - 1 ? "current" : ""
              }`}
            >
              {value}
              {index < postfixNotation.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      </div>

      <svg ref={svgRef} width={width} height={height} className="tree-svg">
        <g ref={gRef} className="tree-group" />
      </svg>

      <style>{`
        .bst-visualization {
          font-family: Arial, sans-serif;
            margin: 20px;
          margin-left: 240px  ;
          width : 1200px;
        
        }
        .controls {
          display: flex;
           width: 1000px;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 8px;
          flex-wrap: wrap;
        }
        .input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          width: 500px;
        } 
        .button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .button.insert {
          background-color: #4CAF50;
          color: white;
        }
        .button.insert:hover:not(:disabled) {
          background-color: #45a049;
        }
        .button.delete {
          background-color: #f44336;
          color: white;
        }
        .button.delete:hover:not(:disabled) {
          background-color: #d32f2f;
        }
        .button.search {
          background-color: #2196F3;
          color: white;
        }
        .button.search:hover:not(:disabled) {
          background-color: #0b7dda;
        }
        .button.postfix {
          background-color: #FF5722;
          color: white;
        }
        .button.postfix:hover:not(:disabled) {
          background-color: #E64A19;
        }
        .button.clear {
          background-color: #ff9800;
          color: white;
        }
        .button.clear:hover:not(:disabled) {
          background-color: #e68a00;
        }
        .tree-svg {
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .node-circle {
          fill: #fff;
          stroke: #6366f1;
          stroke-width: 2px;
          transition: all 0.3s ease;
        }
        .link {
          fill: none;
          stroke: #cbd5e1;
          stroke-width: 1.5px;
          transition: all 0.3s ease;
        }
        text {
          font-weight: 500;
          pointer-events: none;
          fill: #1e293b;
        }
        .traversing {
          fill: #a5b4fc;
          stroke: #4f46e5;
        }
        .postfix {
          fill: #FFAB91;
          stroke: #FF5722;
        }
        .inserting {
          fill: #6ee7b7;
          stroke: #10b981;
        }
        .found {
          fill: #fbbf24;
          stroke: #f59e0b;
        }
        .deleting {
          fill: #fca5a5;
          stroke: #ef4444;
        }
        .not-found, .duplicate {
          stroke: #ef4444;
        }
        .postfix-display {
          margin: 15px 0;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 8px;
           width : 1000px;
        }
        .postfix-display h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #333;
        }
        .postfix-values {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          align-items: center;
        }
        .postfix-value {
          padding: 4px 8px;
          background: #FFCCBC;
          border-radius: 4px;
          color: #BF360C;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        .postfix-value.current {
          background: #FF5722;
          color: white;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default BSTPostfixVisualization;
