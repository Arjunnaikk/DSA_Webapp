'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Functions from '@/components/Function'

// Same algorithm categories as in Function.tsx
const ALGORITHM_CATEGORIES = {
  sorting: ["selection", "insertion"],
  searching: ["linear", "binary"],
  traversal: ["bfs", "dfs"],
  dataStructure: ["stack", "queue", "linked"]
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

export default function AlgorithmPage() {
  const [mounted, setMounted] = useState(false)
  const params = useParams();
  const algo = params.algo as string;
  const category = getAlgorithmCategory(algo);

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Functions initialAlgorithm={algo} initialCategory={category} />
    </main>
  )
}