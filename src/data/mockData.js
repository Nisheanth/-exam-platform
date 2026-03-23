// ===== MOCK DATA FOR TESTGENIE AI =====

export const subjects = ['Data Structures', 'Operating Systems', 'DBMS', 'Computer Networks', 'Machine Learning'];

export const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export const dashboardStats = [
  { label: 'Questions Analyzed', value: '2,847', change: '+12%', icon: 'brain', color: '#6366f1' },
  { label: 'Predictions Made', value: '342', change: '+8%', icon: 'sparkles', color: '#06b6d4' },
  { label: 'Accuracy Rate', value: '89.3%', change: '+3.2%', icon: 'target', color: '#10b981' },
  { label: 'Study Hours', value: '156', change: '+24h', icon: 'clock', color: '#f59e0b' },
];

export const topicHeatmapData = [
  { topic: 'Arrays & Strings', 2018: 4, 2019: 3, 2020: 5, 2021: 4, 2022: 6, 2023: 5, 2024: 7, 2025: 6 },
  { topic: 'Linked Lists', 2018: 3, 2019: 4, 2020: 3, 2021: 5, 2022: 4, 2023: 3, 2024: 4, 2025: 5 },
  { topic: 'Trees & Graphs', 2018: 5, 2019: 6, 2020: 7, 2021: 6, 2022: 8, 2023: 7, 2024: 8, 2025: 9 },
  { topic: 'Dynamic Prog.', 2018: 2, 2019: 3, 2020: 4, 2021: 5, 2022: 6, 2023: 7, 2024: 7, 2025: 8 },
  { topic: 'Sorting & Search', 2018: 6, 2019: 5, 2020: 4, 2021: 3, 2022: 3, 2023: 2, 2024: 3, 2025: 2 },
  { topic: 'OS Scheduling', 2018: 3, 2019: 4, 2020: 5, 2021: 4, 2022: 5, 2023: 6, 2024: 5, 2025: 6 },
  { topic: 'Deadlocks', 2018: 4, 2019: 3, 2020: 4, 2021: 5, 2022: 3, 2023: 4, 2024: 5, 2025: 4 },
  { topic: 'Normalization', 2018: 5, 2019: 6, 2020: 5, 2021: 4, 2022: 5, 2023: 6, 2024: 7, 2025: 6 },
  { topic: 'SQL Queries', 2018: 7, 2019: 6, 2020: 7, 2021: 8, 2022: 7, 2023: 8, 2024: 8, 2025: 9 },
  { topic: 'TCP/IP Model', 2018: 4, 2019: 5, 2020: 4, 2021: 3, 2022: 4, 2023: 5, 2024: 4, 2025: 5 },
];

export const predictions = [
  { id: 1, question: 'Explain B+ Tree insertion and deletion with examples', topic: 'Trees & Graphs', confidence: 94, marks: 10, type: 'Long Answer', trend: 'rising', dna: 'TG-INS-DEL-EX' },
  { id: 2, question: 'Compare and contrast TCP vs UDP protocols with use cases', topic: 'TCP/IP Model', confidence: 91, marks: 8, type: 'Comparison', trend: 'stable', dna: 'NW-CMP-TCP-UDP' },
  { id: 3, question: 'Write a program for Dijkstra\'s shortest path algorithm', topic: 'Trees & Graphs', confidence: 88, marks: 15, type: 'Programming', trend: 'rising', dna: 'TG-ALG-DJKS-P' },
  { id: 4, question: 'Explain 3NF and BCNF with examples. When is BCNF preferred?', topic: 'Normalization', confidence: 86, marks: 10, type: 'Theory + Example', trend: 'stable', dna: 'DB-NRM-3NF-BC' },
  { id: 5, question: 'Solve the producer-consumer problem using semaphores', topic: 'OS Scheduling', confidence: 84, marks: 12, type: 'Problem Solving', trend: 'rising', dna: 'OS-SYN-PC-SEM' },
  { id: 6, question: 'Explain dynamic programming approach for 0/1 Knapsack', topic: 'Dynamic Prog.', confidence: 82, marks: 10, type: 'Long Answer', trend: 'rising', dna: 'DP-KNP-01-TAB' },
  { id: 7, question: 'What are deadlock detection and recovery mechanisms?', topic: 'Deadlocks', confidence: 79, marks: 8, type: 'Theory', trend: 'stable', dna: 'OS-DL-DET-REC' },
  { id: 8, question: 'Write complex SQL queries involving JOIN, GROUP BY, HAVING', topic: 'SQL Queries', confidence: 93, marks: 10, type: 'Programming', trend: 'rising', dna: 'DB-SQL-JN-GRP' },
  { id: 9, question: 'Explain sliding window protocol with diagram', topic: 'TCP/IP Model', confidence: 77, marks: 8, type: 'Theory + Diagram', trend: 'falling', dna: 'NW-SWP-DIA-FL' },
  { id: 10, question: 'Implement AVL tree rotations with balancing examples', topic: 'Trees & Graphs', confidence: 85, marks: 12, type: 'Programming', trend: 'rising', dna: 'TG-AVL-ROT-BL' },
];

