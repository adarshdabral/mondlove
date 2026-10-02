'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, errorMessage } from '@/lib/api'
import { useSession } from '@/lib/session'
import type { Me } from '@/lib/types'
import { Button, Chip, Field, inputCls } from '@/components/ui'

export function PartnerSignup() {
  const router = useRouter()
  const { setUser } = useSession()
  const [f, setF] = useState({ name: '', email: '', password: '', business: '', category: '', area: '' })
  const [kind, setKind] = useState<'cafe' | 'restaurant' | 'activity'>('cafe')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        try {
          const { user } = await api<{ user: Me }>('/auth/register', {
            body: { account: 'partner', name: f.name, email: f.email, password: f.password, business: { name: f.business, kind, category: f.category, area: f.area } },
          })
          setUser(user)
          // Next: the listing wizard (photos, menu, what guests should know).
          router.replace('/partner/setup')
        } catch (err) {
          setError(errorMessage(err))
          setBusy(false)
        }
      }}
      id="join"
      className="scroll-mt-24 space-y-4 rounded-[30px] border border-line bg-white p-6 shadow-lift md:p-8"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-display text-2xl">Register your venue</div>
        <Link href="/partners/login" className="shrink-0 text-[13px] font-semibold text-ember">Already a partner? Log in</Link>
      </div>
      <div className="flex gap-2">
        {(['cafe', 'restaurant', 'activity'] as const).map((k) => (
          <Chip key={k} tone="ink" active={kind === k} onClick={() => setKind(k)}>{k === 'cafe' ? 'Café' : k === 'restaurant' ? 'Restaurant' : 'Activity'}</Chip>
        ))}
      </div>
      <Field label="Business name"><input className={inputCls} required value={f.business} onChange={set('business')} placeholder="Pine & Pour Café" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category"><input className={inputCls} required value={f.category} onChange={set('category')} placeholder={kind === 'activity' ? 'Pottery' : 'Specialty coffee'} /></Field>
        <Field label="Neighbourhood"><input className={inputCls} required value={f.area} onChange={set('area')} placeholder="Rajpur Road" /></Field>
      </div>
      <Field label="Your name"><input className={inputCls} required value={f.name} onChange={set('name')} /></Field>
      <Field label="Work email"><input className={inputCls} required type="email" value={f.email} onChange={set('email')} /></Field>
      <Field label="Password" hint="At least 8 characters."><input className={inputCls} required type="password" minLength={8} value={f.password} onChange={set('password')} /></Field>
      {error && <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <Button full size="lg" type="submit" variant="dark" disabled={busy}>{busy ? 'Creating…' : 'Create partner account'}</Button>
      <p className="text-center text-xs text-muted">Next, you’ll add photos of your venue and food, your menu, timings and what guests should know. We verify every venue before it goes live, usually within two working days.</p>
    </form>
  )
}
