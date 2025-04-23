"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface AlgorithmCardProps {
  id: string;
  title: string;
  description: string;
  className?: string;
}

export function AlgorithmCard({ id, title, description, className }: AlgorithmCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Simple visualization based on card type
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (id === 'sorting') {
        // Draw bar chart visualization
        const barCount = 16;
        const barWidth = canvas.width / (barCount * 1.5);
        const maxHeight = canvas.height * 0.8;
        
        ctx.fillStyle = isHovered ? '#f97316' : '#e2e8f0';
        
        for (let i = 0; i < barCount; i++) {
          const height = (Math.sin(i * 0.4) + 1) * maxHeight / 2 + Math.random() * 30;
          ctx.fillRect(
            i * barWidth * 1.5 + barWidth/2, 
            canvas.height - height, 
            barWidth, 
            height
          );
        }
      } else if (id === 'graphs') {
        // Draw grid with some nodes and edges
        const gridSize = 8;
        const cellSize = Math.min(canvas.width, canvas.height) / gridSize;
        
        ctx.fillStyle = isHovered ? '#f97316' : '#e2e8f0';
        ctx.strokeStyle = isHovered ? 'rgba(249, 115, 22, 0.5)' : 'rgba(226, 232, 240, 0.5)';
        
        // Draw grid
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            if (Math.random() > 0.85) {
              ctx.beginPath();
              ctx.arc(
                i * cellSize + cellSize/2,
                j * cellSize + cellSize/2,
                cellSize/4,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          }
        }
        
        // Draw some connections
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const x1 = Math.floor(Math.random() * gridSize) * cellSize + cellSize/2;
          const y1 = Math.floor(Math.random() * gridSize) * cellSize + cellSize/2;
          const x2 = Math.floor(Math.random() * gridSize) * cellSize + cellSize/2;
          const y2 = Math.floor(Math.random() * gridSize) * cellSize + cellSize/2;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      } else if (id === 'trees') {
        // Draw simple tree
        const drawNode = (x: number, y: number, radius: number, level: number) => {
          if (level > 3) return;
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          if (level < 3) {
            // Draw left child
            const leftX = x - radius * 3 * (1/level);
            const leftY = y + radius * 4;
            ctx.beginPath();
            ctx.moveTo(x, y + radius);
            ctx.lineTo(leftX, leftY - radius);
            ctx.stroke();
            drawNode(leftX, leftY, radius * 0.9, level + 1);
            
            // Draw right child
            const rightX = x + radius * 3 * (1/level);
            const rightY = y + radius * 4;
            ctx.beginPath();
            ctx.moveTo(x, y + radius);
            ctx.lineTo(rightX, rightY - radius);
            ctx.stroke();
            drawNode(rightX, rightY, radius * 0.9, level + 1);
          }
        };
        
        ctx.fillStyle = isHovered ? '#f97316' : '#e2e8f0';
        ctx.strokeStyle = isHovered ? 'rgba(249, 115, 22, 0.5)' : 'rgba(226, 232, 240, 0.5)';
        ctx.lineWidth = 2;
        
        drawNode(canvas.width / 2, 30, 15, 1);
      } else if (id === 'linked-lists') {
        // Draw linked list
        const nodeCount = 4;
        const nodeSize = 30;
        const nodeGap = 60;
        const startX = (canvas.width - (nodeCount * nodeSize + (nodeCount - 1) * nodeGap)) / 2;
        const y = canvas.height / 2;
        
        ctx.fillStyle = isHovered ? '#f97316' : '#e2e8f0';
        ctx.strokeStyle = isHovered ? 'rgba(249, 115, 22, 0.5)' : 'rgba(226, 232, 240, 0.5)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < nodeCount; i++) {
          const x = startX + i * (nodeSize + nodeGap);
          
          // Draw node
          ctx.beginPath();
          ctx.rect(x, y - nodeSize/2, nodeSize, nodeSize);
          ctx.fill();
          
          // Draw arrow
          if (i < nodeCount - 1) {
            ctx.beginPath();
            ctx.moveTo(x + nodeSize, y);
            ctx.lineTo(x + nodeSize + nodeGap, y);
            
            // Arrow head
            const arrowSize = 8;
            ctx.lineTo(x + nodeSize + nodeGap - arrowSize, y - arrowSize/2);
            ctx.moveTo(x + nodeSize + nodeGap, y);
            ctx.lineTo(x + nodeSize + nodeGap - arrowSize, y + arrowSize/2);
            
            ctx.stroke();
          }
        }
      } else if (id === 'searching') {
        // Draw search visualization
        const gridSize = 6;
        const cellSize = Math.min(canvas.width, canvas.height) / gridSize;
        
        ctx.fillStyle = isHovered ? 'rgba(249, 115, 22, 0.3)' : 'rgba(226, 232, 240, 0.3)';
        ctx.strokeStyle = isHovered ? '#f97316' : '#e2e8f0';
        ctx.lineWidth = 1;
        
        // Draw grid cells
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            ctx.fillRect(
              i * cellSize, 
              j * cellSize, 
              cellSize, 
              cellSize
            );
            ctx.strokeRect(
              i * cellSize, 
              j * cellSize, 
              cellSize, 
              cellSize
            );
          }
        }
        
        // Highlight search path
        ctx.fillStyle = isHovered ? '#f97316' : '#94a3b8';
        
        // Binary search pattern
        const row = Math.floor(gridSize / 2);
        for (let i = 0; i < gridSize; i += 2) {
          ctx.fillRect(
            i * cellSize, 
            row * cellSize, 
            cellSize, 
            cellSize
          );
        }
        
        // Target found
        ctx.fillStyle = isHovered ? '#ea580c' : '#64748b';
        ctx.fillRect(
          4 * cellSize, 
          row * cellSize, 
          cellSize, 
          cellSize
        );
        
        // Draw magnifying glass
        ctx.strokeStyle = isHovered ? '#f97316' : '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
          canvas.width - 50, 
          50, 
          20, 
          0, 
          Math.PI * 2
        );
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(canvas.width - 38, 62);
        ctx.lineTo(canvas.width - 25, 75);
        ctx.stroke();
      } else if (id === 'strings') {
        // Draw string pattern matching
        ctx.fillStyle = isHovered ? '#f97316' : '#e2e8f0';
        ctx.font = '16px monospace';
        
        const text = "ABCABABCABCAB";
        const pattern = "ABCAB";
        const y = canvas.height / 2;
        const charWidth = canvas.width / (text.length + 2);
        
        // Draw text
        for (let i = 0; i < text.length; i++) {
          ctx.fillText(
            text[i], 
            (i + 1) * charWidth, 
            y - 20
          );
        }
        
        // Draw pattern with offset
        ctx.fillStyle = isHovered ? '#ea580c' : '#94a3b8';
        for (let i = 0; i < pattern.length; i++) {
          ctx.fillText(
            pattern[i], 
            (i + 3) * charWidth, 
            y + 20
          );
        }
        
        // Draw matching lines
        ctx.strokeStyle = isHovered ? 'rgba(249, 115, 22, 0.6)' : 'rgba(226, 232, 240, 0.6)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < pattern.length; i++) {
          if (text[i + 2] === pattern[i]) {
            ctx.beginPath();
            ctx.moveTo((i + 3) * charWidth + 4, y - 10);
            ctx.lineTo((i + 3) * charWidth + 4, y + 10);
            ctx.stroke();
          }
        }
      }
    };
    
    draw();
    
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [id, isHovered]);
  
  return (
    <Link href={`/${id}`}>
      <Card 
        className={cn(
          "h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
          isHovered && "border-orange-500",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md border bg-muted/50">
            <canvas 
              ref={canvasRef}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}