export const recentQuestions = [
  { id: 1, text: 'Explain the concept of virtual memory with page replacement algorithms', subject: 'Operating Systems', year: 2024, marks: 10, difficulty: 'Hard', unit: 3, repeats: 5 },
  { id: 2, text: 'Write a program to implement BFS and DFS on a graph', subject: 'Data Structures', year: 2024, marks: 12, difficulty: 'Medium', unit: 5, repeats: 7 },
  { id: 3, text: 'Explain normalization up to BCNF with suitable examples', subject: 'DBMS', year: 2024, marks: 10, difficulty: 'Medium', unit: 2, repeats: 8 },
  { id: 4, text: 'Compare circuit switching and packet switching techniques', subject: 'Computer Networks', year: 2024, marks: 6, difficulty: 'Easy', unit: 1, repeats: 4 },
  { id: 5, text: 'Explain backpropagation algorithm in neural networks', subject: 'Machine Learning', year: 2024, marks: 10, difficulty: 'Hard', unit: 4, repeats: 3 },
  { id: 6, text: 'Discuss various CPU scheduling algorithms with Gantt charts', subject: 'Operating Systems', year: 2023, marks: 15, difficulty: 'Hard', unit: 2, repeats: 9 },
  { id: 7, text: 'Implement a hash table with collision resolution', subject: 'Data Structures', year: 2023, marks: 10, difficulty: 'Medium', unit: 4, repeats: 6 },
  { id: 8, text: 'Explain ACID properties of transactions with examples', subject: 'DBMS', year: 2023, marks: 8, difficulty: 'Easy', unit: 3, repeats: 10 },
];

export const yearWiseTrends = [
  { year: 2018, theory: 45, programming: 30, numerical: 25, total: 65 },
  { year: 2019, theory: 42, programming: 35, numerical: 23, total: 70 },
  { year: 2020, theory: 38, programming: 38, numerical: 24, total: 68 },
  { year: 2021, theory: 35, programming: 40, numerical: 25, total: 72 },
  { year: 2022, theory: 32, programming: 42, numerical: 26, total: 75 },
  { year: 2023, theory: 30, programming: 45, numerical: 25, total: 78 },
  { year: 2024, theory: 28, programming: 48, numerical: 24, total: 80 },
  { year: 2025, theory: 25, programming: 50, numerical: 25, total: 82 },
];

export const unitWeightage = [
  { unit: 'Unit 1', name: 'Fundamentals', weight: 18, questions: 24, color: '#6366f1' },
  { unit: 'Unit 2', name: 'Core Concepts', weight: 25, questions: 32, color: '#06b6d4' },
  { unit: 'Unit 3', name: 'Advanced Topics', weight: 22, questions: 28, color: '#10b981' },
  { unit: 'Unit 4', name: 'Applications', weight: 20, questions: 26, color: '#f59e0b' },
  { unit: 'Unit 5', name: 'Problem Solving', weight: 15, questions: 19, color: '#ef4444' },
];

export const performanceData = {
  weeklyStudy: [
    { day: 'Mon', hours: 3.5, questions: 12 },
    { day: 'Tue', hours: 2.0, questions: 8 },
    { day: 'Wed', hours: 4.0, questions: 15 },
    { day: 'Thu', hours: 1.5, questions: 5 },
    { day: 'Fri', hours: 3.0, questions: 11 },
    { day: 'Sat', hours: 5.0, questions: 20 },
    { day: 'Sun', hours: 4.5, questions: 18 },
  ],
  weaknessRadar: [
    { subject: 'Trees', score: 85, fullMark: 100 },
    { subject: 'DP', score: 45, fullMark: 100 },
    { subject: 'Graphs', score: 70, fullMark: 100 },
    { subject: 'SQL', score: 90, fullMark: 100 },
    { subject: 'OS', score: 60, fullMark: 100 },
    { subject: 'Networks', score: 55, fullMark: 100 },
    { subject: 'ML', score: 40, fullMark: 100 },
    { subject: 'Sorting', score: 92, fullMark: 100 },
  ],
  streakDays: 12,
  totalQuestionsSolved: 487,
  accuracy: 78.5,
  rank: 156,
};

