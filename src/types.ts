export const SCHOOL_DOMAIN = '@joongdong.hs.kr'

export const PROBLEM_TYPES = [
  'MULTIPLE_CHOICE',
  'SHORT_ANSWER',
  'COMPLEX_ANSWER',
] as const

export type ProblemType = (typeof PROBLEM_TYPES)[number]

export interface ProblemItem {
  number: number
  type: ProblemType
  correct_answer: string | null
}

export interface Workbook {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at?: string
  problems: ProblemItem[]
}

export interface ProblemDraft {
  number: string
  type: ProblemType
  correctAnswer: string
}

export interface GradeResult {
  number: number
  type: ProblemType
  correctAnswer: string | null
  studentAnswer: string | null
  status: 'correct' | 'incorrect' | 'skipped' | 'ungradable'
}

export interface WorkbookSummary {
  total: number
  gradable: number
  correct: number
  incorrect: number
  skipped: number
  ungradable: number
  accuracy: number
}

export type AuthStatus = 'loading' | 'signedOut' | 'authenticated' | 'blocked'

export type AppStep = 'login' | 'dashboard' | 'admin' | 'grader' | 'result'

export interface UserSession {
  id: string
  email: string
}
