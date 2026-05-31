import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-white px-4 py-6 text-black">
      <div className="min-h-[80vh]">{children}</div>

      <footer className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
        <div>© 2026 Jongwon Choi. All rights reserved.</div>
        <div>
          by 121기 최종원 (
          <a
            href="mailto:h2511129@joongdong.hs.kr"
            className="text-blue-600 hover:text-blue-700"
          >
            h2511129@joongdong.hs.kr
          </a>
          )
        </div>
        <div>
          Source:{' '}
          <a
            href="https://github.com/jwchoi-edu/AutoGrader"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700"
          >
            jwchoi-edu/AutoGrader
          </a>{' '}
          — GPL 3.0
        </div>
      </footer>
    </div>
  )
}
