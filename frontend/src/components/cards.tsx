'use client'

import Link from 'next/link'
import { ChevronRight, Gift } from 'lucide-react'
import type { Booking, Proposal } from '../lib/types'
import { Avatar } from './Avatar'
import { Pill, VenueArt } from './ui'

const STATUS: Record<string, { label: string; tone: 'sage' | 'gold' | 'plum' | 'sand' | 'red' | 'sky' | 'ember' }> = {
  sent: { label: 'Waiting for reply', tone: 'plum' },
  customized: { label: 'Customized', tone: 'gold' },
  confirmed: { label: 'Confirmed', tone: 'sage' },
  declined: { label: 'Not this time', tone: 'sand' },
  cancelled: { label: 'Cancelled', tone: 'sand' },
}

export function ProposalRow({ p }: { p: Proposal }) {
  const s = p.myTurn ? { label: p.role === 'receiver' && p.status === 'sent' ? 'New invitation' : 'Your turn', tone: 'ember' as const } : STATUS[p.status]
  return (
    <Link href={`/app/proposals/${p.id}`} className="flex items-center gap-4 rounded-3xl border border-line/70 bg-white p-4 shadow-card transition hover:shadow-lift">
      <div className="relative">
        <Avatar config={p.other.avatar} size={52} />
        <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white text-sm shadow">{p.venue.emoji}</span>
      </div>
      <div className="min-w-0 flex-1">
        <Pill tone={s.tone}>{s.label}</Pill>
        <div className="mt-1 truncate font-semibold">{p.venue.name}</div>
        <div className="truncate text-xs text-muted">{p.role === 'sender' ? 'To' : 'From'} {p.other.name} · {p.day} · {p.time}</div>
      </div>
      <ChevronRight size={18} className="text-muted" />
    </Link>
  )
}

const KIND: Record<Booking['kind'], string> = { date: 'Mingleo Date', lab: 'Date Lab', surprise: 'Surprise', marketplace: 'Experience' }

export function BookingCard({ b }: { b: Booking }) {
  if (b.secret) {
    return (
      <Link href={`/app/bookings/${b.id}`} className="relative block overflow-hidden rounded-3xl bg-gradient-to-br from-ember to-plum p-5 text-white shadow-lift">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80"><Gift size={14} /> Surprise</div>
        <div className="mt-2 font-display text-xl">{b.title}</div>
        <div className="mt-1 text-sm text-white/80">{b.day} · {b.time}</div>
        <div className="mt-3 rounded-2xl bg-white/15 px-3 py-2 text-sm">“{b.hint}”</div>
      </Link>
    )
  }
  const date = new Date(b.startsAt)
  return (
    <Link href={`/app/bookings/${b.id}`} className="flex items-center gap-4 overflow-hidden rounded-3xl border border-line/70 bg-white p-4 shadow-card transition hover:shadow-lift">
      <div className="w-14 shrink-0 rounded-2xl bg-sand py-2 text-center">
        <div className="text-[10px] font-bold uppercase text-ember-dark">{date.toLocaleString('en-US', { weekday: 'short' })}</div>
        <div className="font-display text-2xl leading-none">{date.getDate()}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{b.title}</div>
        <div className="truncate text-xs text-muted">{b.venue?.name} · {b.time}{b.with.length ? ` · with ${b.with.map((w) => w.name).join(', ')}` : ''}</div>
        <div className="mt-1.5 flex gap-1.5">
          <Pill tone={b.kind === 'date' ? 'ember' : b.kind === 'surprise' ? 'gold' : 'plum'}>{KIND[b.kind]}</Pill>
          {b.status !== 'confirmed' && <Pill tone={b.status === 'cancelled' ? 'red' : 'sand'}>{b.status[0].toUpperCase() + b.status.slice(1)}</Pill>}
        </div>
      </div>
      {b.venue && <VenueArt emoji={b.venue.emoji} tone={b.venue.tone} className="hidden h-14 w-14 rounded-2xl sm:grid" size="sm" />}
    </Link>
  )
}
