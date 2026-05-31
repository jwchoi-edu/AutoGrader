import { useEffect, useMemo, useState } from 'react'
import { Layout } from './components/Layout'
import { CreatePage } from './pages/CreatePage'
import { DashboardPage } from './pages/DashboardPage'
import { GraderPage } from './pages/GraderPage'
import {
  blockUnauthorizedEmail,
  isAllowedEmail,
  LoginPage,
  signInWithGoogle,
} from './pages/LoginPage'
import { ResultPage } from './pages/ResultPage'
import { hasSupabaseConfig, supabase } from './supabaseClient'
import type { AppStep, AuthStatus, ProblemDraft, Workbook } from './types'
import { SCHOOL_DOMAIN } from './types'
import {
  createDraftRows,
  createSampleWorkbook,
  evaluateProblem,
  normalizeDraftToWorkbook,
  summarizeResults,
} from './workbook'

const LOCAL_WORKBOOKS_KEY = 'autograder.workbooks'

const sampleWorkbook = createSampleWorkbook()

const clampProblemCount = (value: number) => Math.max(1, Math.min(100, Math.floor(value) || 1))

const resizeDraftRows = (rows: ProblemDraft[], nextCount: number): ProblemDraft[] => {
  const safeCount = clampProblemCount(nextCount)

  if (safeCount === rows.length) {
    return rows
  }

  if (safeCount < rows.length) {
    return rows.slice(0, safeCount).map((row, index) => ({
      ...row,
      number: String(index + 1),
    }))
  }

  const extraRows = Array.from({ length: safeCount - rows.length }, (_, index) => ({
    number: String(rows.length + index + 1),
    type: 'MULTIPLE_CHOICE' as const,
    correctAnswer: '',
  }))

  return [
    ...rows.map((row, index) => ({
      ...row,
      number: String(index + 1),
    })),
    ...extraRows,
  ]
}

const loadLocalWorkbooks = (): Workbook[] => {
  if (typeof window === 'undefined') {
    return [sampleWorkbook]
  }

  const rawValue = window.localStorage.getItem(LOCAL_WORKBOOKS_KEY)

  if (rawValue === null) {
    return [sampleWorkbook]
  }

  try {
    const parsed = JSON.parse(rawValue) as Workbook[]
    return parsed.length > 0 ? parsed : [sampleWorkbook]
  } catch {
    return [sampleWorkbook]
  }
}

const saveLocalWorkbooks = (workbooks: Workbook[]) => {
  try {
    window.localStorage.setItem(LOCAL_WORKBOOKS_KEY, JSON.stringify(workbooks))
  } catch {
    // Ignore storage failures in privacy-restricted contexts.
  }
}

