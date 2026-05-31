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
        <p className="text-xs tracking-widest text-slate-500 uppercase">Dashboard</p>
        <h1 className="mt-1 text-xl font-bold text-black">문제집 목록</h1>
        <p className="mt-1 text-sm text-slate-600">{userEmail}</p>
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
        + 새 문제집 등록
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
                  {new Date(workbook.created_at).toLocaleDateString('ko-KR')}
                </p>
              </button>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-black transition hover:bg-slate-100 interactive"
                  onClick={() => onEditWorkbook(workbook)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-black bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 interactive"
                  onClick={() => onGradeWorkbook(workbook)}
                >
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
        로그아웃
      </button>
    </div>
  )
}
