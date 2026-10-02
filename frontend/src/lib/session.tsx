'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { api } from './api'
import type { Me } from './types'

/* ---------------- Auth ---------------- */

interface Session {
  user: Me | null
  loading: boolean
  refresh: () => Promise<Me | null>
  setUser: (u: Me | null) => void
  logout: () => Promise<void>
}

const SessionCtx = createContext<Session | null>(null)

/* ---------------- Toasts ---------------- */

type Tone = 'default' | 'success' | 'warn'
interface Toast { id: number; text: string; tone: Tone }
const ToastCtx = createContext<{ toast: (text: string, tone?: Tone) => void } | null>(null)

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const refresh = useCallback(async () => {
    try {
      const { user } = await api<{ user: Me }>('/auth/me')
      setUser(user)
      return user
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
  }, [])

  const toast = useCallback((text: string, tone: Tone = 'default') => {
    const id = ++nextId.current
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <SessionCtx.Provider value={{ user, loading, refresh, setUser, logout }}>
      <ToastCtx.Provider value={{ toast }}>
        {children}
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-8" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`animate-fade-up rounded-full px-5 py-3 text-sm font-semibold shadow-lift ${t.tone === 'success' ? 'bg-sage text-white' : t.tone === 'warn' ? 'bg-gold text-ink' : 'bg-ink text-white'}`}>
              {t.text}
            </div>
          ))}
        </div>
      </ToastCtx.Provider>
    </SessionCtx.Provider>
  )
}

export function useSession() {
  const s = useContext(SessionCtx)
  if (!s) throw new Error('useSession outside Providers')
  return s
}

export function useToast() {
  const t = useContext(ToastCtx)
  if (!t) throw new Error('useToast outside Providers')
  return t.toast
}

/* ---------------- Data fetching ---------------- */

/** Minimal fetch-on-mount hook with manual reload. `path = null` skips the request. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!path)

  const load = useCallback(async () => {
    if (!path) return
    setLoading(true)
    try {
      setData(await api<T>(path))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    void load()
  }, [load])

  return { data, error, loading, reload: load, setData }
}
