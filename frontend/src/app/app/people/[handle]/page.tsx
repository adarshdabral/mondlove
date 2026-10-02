'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, Info, Lock, MapPin, MoreHorizontal } from 'lucide-react'
import { useApi, useSession } from '@/lib/session'
import { COMPAT_LABELS } from '@/lib/constants'
import type { CompatKey, Person } from '@/lib/types'
import { Avatar } from '@/components/Avatar'
import { Bar, Card, CompatRing, Eyebrow, Pill } from '@/components/ui'
import { ErrorState, PageLoader, SafetySheet, VerifiedBadge } from '@/components/shared'

const COLORS = ['bg-ember', 'bg-plum', 'bg-gold', 'bg-sage', 'bg-sky', 'bg-ember-dark']

export default function PersonPage() {
  const { handle } = useParams<{ handle: string }>()
  const { user } = useSession()
  const { data, error, loading, reload } = useApi<{ person: Person; openProposalId: string | null; disclaimer: string }>(`/users/${handle}`)
  const [safety, setSafety] = useState(false)
  if (loading) return <PageLoader />
  if (error || !data) return <ErrorState message={error ?? 'Profile not found'} onRetry={reload} />
  const p = data.person
  const keys = Object.keys(p.breakdown ?? {}) as CompatKey[]
  const sharedInterests = p.interests.filter((i) => user!.interests.some((x) => x.label === i.label))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/app/discover" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ChevronLeft size={16} /> Discover</Link>
        <button onClick={() => setSafety(true)} aria-label="Safety options" className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-card cursor-pointer"><MoreHorizontal size={18} /></button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-[32px] px-6 pb-8 pt-8 text-center" style={{ background: `linear-gradient(180deg, ${p.avatar.bg[0]}, ${p.avatar.bg[1]}55 70%, transparent)` }}>
            <div className="mx-auto w-fit"><Avatar config={p.avatar} size={150} shape="squircle" ring /></div>
            <div className="mt-5 flex items-center justify-center gap-2">
              <h1 className="font-display text-[36px] leading-none">{p.name}, {p.age}</h1>
              {p.verified && <VerifiedBadge size={22} />}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-sm text-ink-soft"><MapPin size={14} /> {p.area}{p.pronouns && ` · ${p.pronouns}`}</div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {p.intention && <Pill tone="plum">{p.intention}</Pill>}
              {p.photosLocked ? <Pill><Lock size={11} /> Photos after your first date</Pill> : <Pill tone="sage">Photos unlocked</Pill>}
            </div>
          </div>

          {!p.photosLocked && p.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.photos.map((src) => <img key={src} src={src} alt={`${p.name}`} className="aspect-square w-full rounded-2xl object-cover" />)}
            </div>
          )}

          <div className="sticky bottom-24 z-10 md:static">
            {data.openProposalId ? (
              <Link href={`/app/proposals/${data.openProposalId}`} className="flex h-13 w-full items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-white">View your open proposal</Link>
            ) : user!.mode === 'couple' ? null : (
              <Link href={`/app/propose/${p.id}`} className="flex h-13 w-full items-center justify-center rounded-full bg-ember text-[15px] font-semibold text-white shadow-lift hover:bg-ember-dark">💌 Propose a date to {p.name}</Link>
            )}
          </div>

          {p.about && (
            <Card className="p-5"><Eyebrow>About</Eyebrow><p className="mt-2 text-[15px] leading-relaxed">{p.about}</p></Card>
          )}
          {p.prompts.map((q) => (
            <Card key={q.q} className="p-5">
              <div className="text-[13px] font-semibold text-ember-dark">{q.q}</div>
              <p className="mt-1.5 font-display text-[19px] leading-snug">{q.a}</p>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {p.compat != null && (
            <Card className="p-6">
              <div className="flex items-center gap-5">
                <CompatRing value={p.compat} size={96} stroke={8} />
                <div>
                  <Eyebrow>Mingleo compatibility</Eyebrow>
                  <p className="mt-1 font-display text-xl leading-snug">{p.sharedLine}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {keys.map((k, i) => (
                  <div key={k} className="rounded-2xl bg-sand/60 p-3">
                    <div className="flex items-baseline justify-between text-[13px]"><span className="font-semibold">{COMPAT_LABELS[k].label}</span><span className="font-display text-lg">{p.breakdown![k]}%</span></div>
                    <Bar value={p.breakdown![k]} color={COLORS[i]} className="mt-2" />
                    <div className="mt-1.5 text-[11px] text-muted">{COMPAT_LABELS[k].blurb}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 flex gap-2 text-[11px] text-muted"><Info size={13} className="mt-0.5 shrink-0" />{data.disclaimer}</p>
            </Card>
          )}

          <Card className="p-5">
            <Eyebrow>Interests</Eyebrow>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.interests.map((i) => (
                <span key={i.label} className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${sharedInterests.some((s) => s.label === i.label) ? 'bg-ember-soft text-ember-dark' : 'bg-sand'}`}>{i.emoji} {i.label}</span>
              ))}
            </div>
            {p.traits.length > 0 && (<><Eyebrow className="mt-5">Personality</Eyebrow><div className="mt-3 flex flex-wrap gap-1.5">{p.traits.map((t) => <span key={t} className="rounded-full bg-plum-soft px-3 py-1.5 text-[13px] font-medium text-plum">{t}</span>)}</div></>)}
            {p.food.length > 0 && (<><Eyebrow className="mt-5">Food</Eyebrow><div className="mt-3 flex flex-wrap gap-1.5">{p.food.map((t) => <span key={t} className="rounded-full bg-gold-soft px-3 py-1.5 text-[13px] font-medium text-[#9a6d17]">{t}</span>)}</div></>)}
          </Card>

          <Card className="p-5">
            <Eyebrow>Lifestyle & dates</Eyebrow>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {p.lifestyle.map((l) => <div key={l.label} className="rounded-2xl bg-sand/70 p-3"><div className="text-[11px] text-muted">{l.label}</div><div className="text-[13px] font-semibold">{l.value}</div></div>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">{p.datePrefs.map((d) => <span key={d} className="rounded-full border border-line px-3 py-1.5 text-[13px]">{d}</span>)}</div>
            {p.conversation && <div className="mt-4 rounded-2xl bg-sky-soft p-3 text-[13px] text-sky">💬 <b>Conversation style:</b> {p.conversation}</div>}
          </Card>
          <button onClick={() => setSafety(true)} className="mx-auto block py-2 text-xs font-semibold text-muted cursor-pointer">Report or block {p.name}</button>
        </div>
      </div>
      <SafetySheet open={safety} onClose={() => setSafety(false)} person={p} trusted={user!.trustedContact} />
    </div>
  )
}
