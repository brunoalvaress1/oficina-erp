import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const STORAGE_KEY = 'oficina-erp-sidebar-collapsed'

export function MainLayout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}