'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Check, Clock, Edit3, Heart, Info, RefreshCw, ShieldCheck } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { useApi, useSession, useToast } from '@/lib/session'
import type { Person, Proposal, Treat, Venue } from '@/lib/types'
import { Avatar } from '@/components/Avatar'
import { PlanPicker, type Plan } from '@/components/PlanPicker'
import { Button, Card, Chip, Eyebrow, SectionTitle, Sheet, VenueArt } from '@/components/ui'
import { ErrorState, PageLoader, SafetySheet, TreatPicker } from '@/components/shared'

interface Detail {
  proposal: Proposal
  venue: Venue
  person: Person
  history: { action: string; changes: string[]; at: string; byMe: boolean }[]
}

export default function ProposalPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const { user } = useSession()
  const { data, error, loading, reload } = useApi<Detail>(`/proposals/${id}`)
  const venues = useApi<{ venues: Venue[] }>('/venues')
  const [pick, setPick] = useState<Treat | null>(null)
  const [mode, setMode] = useState<'view' | 'customize'>('view')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [declineOpen, setDeclineOpen] = useState(false)
  const [safety, setSafety] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading) return <PageLoader />
  if (error || !data) return <ErrorState message={error ?? 'Not found'} onRetry={reload} />
  const { proposal: p, venue, person } = data
  const pkg = venue.packages.find((x) => x.id === p.packageId)
  const receiverFirstReply = p.role === 'receiver' && p.status === 'sent'
  const myTreatForThem = p.role === 'sender' ? p.treatForReceiver : p.treatForSender
  const theirTreatForMe = p.role === 'sender' ? p.treatForSender : p.treatForReceiver

  const act = async (path: string, body?: object, ok?: string) => {
    setBusy(true)
    try {
      const r = await api<{ proposal: Proposal; booking?: { id: string } }>(`/proposals/${p.id}/${path}`, { body: body ?? {} })
      if (ok) toast(ok, 'success')
      if (r.booking) router.push(`/app/bookings/${r.booking.id}?new=1`)
      else {
        setMode('view')
        await reload()
      }
    } catch (e) {
      toast(errorMessage(e), 'warn')
    } finally {
      setBusy(false)
    }
  }

  const startCustomize = () => {
    setPlan({ venueId: p.venueId, packageId: p.packageId, day: p.day, time: p.time })
    setMode('customize')
  }

  /* ---------- Customize ---------- */
  if (mode === 'customize' && plan) {
    const v = venues.data?.venues.find((x) => x.id === plan.venueId) ?? venue
    return (
      <div className="pb-24">
        <button onClick={() => setMode('view')} className="mb-4 text-sm font-semibold text-muted cursor-pointer">← Back to the proposal</button>
        <h1 className="font-display text-[30px] leading-tight">Make it yours.</h1>
        <p className="mt-1 text-ink-soft">Change anything you like. {person.name} gets your version to confirm.</p>
        <div className="mt-8">
          <PlanPicker venues={venues.data?.venues ?? [venue]} value={plan} showPrice={false} tone="plum" onChange={setPlan} />
        </div>
        {p.role === 'receiver' && (
          <section className="mt-8">
            <SectionTitle>Something for {person.name} to try</SectionTitle>
            <TreatPicker treats={v.treats} value={pick} onChange={setPick} tone="plum" />
          </section>
        )}
        <div className="fixed inset-x-0 bottom-20 z-30 border-t border-line/60 bg-cream/90 px-4 py-3 backdrop-blur md:bottom-0 md:left-64">
          <div className="mx-auto flex max-w-5xl justify-end">
            <Button
              size="lg"
              variant="plum"
              disabled={busy}
              className="w-full sm:w-auto"
              onClick={() =>
                act('customize', {
                  venueId: plan.venueId !== p.venueId ? plan.venueId : undefined,
                  packageId: plan.packageId,
                  day: plan.day,
                  time: plan.time,
                  treatForSender: p.role === 'receiver' && pick ? pick : undefined,
                }, `Updated proposal sent to ${person.name}`)
              }
            >
              Send updated proposal
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- View ---------- */
  return (
    <div className="pb-28">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/app/dates" className="text-sm font-semibold text-muted hover:text-ink">← All dates</Link>
        <button onClick={() => setSafety(true)} className="text-sm font-semibold text-muted cursor-pointer">Safety</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          {/* Header card depends on state */}
          <div className="relative overflow-hidden rounded-[30px] bg-ink p-6 text-center text-white">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-ember/30 blur-2xl" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-plum/60 blur-2xl" />
            <div className="relative mx-auto w-fit"><Avatar config={person.avatar} size={84} ring /></div>
            <div className="relative mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-peach">
              {p.status === 'confirmed' ? 'It’s a date' : p.status === 'declined' ? 'Not this time' : p.myTurn ? (receiverFirstReply ? 'You’re invited' : 'Your proposal was customized') : 'Waiting for a reply'}
            </div>
            <h1 className="relative mt-1 font-display text-[26px] leading-tight">
              {receiverFirstReply && p.myTurn ? 'Someone has invited you on a Mingleo Date' : p.status === 'confirmed' ? `You & ${person.name}` : p.myTurn ? `${person.name} suggested some changes` : p.status === 'declined' ? `${p.role === 'sender' ? person.name : 'You'} said not this time` : `We’ll let you know when ${person.name} replies`}
            </h1>
            <div className="relative mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm">
              <Link href={`/app/people/${person.id}`} className="font-semibold underline-offset-2 hover:underline">{person.name}, {person.age}</Link>
              {person.compat != null && <><span className="text-white/40">·</span><span className="text-peach">{person.compat}% match</span></>}
            </div>
            <p className="relative mx-auto mt-3 max-w-xs text-[13px] text-white/60">{person.sharedLine}</p>
          </div>

          {p.myTurn && p.changes.length > 0 && (
            <Card className="p-5">
              <Eyebrow>What {person.name} changed</Eyebrow>
              <ul className="mt-3 space-y-2">{p.changes.map((c) => <li key={c} className="flex items-start gap-2 text-[14px]"><RefreshCw size={14} className="mt-0.5 text-gold" /> {c}</li>)}</ul>
            </Card>
          )}

          {p.status === 'confirmed' && p.bookingId && (
            <Link href={`/app/bookings/${p.bookingId}`} className="flex items-center justify-between rounded-3xl bg-sage-soft p-5 font-semibold text-sage">
              <span className="flex items-center gap-2"><Check size={18} /> Booking {p.bookingRef}</span> View booking →
            </Link>
          )}

          {data.history.length > 0 && (
            <Card className="p-5">
              <Eyebrow>Timeline</Eyebrow>
              <ol className="mt-3 space-y-2.5 text-[13px]">
                {data.history.map((h, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ember" />
                    <span><b>{h.byMe ? 'You' : person.name}</b> {h.action === 'sent' ? 'sent the proposal' : h.action}{h.changes.length ? `: ${h.changes.join(', ')}` : ''} <span className="text-muted">· {new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span></span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-[28px] border border-line bg-white shadow-card">
            <VenueArt emoji={venue.emoji} tone={venue.tone} className="h-32" size="lg" />
            <div className="p-5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">{venue.category} · {venue.area} {venue.verified && <><ShieldCheck size={13} className="text-sage" /> Verified venue</>}</div>
              <div className="mt-1 font-display text-[24px] leading-tight">{venue.name}</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-sand/70 p-3"><div className="text-[11px] text-muted">When</div><div className="text-[14px] font-semibold">{p.day}</div><div className="flex items-center gap-1 text-[13px] text-ink-soft"><Clock size={12} /> {p.time}</div></div>
                <div className="rounded-2xl bg-sand/70 p-3"><div className="text-[11px] text-muted">Experience</div><div className="text-[14px] font-semibold leading-tight">{pkg?.name ?? p.experienceName}</div><div className="text-[13px] text-ink-soft">{pkg?.duration}</div></div>
              </div>
              {pkg && <div className="mt-2 text-[12px] text-muted">Includes {pkg.includes.join(' · ')}</div>}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-ember-soft p-3">
                  <div className="text-[11px] font-semibold text-ember-dark">{p.role === 'sender' ? 'Your pick for them' : `${person.name}'s pick for you`}</div>
                  <div className="mt-0.5 text-[14px] font-semibold">{p.treatForReceiver ? `${p.treatForReceiver.emoji} ${p.treatForReceiver.name}` : '—'}</div>
                </div>
                <div className="rounded-2xl bg-plum-soft p-3">
                  <div className="text-[11px] font-semibold text-plum">{p.role === 'sender' ? `${person.name}'s pick for you` : 'Your pick for them'}</div>
                  <div className="mt-0.5 text-[14px] font-semibold">{p.treatForSender ? `${p.treatForSender.emoji} ${p.treatForSender.name}` : 'Not chosen yet'}</div>
                </div>
              </div>
              {p.note && <p className="mt-4 border-l-2 border-ember pl-3 font-display text-[16px] italic leading-snug text-ink-soft">“{p.note}”</p>}
            </div>
          </div>

          {receiverFirstReply && p.myTurn && (
            <Card className="p-5">
              <div className="font-display text-lg">Your turn: pick something for {person.name}</div>
              <p className="mb-3 mt-0.5 text-[13px] text-muted">That&apos;s the fun part.</p>
              <TreatPicker treats={venue.treats} value={pick ?? myTreatForThem} onChange={setPick} tone="plum" />
            </Card>
          )}
          {!p.myTurn && ['sent', 'customized'].includes(p.status) && (
            <div className="flex items-start gap-2 rounded-2xl border border-line p-4 text-[13px] text-muted">
              <Info size={16} className="mt-0.5 shrink-0" /> {person.name} can accept, suggest changes, or say “not this time”. We&apos;ll show it here.
            </div>
          )}
          {theirTreatForMe && p.status === 'confirmed' && <div className="text-center text-[13px] text-muted">The food swap is set. Enjoy!</div>}
        </div>
      </div>

      {p.myTurn && (
        <div className="fixed inset-x-0 bottom-20 z-30 border-t border-line/60 bg-cream/90 px-4 py-3 backdrop-blur md:bottom-0 md:left-64">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" disabled={busy} onClick={() => setDeclineOpen(true)}>Decline</Button>
            <Button variant="outline" disabled={busy} icon={<Edit3 size={15} />} onClick={startCustomize}>Customize</Button>
            {receiverFirstReply ? (
              <Button
                disabled={busy}
                icon={<Heart size={15} />}
                onClick={() => {
                  const t = pick ?? myTreatForThem
                  if (!t) return toast(`Pick something for ${person.name} to try first`, 'warn')
                  void act('accept', { treatForSender: t }, 'It’s a date 🎉')
                }}
              >
                Accept
              </Button>
            ) : (
              <Button disabled={busy} icon={<Check size={15} />} onClick={() => act('confirm', {}, 'Date confirmed 🎉')}>Confirm date</Button>
            )}
          </div>
        </div>
      )}

      <Sheet open={declineOpen} onClose={() => setDeclineOpen(false)} title="Not this time?">
        <p className="text-sm text-ink-soft">That&apos;s completely okay. {person.name} will simply see “Not this time”. No explanations, and nobody gets blocked.</p>
        <div className="mt-4 flex flex-wrap gap-2">{['Not feeling a spark', 'Busy that week', 'Prefer a different vibe'].map((r) => <Chip key={r}>{r}</Chip>)}</div>
        <p className="mt-2 text-xs text-muted">Your reason stays private. It just helps us suggest better matches.</p>
        <Button full variant="dark" className="mt-5" disabled={busy} onClick={async () => { setDeclineOpen(false); await act('decline', {}, 'Declined kindly') }}>Send “Not this time”</Button>
      </Sheet>
      <SafetySheet open={safety} onClose={() => setSafety(false)} person={person} trusted={user!.trustedContact} />
    </div>
  )
}
