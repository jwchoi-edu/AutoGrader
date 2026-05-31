import { useEffect, useMemo, useState } from 'react'
import { Layout } from './components/Layout'
import { AdminPage } from './pages/AdminPage'
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
  const [draftRows, setDraftRows] = useState<ProblemDraft[]>(createDraftRows)
  const [responses, setResponses] = useState<Record<number, string | null>>({})
  const [draftResponses, setDraftResponses] = useState<Record<number, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadingWorkbooks, setLoadingWorkbooks] = useState(false)

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
        setAuthMessage('Google 계정으로 로그인해 주세요.')
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
        setAuthMessage('Google 계정으로 로그인해 주세요.')
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
          ? 'Supabase에 저장된 문제집이 없어 데모 문제집을 불러왔습니다.'
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

    return [...selectedWorkbook.problems]
      .sort((left, right) => left.number - right.number)
      .map((problem) => {
        const rawAnswer = responses[problem.number]
        const studentAnswer = rawAnswer === undefined ? null : rawAnswer
        return evaluateProblem(problem, studentAnswer)
      })
  }, [responses, selectedWorkbook])

  const summary = useMemo(() => summarizeResults(gradedProblems), [gradedProblems])

  const resetAdminDraft = () => {
    setTitle('새 문제집')
    setDraftRows(createDraftRows())
    setEditingWorkbookId(null)
  }

  const loadWorkbookIntoEditor = (workbook: Workbook) => {
    setEditingWorkbookId(workbook.id === sampleWorkbook.id ? null : workbook.id)
    setTitle(workbook.title)
    setDraftRows(
      workbook.problems.map((problem) => ({
        number: String(problem.number),
        type: problem.type,
        correctAnswer: problem.correct_answer ?? '',
      })),
    )
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
    setAuthMessage('Google 계정으로 로그인해 주세요.')
    setStep('login')
  }

  const handleValidate = () => {
    const normalized = normalizeDraftToWorkbook(title, userId ?? 'demo-user', draftRows)

    if (normalized.workbook === null) {
      setBanner(normalized.errors.join(' '))
      return
    }

    setDraftRows(
      normalized.workbook.problems.map((problem) => ({
        number: String(problem.number),
        type: problem.type,
        correctAnswer: problem.correct_answer ?? '',
      })),
    )
    setBanner('문제집이 정렬되었습니다. 저장 버튼을 눌러 확정하세요.')
  }

  const handleSaveWorkbook = async () => {
    const normalized = normalizeDraftToWorkbook(title, userId ?? 'demo-user', draftRows)

    if (normalized.workbook === null) {
      setBanner(normalized.errors.join(' '))
      return
    }

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
    setBanner(isConfigured ? '문제집을 Supabase에 저장했습니다.' : '문제집을 로컬에 저장했습니다.')
    setStep('dashboard')
  }

  const startGrading = (workbook: Workbook) => {
    setSelectedWorkbook(workbook)
    setResponses({})
    setDraftResponses({})
    setCurrentIndex(0)
    setStep('grader')
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
        <DashboardPage
          userEmail={userEmail ?? ''}
          workbooks={workbooks}
          loading={loadingWorkbooks}
          banner={banner}
          onCreateWorkbook={() => {
            resetAdminDraft()
            setBanner(null)
            setStep('admin')
          }}
          onSelectWorkbook={(workbook) => {
            setSelectedWorkbook(workbook)
          }}
          onGradeWorkbook={startGrading}
          onEditWorkbook={(workbook) => {
            loadWorkbookIntoEditor(workbook)
            setBanner(null)
            setStep('admin')
          }}
          onSignOut={handleSignOut}
        />
      )
    }

    if (step === 'admin') {
      return (
        <AdminPage
          title={title}
          draftRows={draftRows}
          banner={banner}
          onTitleChange={setTitle}
          onDraftRowsChange={setDraftRows}
          onValidate={handleValidate}
          onSave={() => {
            void handleSaveWorkbook()
          }}
          onBack={() => {
            setBanner(null)
            setStep('dashboard')
          }}
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
          onResponsesChange={setResponses}
          onDraftResponsesChange={setDraftResponses}
          onCurrentIndexChange={setCurrentIndex}
          onComplete={() => setStep('result')}
          onBack={() => setStep('dashboard')}
        />
      )
    }

    if (step === 'result' && selectedWorkbook !== null) {
      return (
        <ResultPage
          workbookTitle={selectedWorkbook.title}
          summary={summary}
          gradedProblems={gradedProblems}
          onBack={() => setStep('dashboard')}
          onRegrade={() => {
            setResponses({})
            setDraftResponses({})
            setCurrentIndex(0)
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
