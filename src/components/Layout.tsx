import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-white px-4 py-6 text-black">
      {children}
    </div>
  )
}
