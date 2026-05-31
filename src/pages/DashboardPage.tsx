import type { Workbook } from '../types'

interface DashboardPageProps {
  userEmail: string
  workbooks: Workbook[]
  loading: boolean
  banner: string | null
  onCreateWorkbook: () => void
  onSelectWorkbook: (workbook: Workbook) => void
  onGradeWorkbook: (workbook: Workbook) => void
  onEditWorkbook: (workbook: Workbook) => void
  onSignOut: () => Promise<void>
}

export function DashboardPage({
  userEmail,
  workbooks,
  loading,
  banner,
  onCreateWorkbook,
  onSelectWorkbook,
  onGradeWorkbook,
  onEditWorkbook,
  onSignOut,
}: DashboardPageProps) {
  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-widest text-slate-500 uppercase">
              Dashboard
            </p>
            <h1 className="mt-1 text-xl font-bold text-black">문제집 목록</h1>
            <p className="mt-1 text-sm text-slate-600">{userEmail}</p>
          </div>

          <a
            href="https://github.com/jwchoi-edu/AutoGrader/blob/main/docs/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-black interactive"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <text
                x="12"
                y="16"
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="currentColor"
              >
                ?
              </text>
            </svg>
            도움말
          </a>
        </div>
      </header>

      {banner !== null ? (
        <p className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-black">
          {banner}
        </p>
      ) : null}

      <button
        type="button"
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-100 interactive"
        onClick={onCreateWorkbook}
      >
        <svg
          className="inline-block mr-2 -ml-1 h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        새 문제집 등록
      </button>

      <div className="space-y-3">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          {loading ? '불러오는 중…' : `저장된 문제집 ${workbooks.length}개`}
        </p>

        {workbooks.length === 0 ? (
          <p className="rounded-lg border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            등록된 문제집이 없습니다.
          </p>
        ) : (
          workbooks.map((workbook) => (
            <article
              key={workbook.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <button
                type="button"
                className="w-full text-left interactive"
                onClick={() => onSelectWorkbook(workbook)}
              >
                <h2 className="font-semibold text-black">{workbook.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {workbook.problems.length}문항 ·{' '}
                  {new Date(
                    workbook.updated_at ?? workbook.created_at,
                  ).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                    timeZoneName: 'short',
                  })}
                </p>
              </button>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-black transition hover:bg-slate-100 interactive"
                  onClick={() => onEditWorkbook(workbook)}
                >
                  <svg
                    className="inline-block mr-2 -ml-1 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M3 21v-3.75L17.81 2.69a2.25 2.25 0 0 1 3.18 0l.32.32a2.25 2.25 0 0 1 0 3.18L6.5 20.75H3z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  수정
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-black bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 interactive"
                  onClick={() => onGradeWorkbook(workbook)}
                >
                  <svg
                    className="inline-block mr-2 -ml-1 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path d="M5 3v18l15-9L5 3z" fill="currentColor" />
                  </svg>
                  채점 시작
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <button
        type="button"
        className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 interactive"
        onClick={() => {
          void onSignOut()
        }}
      >
        <svg
          className="inline-block mr-2 -ml-1 h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M16 17l5-5-5-5M21 12H9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 19H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        로그아웃
      </button>
    </div>
  )
}
