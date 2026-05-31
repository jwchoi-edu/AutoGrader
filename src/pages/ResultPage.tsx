import { useState } from 'react'
import type { GradeResult, ProblemType, WorkbookSummary } from '../types'

interface ResultPageProps {
  workbookTitle: string
  gradedRangeLabel?: string | null
  summary: WorkbookSummary
  gradedProblems: GradeResult[]
  onBack: () => void
  onRegrade: () => void
}

const typeLabels: Record<ProblemType, string> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER: '단답형',
  COMPLEX_ANSWER: '채점 불가',
}

const statusLabels = {
  correct: '정답',
  incorrect: '오답',
  skipped: '스킵',
  ungradable: '채점 불가',
} as const

export function ResultPage({
  workbookTitle,
  gradedRangeLabel,
  summary,
  gradedProblems,
  onBack,
  onRegrade,
}: ResultPageProps) {
  const [showList, setShowList] = useState(false)

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-4">
        <p className="text-xs tracking-widest text-slate-500 uppercase">Result</p>
        <h1 className="mt-1 text-xl font-bold text-black">채점 결과</h1>
        <p className="mt-1 text-sm text-slate-600">{workbookTitle} {gradedRangeLabel ? `· ${gradedRangeLabel}` : null}</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: '전체 문제 수', value: summary.total },
          { label: '채점 가능', value: summary.gradable },
          { label: '맞은 개수', value: summary.correct },
          { label: '정답률', value: `${summary.accuracy}%` },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-slate-200 bg-white p-4 text-center"
          >
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-black">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-sm md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 py-3">
          <p className="text-xs text-slate-500">정답</p>
          <p className="mt-1 font-bold text-black">{summary.correct}</p>
        </div>
        <div className="rounded-lg border border-slate-200 py-3">
          <p className="text-xs text-slate-500">오답</p>
          <p className="mt-1 font-bold text-black">{summary.incorrect}</p>
        </div>
        <div className="rounded-lg border border-slate-200 py-3">
          <p className="text-xs text-slate-500">스킵</p>
          <p className="mt-1 font-bold text-black">{summary.skipped}</p>
        </div>
        <div className="rounded-lg border border-slate-200 py-3">
          <p className="text-xs text-slate-500">채점 불가</p>
          <p className="mt-1 font-bold text-black">{summary.ungradable}</p>
        </div>
      </div>

      <button
        type="button"
        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-black transition hover:bg-slate-200 interactive"
        onClick={() => setShowList((current) => !current)}
      >
        {showList ? '리스트 숨기기' : '리스트 보기'}
      </button>

      {showList ? (
        <div className="space-y-2">
          {gradedProblems.map((result) => (
            <div
              key={result.number}
              className="flex items-start gap-3 rounded-lg border border-slate-200 px-4 py-3"
            >
              <span className="mt-0.5 w-6 shrink-0 text-center text-lg font-bold">
                {result.status === 'correct' ? (
                  <span className="text-green-600">✓</span>
                ) : result.status === 'incorrect' ? (
                  <span className="text-red-600">✕</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-black">{result.number}번</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{typeLabels[result.type]}</span>
                    <span>{statusLabels[result.status]}</span>
                  </div>
                </div>

                {result.status === 'incorrect' || result.status === 'skipped' ? (
                  <div className="mt-1 space-y-0.5 text-sm text-slate-600">
                    <p>
                      내 답:{' '}
                      <span className={result.status === 'incorrect' ? 'text-red-600' : 'text-slate-500'}>
                        {result.studentAnswer && result.studentAnswer.length > 0
                          ? result.studentAnswer
                          : '—'}
                      </span>
                    </p>
                    <p>
                      정답:{' '}
                      <span className="text-black">{result.correctAnswer ?? '—'}</span>
                    </p>
                  </div>
                ) : result.status === 'correct' ? (
                  <div className="mt-1 space-y-0.5 text-sm text-slate-600">
                    <p>
                      내 답:{' '}
                      <span className="text-emerald-600">
                        {result.studentAnswer && result.studentAnswer.length > 0
                          ? result.studentAnswer
                          : '—'}
                      </span>
                    </p>
                    <p>
                      정답:{' '}
                      <span className="text-black">{result.correctAnswer ?? '—'}</span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">단순 채점 불가 문항입니다.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-black transition hover:bg-slate-100 interactive"
          onClick={onBack}
        >
          <svg className="inline-block mr-2 -ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M9 6L3 12l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          목록으로
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 interactive"
          onClick={onRegrade}
        >
          <svg className="inline-block mr-2 -ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M5 3v18l15-9L5 3z" fill="currentColor" />
          </svg>
          다시 채점
        </button>
      </div>
    </div>
  )
}
