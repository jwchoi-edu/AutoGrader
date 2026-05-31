import type {
  GradeResult,
  ProblemDraft,
  ProblemItem,
  ProblemType,
  Workbook,
  WorkbookSummary,
} from './types'

const createId = () => globalThis.crypto.randomUUID()

const normalizeText = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase()

export const createDraftRows = (count = 6): ProblemDraft[] =>
  Array.from({ length: count }, (_, index) => ({
    number: String(index + 1),
    type: 'MULTIPLE_CHOICE' as ProblemType,
    correctAnswer: '',
  }))

export const createSampleWorkbook = (): Workbook => ({
  id: 'demo-workbook',
  user_id: 'demo-user',
  title: '데모 문제집',
  created_at: new Date('2026-05-31T09:00:00.000Z').toISOString(),
  updated_at: new Date('2026-05-31T09:00:00.000Z').toISOString(),
  problems: [
    { number: 1, type: 'MULTIPLE_CHOICE', correct_answer: '4' },
    { number: 2, type: 'SHORT_ANSWER', correct_answer: '중동고' },
    { number: 3, type: 'COMPLEX_ANSWER', correct_answer: null },
    { number: 4, type: 'MULTIPLE_CHOICE', correct_answer: '2' },
    { number: 5, type: 'SHORT_ANSWER', correct_answer: '42' },
  ],
})

export const normalizeDraftToWorkbook = (
  title: string,
  userId: string,
  rows: ProblemDraft[],
): { workbook: Workbook | null; errors: string[] } => {
  const errors: string[] = []
  const trimmedTitle = title.trim()

  if (trimmedTitle.length === 0) {
    errors.push('문제집 제목을 입력해 주세요.')
  }

  const normalizedRows = rows
    .map((row, index) => ({
      index,
      number: Number.parseInt(row.number, 10),
      type: row.type,
      correctAnswer: row.correctAnswer.trim(),
    }))
    .filter((row) => row.number > 0)
    .sort((left, right) => left.number - right.number)

  const numberSet = new Set<number>()

  for (const row of normalizedRows) {
    if (numberSet.has(row.number)) {
      errors.push(`${row.number}번 문제가 중복되었습니다.`)
    }

    numberSet.add(row.number)

    if (row.type === 'MULTIPLE_CHOICE' && !/^[1-5]$/.test(row.correctAnswer)) {
      errors.push(`${row.number}번은 1~5 사이의 정답만 허용됩니다.`)
    }

    if (row.type === 'SHORT_ANSWER' && row.correctAnswer.length === 0) {
      errors.push(`${row.number}번은 단답형 정답을 입력해 주세요.`)
    }
  }

  if (normalizedRows.length === 0) {
    errors.push('최소 1개의 문제를 입력해 주세요.')
  }

  if (errors.length > 0) {
    return { workbook: null, errors }
  }

  return {
    workbook: {
      id: createId(),
      user_id: userId,
      title: trimmedTitle,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      problems: normalizedRows.map((row) => ({
        number: row.number,
        type: row.type,
        correct_answer:
          row.type === 'COMPLEX_ANSWER' ? null : row.correctAnswer,
      })),
    },
    errors,
  }
}

export const evaluateProblem = (
  problem: ProblemItem,
  studentAnswer: string | null,
): GradeResult => {
  if (problem.type === 'COMPLEX_ANSWER' || problem.correct_answer === null) {
    return {
      number: problem.number,
      type: problem.type,
      correctAnswer: problem.correct_answer,
      studentAnswer,
      status: 'ungradable',
    }
  }

  if (studentAnswer === null || studentAnswer.trim().length === 0) {
    return {
      number: problem.number,
      type: problem.type,
      correctAnswer: problem.correct_answer,
      studentAnswer,
      status: 'skipped',
    }
  }

  const isCorrect =
    problem.type === 'SHORT_ANSWER'
      ? normalizeText(studentAnswer) === normalizeText(problem.correct_answer)
      : studentAnswer.trim() === problem.correct_answer

  return {
    number: problem.number,
    type: problem.type,
    correctAnswer: problem.correct_answer,
    studentAnswer,
    status: isCorrect ? 'correct' : 'incorrect',
  }
}

export const summarizeResults = (results: GradeResult[]): WorkbookSummary => {
  const gradable = results.filter(
    (result) => result.type !== 'COMPLEX_ANSWER',
  ).length
  const correct = results.filter((result) => result.status === 'correct').length
  const incorrect = results.filter(
    (result) => result.status === 'incorrect',
  ).length
  const skipped = results.filter((result) => result.status === 'skipped').length
  const ungradable = results.filter(
    (result) => result.status === 'ungradable',
  ).length

  return {
    total: results.length,
    gradable,
    correct,
    incorrect,
    skipped,
    ungradable,
    accuracy: gradable === 0 ? 0 : Math.round((correct / gradable) * 1000) / 10,
  }
}
