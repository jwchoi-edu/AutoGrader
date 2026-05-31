import { useRef } from 'react'
import type { ProblemDraft, ProblemType } from '../types'

interface AdminPageProps {
  title: string
  draftRows: ProblemDraft[]
  banner: string | null
  onTitleChange: (value: string) => void
  onDraftRowsChange: (rows: ProblemDraft[]) => void
  onValidate: () => void
  onSave: () => void
  onBack: () => void
}

const typeLabels: Record<ProblemType, string> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER: '단답형',
  COMPLEX_ANSWER: '채점 불가',
}

export function AdminPage({
  title,
  draftRows,
  banner,
  onTitleChange,
  onDraftRowsChange,
  onValidate,
  onSave,
  onBack,
}: AdminPageProps) {
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

  const addDraftRow = () => {
    const nextRows = [
      ...draftRows,
      {
        number: String(draftRows.length + 1),
        type: 'MULTIPLE_CHOICE' as ProblemType,
        correctAnswer: '',
      },
    ]

    onDraftRowsChange(nextRows)
    window.requestAnimationFrame(() => {
      rowRefs.current[nextRows.length - 1]?.focus()
    })
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs tracking-widest text-slate-500 uppercase">Admin</p>
          <h1 className="mt-1 text-xl font-bold text-black">문제집 등록</h1>
        </div>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-100 interactive"
            onClick={onBack}
          >
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
          placeholder="예: 1학년 2학기 중간고사"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-black outline-none placeholder:text-slate-400 focus:border-slate-400"
        />
      </label>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div className="grid grid-cols-[56px_80px_1fr] gap-px bg-slate-200 text-xs font-semibold text-slate-600">
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
                className="grid grid-cols-[56px_80px_1fr] gap-px bg-slate-200 text-sm"
              >
                <div className="bg-white px-2 py-2">
                  <input
                    value={row.number}
                    onChange={(event) =>
                      updateDraftRow(index, {
                        number: event.target.value.replace(/[^0-9]/g, ''),
                      })
                    }
                    className="w-full rounded border border-slate-200 px-1 py-1 text-center text-sm text-black outline-none focus:border-slate-400"
                  />
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
                    className="w-full rounded border border-slate-200 bg-white px-1 py-1 text-xs text-black outline-none focus:border-slate-400"
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

      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-black transition hover:bg-slate-100"
          onClick={addDraftRow}
        >
          행 추가
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-slate-200"
          onClick={onValidate}
        >
          정렬/검증
        </button>
      </div>

      <button
        type="button"
        className="w-full rounded-lg border border-black bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        onClick={onSave}
      >
        문제집 저장
      </button>
    </div>
  )
}
