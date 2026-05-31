import { hasSupabaseConfig, supabase } from '../supabaseClient'
import { SCHOOL_DOMAIN } from '../types'

interface LoginPageProps {
  authMessage: string | null
  onSignIn: () => Promise<void>
}

export function LoginPage({ authMessage, onSignIn }: LoginPageProps) {
  return (
    <div className="flex min-h-[80vh] flex-col justify-center">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <p className="text-xs tracking-widest text-slate-500 uppercase">Autonomous-Grader-Web</p>
        <h1 className="mt-2 text-2xl font-bold text-black">학교 계정 로그인</h1>
        <p className="mt-2 text-sm text-slate-600">
          Google SSO로 로그인합니다. {SCHOOL_DOMAIN} 도메인 계정만 접근할 수 있습니다.
        </p>
      </header>

      <button
        type="button"
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-100 interactive"
        onClick={() => {
          void onSignIn()
        }}
      >
        Google로 로그인
      </button>

      {authMessage !== null ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-black">
          {authMessage}
        </p>
      ) : null}

      {!hasSupabaseConfig ? (
        <p className="mt-4 text-xs text-slate-500">
          Supabase 환경 변수가 없으면 데모 모드로 자동 진입합니다.
        </p>
      ) : null}
    </div>
  )
}

export async function signInWithGoogle(): Promise<string | null> {
  if (supabase === null) {
    return 'Supabase 환경 변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)를 설정해 주세요.'
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })

  return error?.message ?? null
}

export function isAllowedEmail(email: string): boolean {
  return email.endsWith(SCHOOL_DOMAIN)
}

export function blockUnauthorizedEmail(email: string): void {
  window.alert(`허용되지 않은 계정입니다.\n로그인 이메일은 반드시 ${SCHOOL_DOMAIN} 로 끝나야 합니다.\n\n현재: ${email}`)
}
