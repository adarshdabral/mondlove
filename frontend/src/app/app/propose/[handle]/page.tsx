'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { useApi, useSession, useToast } from '@/lib/session'
import { upcomingDays } from '@/lib/constants'
import type { Person, Proposal, Treat, Venue } from '@/lib/types'
import { Avatar } from '@/components/Avatar'
import { PlanPicker, type Plan } from '@/components/PlanPicker'
import { Button, Chip, SectionTitle, Sheet, VenueArt } from '@/components/ui'
import { ErrorState, PageLoader, TreatPicker } from '@/components/shared'

const NOTE_IDEAS = ['Your profile made me smile. Coffee?', 'I hear their dessert is dangerous.', 'Low-key, no pressure, just good conversation.']

export default function Propose() {
  const { handle } = useParams<{ handle: string }>()
  const router = useRouter()
  const toast = useToast()
  const { user } = useSession()
  const person = useApi<{ person: Person; openProposalId: string | null }>(`/users/${handle}`)
  const venues = useApi<{ venues: Venue[] }>('/venues')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [treat, setTreat] = useState<Treat | null>(null)
  const [note, setNote] = useState('')
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!venues.data || !person.data || plan) return
    const fav = venues.data.venues.find((v) => v.id === person.data!.person.favoriteVenue) ?? venues.data.venues[0]
    setPlan({ venueId: fav.id, packageId: fav.packages[0]?.id, day: upcomingDays(12)[3], time: fav.slots[Math.min(1, fav.slots.length - 1)] })
    setTreat(fav.treats[0] ?? null)
  }, [venues.data, person.data, plan])

  useEffect(() => {
    if (person.data?.openProposalId) router.replace(`/app/proposals/${person.data.openProposalId}`)
  }, [person.data, router])

  if (person.loading || venues.loading || !plan) return <PageLoader />
  if (person.error || venues.error) return <ErrorState message={person.error ?? venues.error!} />
  const p = person.data!.person
  const venue = venues.data!.venues.find((v) => v.id === plan.venueId)!
  const pkg = venue.packages.find((x) => x.id === plan.packageId) ?? venue.packages[0]

  const send = async () => {
    setBusy(true)
    try {
      const { proposal } = await api<{ proposal: Proposal }>('/proposals', { body: { to: p.id, venueId: plan.venueId, packageId: plan.packageId, day: plan.day, time: plan.time, treatForReceiver: treat, note: note || undefined } })
      toast(`Proposal sent to ${p.name} 💌`, 'success')
      router.replace(`/app/proposals/${proposal.id}`)
    } catch (e) {
      toast(errorMessage(e), 'warn')
      setBusy(false)
    }
  }

  return (
    <div className="pb-24">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex -space-x-3">
          <Avatar config={user!.avatar} size={52} ring />
          <Avatar config={p.avatar} size={52} ring />
        </div>
        <div>
          <h1 className="font-display text-[28px] leading-tight md:text-[34px]">Invite {p.name} on a date</h1>
          <div className="text-sm text-muted">Not a chat request. A real plan.</div>
        </div>
      </div>

      <PlanPicker
        venues={venues.data!.venues}
        value={plan}
        favourite={p.favoriteVenue ? { id: p.favoriteVenue, label: `${p.name}'s fave` } : undefined}
        onChange={(next) => {
          if (next.venueId !== plan.venueId) setTreat(venues.data!.venues.find((v) => v.id === next.venueId)?.treats[0] ?? null)
          setPlan(next)
        }}
      />

      <section className="mt-8">
        <SectionTitle>Something for {p.name} to try</SectionTitle>
        <p className="-mt-2 mb-3 text-[13px] text-muted">Your Date Token. {p.name} picks something for you in return.</p>
        <TreatPicker treats={venue.treats} value={treat} onChange={setTreat} />
      </section>

      <section className="mt-8">
        <SectionTitle>A short note <span className="text-sm text-muted">(optional)</span></SectionTitle>
        <textarea value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} placeholder="Say why you thought of them…" className="h-20 w-full rounded-2xl border border-line bg-white p-3 text-[14px] outline-none focus:border-ember" />
        <div className="mt-2 flex flex-wrap gap-1.5">{NOTE_IDEAS.map((n) => <Chip key={n} size="sm" onClick={() => setNote(n)}>{n}</Chip>)}</div>
      </section>

      <div className="fixed inset-x-0 bottom-20 z-30 border-t border-line/60 bg-cream/90 px-4 py-3 backdrop-blur md:bottom-0 md:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="hidden text-sm text-ink-soft sm:block">{venue.name} · {plan.day} · {plan.time}</div>
          <Button size="lg" disabled={!treat} onClick={() => setPreview(true)} icon={<Sparkles size={16} />} className="w-full sm:w-auto">Preview invitation</Button>
        </div>
      </div>

      <Sheet open={preview} onClose={() => setPreview(false)} title={`What ${p.name} will see`}>
        <div className="overflow-hidden rounded-[28px] border border-line bg-white">
          <VenueArt emoji={venue.emoji} tone={venue.tone} className="h-28" size="lg" />
          <div className="p-5">
            <div className="text-xs text-muted">{venue.category} · {venue.area}</div>
            <div className="font-display text-2xl">{venue.name}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-sand/70 p-3"><div className="text-[11px] text-muted">When</div><div className="font-semibold">{plan.day}</div><div>{plan.time}</div></div>
              <div className="rounded-2xl bg-sand/70 p-3"><div className="text-[11px] text-muted">Experience</div><div className="font-semibold">{pkg.name}</div></div>
            </div>
            {treat && <div className="mt-3 rounded-2xl bg-ember-soft p-3"><div className="text-[12px] text-ember-dark">{user!.name} would love you to try</div><div className="font-display text-lg">{treat.emoji} {treat.name}</div></div>}
            {note && <p className="mt-3 border-l-2 border-ember pl-3 font-display italic text-ink-soft">“{note}”</p>}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[12px] text-muted"><ShieldCheck size={14} className="text-sage" /> {p.name} never sees the price.</div>
        <Button full size="lg" className="mt-4" disabled={busy} onClick={send}>{busy ? 'Sending…' : '💌 Send proposal'}</Button>
      </Sheet>
    </div>
  )
}
