'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, errorMessage } from '@/lib/api'
import { useSession } from '@/lib/session'
import type { Me } from '@/lib/types'
import { Button, Field, inputCls } from '@/components/ui'

const DEMOS = [
  ['Single', 'aarav@demo.mingleo.app'],
  ['Couple', 'isha@demo.mingleo.app'],
  ['Café owner', 'rhea@demo.mingleo.app'],
  ['Admin', 'admin@demo.mingleo.app'],
]

export const homeFor = (u: Me) => (u.role === 'partner' ? '/partner' : u.role === 'admin' ? '/admin' : u.onboarded ? '/app' : '/onboarding')

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter()
  const { setUser } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const login = async (e: string, p: string) => {
    setBusy(true)
    setError('')
    try {
      const { user } = await api<{ user: Me }>('/auth/login', { body: { email: e, password: p } })
      setUser(user)
      // Only follow same-site relative redirects.
      router.replace(next?.startsWith('/') && !next.startsWith('//') && user.role === 'user' && user.onboarded ? next : homeFor(user))
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void login(email, password)
        }}
        className="space-y-4"
      >
        <Field label="Email">
          <input className={inputCls} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input className={inputCls} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Button full size="lg" type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        New to Mingleo? <Link href="/signup" className="font-semibold text-ember">Create an account</Link>
      </p>
      {process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== 'false' && (
        <div className="mt-10 rounded-3xl border border-dashed border-line p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted">Demo accounts</div>
          <p className="mt-1 text-xs text-muted">Seeded test users · password <code className="rounded bg-sand px-1">mingleo-demo</code></p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMOS.map(([label, e]) => (
              <button key={e} type="button" disabled={busy} onClick={() => login(e, 'mingleo-demo')} className="rounded-2xl border border-line bg-white px-3 py-2.5 text-left text-[13px] hover:border-ink/30 cursor-pointer disabled:opacity-50">
                <div className="font-semibold">{label}</div>
                <div className="truncate text-[11px] text-muted">{e}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
