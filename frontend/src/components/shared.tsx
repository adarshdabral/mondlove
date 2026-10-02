'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Ban, Check, Flag, LifeBuoy, Loader2, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { api, errorMessage } from '../lib/api'
import { useToast } from '../lib/session'
import type { MiniPerson, Person, Treat, Venue } from '../lib/types'
import { Avatar } from './Avatar'
import { Button, Chip, CompatRing, Sheet, VenueArt } from './ui'

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return <BadgeCheck size={size} className="shrink-0 fill-sky text-white" aria-label="Verified" />
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted">
      <Loader2 size={18} className="animate-spin" /> {label}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
      {message}
      {onRetry && (
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button>
        </div>
      )}
    </div>
  )
}

export function EmptyState({ emoji, title, body, action }: { emoji: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-line px-6 py-12 text-center">
      <div className="text-4xl">{emoji}</div>
      <div className="mt-3 font-display text-xl">{title}</div>
      <p className="mx-auto mt-1 max-w-sm text-[14px] text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function PageHeader({ eyebrow, title, sub, action }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ember">{eyebrow}</div>}
        <h1 className="mt-1 font-display text-[30px] leading-tight md:text-[38px]">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function MiniAvatarName({ p, sub }: { p: MiniPerson; sub?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar config={p.avatar} size={44} />
      <div className="min-w-0">
        <div className="flex items-center gap-1 font-semibold">{p.name} {p.verified && <VerifiedBadge size={14} />}</div>
        {sub && <div className="truncate text-xs text-muted">{sub}</div>}
      </div>
    </div>
  )
}

export function PersonCard({ p }: { p: Person }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[30px] border border-line/70 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative px-5 pb-4 pt-5" style={{ background: `linear-gradient(160deg, ${p.avatar.bg[0]}, #fff 85%)` }}>
        <div className="flex items-start gap-4">
          <Avatar config={p.avatar} size={80} shape="squircle" ring />
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="whitespace-nowrap font-display text-[24px] leading-none">{p.name}, {p.age}</span>
              {p.verified && <VerifiedBadge size={18} />}
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[13px] text-ink-soft">
              <MapPin size={13} className="shrink-0" /> <span className="truncate">{p.area}{p.distanceKm != null && ` · ${p.distanceKm} km`}</span>
            </div>
            <div className="mt-1.5 text-[12px] font-medium text-muted">{p.intention}</div>
          </div>
          {p.compat != null && (
            <div className="flex flex-col items-center">
              <CompatRing value={p.compat} size={54} />
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Match</span>
            </div>
          )}
        </div>
        <p className="mt-4 font-display text-[17px] italic leading-snug">“{p.sharedLine}”</p>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="flex flex-wrap gap-1.5">
          {p.interests.slice(0, 5).map((i) => (
            <span key={i.label} className="rounded-full bg-sand px-2.5 py-1 text-[12px] font-medium text-ink-soft">{i.emoji} {i.label}</span>
          ))}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <Link href={`/app/people/${p.id}`} className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold hover:border-ink/30">View profile</Link>
          <Link href={`/app/propose/${p.id}`} className="inline-flex h-11 items-center justify-center rounded-full bg-ember text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgb(232_119_74/0.7)] hover:bg-ember-dark">Propose a date</Link>
        </div>
      </div>
    </div>
  )
}

export function TreatPicker({ treats, value, onChange, tone = 'ember' }: { treats: Treat[]; value: Treat | null; onChange: (t: Treat) => void; tone?: 'ember' | 'plum' }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {treats.map((t) => {
        const on = value?.name === t.name
        return (
          <button
            key={t.name}
            type="button"
            onClick={() => onChange(t)}
            className={`rounded-2xl border p-3 text-left transition cursor-pointer active:scale-[0.98] ${on ? (tone === 'ember' ? 'border-ember bg-ember-soft' : 'border-plum bg-plum-soft') : 'border-line bg-white hover:border-ink/20'}`}
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">{t.emoji}</span>
              {on && <span className={`grid h-5 w-5 place-items-center rounded-full text-white ${tone === 'ember' ? 'bg-ember' : 'bg-plum'}`}><Check size={12} strokeWidth={3} /></span>}
            </div>
            <div className="mt-1.5 text-[13px] font-semibold leading-tight">{t.name}</div>
            {t.note && <div className="mt-0.5 text-[11px] leading-snug text-muted">{t.note}</div>}
          </button>
        )
      })}
    </div>
  )
}

