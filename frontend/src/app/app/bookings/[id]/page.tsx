'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { CalendarPlus, Check, CreditCard, Gift, LifeBuoy, MapPin, Navigation, ShieldCheck, Sparkles, XCircle } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { inr } from '@/lib/constants'
import { useApi, useSession, useToast } from '@/lib/session'
import type { Booking } from '@/lib/types'
import { useCouple } from '@/components/AppShell'
import { Avatar } from '@/components/Avatar'
import { Button, Card, Chip, Eyebrow, Pill, Sheet, VenueArt } from '@/components/ui'
import { ErrorState, PageLoader, SafetySheet } from '@/components/shared'

function downloadIcs(b: Booking) {
  const start = new Date(b.startsAt)
  const end = new Date(start.getTime() + 2 * 3600e3)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mingleo//EN', 'BEGIN:VEVENT', `UID:${b.id}@mingleo.app`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:${b.secret ? b.title : `${b.title} · ${b.venue?.name}`}`,
    b.secret ? '' : `LOCATION:${b.venue?.name}, ${b.venue?.area}, Dehradun`, `DESCRIPTION:Mingleo booking ${b.ref}`, 'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `mingleo-${b.ref}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const s = Math.max(0, Math.floor((new Date(to).getTime() - now) / 1000))
  const parts = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60]
  return (
    <div className="grid grid-cols-4 gap-2">
      {['Days', 'Hours', 'Mins', 'Secs'].map((l, i) => (
        <div key={l} className="rounded-2xl bg-white/10 py-3 text-center">
          <div className="font-display text-2xl tabular-nums">{String(parts[i]).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase tracking-wider text-white/50">{l}</div>
        </div>
      ))}
    </div>
  )
}

