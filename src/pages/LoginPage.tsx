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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-widest text-slate-500">
              AutoGrader by Jongwon Choi
            </p>
            <h1 className="mt-2 text-2xl font-bold text-black">
              Login to AutoGrader
            </h1>
            <p className="mt-2 text-sm text-slate-600 whitespace-nowrap">
              Google SSO로 로그인합니다.
              <br />
              {SCHOOL_DOMAIN} 계정만 접근할 수 있습니다.
            </p>
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

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-100 interactive"
        onClick={() => {
          void onSignIn()
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0"
        >
          <path
            fill="#4285F4"
            d="M21.35 11.1H12v2.95h5.35c-.23 1.34-1 2.47-2.13 3.24v2.69h3.44c2.02-1.86 3.19-4.59 3.19-7.84 0-.75-.07-1.47-.5-2.04Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.97 0 5.46-.98 7.28-2.66l-3.44-2.69c-.95.64-2.17 1.01-3.84 1.01-2.95 0-5.45-1.99-6.34-4.67H1.98v2.77A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M5.66 13.99A5.99 5.99 0 0 1 5.33 12c0-.69.12-1.36.33-1.99V7.24H1.98A10 10 0 0 0 2 12c0 1.61.39 3.13 1.04 4.46l2.62-2.47Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.07.56 4.23 1.67l3.17-3.17C17.45 2.12 14.97 1 12 1A10 10 0 0 0 2.04 7.54l3.62 2.47C6.55 7.37 9.05 5.38 12 5.38Z"
          />
        </svg>
        <span>Google로 로그인</span>
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
  window.alert(
    `허용되지 않은 계정입니다.\n로그인 이메일은 반드시 ${SCHOOL_DOMAIN} 로 끝나야 합니다.\n\n현재: ${email}`,
  )
}