export const flashcards = [
  { id: 1, front: 'What is the time complexity of Binary Search?', back: 'O(log n) — It divides the search space in half each step.', topic: 'Sorting & Search', mastered: true },
  { id: 2, front: 'Define Deadlock in OS', back: 'A situation where two or more processes are blocked forever, each waiting for a resource held by the other.', topic: 'Deadlocks', mastered: false },
  { id: 3, front: 'What is BCNF?', back: 'Boyce-Codd Normal Form — A stricter version of 3NF where every determinant must be a candidate key.', topic: 'Normalization', mastered: false },
  { id: 4, front: 'TCP vs UDP — Key difference?', back: 'TCP is connection-oriented & reliable; UDP is connectionless & faster but unreliable.', topic: 'TCP/IP Model', mastered: true },
  { id: 5, front: 'What is Dynamic Programming?', back: 'An optimization technique that solves complex problems by breaking them into overlapping subproblems and storing results.', topic: 'Dynamic Prog.', mastered: false },
  { id: 6, front: 'AVL Tree property?', back: 'A self-balancing BST where the difference in heights of left and right subtrees is at most 1 for every node.', topic: 'Trees & Graphs', mastered: true },
];

export const notes = [
  { id: 1, title: 'B+ Tree Complete Guide', topic: 'Trees & Graphs', content: 'B+ Tree is a self-balancing tree data structure that maintains sorted data and allows searches, insertions, and deletions in O(log n). Unlike B-trees, all values are at leaf level...', type: 'detailed', createdAt: '2025-03-15' },
  { id: 2, title: 'Normalization Quick Reference', topic: 'Normalization', content: '1NF: Atomic values only. 2NF: No partial dependencies. 3NF: No transitive dependencies. BCNF: Every determinant is a candidate key...', type: 'quick', createdAt: '2025-03-14' },
  { id: 3, title: 'TCP/IP Formula Sheet', topic: 'TCP/IP Model', content: 'Throughput = Window Size / RTT. Utilization = (L/R) / (RTT + L/R). Propagation Delay = Distance / Speed...', type: 'formula', createdAt: '2025-03-13' },
  { id: 4, title: 'OS Scheduling Algorithms', topic: 'OS Scheduling', content: 'FCFS: Simple but convoy effect. SJF: Optimal but starvation. Round Robin: Fair, uses time quantum. Priority: Flexible but may starve...', type: 'summary', createdAt: '2025-03-12' },
  { id: 5, title: 'SQL Joins Cheat Sheet', topic: 'SQL Queries', content: 'INNER JOIN: Matching rows only. LEFT JOIN: All left + matching right. RIGHT JOIN: All right + matching left. FULL: All rows from both...', type: 'cheatsheet', createdAt: '2025-03-11' },
];

export const studyPlan = [
  { time: '9:00 AM', task: 'Review B+ Tree concepts', topic: 'Trees & Graphs', duration: '45 min', priority: 'high', completed: true },
  { time: '10:00 AM', task: 'Practice SQL JOIN queries', topic: 'SQL Queries', duration: '60 min', priority: 'high', completed: true },
  { time: '11:30 AM', task: 'Solve DP problems (Knapsack)', topic: 'Dynamic Prog.', duration: '90 min', priority: 'critical', completed: false },
  { time: '1:00 PM', task: 'Lunch Break', topic: '', duration: '60 min', priority: 'break', completed: false },
  { time: '2:00 PM', task: 'OS Deadlock detection theory', topic: 'Deadlocks', duration: '45 min', priority: 'medium', completed: false },
  { time: '3:00 PM', task: 'Network protocol diagrams', topic: 'TCP/IP Model', duration: '60 min', priority: 'medium', completed: false },
  { time: '4:30 PM', task: 'Revision - Flashcards', topic: 'Mixed', duration: '30 min', priority: 'low', completed: false },
  { time: '5:00 PM', task: 'Mock test - 25 questions', topic: 'All Topics', duration: '90 min', priority: 'high', completed: false },
];

export const chatMessages = [
  { id: 1, role: 'ai', content: "👋 Hello! I'm your AI Study Assistant. I've analyzed your uploaded question papers and I'm ready to help. What would you like to learn about today?" },
  { id: 2, role: 'user', content: 'Can you explain B+ Trees and why they are important for exams?' },
  { id: 3, role: 'ai', content: "Great question! 🌳 **B+ Trees** are extremely important — they appeared in **7 out of 8 years** in your papers!\n\n**Key Points:**\n1. Self-balancing search tree\n2. All data stored at leaf level\n3. Leaf nodes are linked (sequential access)\n4. Used in database indexing (real-world application)\n\n**Why examiners love it:**\n- Tests understanding of tree structures\n- Can ask insertion, deletion, or comparison questions\n- Combines theory + practical application\n\n📊 **Prediction:** 94% chance of appearing in next exam as a 10-mark question.\n\nWould you like me to generate practice problems or short notes on this topic?" },
];

export const examProphecyScore = {
  overall: 87,
  breakdown: [
    { factor: 'Frequency Analysis', score: 92, weight: 0.3 },
    { factor: 'Trend Momentum', score: 85, weight: 0.25 },
    { factor: 'Gap Analysis', score: 78, weight: 0.2 },
    { factor: 'Difficulty Rotation', score: 90, weight: 0.15 },
    { factor: 'Syllabus Coverage', score: 88, weight: 0.1 },
  ]
};
