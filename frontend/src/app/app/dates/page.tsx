'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useApi } from '@/lib/session'
import type { Booking, Proposal } from '@/lib/types'
import { BookingCard, ProposalRow } from '@/components/cards'
import { EmptyState, PageHeader, PageLoader } from '@/components/shared'

type Tab = 'upcoming' | 'proposals' | 'past'

export default function Dates() {
  const proposals = useApi<{ proposals: Proposal[] }>('/proposals')
  const bookings = useApi<{ bookings: Booking[] }>('/bookings')
  const [tab, setTab] = useState<Tab>('upcoming')
  if (proposals.loading || bookings.loading) return <PageLoader />
  const now = Date.now()
  const all = bookings.data?.bookings ?? []
  const upcoming = all.filter((b) => new Date(b.startsAt).getTime() >= now && b.status !== 'cancelled')
  const past = all.filter((b) => new Date(b.startsAt).getTime() < now || b.status === 'cancelled').reverse()
  const props = proposals.data?.proposals ?? []
  const open = props.filter((p) => ['sent', 'customized'].includes(p.status))
  const closed = props.filter((p) => !['sent', 'customized'].includes(p.status))

  return (
    <div>
      <PageHeader eyebrow="Plans" title="Your dates" sub="Proposals, bookings and everything you've been on." />
      <div className="mb-6 flex max-w-md rounded-full bg-sand p-1 text-[13px] font-semibold">
        {([['upcoming', `Upcoming (${upcoming.length})`], ['proposals', `Proposals (${open.length})`], ['past', 'Past']] as [Tab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-full py-2 transition cursor-pointer ${tab === t ? 'bg-white shadow-card' : 'text-muted'}`}>{l}</button>
        ))}
      </div>
      <div className="stagger grid gap-3 md:grid-cols-2">
        {tab === 'upcoming' && (upcoming.length ? upcoming.map((b) => <BookingCard key={b.id} b={b} />) : <div className="md:col-span-2"><EmptyState emoji="🗓️" title="Nothing booked yet" body="When a proposal is accepted, or you book an experience, it lands here with everything you need." action={<Link href="/app/discover" className="font-semibold text-ember">Find someone</Link>} /></div>)}
        {tab === 'proposals' && (props.length ? [...open, ...closed].map((p) => <ProposalRow key={p.id} p={p} />) : <div className="md:col-span-2"><EmptyState emoji="💌" title="No proposals yet" body="Propose a real date from someone's profile. They can accept, customize, or say “not this time”." /></div>)}
        {tab === 'past' && (past.length ? past.map((b) => <BookingCard key={b.id} b={b} />) : <div className="md:col-span-2"><EmptyState emoji="✨" title="Your story starts soon" body="After each date you can rate it and save it to Memories." /></div>)}
      </div>
    </div>
  )
}
