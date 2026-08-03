import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type Theme = 'dark' | 'light'
type Modo = Theme | 'sistema'

interface ThemeContextType {
  theme: Theme
  modo: Modo
  toggleTheme: () => void
  setTheme: (modo: Modo) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'oficina-erp-theme'

function prefereEscuro(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getInitialModo(): Modo {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light' || stored === 'sistema') return stored
  return prefereEscuro() ? 'dark' : 'light'
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [modo, setModoState] = useState<Modo>(getInitialModo)
  const [theme, setThemeState] = useState<Theme>(() => {
    const inicial = getInitialModo()
    return inicial === 'sistema' ? (prefereEscuro() ? 'dark' : 'light') : inicial
  })

  useEffect(() => {
    if (modo !== 'sistema') {
      setThemeState(modo)
      return
    }

    setThemeState(prefereEscuro() ? 'dark' : 'light')
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (event: MediaQueryListEvent) => setThemeState(event.matches ? 'dark' : 'light')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [modo])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, modo)
  }, [modo])

  function setTheme(novoModo: Modo) {
    setModoState(novoModo)
  }

  function toggleTheme() {
    setModoState((prev) => {
      const atual = prev === 'sistema' ? theme : prev
      return atual === 'dark' ? 'light' : 'dark'
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, modo, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  return context
}