export function VenueTile({ v, selected, onClick, badge }: { v: Pick<Venue, 'id' | 'name' | 'emoji' | 'tone' | 'category' | 'area'>; selected?: boolean; onClick?: () => void; badge?: string }) {
  return (
    <button type="button" onClick={onClick} className={`relative w-full overflow-hidden rounded-3xl border-2 bg-white text-left transition cursor-pointer ${selected ? 'border-ember shadow-lift' : 'border-transparent shadow-card hover:shadow-lift'}`}>
      <VenueArt emoji={v.emoji} tone={v.tone} className="h-20" />
      {badge && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-ember-dark">{badge}</span>}
      <div className="p-3">
        <div className="truncate text-[13px] font-semibold">{v.name}</div>
        <div className="truncate text-[11px] text-muted">{v.category} · {v.area}</div>
      </div>
    </button>
  )
}

/** Report, block, emergency help and support, available wherever another person appears. */
export function SafetySheet({ open, onClose, person, trusted }: { open: boolean; onClose: () => void; person?: { id: string; name: string; avatar: Person['avatar'] }; trusted?: { name: string; phone: string } | null }) {
  const toast = useToast()
  const router = useRouter()
  const [step, setStep] = useState<'menu' | 'report' | 'block'>('menu')
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const close = () => {
    setStep('menu')
    setReason('')
    onClose()
  }
  const run = async (fn: () => Promise<unknown>, ok: string, after?: () => void) => {
    setBusy(true)
    try {
      await fn()
      toast(ok, 'success')
      close()
      after?.()
    } catch (e) {
      toast(errorMessage(e), 'warn')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Sheet open={open} onClose={close} title={step === 'menu' ? 'Safety toolkit' : step === 'report' ? `Report ${person?.name ?? ''}` : `Block ${person?.name ?? ''}?`}>
      {step === 'menu' && (
        <div className="space-y-2.5">
          <a href="tel:112" className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-700">
            <Phone size={20} />
            <div className="flex-1">
              <div className="font-semibold">Emergency help</div>
              <div className="text-xs opacity-80">Call 112{trusted ? ` · then let ${trusted.name} know` : ''}</div>
            </div>
          </a>
          {trusted && (
            <a href={`sms:${trusted.phone}?body=${encodeURIComponent('I’m on a Mingleo date. I’ll check in with you soon.')}`} className="flex items-center gap-3 rounded-2xl bg-white p-4">
              <ShieldCheck size={20} className="text-sage" />
              <div className="flex-1">
                <div className="font-semibold">Message {trusted.name}</div>
                <div className="text-xs text-muted">Share that you&apos;re on a date</div>
              </div>
            </a>
          )}
          <a href="mailto:safety@mingleo.app" className="flex items-center gap-3 rounded-2xl bg-white p-4">
            <LifeBuoy size={20} className="text-sky" />
            <div className="flex-1">
              <div className="font-semibold">Contact Trust &amp; Safety</div>
              <div className="text-xs text-muted">safety@mingleo.app · reviewed around the clock</div>
            </div>
          </a>
          {person && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button onClick={() => setStep('report')} className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-white p-3.5 text-sm font-semibold cursor-pointer">
                <Flag size={16} /> Report
              </button>
              <button onClick={() => setStep('block')} className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-white p-3.5 text-sm font-semibold text-red-600 cursor-pointer">
                <Ban size={16} /> Block
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 pt-2 text-xs text-muted">
            <ShieldCheck size={14} className="text-sage" /> Every Mingleo date happens at a verified public venue.
          </div>
        </div>
      )}
      {step === 'report' && person && (
        <div>
          <p className="text-sm text-ink-soft">Reports are confidential. {person.name} won&apos;t know it was you.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Inappropriate messages', 'Fake profile', 'Didn’t show up', 'Made me feel unsafe', 'Something else'].map((r) => (
              <Chip key={r} active={reason === r} onClick={() => setReason(r)}>{r}</Chip>
            ))}
          </div>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="Anything else our safety team should know? (optional)" className="mt-4 h-24 w-full rounded-2xl border border-line bg-white p-3 text-sm outline-none focus:border-ember" />
          <Button full className="mt-4" variant="dark" disabled={!reason || busy} onClick={() => run(() => api('/reports', { body: { against: person.id, type: reason, details: details || undefined } }), 'Report received. Our safety team is on it.')}>
            Submit report
          </Button>
        </div>
      )}
      {step === 'block' && person && (
        <div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
            <Avatar config={person.avatar} size={48} />
            <p className="text-sm text-ink-soft">You won&apos;t see each other again, and any open proposals between you are cancelled quietly. You can unblock from your profile.</p>
          </div>
          <Button full className="mt-4" variant="danger" disabled={busy} onClick={() => run(() => api('/blocks', { body: { handle: person.id } }), `${person.name} has been blocked`, () => router.push('/app/discover'))}>
            Block {person.name}
          </Button>
          <Button full className="mt-2" variant="ghost" onClick={() => setStep('menu')}>Go back</Button>
        </div>
      )}
    </Sheet>
  )
}
