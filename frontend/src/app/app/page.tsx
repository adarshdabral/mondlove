'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Gift, Map, Star, Wand2 } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import { useApi, useSession, useToast } from '@/lib/session'
import type { Booking, Person, Proposal, Venue } from '@/lib/types'
import { useCouple } from '@/components/AppShell'
import { Avatar } from '@/components/Avatar'
import { BookingCard, ProposalRow } from '@/components/cards'
import { Button, CompatRing, SectionTitle, VenueArt } from '@/components/ui'
import { VerifiedBadge } from '@/components/shared'

export default function Home() {
  const { user } = useSession()
  const router = useRouter()
  const toast = useToast()
  const { data: coupleData, reload: reloadCouple } = useCouple()
  const couple = coupleData?.couple
  const inCoupleMode = user!.mode === 'couple' || !!couple
  const proposals = useApi<{ proposals: Proposal[] }>('/proposals')
  const bookings = useApi<{ bookings: Booking[] }>('/bookings')
  const picks = useApi<{ people: Person[] }>(inCoupleMode ? null : '/users/discover')
  const venues = useApi<{ venues: Venue[] }>('/venues')

  const now = Date.now()
  const yourTurn = proposals.data?.proposals.filter((p) => p.myTurn) ?? []
  const waiting = proposals.data?.proposals.filter((p) => !p.myTurn && ['sent', 'customized'].includes(p.status)) ?? []
  const upcoming = bookings.data?.bookings.filter((b) => new Date(b.startsAt).getTime() > now && !['cancelled', 'completed'].includes(b.status)) ?? []
  const needsFeedback = bookings.data?.bookings.filter((b) => b.kind === 'date' && new Date(b.startsAt).getTime() < now && b.status !== 'cancelled' && !b.myFeedback) ?? []
  const incomingInvites = coupleData?.invites.filter((i) => i.incoming) ?? []
  const hour = new Date().getHours()

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        {couple ? (
          <div className="flex -space-x-3">
            <Avatar config={user!.avatar} size={52} ring />
            <Avatar config={couple.partner.avatar} size={52} ring />
          </div>
        ) : (
          <Avatar config={user!.avatar} size={52} />
        )}
        <div>
          <div className="text-sm text-muted">{hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}</div>
          <h1 className="font-display text-[30px] leading-tight md:text-[36px]">{couple ? `${user!.name} & ${couple.partner.name}` : user!.name}</h1>
        </div>
      </div>

      {incomingInvites.map((inv) => (
        <div key={inv.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-plum/30 bg-plum-soft p-5">
          <Avatar config={inv.person.avatar} size={48} />
          <div className="flex-1">
            <div className="font-semibold">{inv.person.name} wants to link with you as a couple</div>
            <div className="text-sm text-ink-soft">You&apos;ll plan dates together and share Memories. You&apos;ll both leave Discover.</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={async () => { await api(`/couples/${inv.id}/decline`, { method: 'POST' }); await reloadCouple() }}>Decline</Button>
            <Button
              size="sm"
              variant="plum"
              onClick={async () => {
                try {
                  await api(`/couples/${inv.id}/accept`, { method: 'POST' })
                  toast(`You and ${inv.person.name} are linked 💞`, 'success')
                  window.location.reload()
                } catch (e) {
                  toast(errorMessage(e), 'warn')
                }
              }}
            >
              Accept
            </Button>
          </div>
        </div>
      ))}

      {needsFeedback.map((b) => (
        <Link key={b.id} href={`/app/bookings/${b.id}?feedback=1`} className="flex items-center gap-4 rounded-3xl bg-ink p-5 text-white">
          <Star className="text-gold" />
          <div className="flex-1">
            <div className="font-semibold">How was your date with {b.with[0]?.name}?</div>
            <div className="text-sm text-white/60">Rate it, and tell us privately whether you&apos;d like to continue.</div>
          </div>
          <ArrowRight size={18} />
        </Link>
      ))}

      {yourTurn.length > 0 && (
        <section>
          <SectionTitle>Waiting on you</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">{yourTurn.map((p) => <ProposalRow key={p.id} p={p} />)}</div>
        </section>
      )}

      {inCoupleMode && (
        <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Link href="/app/date-lab" className="group relative overflow-hidden rounded-[30px] bg-plum p-7 text-white shadow-lift">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-ember/40 blur-2xl transition group-hover:scale-110" />
            <div className="relative flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-peach"><Wand2 size={14} /> Date Lab</div>
            <div className="relative mt-2 font-display text-[28px] leading-tight">Create a date worth remembering.</div>
            <div className="relative mt-5 inline-flex items-center gap-1 font-semibold">Start <ArrowRight size={16} className="transition group-hover:translate-x-1" /></div>
          </Link>
          <div className="grid gap-4">
            <Link href="/app/surprise" className="flex items-center gap-4 rounded-3xl border border-line bg-white p-5 shadow-card hover:shadow-lift">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ember-soft text-ember-dark"><Gift size={20} /></span>
              <div><div className="font-semibold">Surprise my partner</div><div className="text-xs text-muted">Plan it in secret</div></div>
            </Link>
            <Link href="/app/experiences" className="flex items-center gap-4 rounded-3xl border border-line bg-white p-5 shadow-card hover:shadow-lift">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-soft text-[#9a6d17]"><Map size={20} /></span>
              <div><div className="font-semibold">Browse experiences</div><div className="text-xs text-muted">Cafés, dinners, workshops</div></div>
            </Link>
          </div>
          {!couple && (
            <div className="rounded-3xl border border-dashed border-plum/40 bg-plum-soft/50 p-5 text-sm md:col-span-2">
              <b className="text-plum">Link your partner</b> to share plans and memories. <Link href="/app/profile#partner" className="font-semibold text-plum underline">Invite them</Link>
            </div>
          )}
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <SectionTitle action="All plans" onAction={() => router.push('/app/dates')}>Coming up</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">{upcoming.slice(0, 4).map((b) => <BookingCard key={b.id} b={b} />)}</div>
        </section>
      )}

      {!inCoupleMode && (
        <section>
          <SectionTitle action="See everyone" onAction={() => router.push('/app/discover')}>Today&apos;s thoughtful picks</SectionTitle>
          <p className="-mt-2 mb-4 text-sm text-muted">A few people chosen for you. No endless swiping.</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(picks.data?.people ?? []).slice(0, 4).map((p) => (
              <Link key={p.id} href={`/app/people/${p.id}`} className="rounded-3xl border border-line/70 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-start justify-between">
                  <Avatar config={p.avatar} size={56} shape="squircle" />
                  {p.compat != null && <CompatRing value={p.compat} size={42} stroke={4} />}
                </div>
                <div className="mt-3 flex items-center gap-1 font-semibold">{p.name}, {p.age} {p.verified && <VerifiedBadge size={14} />}</div>
                <div className="text-xs text-muted">{p.area}</div>
                <div className="mt-2 line-clamp-2 text-[12px] leading-snug text-ink-soft">{p.sharedLine}</div>
              </Link>
            ))}
          </div>
          {waiting.length > 0 && (
            <div className="mt-6">
              <SectionTitle>Waiting for a reply</SectionTitle>
              <div className="grid gap-3 md:grid-cols-2">{waiting.map((p) => <ProposalRow key={p.id} p={p} />)}</div>
            </div>
          )}
        </section>
      )}

      <section>
        <SectionTitle action="Explore" onAction={() => router.push('/app/experiences')}>Date-worthy this week</SectionTitle>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {(venues.data?.venues ?? []).slice(0, 8).map((v) => (
            <Link key={v.id} href={`/app/experiences?venue=${v.id}`} className="w-[200px] shrink-0 snap-start overflow-hidden rounded-3xl border border-line/70 bg-white shadow-card md:w-auto">
              <VenueArt emoji={v.emoji} tone={v.tone} className="h-24" />
              <div className="p-3">
                <div className="truncate text-[14px] font-semibold">{v.packages[0]?.name ?? v.name}</div>
                <div className="truncate text-[12px] text-muted">{v.name} · {v.area}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
