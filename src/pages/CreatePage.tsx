import { useRef } from 'react'
import type { ProblemDraft, ProblemType } from '../types'

interface CreatePageProps {
  title: string
  problemCount: string
  draftRows: ProblemDraft[]
  banner: string | null
  validationErrors: string[] | null
  onTitleChange: (value: string) => void
  onProblemCountChange: (value: string) => void
  onDraftRowsChange: (rows: ProblemDraft[]) => void
  onSave: () => void
  onBack: () => void
  onCloseValidationErrors: () => void
}

const typeLabels: Record<ProblemType, string> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER: '단답형',
  COMPLEX_ANSWER: '채점 불가',
}

export function CreatePage({
  title,
  problemCount,
  draftRows,
  banner,
  validationErrors,
  onTitleChange,
  onProblemCountChange,
  onDraftRowsChange,
  onSave,
  onBack,
  onCloseValidationErrors,
}: CreatePageProps) {
  const rowRefs = useRef<Array<HTMLInputElement | null>>([])

  const queueFocus = (index: number) => {
    window.requestAnimationFrame(() => {
      rowRefs.current[index]?.focus()
    })
  }

  const updateDraftRow = (index: number, nextRow: Partial<ProblemDraft>) => {
    onDraftRowsChange(
      draftRows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...nextRow } : row)),
    )
  }

  const updateProblemCount = (nextValue: string) => {
    onProblemCountChange(nextValue)
  }

  const handleDraftAnswerChange = (index: number, value: string) => {
    const row = draftRows[index]

    if (row === undefined) {
      return
    }

    if (row.type === 'MULTIPLE_CHOICE') {
      const digit = value.replace(/[^1-5]/g, '').slice(0, 1)
      updateDraftRow(index, { correctAnswer: digit })

      if (digit.length === 1) {
        queueFocus(Math.min(index + 1, draftRows.length - 1))
      }

      return
    }

    updateDraftRow(index, { correctAnswer: value })
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs tracking-widest text-slate-500 uppercase">Create</p>
          <h1 className="mt-1 text-xl font-bold text-black">문제집 등록</h1>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-100 interactive"
          onClick={onBack}
        >
          <svg className="inline-block mr-2 -ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M9 6L3 12l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          목록
        </button>
      </header>

      {banner !== null ? (
        <p className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-black">
          {banner}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-black">문제집 제목</span>
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="문제집 제목을 입력하세요"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-black outline-none placeholder:text-slate-400 focus:border-slate-400"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-black">문제 개수</span>
        <input
          type="number"
          min={1}
          max={100}
          value={problemCount}
          onChange={(event) => updateProblemCount(event.target.value)}
          className={`w-full rounded-lg bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-slate-400 ${
            problemCount.trim().length === 0
              ? 'border border-red-400'
              : 'border border-slate-200'
          }`}
        />
        <p className={`text-xs ${problemCount.trim().length === 0 ? 'text-red-600' : 'text-slate-500'}`}>
          {problemCount.trim().length === 0
            ? '문제 개수는 1개 이상, 100개 이하로 입력해 주세요.'
            : '입력한 개수만큼 문제 행이 자동으로 생성됩니다.'}
        </p>
      </label>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div className="grid grid-cols-[56px_96px_1fr] gap-px bg-slate-200 text-xs font-semibold text-slate-600">
          <div className="bg-slate-100 px-2 py-2 text-center">번호</div>
          <div className="bg-slate-100 px-2 py-2 text-center">유형</div>
          <div className="bg-slate-100 px-2 py-2">정답</div>
        </div>

        <div className="divide-y divide-slate-200">
          {draftRows.map((row, index) => {
            const isMultipleChoice = row.type === 'MULTIPLE_CHOICE'
            const isShortAnswer = row.type === 'SHORT_ANSWER'
            const isComplexAnswer = row.type === 'COMPLEX_ANSWER'

            return (
              <div
                key={`${index}-${row.type}`}
                className="grid grid-cols-[56px_96px_1fr] gap-px bg-slate-200 text-sm"
              >
                <div className="bg-white px-2 py-2 text-center text-sm font-medium text-black">
                  {row.number}
                </div>

                <div className="bg-white px-1 py-2">
                  <select
                    value={row.type}
                    onChange={(event) => {
                      const nextType = event.target.value as ProblemType
                      updateDraftRow(index, {
                        type: nextType,
                        correctAnswer: nextType === 'COMPLEX_ANSWER' ? '' : row.correctAnswer,
                      })
                    }}
                    className="w-full rounded border border-slate-200 bg-white px-1 py-1 text-[11px] leading-tight text-black outline-none focus:border-slate-400"
                  >
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 bg-white px-2 py-2">
                  {isMultipleChoice ? (
                    <div className="grid grid-cols-5 gap-1">
                      {['1', '2', '3', '4', '5'].map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          className={`rounded border px-0 py-1.5 text-xs font-semibold transition ${
                            row.correctAnswer === choice
                                ? 'border-black bg-black text-white interactive'
                              : 'border-slate-200 bg-white text-black hover:bg-slate-100'
                          }`}
                          onClick={() => {
                            updateDraftRow(index, { correctAnswer: choice })
                            queueFocus(Math.min(index + 1, draftRows.length - 1))
                          }}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <input
                    ref={(element) => {
                      rowRefs.current[index] = element
                    }}
                    value={isComplexAnswer ? '' : row.correctAnswer}
                    onChange={(event) => handleDraftAnswerChange(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        queueFocus(Math.min(index + 1, draftRows.length - 1))
                      }
                    }}
                    readOnly={isComplexAnswer}
                    disabled={isComplexAnswer}
                    inputMode={isMultipleChoice ? 'numeric' : 'text'}
                    placeholder={
                      isComplexAnswer
                        ? '채점 불가 — 정답 없음'
                        : isMultipleChoice
                          ? '1-5'
                          : '정답 텍스트'
                    }
                    className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm text-black outline-none placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                  />

                  <p className="text-xs text-slate-500">
                    {isMultipleChoice
                      ? '1~5 입력 시 다음 칸으로 이동'
                      : isShortAnswer
                        ? 'Enter로 다음 칸 이동'
                        : '단순 채점 불가'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        className="w-full rounded-lg border border-black bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        onClick={onSave}
      >
        <svg className="inline-block mr-2 -ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        문제집 저장
      </button>

      {validationErrors !== null && validationErrors.length > 0 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-4">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col rounded-2xl border border-red-200 bg-white p-5 shadow-xl">
            <div className="flex-1 overflow-y-auto rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">검증 실패</p>
              <p className="mt-1 text-sm text-red-600">문제집 저장 전에 아래 항목을 수정해 주세요.</p>

              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-700">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-black bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 interactive"
              onClick={onCloseValidationErrors}
            >
              <svg className="inline-block mr-2 -ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              확인
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}