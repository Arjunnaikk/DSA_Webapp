export const ALGORITHM_CATEGORIES = [
    {
        id: 'sorting',
        title: 'Sorting',
        description: 'Visualize how different sorting algorithms arrange elements in a specific order.',
        algorithms: ['Bubble Sort', 'Quick Sort', 'Merge Sort', 'Heap Sort', 'Selection Sort'],
    },
    {
        id: 'graphs',
        title: 'Graphs',
        description: 'Explore graph traversal and shortest path algorithms with interactive visualizations.',
        algorithms: ['BFS', 'DFS', 'Dijkstra', 'A*', 'Kruskal\'s MST'],
    },
    {
        id: 'trees',
        title: 'Trees',
        description: 'Understand tree data structures and related algorithms through visual demonstrations.',
        algorithms: ['Binary Trees', 'AVL Trees', 'Red-Black Trees', 'Heap', 'Trie'],
    },
    {
        id: 'linked-lists',
        title: 'Linked Lists',
        description: 'Learn about linked list operations and manipulations with step-by-step visuals.',
        algorithms: ['Insertion', 'Deletion', 'Traversal', 'Reversal', 'Cycle Detection'],
    },
];

export const SAMPLE_QUESTIONS = [
    {
        id: 1,
        category: 'sorting',
        question: 'What is the time complexity of Bubble Sort?',
        options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 2,
        explanation: 'Bubble Sort has a time complexity of O(n²) because it uses nested loops to compare and swap adjacent elements. For each element, it needs to compare with every other element, resulting in n * n comparisons.',
    },
    {
        id: 2,
        category: 'sorting',
        question: 'Which sorting algorithm has the best average-case time complexity?',
        options: ['Bubble Sort', 'Quick Sort', 'Selection Sort', 'Insertion Sort'],
        correctAnswer: 1,
        explanation: 'Quick Sort has an average-case time complexity of O(n log n), which is optimal for comparison-based sorting. It achieves this through its divide-and-conquer strategy and efficient partitioning.',
    },
    {
        id: 3,
        category: 'graphs',
        question: 'Which algorithm finds the shortest path in an unweighted graph?',
        options: ['DFS', 'BFS', 'Dijkstra', 'Kruskal'],
        correctAnswer: 1,
        explanation: 'Breadth-First Search (BFS) is ideal for finding shortest paths in unweighted graphs because it explores all vertices at the current depth before moving to vertices at the next depth level.',
    },
    {
        id: 4,
        category: 'trees',
        question: 'What is the maximum number of nodes at level i of a binary tree?',
        options: ['i', '2^i', '2^(i-1)', '2^(i+1)'],
        correctAnswer: 1,
        explanation: 'At each level i of a binary tree, the maximum number of nodes is 2^i. This is because each node from the previous level can have at most 2 children, leading to exponential growth.',
    },
    {
        id: 5,
        category: 'linked-lists',
        question: 'What is the time complexity of inserting at the beginning of a linked list?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
        correctAnswer: 0,
        explanation: 'Inserting at the beginning of a linked list is O(1) because we only need to update the head pointer and the next pointer of the new node, regardless of the list size.',
    },
];

export type TestResult = {
    id: string;
    userId: string;
    category: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timestamp: string;
};