function Feedback({ b, onSubmitted }: { b: Booking; onSubmitted: () => void }) {
  const toast = useToast()
  const { refresh } = useSession()
  const { reload: reloadCouple } = useCouple()
  const [rating, setRating] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [choice, setChoice] = useState<'yes' | 'unsure' | 'no' | null>(null)
  const [result, setResult] = useState<{ connected: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const other = b.with[0]
  if (result) {
    return result.connected ? (
      <Card className="p-6 text-center">
        <div className="mx-auto flex w-fit -space-x-4"><Avatar config={other.avatar} size={72} ring /></div>
        <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ember">You both said yes</div>
        <h2 className="mt-1 font-display text-[28px]">Your connection continues.</h2>
        <p className="mt-2 text-sm text-ink-soft">Photos are unlocked, you&apos;re now linked as a couple, and your first date is saved to Memories.</p>
        <Link href="/app/memories" className="mt-5 inline-flex h-11 items-center rounded-full bg-plum px-6 text-sm font-semibold text-white">See your first memory</Link>
      </Card>
    ) : (
      <Card className="p-6 text-center">
        <h2 className="font-display text-2xl">Thanks for telling us.</h2>
        <p className="mt-2 text-sm text-ink-soft">{choice === 'yes' ? `If ${other.name} feels the same, you'll both be told.` : 'Your answer is private. It helps us suggest better dates.'}</p>
      </Card>
    )
  }
  return (
    <Card className="p-6">
      <h2 className="font-display text-[26px] leading-tight">How was your Mingleo experience?</h2>
      <div className="mt-5 flex justify-between gap-2">
        {['😕', '🙂', '😊', '😍', '🤩'].map((f, i) => (
          <button key={f} aria-label={`${i + 1} of 5`} onClick={() => setRating(i + 1)} className={`grid h-14 flex-1 place-items-center rounded-2xl text-3xl transition cursor-pointer ${rating === i + 1 ? 'scale-105 bg-ember-soft ring-2 ring-ember' : 'bg-sand/70'}`}>{f}</button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {['Great conversation', 'Loved the venue', 'The food swap was fun', 'Felt safe & comfortable', 'Not quite my vibe'].map((t) => (
          <Chip key={t} size="sm" active={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</Chip>
        ))}
      </div>
      {b.kind === 'date' && (
        <>
          <h3 className="mt-7 font-display text-xl">Would you like to continue this connection?</h3>
          <p className="mt-1 text-[13px] text-muted">{other.name} only finds out if you both say yes.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {([['yes', '💛', 'Yes, I’d love to'], ['unsure', '🤔', 'Maybe, one more date'], ['no', '👋', 'Not for me']] as const).map(([id, e, t]) => (
              <button key={id} onClick={() => setChoice(id)} className={`rounded-2xl border p-4 text-left transition cursor-pointer ${choice === id ? 'border-ember bg-ember-soft' : 'border-line bg-white'}`}>
                <div className="text-2xl">{e}</div>
                <div className="mt-1 text-sm font-semibold">{t}</div>
              </button>
            ))}
          </div>
        </>
      )}
      <Button
        full
        size="lg"
        className="mt-6"
        disabled={!rating || (b.kind === 'date' && !choice) || busy}
        onClick={async () => {
          setBusy(true)
          try {
            const r = await api<{ connected: boolean }>(`/bookings/${b.id}/feedback`, { body: { rating, tags, continue: choice ?? 'yes' } })
            setResult(r)
            onSubmitted()
            // A mutual yes links the couple and switches both people into Couple Mode.
            if (r.connected) await Promise.all([refresh(), reloadCouple()])
          } catch (e) {
            toast(errorMessage(e), 'warn')
          } finally {
            setBusy(false)
          }
        }}
      >
        Submit
      </Button>
    </Card>
  )
}

function BookingView() {
  const { id } = useParams<{ id: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const toast = useToast()
  const { user } = useSession()
  const { data, error, loading, reload } = useApi<{ booking: Booking }>(`/bookings/${id}`)
  const [safety, setSafety] = useState(false)
  const [cancel, setCancel] = useState(false)
  const [pay, setPay] = useState(false)
  // Keeps the feedback card (and its result) on screen after the booking reloads with our answer.
  const [submitted, setSubmitted] = useState(false)
  if (loading) return <PageLoader />
  if (error || !data) return <ErrorState message={error ?? 'Not found'} onRetry={reload} />
  const b = data.booking
  const started = new Date(b.startsAt).getTime() < Date.now()
  const canFeedback = submitted || (started && b.status !== 'cancelled' && !b.myFeedback && b.with.length > 0)
  const other = b.with[0]

  /* ---------- Secret surprise (partner view) ---------- */
  if (b.secret) {
    const dayName = new Date(b.startsAt).toLocaleString('en-US', { weekday: 'long' })
    return (
      <div className="relative mx-auto max-w-xl overflow-hidden rounded-[34px] bg-ink px-6 py-10 text-center text-white">
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-ember/25 blur-3xl" />
        <div className="relative mx-auto w-fit">{b.from && <Avatar config={b.from.avatar} size={76} ring />}</div>
        <div className="relative mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-peach">Someone has planned a surprise for you</div>
        <h1 className="relative mt-3 font-display text-[48px] leading-none shimmer-text">{dayName}</h1>
        <div className="relative mt-2 font-display text-[34px]">{b.time}</div>
        <div className="relative mx-auto mt-8 max-w-xs rounded-3xl border border-white/15 bg-white/5 p-5">
          <div className="text-lg">{b.hint}</div>
          <div className="mt-1 text-white/60">That&apos;s all you need to know. 😉</div>
        </div>
        <div className="relative mt-8"><Countdown to={b.startsAt} /></div>
        <Button variant="outline" className="relative mt-8" icon={<CalendarPlus size={15} />} onClick={() => downloadIcs(b)}>Save the date</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {search.get('new') && (
        <div className="relative overflow-hidden rounded-[30px] bg-ink px-6 py-10 text-center text-white">
          <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-ember/30 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-plum/60 blur-3xl" />
          <div className="relative mx-auto flex w-fit -space-x-4">
            <Avatar config={user!.avatar} size={72} ring />
            {other && <Avatar config={other.avatar} size={72} ring />}
          </div>
          <div className="relative mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-peach">It&apos;s a date</div>
          <h1 className="relative mt-1 font-display text-[32px]">Your date is confirmed ❤️</h1>
          <p className="relative mt-1 text-sm text-white/60">Booking {b.ref}{other ? ` · with ${other.name}` : ''}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[28px] border border-line bg-white shadow-card">
            {b.venue && <VenueArt emoji={b.venue.emoji} tone={b.venue.tone} className="h-40" size="lg" />}
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Pill tone={b.status === 'cancelled' ? 'red' : b.status === 'completed' ? 'sand' : 'sage'}>{b.status[0].toUpperCase() + b.status.slice(1)}</Pill>
                  <h1 className="mt-2 font-display text-[28px] leading-tight">{b.title}</h1>
                  <div className="mt-1 flex items-center gap-1 text-sm text-ink-soft"><MapPin size={14} /> {b.venue?.name}, {b.venue?.area}</div>
                </div>
                {other && <Link href={`/app/people/${other.id}`} className="flex items-center gap-2 rounded-full bg-sand py-1 pl-1 pr-3 text-sm font-semibold"><Avatar config={other.avatar} size={30} /> {other.name}</Link>}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[['Day', b.day], ['Time', b.time], ['Ref', b.ref]].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-sand/70 p-3"><div className="text-[11px] text-muted">{k}</div><div className="text-[14px] font-semibold">{v}</div></div>
                ))}
              </div>
              {b.experience && (
                <div className="mt-5">
                  <Eyebrow>Experience</Eyebrow>
                  <div className="mt-1 font-semibold">{b.experience.name}{b.experience.duration && <span className="font-normal text-muted"> · {b.experience.duration}</span>}</div>
                  <div className="text-sm text-ink-soft">{(b.items?.length ? b.items : b.experience.includes).join(' · ')}</div>
                </div>
              )}
              {b.treats?.forReceiver && b.treats?.forSender && (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-ember-soft p-3 text-center"><div className="text-2xl">{b.treats.forReceiver.emoji}</div><div className="text-[13px] font-semibold">{b.treats.forReceiver.name}</div></div>
                  <div className="rounded-2xl bg-plum-soft p-3 text-center"><div className="text-2xl">{b.treats.forSender.emoji}</div><div className="text-[13px] font-semibold">{b.treats.forSender.name}</div></div>
                </div>
              )}
              {b.kind === 'surprise' && b.iPlanned && (
                <div className="mt-5 rounded-2xl bg-gold-soft p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold"><Gift size={16} /> Your surprise is secret</div>
                  <div className="mt-1 text-ink-soft">{other?.name} only sees the day, time and your hint: “{b.hint}”.{b.gift ? ` Gift: ${b.gift.label}.` : ''}</div>
                </div>
              )}
              {b.price != null && (
                <>
                  <button onClick={() => setPay(!pay)} className="mt-5 flex w-full items-center gap-2 border-t border-dashed border-line pt-4 text-left text-[13px] text-muted cursor-pointer"><CreditCard size={15} /> Booking &amp; payment</button>
                  {pay && (
                    <div className="mt-3 space-y-1.5 rounded-2xl bg-sand/60 p-3 text-[13px]">
                      <div className="flex justify-between"><span>{b.experience?.name}</span><span>{inr(b.price)}</span></div>
                      {b.gift && <div className="flex justify-between"><span>{b.gift.label}</span><span>{inr(b.gift.price)}</span></div>}
                      <div className="flex justify-between"><span>Mingleo booking fee</span><span className="text-sage">₹0</span></div>
                      <div className="pt-1 text-[11px] text-muted">Only you can see this. Free cancellation up to 24 hours before.</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {canFeedback && <Feedback b={b} onSubmitted={() => setSubmitted(true)} />}
          {b.myFeedback && !canFeedback && <div className="rounded-2xl bg-sage-soft p-4 text-sm text-sage"><Check size={15} className="mr-1 inline" /> You rated this date {b.myFeedback.rating}/5.</div>}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" icon={<Navigation size={15} />} onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${b.venue?.name} ${b.venue?.area} Dehradun`)}`, '_blank', 'noopener')}>Directions</Button>
            <Button variant="outline" icon={<CalendarPlus size={15} />} onClick={() => { downloadIcs(b); toast('Calendar file downloaded') }}>Add to calendar</Button>
          </div>
          <Card className="p-5">
            <div className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} className="text-sage" /> Safety tools</div>
            <p className="mt-1 text-[13px] text-muted">Public, verified venue. {user!.trustedContact ? `Check in with ${user!.trustedContact.name} in one tap.` : 'Add a trusted contact in your profile for one-tap check-ins.'}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" variant="soft" icon={<LifeBuoy size={14} />} onClick={() => setSafety(true)}>Safety toolkit</Button>
              <a href="tel:112" className="inline-flex h-9 items-center justify-center rounded-full bg-red-50 text-[13px] font-semibold text-red-700">Emergency 112</a>
            </div>
          </Card>
          {['pending', 'confirmed'].includes(b.status) && !started && (
            <Button full variant="danger" icon={<XCircle size={15} />} onClick={() => setCancel(true)}>Cancel booking</Button>
          )}
          {b.kind !== 'date' && b.status === 'completed' && (
            <Link href="/app/memories" className="flex items-center gap-2 rounded-3xl border border-line bg-white p-4 text-sm font-semibold shadow-card"><Sparkles size={16} className="text-plum" /> Save this date to Memories</Link>
          )}
        </div>
      </div>

      <SafetySheet open={safety} onClose={() => setSafety(false)} person={other} trusted={user!.trustedContact} />
      <Sheet open={cancel} onClose={() => setCancel(false)} title="Cancel this booking?">
        <p className="text-sm text-ink-soft">{other ? `We'll let ${other.name} know kindly. ` : ''}You&apos;ll be refunded in full if you cancel at least 24 hours before.</p>
        <Button
          full
          variant="danger"
          className="mt-5"
          onClick={async () => {
            try {
              await api(`/bookings/${b.id}/cancel`, { method: 'POST' })
              toast('Booking cancelled')
              router.replace('/app/dates')
            } catch (e) {
              toast(errorMessage(e), 'warn')
            }
          }}
        >
          Cancel booking
        </Button>
        <Button full variant="ghost" className="mt-2" onClick={() => setCancel(false)}>Keep it</Button>
      </Sheet>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BookingView />
    </Suspense>
  )
}
