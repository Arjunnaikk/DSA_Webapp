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

const BSTVisualization: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [operation, setOperation] = useState<string>("");
  const [bst] = useState<BST>(new BST());
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const animationRef = useRef<any>(null);

  // Tree dimensions and layout
  const width = 800;
  const height = 500;
  const margin = { top: 50, right: 0, bottom: 50, left: 90 };
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

  // Initialize tree with a basic structure
  useEffect(() => {
    const initialValues = [50, 30, 70];
    initialValues.forEach((val) => bst.insert(val));
    updateTree();
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

    // Create tree layout
    const treeLayout = d3.tree().size([innerWidth, innerHeight]);
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
          .x((d: any) => d.x)
          .y((d: any) => d.y + 40)
      );

    // Create node groups
    const node = g
      .selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.x},${d.y + 40})`);

    // Add circles to nodes
    node.append("circle").attr("r", 20).attr("class", "node-circle");

    // Add text to nodes
    node
      .append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text((d: any) => d.data.value);
  };

  // Animate insertion with smooth transitions
  const animateInsertion = (value: number) => {
    const path = getPathToValue(value);
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    // Clear any existing animations
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    // First animate the traversal path
    animateTraversal(path, () => {
      // Perform the actual insertion
      bst.insert(value);

      // Get the new tree structure
      const rootData = bstToHierarchy(bst.root);
      const root = d3.hierarchy(rootData);
      const treeLayout = d3.tree().size([innerWidth, innerHeight]);
      const newTreeData = treeLayout(root);

      // Find the new node in the tree data
      const newNodeData = newTreeData
        .descendants()
        .find((d: any) => d.data.value === value);
      if (!newNodeData) return;

      // Get parent node position
      const parentValue = path[path.length - 1].value;
      const parentNode = g
        .selectAll(".node")
        .filter((d: any) => d.data.value === parentValue);

      const parentX = parentNode.size()
        ? parseFloat(parentNode.attr("transform").split(",")[0].split("(")[1])
        : innerWidth / 2;
      const parentY = parentNode.size()
        ? parseFloat(parentNode.attr("transform").split(",")[1].split(")")[0])
        : 0;

      // Create temporary node at parent position
      const tempNode = g
        .append("g")
        .attr("class", "node temp-node")
        .attr("transform", `translate(${parentX},${parentY})`);

      tempNode
        .append("circle")
        .attr("r", 0)
        .attr("class", "node-circle inserting")
        .transition()
        .duration(300)
        .attr("r", 20);

      tempNode
        .append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(value)
        .style("opacity", 0)
        .transition()
        .duration(300)
        .style("opacity", 1);

      // Animate node to its final position
      tempNode
        .transition()
        .duration(800)
        .attr("transform", `translate(${newNodeData.x},${newNodeData.y})`)
        .on("end", () => {
          // Redraw the entire tree with proper layout
          updateTree();
        });
    });
  };

  // Animate deletion with smooth transitions
  const animateDeletion = (value: number) => {
    const path = getPathToValue(value);
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    if (path.length === 0 || path[path.length - 1].value !== value) {
      // Value not found - show error
      animateSearch(value);
      return;
    }

    // First animate the traversal path
    animateTraversal(path, () => {
      // Highlight node to be deleted
      const nodeToDelete = g
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

      // After deletion animation completes, perform the actual deletion
      setTimeout(() => {
        bst.remove(value);
        updateTree();
      }, 500);
    });
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

  // Animate search operation
  const animateSearch = (value: number) => {
    const path = getPathToValue(value);
    const g = d3.select(gRef.current);

    animateTraversal(path, () => {
      const found = path.length > 0 && path[path.length - 1].value === value;
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
  };

  // Get path to a value in the tree
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

  // Event handlers
  const handleInsert = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) return;

    setOperation("insert");
    animateInsertion(value);
    setInputValue("");
  };

  const handleDelete = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) return;

    setOperation("delete");
    animateDeletion(value);
    setInputValue("");
  };

  const handleSearch = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) return;

    setOperation("search");
    animateSearch(value);
    setInputValue("");
  };

  const handleClear = () => {
    bst.root = null;
    updateTree();
  };

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
        <button onClick={handleClear} className="button clear">
          Clear
        </button>
      </div>
      <svg ref={svgRef} width={width} height={height} className="tree-svg">
        <g ref={gRef} className="tree-group" />
      </svg>

      <style>{`
        .bst-visualization {
          font-family: Arial, sans-serif;
          margin: 20px;
          margin-left: 300px  ;
          width : 1150px;
        }
        .controls {
          display: flex;
          width: 800px
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          width: 460px;
        }
        .button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .button.insert {
          background-color: #4CAF50;
          color: white;
        }
        .button.insert:hover {
          background-color: #45a049;
        }
        .button.delete {
          background-color: #f44336;
          color: white;
        }
        .button.delete:hover {
          background-color: #d32f2f;
        }
        .button.search {
          background-color: #2196F3;
          color: white;
        }
        .button.search:hover {
          background-color: #0b7dda;
        }
        .button.clear {
          background-color: #ff9800;
          color: white;
        }
        .button.clear:hover {
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
          stroke-width: 3px;
          transition: all 0.3s ease;
        }
        .link {
          fill: none;
          stroke: #cbd5e1;
          stroke-width: 2px;
          transition: all 0.3s ease;
        }
        text {
          font: 14px Arial;
          font-weight: 500;
          pointer-events: none;
          fill: #1e293b;
        }
        .traversing {
          fill: #a5b4fc;
          stroke: #4f46e5;
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
        .not-found {
          stroke: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default BSTVisualization;
