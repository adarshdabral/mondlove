'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, errorMessage } from '@/lib/api'
import { useSession } from '@/lib/session'
import type { Me } from '@/lib/types'
import { Button, Field, inputCls } from '@/components/ui'

const DEMOS = {
  member: [
    ['Single', 'aarav@demo.mingleo.app'],
    ['Couple', 'isha@demo.mingleo.app'],
    ['Café owner', 'rhea@demo.mingleo.app'],
    ['Admin', 'admin@demo.mingleo.app'],
  ],
  partner: [
    ['Café owner', 'rhea@demo.mingleo.app'],
    ['Activity studio', 'vikram@demo.mingleo.app'],
    ['New venue (pending)', 'newcafe@demo.mingleo.app'],
    ['Admin', 'admin@demo.mingleo.app'],
  ],
}

/** Switches between the member and business login pages. */
export function AccountTypeTabs({ active }: { active: 'member' | 'partner' }) {
  const tab = (on: boolean) => `flex-1 rounded-full py-2 text-center transition ${on ? 'bg-white shadow-card text-ink' : 'text-muted hover:text-ink'}`
  return (
    <div className="mb-6 flex rounded-full bg-sand p-1 text-[13px] font-semibold" role="tablist" aria-label="Account type">
      <Link href="/login" role="tab" aria-selected={active === 'member'} className={tab(active === 'member')}>💫 Dating &amp; couples</Link>
      <Link href="/partners/login" role="tab" aria-selected={active === 'partner'} className={tab(active === 'partner')}>☕ Café or activity owner</Link>
    </div>
  )
}

export const homeFor = (u: Me) => (u.role === 'partner' ? '/partner' : u.role === 'admin' ? '/admin' : u.onboarded ? '/app' : '/onboarding')

export function LoginForm({ next, variant = 'member' }: { next?: string; variant?: 'member' | 'partner' }) {
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
      {variant === 'partner' ? (
        <div className="mt-6 space-y-2 text-center text-sm text-ink-soft">
          <p>New venue? <Link href="/partners#join" className="font-semibold text-ember">Register your café or activity</Link></p>
          <p className="text-xs text-muted">Looking for dates instead? <Link href="/login" className="underline">Member login</Link></p>
        </div>
      ) : (
        <div className="mt-6 space-y-2 text-center text-sm text-ink-soft">
          <p>New to Mingleo? <Link href="/signup" className="font-semibold text-ember">Create an account</Link></p>
          <p className="text-xs text-muted">Own a café or run activities? <Link href="/partners/login" className="underline">Partner login</Link> · <Link href="/partners#join" className="underline">Register your venue</Link></p>
        </div>
      )}
      {process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== 'false' && (
        <div className="mt-10 rounded-3xl border border-dashed border-line p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted">Demo accounts</div>
          <p className="mt-1 text-xs text-muted">Seeded test users · password <code className="rounded bg-sand px-1">mingleo-demo</code></p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMOS[variant].map(([label, e]) => (
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
