'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarHeart, Heart, Sparkles } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { useSession } from '@/lib/session'
import type { Me } from '@/lib/types'
import { Button, Field, inputCls } from '@/components/ui'

type Intent = 'meet' | 'plan' | 'both'

const INTENTS = [
  { id: 'meet' as const, icon: Heart, title: 'Meet someone', body: 'Discover compatible people and propose a real date.', tone: 'bg-ember-soft text-ember-dark' },
  { id: 'plan' as const, icon: CalendarHeart, title: 'Plan dates with my partner', body: 'Date Lab, surprises and shared memories.', tone: 'bg-plum-soft text-plum' },
  { id: 'both' as const, icon: Sparkles, title: 'Both', body: 'Keep both doors open. Switch any time.', tone: 'bg-gold-soft text-[#9a6d17]' },
]

export function SignupForm({ initialIntent }: { initialIntent?: Intent }) {
  const router = useRouter()
  const { setUser } = useSession()
  const [intent, setIntent] = useState<Intent | null>(initialIntent ?? null)
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '' })
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!intent) {
    return (
      <div className="space-y-3">
        <p className="text-[13px] text-muted">This isn&apos;t a label, just where you&apos;d like to start.</p>
        {INTENTS.map((o) => (
          <button key={o.id} onClick={() => setIntent(o.id)} className="group flex w-full items-center gap-4 rounded-3xl border border-line bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lift cursor-pointer">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${o.tone}`}><o.icon size={22} /></span>
            <span className="flex-1">
              <span className="block text-[16px] font-semibold">{o.title}</span>
              <span className="block text-[13px] text-muted">{o.body}</span>
            </span>
            <ArrowRight size={18} className="text-muted transition group-hover:translate-x-1" />
          </button>
        ))}
        <p className="pt-4 text-center text-sm text-ink-soft">
          Already have an account? <Link href="/login" className="font-semibold text-ember">Log in</Link>
        </p>
      </div>
    )
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        try {
          const { user } = await api<{ user: Me }>('/auth/register', { body: { account: 'person', ...form, age: Number(form.age), intent } })
          setUser(user)
          router.replace('/onboarding')
        } catch (err) {
          setError(errorMessage(err))
          setBusy(false)
        }
      }}
      className="space-y-4"
    >
      <button type="button" onClick={() => setIntent(null)} className="text-[13px] font-semibold text-muted cursor-pointer">
        ← {INTENTS.find((i) => i.id === intent)?.title}
      </button>
      <div className="grid grid-cols-[1fr_100px] gap-3">
        <Field label="First name"><input className={inputCls} required autoComplete="given-name" value={form.name} onChange={set('name')} /></Field>
        <Field label="Age"><input className={inputCls} required type="number" min={18} max={100} value={form.age} onChange={set('age')} /></Field>
      </div>
      <Field label="Email"><input className={inputCls} required type="email" autoComplete="email" value={form.email} onChange={set('email')} /></Field>
      <Field label="Password" hint="At least 8 characters.">
        <input className={inputCls} required type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} />
      </Field>
      <label className="flex items-start gap-2.5 text-[13px] text-ink-soft">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-ember" />
        <span>I&apos;m 18 or older and agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</span>
      </label>
      {error && <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <Button full size="lg" type="submit" disabled={busy || !agree} variant={intent === 'plan' ? 'plum' : 'primary'}>{busy ? 'Creating your account…' : 'Create account'}</Button>
      <p className="text-center text-sm text-ink-soft">
        Own a café or run experiences? <Link href="/partners" className="font-semibold text-ember">List your venue</Link>
      </p>
    </form>
  )
}
