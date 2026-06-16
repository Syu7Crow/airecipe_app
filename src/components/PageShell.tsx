import { memo, type ReactNode } from 'react'
import { Topbar } from './Topbar'
import type { AppDestination } from '../types/ui'

type PageShellProps = {
  children: ReactNode
  currentPage?: string
  onNavigate?: (page: AppDestination) => void
  onLogout?: () => void | Promise<void>
}

export const PageShell = memo(function PageShell({
  children,
  currentPage,
  onNavigate,
  onLogout,
}: PageShellProps) {
  return (
    <div className="app-shell">
      <Topbar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="page-transition" key={currentPage}>{children}</div>
    </div>
  )
})