function App() {
  const isConfigured = hasSupabaseConfig && supabase !== null

  const [step, setStep] = useState<AppStep>(isConfigured ? 'login' : 'dashboard')
  const [authStatus, setAuthStatus] = useState<AuthStatus>(isConfigured ? 'loading' : 'authenticated')
  const [userId, setUserId] = useState<string | null>(isConfigured ? null : 'demo-user')
  const [userEmail, setUserEmail] = useState<string | null>(
    isConfigured ? null : `demo${SCHOOL_DOMAIN}`,
  )
  const [authMessage, setAuthMessage] = useState<string | null>(
    isConfigured ? null : '데모 모드입니다. Supabase 환경 변수를 설정하면 Google OAuth가 활성화됩니다.',
  )
  const [banner, setBanner] = useState<string | null>(null)
  const [workbooks, setWorkbooks] = useState<Workbook[]>(loadLocalWorkbooks)
  const [selectedWorkbook, setSelectedWorkbook] = useState<Workbook | null>(
    loadLocalWorkbooks()[0] ?? sampleWorkbook,
  )
  const [editingWorkbookId, setEditingWorkbookId] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('새 문제집')
  const [problemCountInput, setProblemCountInput] = useState<string>(String(createDraftRows().length))
  const [draftRows, setDraftRows] = useState<ProblemDraft[]>(createDraftRows)
  const [responses, setResponses] = useState<Record<number, string | null>>({})
  const [draftResponses, setDraftResponses] = useState<Record<number, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gradingStartIndex, setGradingStartIndex] = useState(0)
  const [gradingEndIndexExclusive, setGradingEndIndexExclusive] = useState<number | null>(null)
  const [loadingWorkbooks, setLoadingWorkbooks] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null)
  const [gradeModalOpen, setGradeModalOpen] = useState(false)
  const [gradeModalWorkbook, setGradeModalWorkbook] = useState<Workbook | null>(null)
  const [gradeStartInput, setGradeStartInput] = useState<string>('1')

  useEffect(() => {
    const client = supabase

    if (!isConfigured || client === null) {
      return
    }

    let active = true

    const handleSession = (email: string, id: string) => {
      if (!isAllowedEmail(email)) {
        setAuthStatus('blocked')
        setUserId(id)
        setUserEmail(email)
        setAuthMessage(`로그인 이메일은 반드시 ${SCHOOL_DOMAIN} 로 끝나야 합니다.`)
        blockUnauthorizedEmail(email)
        void client.auth.signOut()
        setStep('login')
        return
      }

      setAuthStatus('authenticated')
      setUserId(id)
      setUserEmail(email)
      setAuthMessage(null)
      setStep('dashboard')
    }

    const bootstrap = async () => {
      const { data, error } = await client.auth.getSession()

      if (!active) {
        return
      }

      if (error !== null) {
        setAuthStatus('signedOut')
        setAuthMessage(error.message)
        setStep('login')
        return
      }

      const session = data.session

      if (session === null) {
        setAuthStatus('signedOut')
        setAuthMessage(null)
        setStep('login')
        return
      }

      handleSession(session.user.email ?? '', session.user.id)
    }

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return
      }

      if (session === null) {
        setAuthStatus('signedOut')
        setUserId(null)
        setUserEmail(null)
        setAuthMessage(null)
        setStep('login')
        return
      }

      handleSession(session.user.email ?? '', session.user.id)
    })

    void bootstrap()

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [isConfigured])

  useEffect(() => {
    if (authStatus !== 'authenticated' || supabase === null || userId === null || !isConfigured) {
      return
    }

    setLoadingWorkbooks(true)

    void (async () => {
      const { data, error } = await supabase
        .from('workbooks')
        .select('id, user_id, title, created_at, problems')
        .order('created_at', { ascending: false })

      if (error !== null) {
        setBanner(error.message)
        setLoadingWorkbooks(false)
        return
      }

      const remoteWorkbooks = (data ?? []) as Workbook[]
      const nextWorkbooks = remoteWorkbooks.length > 0 ? remoteWorkbooks : [sampleWorkbook]

      setWorkbooks(nextWorkbooks)
      setBanner(
        remoteWorkbooks.length === 0
          ? '데이터베이스에 저장된 문제집이 없어 데모 문제집을 불러왔습니다.'
          : null,
      )
      setLoadingWorkbooks(false)
    })()
  }, [authStatus, isConfigured, userId])

  useEffect(() => {
    if (!isConfigured) {
      saveLocalWorkbooks(workbooks)
    }
  }, [isConfigured, workbooks])

  const gradedProblems = useMemo(() => {
    if (selectedWorkbook === null) {
      return []
    }

    const sortedProblems = [...selectedWorkbook.problems]
      .sort((left, right) => left.number - right.number)
    const endIndex = gradingEndIndexExclusive ?? currentIndex

    return sortedProblems
      .slice(gradingStartIndex, endIndex)
      .map((problem) => {
        const rawAnswer = responses[problem.number]
        const studentAnswer = rawAnswer === undefined ? null : rawAnswer
        return evaluateProblem(problem, studentAnswer)
      })
  }, [currentIndex, gradingEndIndexExclusive, gradingStartIndex, responses, selectedWorkbook])

  const summary = useMemo(() => summarizeResults(gradedProblems), [gradedProblems])

  const gradingRangeLabel = useMemo(() => {
    if (gradedProblems.length === 0) {
      return null
    }

    const firstProblem = gradedProblems[0]
    const lastProblem = gradedProblems[gradedProblems.length - 1]

    return firstProblem.number === lastProblem.number
      ? `${firstProblem.number}번`
      : `${firstProblem.number}~${lastProblem.number}번`
  }, [gradedProblems])

  const resetCreateDraft = () => {
    setTitle('새 문제집')
    setDraftRows(createDraftRows())
    setProblemCountInput(String(createDraftRows().length))
    setEditingWorkbookId(null)
    setValidationErrors(null)
  }

  const loadWorkbookIntoEditor = (workbook: Workbook) => {
    setEditingWorkbookId(workbook.id === sampleWorkbook.id ? null : workbook.id)
    setTitle(workbook.title)
    setProblemCountInput(String(workbook.problems.length))
    setDraftRows(
      workbook.problems.map((problem) => ({
        number: String(problem.number),
        type: problem.type,
        correctAnswer: problem.correct_answer ?? '',
      })),
    )
    setValidationErrors(null)
  }

  const handleSignIn = async () => {
    const errorMessage = await signInWithGoogle()

    if (errorMessage !== null) {
      setBanner(errorMessage)
    }
  }

  const handleSignOut = async () => {
    if (supabase !== null) {
      await supabase.auth.signOut()
    }

    setAuthStatus('signedOut')
    setUserId(null)
    setUserEmail(null)
    setAuthMessage(null)
    setStep('login')
  }

  const handleProblemCountChange = (nextCount: number) => {
    setDraftRows((currentRows) => resizeDraftRows(currentRows, nextCount))
    setValidationErrors(null)
  }

  const handleProblemCountInputChange = (nextValue: string) => {
    setProblemCountInput(nextValue)

    if (nextValue.trim().length === 0) {
      return
    }

    const nextCount = Number.parseInt(nextValue, 10)

    if (Number.isFinite(nextCount)) {
      const clampedCount = clampProblemCount(nextCount)
      setProblemCountInput(String(clampedCount))
      handleProblemCountChange(clampedCount)
    }
  }

  const handleSaveWorkbook = async () => {
    if (problemCountInput.trim().length === 0) {
      setValidationErrors(['문제 개수는 1개 이상이어야 합니다.'])
      return
    }

    const normalized = normalizeDraftToWorkbook(title, userId ?? 'demo-user', draftRows)

    if (normalized.workbook === null) {
      setValidationErrors(normalized.errors)
      return
    }

    setValidationErrors(null)

    const isEditingPersisted =
      editingWorkbookId !== null && editingWorkbookId !== sampleWorkbook.id
    const existingWorkbook = isEditingPersisted
      ? workbooks.find((workbook) => workbook.id === editingWorkbookId) ?? null
      : null

    const workbookToSave: Workbook = {
      ...normalized.workbook,
      id: isEditingPersisted && existingWorkbook !== null ? existingWorkbook.id : normalized.workbook.id,
      created_at:
        isEditingPersisted && existingWorkbook !== null
          ? existingWorkbook.created_at
          : normalized.workbook.created_at,
    }

    if (isConfigured && supabase !== null && userId !== null) {
      const { error } = await supabase.from('workbooks').upsert(workbookToSave)

      if (error !== null) {
        setBanner(error.message)
        return
      }
    }

    const nextWorkbooks = [
      workbookToSave,
      ...workbooks.filter((workbook) => workbook.id !== workbookToSave.id),
    ]

    setWorkbooks(nextWorkbooks)
    saveLocalWorkbooks(nextWorkbooks)
    setSelectedWorkbook(workbookToSave)
    setBanner(isConfigured ? '문제집을 데이터베이스에 저장했습니다.' : '문제집을 로컬에 저장했습니다.')
    setStep('dashboard')
  }

  const startGrading = (workbook: Workbook, startProblemNumber = 1) => {
    const sortedProblems = [...workbook.problems].sort((left, right) => left.number - right.number)
    const resolvedIndex = sortedProblems.findIndex((problem) => problem.number >= startProblemNumber)
    const nextStartIndex = resolvedIndex === -1 ? Math.max(sortedProblems.length - 1, 0) : resolvedIndex

    setSelectedWorkbook(workbook)
    setResponses({})
    setDraftResponses({})
    setGradingStartIndex(nextStartIndex)
    setGradingEndIndexExclusive(null)
    setCurrentIndex(nextStartIndex)
    setStep('grader')
  }

  const completeGrading = (endIndexExclusive: number) => {
    setGradingEndIndexExclusive(endIndexExclusive)
    setCurrentIndex(endIndexExclusive)
    setStep('result')
  }

  const renderPage = () => {
    if (authStatus === 'loading') {
      return (
        <div className="flex min-h-[80vh] items-center justify-center text-sm text-slate-500">
          로딩 중…
        </div>
      )
    }

    if (step === 'login' || authStatus !== 'authenticated') {
      return <LoginPage authMessage={authMessage} onSignIn={handleSignIn} />
    }

    if (step === 'dashboard') {
      return (
        <>
          <DashboardPage
            userEmail={userEmail ?? ''}
            workbooks={workbooks}
            loading={loadingWorkbooks}
            banner={banner}
            onCreateWorkbook={() => {
              resetCreateDraft()
              setBanner(null)
              setStep('admin')
            }}
            onSelectWorkbook={(workbook) => {
              setSelectedWorkbook(workbook)
            }}
            onGradeWorkbook={(workbook) => {
              setGradeModalWorkbook(workbook)
              setGradeStartInput('1')
              setGradeModalOpen(true)
            }}
            onEditWorkbook={(workbook) => {
              loadWorkbookIntoEditor(workbook)
              setBanner(null)
              setStep('admin')
            }}
            onSignOut={handleSignOut}
          />

          {gradeModalOpen && gradeModalWorkbook !== null ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-4">
              <div className="w-full max-w-sm rounded-2xl border bg-white p-6">
                <h2 className="text-lg font-semibold">채점 시작 문제 번호 선택</h2>
                <p className="mt-2 text-sm text-slate-500">몇 번부터 채점할지 선택하세요.</p>

                <div className="mt-4">
                  <label className="block text-sm text-slate-700">시작 문제 번호</label>
                  <input
                    type="number"
                    min={1}
                    max={gradeModalWorkbook.problems.length}
                    value={gradeStartInput}
                    onChange={(e) => {
                      const next = e.target.value
                      setGradeStartInput(next)

                      if (next.trim().length === 0) {
                        // allow empty but show warning
                        return
                      }

                      const parsed = Number.parseInt(next, 10)

                      if (!Number.isFinite(parsed)) {
                        return
                      }

                      const clamped = Math.max(1, Math.min(gradeModalWorkbook.problems.length, Math.floor(parsed)))
                      if (String(clamped) !== next) {
                        setGradeStartInput(String(clamped))
                      }
                      
                    }}
                    className={`mt-2 w-full rounded-lg px-3 py-2 text-sm outline-none ${
                      gradeStartInput.trim().length === 0 ? 'border border-red-400' : 'border border-slate-200'
                    }`}
                  />
                  <p className={`mt-2 text-xs ${gradeStartInput.trim().length === 0 ? 'text-red-600' : 'text-slate-500'}`}>
                    {gradeStartInput.trim().length === 0
                      ? '시작 문제 번호를 입력해 주세요. 예: 11'
                      : `전체 ${gradeModalWorkbook.problems.length}문항 중 선택`}
                  </p>
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 interactive"
                    onClick={() => {
                      setGradeModalOpen(false)
                      setGradeModalWorkbook(null)
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-black bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 interactive"
                    onClick={() => {
                      const parsed = Number.parseInt(gradeStartInput || '1', 10)
                      const startNumber = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
                      setGradeModalOpen(false)
                      if (gradeModalWorkbook) {
                        startGrading(gradeModalWorkbook, startNumber)
                      }
                      setGradeModalWorkbook(null)
                    }}
                  >
                    채점 시작
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )
    }

    if (step === 'admin') {
      return (
        <CreatePage
          title={title}
          problemCount={problemCountInput}
          draftRows={draftRows}
          banner={banner}
          validationErrors={validationErrors}
          onTitleChange={setTitle}
          onProblemCountChange={handleProblemCountInputChange}
          onDraftRowsChange={setDraftRows}
          onSave={() => {
            void handleSaveWorkbook()
          }}
          onBack={() => {
            setBanner(null)
            setValidationErrors(null)
            setStep('dashboard')
          }}
          onCloseValidationErrors={() => setValidationErrors(null)}
        />
      )
    }

    if (step === 'grader' && selectedWorkbook !== null) {
      return (
        <GraderPage
          workbook={selectedWorkbook}
          responses={responses}
          draftResponses={draftResponses}
          currentIndex={currentIndex}
          startIndex={gradingStartIndex}
          onResponsesChange={setResponses}
          onDraftResponsesChange={setDraftResponses}
          onCurrentIndexChange={setCurrentIndex}
          onComplete={completeGrading}
          onBack={() => setStep('dashboard')}
        />
      )
    }

    if (step === 'result' && selectedWorkbook !== null) {
      return (
        <ResultPage
          workbookTitle={selectedWorkbook.title}
          gradedRangeLabel={gradingRangeLabel}
          summary={summary}
          gradedProblems={gradedProblems}
          onBack={() => setStep('dashboard')}
          onRegrade={() => {
            setResponses({})
            setDraftResponses({})
            setGradingEndIndexExclusive(null)
            setCurrentIndex(gradingStartIndex)
            setStep('grader')
          }}
        />
      )
    }

    return null
  }

  return <Layout>{renderPage()}</Layout>
}

export default App
