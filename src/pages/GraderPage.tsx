import type { ProblemItem, ProblemType, Workbook } from '../types'

interface GraderPageProps {
  workbook: Workbook
  responses: Record<number, string | null>
  draftResponses: Record<number, string>
  currentIndex: number
  startIndex?: number
  onResponsesChange: (responses: Record<number, string | null>) => void
  onDraftResponsesChange: (draftResponses: Record<number, string>) => void
  onCurrentIndexChange: (index: number) => void
  onComplete: (endIndexExclusive: number) => void
  onBack: () => void
}

const typeLabels: Record<ProblemType, string> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER: '단답형',
  COMPLEX_ANSWER: '채점 불가',
}

const answerPanelClass = 'min-h-[72px]'
const controlButtonClass =
  'rounded-lg border px-4 py-3 text-sm font-semibold transition interactive disabled:cursor-not-allowed disabled:opacity-40'

export function GraderPage({
  workbook,
  responses,
  draftResponses,
  currentIndex,
  onResponsesChange,
  onDraftResponsesChange,
  onCurrentIndexChange,
  onComplete,
  onBack,
}: GraderPageProps) {
  const sortedProblems = [...workbook.problems].sort((a, b) => a.number - b.number)
  const currentProblem: ProblemItem | null = sortedProblems[currentIndex] ?? null

  const committedAnswer = currentProblem === null ? null : responses[currentProblem.number] ?? null
  const shortAnswerDraft =
    currentProblem === null
      ? ''
      : draftResponses[currentProblem.number] ?? committedAnswer ?? ''

  const recordResponse = (value: string | null) => {
    if (currentProblem === null) {
      return
    }

    onResponsesChange({
      ...responses,
      [currentProblem.number]: value,
    })

    if (value !== null) {
      onDraftResponsesChange({
        ...draftResponses,
        [currentProblem.number]: value,
      })
    }

    if (currentIndex < sortedProblems.length - 1) {
      onCurrentIndexChange(currentIndex + 1)
      return
    }

    onComplete(currentIndex + 1)
  }

  const hasAnswered = (problemNumber: number): boolean => {
    const answer = responses[problemNumber]

    return answer !== undefined && answer !== null && answer.trim().length > 0
  }

  const answeredCount = sortedProblems.filter((problem) => hasAnswered(problem.number)).length

  return (
    <div className="flex min-h-[80vh] flex-col">
      <header className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
        <button
          type="button"
          className="text-xs text-slate-500 transition hover:text-black interactive"
          onClick={onBack}
        >
          ← 목록
        </button>
        <p className="text-xs text-slate-500">{answeredCount}/{sortedProblems.length}</p>
      </header>

      <p className="text-center text-xs tracking-widest text-slate-500 uppercase">
        {workbook.title}
      </p>

      <div className="flex flex-1 flex-col justify-center py-8">
        <div className="rounded-lg border border-slate-200 bg-white py-16 text-center">
          <p className="text-xs tracking-widest text-slate-500 uppercase">문제 번호</p>
          <p className="mt-4 text-7xl font-bold text-black">{currentProblem?.number ?? '—'}</p>
          <p className="mt-3 text-sm text-slate-500">
            {currentProblem === null ? '' : typeLabels[currentProblem.type]}
          </p>
        </div>
      </div>

      {currentProblem !== null ? (
        <div className="space-y-3 pb-4">
          {currentProblem.type === 'MULTIPLE_CHOICE' ? (
            <div className={`grid grid-cols-5 gap-2 ${answerPanelClass}`}>
              {['1', '2', '3', '4', '5'].map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`rounded-lg border py-4 text-lg font-bold transition interactive ${
                    committedAnswer === choice
                      ? 'border-black bg-black text-white'
                      : 'border-slate-200 text-black hover:border-black hover:bg-slate-100'
                  }`}
                  onClick={() => recordResponse(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : currentProblem.type === 'SHORT_ANSWER' ? (
            <div className={`flex flex-col gap-2 ${answerPanelClass}`}>
              <div className="flex gap-2">
              <input
                value={shortAnswerDraft}
                onChange={(event) => {
                  const nextDraftResponses = {
                    ...draftResponses,
                    [currentProblem.number]: event.target.value,
                  }

                  onDraftResponsesChange(nextDraftResponses)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && shortAnswerDraft.trim().length > 0) {
                    event.preventDefault()
                    recordResponse(shortAnswerDraft.trim())
                  }
                }}
                placeholder="답안을 입력하세요"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-3 text-base text-black outline-none placeholder:text-slate-400 focus:border-slate-400"
              />
                <button
                  type="button"
                  className={`${controlButtonClass} border-black bg-black text-white hover:bg-slate-800`}
                  disabled={shortAnswerDraft.trim().length === 0}
                  onClick={() => recordResponse(shortAnswerDraft.trim())}
                >
                  <svg className="inline-block mr-2 -ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  확인
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600 ${answerPanelClass}`}
            >
              채점 불가 문항입니다. (단순 채점 불가)
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-black transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 interactive"
              disabled={currentIndex === 0}
              onClick={() => onCurrentIndexChange(Math.max(currentIndex - 1, 0))}
            >
                <svg className="inline-block mr-2 -ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M9 6L3 12l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                이전
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-black transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 interactive"
              onClick={() => recordResponse(null)}
            >
                <svg className="inline-block mr-2 -ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M5 5v14l10-7L5 5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                스킵
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 interactive"
              onClick={() => onComplete(currentIndex)}
            >
                <svg className="inline-block mr-2 -ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                채점 완료
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
