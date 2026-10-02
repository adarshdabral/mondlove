'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, RefreshCw, Shuffle, Sparkles, Wand2 } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { ACTIVITIES, CUISINES, MOODS, OCCASIONS, TIERS, inr, upcomingDays } from '@/lib/constants'
import { useToast } from '@/lib/session'
import type { Booking, LabPlan } from '@/lib/types'
import { Button, Chip, Eyebrow } from '@/components/ui'

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-muted">{title}</div>
      {children}
    </section>
  )
}

export default function DateLab() {
  const router = useRouter()
  const toast = useToast()
  const [input, setInput] = useState({ mood: 'relaxing', occasion: 'regular', cuisine: 'coffee', activity: 'pottery', tier: 'classic', location: 'Neighbourhood' })
  const [plan, setPlan] = useState<LabPlan | null>(null)
  const [seed, setSeed] = useState(0)
  const [day, setDay] = useState(upcomingDays()[3])
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof input) => (v: string) => setInput({ ...input, [k]: v })

  const generate = async (s = 0) => {
    setBusy(true)
    try {
      const [{ plan }] = await Promise.all([api<{ plan: LabPlan }>('/date-lab/generate', { body: { ...input, seed: s } }), new Promise((r) => setTimeout(r, 700))])
      setPlan(plan)
      setSeed(s)
    } catch (e) {
      toast(errorMessage(e), 'warn')
    } finally {
      setBusy(false)
    }
  }

  const book = async () => {
    if (!plan?.bookable.venueId) return toast('This plan has no bookable venue. Try another idea.', 'warn')
    setBusy(true)
    try {
      const { booking } = await api<{ booking: Booking }>('/bookings', { body: { kind: 'lab', venueId: plan.bookable.venueId, day, time: plan.bookable.time, title: plan.title, items: plan.steps.map((s) => s.label), price: plan.price } })
      toast('Date booked ✨', 'success')
      router.push(`/app/bookings/${booking.id}?new=1`)
    } catch (e) {
      toast(errorMessage(e), 'warn')
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="relative overflow-hidden rounded-[30px] bg-plum p-7 text-white">
          <div className="absolute -right-14 -top-10 h-48 w-48 rounded-full bg-ember/40 blur-3xl" />
          <div className="relative flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-peach"><Wand2 size={14} /> Date Lab</div>
          <h1 className="relative mt-2 font-display text-[32px] leading-[1.08]">Create a date worth remembering.</h1>
          <p className="relative mt-2 text-sm text-white/70">Tell us the feeling. We&apos;ll design the evening from real venues.</p>
        </div>
        <div className="mt-6 space-y-6">
          <Group title="Mood">
            <div className="flex flex-wrap gap-2">{MOODS.map((m) => <Chip key={m.id} tone="plum" active={input.mood === m.id} onClick={() => set('mood')(m.id)}>{m.emoji} {m.label}</Chip>)}</div>
          </Group>
          <Group title="Occasion"><div className="flex flex-wrap gap-2">{OCCASIONS.map((o) => <Chip key={o.id} tone="plum" active={input.occasion === o.id} onClick={() => set('occasion')(o.id)}>{o.emoji} {o.label}</Chip>)}</div></Group>
          <Group title="Food & drink"><div className="flex flex-wrap gap-2">{CUISINES.map((o) => <Chip key={o.id} tone="plum" active={input.cuisine === o.id} onClick={() => set('cuisine')(o.id)}>{o.emoji} {o.label}</Chip>)}</div></Group>
          <Group title="Activity"><div className="flex flex-wrap gap-2">{ACTIVITIES.map((o) => <Chip key={o.id} tone="plum" active={input.activity === o.id} onClick={() => set('activity')(o.id)}>{o.emoji} {o.label}</Chip>)}</div></Group>
          <Group title="Experience tier">
            <div className="grid grid-cols-2 gap-2">
              {TIERS.map((t) => (
                <button key={t.id} onClick={() => set('tier')(t.id)} className={`rounded-2xl border p-3 text-left transition cursor-pointer ${input.tier === t.id ? 'border-plum bg-plum-soft' : 'border-line bg-white'}`}>
                  <div className="text-[14px] font-semibold">{t.label}</div><div className="text-[11px] text-muted">{t.hint} for two</div>
                </button>
              ))}
            </div>
          </Group>
          <Group title="Where">
            <div className="flex rounded-full bg-sand p-1 text-[13px] font-semibold">
              {['Nearby', 'Neighbourhood', 'City'].map((l) => (
                <button key={l} onClick={() => set('location')(l)} className={`flex flex-1 items-center justify-center gap-1 rounded-full py-2 cursor-pointer ${input.location === l ? 'bg-white text-plum shadow-card' : 'text-muted'}`}><MapPin size={12} /> {l}</button>
              ))}
            </div>
          </Group>
          <Button full size="lg" variant="plum" onClick={() => generate(0)} disabled={busy} icon={busy ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}>{busy && !plan ? 'Designing your evening…' : 'Create my date'}</Button>
        </div>
      </div>

      <div className="min-w-0 lg:sticky lg:top-10 lg:self-start">
        {plan ? (
          <div key={plan.tagline + seed} className="animate-scale-in overflow-hidden rounded-[32px] bg-white shadow-lift">
            <div className="relative overflow-hidden bg-gradient-to-br from-plum to-plum-dark p-6 text-white">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-ember/40 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-peach">Your date</div>
                <button onClick={() => generate(seed + 1)} disabled={busy} aria-label="Another idea" className="grid h-9 w-9 place-items-center rounded-full bg-white/15 cursor-pointer"><Shuffle size={15} /></button>
              </div>
              <h2 className="relative mt-1 font-display text-[28px] leading-tight">{plan.title}</h2>
              <div className="relative mt-5 flex items-center justify-center gap-2">
                {plan.steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-3xl">{s.emoji}</span>
                      <span className="mt-1.5 max-w-[84px] text-center text-[11px] leading-tight text-white/80">{s.label}</span>
                    </div>
                    {i < plan.steps.length - 1 && <span className="mb-5 text-xl text-peach">+</span>}
                  </div>
                ))}
              </div>
              <p className="relative mt-5 text-center font-display text-[18px] italic text-white/90">“{plan.tagline}”</p>
            </div>
            <div className="p-6">
              <Eyebrow>Itinerary</Eyebrow>
              <div className="relative mt-3 space-y-4 pl-6">
                <div className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-plum-soft" />
                {plan.steps.map((s) => (
                  <div key={s.label} className="relative">
                    <span className="absolute -left-6 top-1 h-4 w-4 rounded-full border-4 border-white bg-plum shadow" />
                    <div className="text-[11px] font-bold text-plum">{s.time}</div>
                    <div className="font-semibold">{s.emoji} {s.label}</div>
                    <div className="text-xs text-muted">{s.venue}</div>
                  </div>
                ))}
              </div>
              <Eyebrow className="mt-6">Pick a day</Eyebrow>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">{upcomingDays().map((d) => <Chip key={d} tone="plum" active={day === d} onClick={() => setDay(d)}>{d}</Chip>)}</div>
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-sand/70 p-3 text-[13px]">
                <span className="text-muted">Estimated for two</span><span className="font-semibold">{inr(plan.price)}</span>
              </div>
              {plan.overBudget && plan.tierMax != null && (
                <p className="mt-2 text-[12px] text-ink-soft">This one is a little over {inr(plan.tierMax)}. For something lighter, try chai, momos or board games.</p>
              )}
              <Button full size="lg" variant="plum" className="mt-4" disabled={busy} onClick={book}>Book this date</Button>
            </div>
          </div>
        ) : (
          <div className="grid h-full min-h-[300px] place-items-center rounded-[32px] border border-dashed border-plum/30 p-10 text-center">
            <div>
              <div className="text-4xl">☕ 🎨 🍰</div>
              <p className="mt-4 text-ink-soft">Pick a mood and we&apos;ll put together a full evening from verified venues near you.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
