export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  subject?: string;
  telegramChatId?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  studentCount?: number;
  studentIds?: string[];
  createdAt: string;
}

export type TestStatus = 'draft' | 'open' | 'closed';
export type QuestionType = 'single_choice' | 'true_false';

export interface QuestionOption {
  id: string;
  letter: string; // 'A' | 'B' | 'C' | 'D' | 'Ha' | 'Yo‘q'
  text: string;
  isCorrect?: boolean; // Only visible to teacher/admin or in review
}

export interface Question {
  id: string;
  testId?: string;
  text: string;
  type: QuestionType;
  points: number;
  orderIndex: number;
  explanation?: string;
  options: QuestionOption[];
}

export interface Test {
  id: string;
  teacherId: string;
  teacherName?: string;
  groupId: string;
  groupName?: string;
  title: string;
  bookName: string;
  subject: string;
  durationMinutes: number;
  maxAttempts: number;
  passingPercentage: number;
  startDate?: string;
  endDate?: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswersAfterResult: boolean;
  showExplanations: boolean;
  status: TestStatus;
  questionCount?: number;
  createdAt: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  testTitle?: string;
  studentId: string;
  studentName?: string;
  studentPhone?: string;
  groupId: string;
  groupName?: string;
  startTime: string;
  endTime?: string;
  submittedAt?: string;
  timeSpentSeconds: number;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'in_progress' | 'passed' | 'failed' | 'abandoned';
  windowExitCount: number;
  autoSubmitted: boolean;
  answers?: Record<string, string>; // questionId -> selectedOption letter
}

export interface AttemptReviewItem {
  questionId: string;
  questionText: string;
  type: QuestionType;
  points: number;
  selectedOption?: string;
  correctOption?: string;
  isCorrect: boolean;
  explanation?: string;
  options: {
    letter: string;
    text: string;
    isCorrect: boolean;
  }[];
}

export interface QuestionStat {
  questionId: string;
  questionNumber: number;
  questionText: string;
  totalAnswers: number;
  correctCount: number;
  correctPercent: number;
  incorrectPercent: number;
  optionDistribution: Record<string, number>; // { A: 70, B: 15, C: 10, D: 5 }
}

export interface LoadTestResult {
  virtualUsers: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number; // in ms
  p95ResponseTime: number; // in ms
  errorRate: string; // e.g. "0.0%"
  timestamp: string;
  simulatedTimeMs: number;
  note: string;
}
