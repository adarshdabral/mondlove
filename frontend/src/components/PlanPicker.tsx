'use client'

import { useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import type { Venue } from '../lib/types'
import { inr, upcomingDays } from '../lib/constants'
import { Chip, Pill, SectionTitle } from './ui'
import { VenueTile } from './shared'
import { VenueDetailsToggle } from './VenueDetails'

export interface Plan {
  venueId: string
  packageId: string
  day: string
  time: string
}

/** Venue, experience, day and time picker shared by the proposal builder and "customize". */
export function PlanPicker({ venues, value, onChange, favourite, showPrice = true, tone = 'ember' }: { venues: Venue[]; value: Plan; onChange: (p: Plan) => void; favourite?: { id: string; label: string }; showPrice?: boolean; tone?: 'ember' | 'plum' }) {
  const [kind, setKind] = useState<'all' | Venue['kind']>('all')
  const days = useMemo(() => upcomingDays(12), [])
  const list = useMemo(() => {
    const l = venues.filter((v) => v.packages.length && (kind === 'all' || v.kind === kind))
    return favourite ? [...l].sort((a, b) => (a.id === favourite.id ? -1 : b.id === favourite.id ? 1 : 0)) : l
  }, [venues, kind, favourite])
  const venue = venues.find((v) => v.id === value.venueId)

  const pickVenue = (v: Venue) => onChange({ venueId: v.id, packageId: v.packages[0].id, day: value.day, time: v.slots.includes(value.time) ? value.time : v.slots[0] })

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>Where</SectionTitle>
        <div className="mb-3 flex flex-wrap gap-2">
          {(['all', 'cafe', 'restaurant', 'activity'] as const).map((k) => (
            <Chip key={k} size="sm" tone="ink" active={kind === k} onClick={() => setKind(k)}>{k === 'all' ? 'All' : k === 'cafe' ? 'Cafés' : k === 'restaurant' ? 'Restaurants' : 'Activities'}</Chip>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((v) => (
            <VenueTile key={v.id} v={v} selected={value.venueId === v.id} onClick={() => pickVenue(v)} badge={favourite?.id === v.id ? favourite.label : undefined} />
          ))}
        </div>
        {venue && <div className="mt-3 flex flex-wrap gap-1.5">{venue.ambience.map((a) => <Pill key={a}>{a}</Pill>)}</div>}
        {venue && <div className="mt-3"><VenueDetailsToggle key={venue.id} venue={venue} showPrices={showPrice} /></div>}
      </section>

      {venue && (
        <section>
          <SectionTitle>The experience</SectionTitle>
          <div className="grid gap-2 md:grid-cols-2">
            {venue.packages.map((p) => {
              const on = value.packageId === p.id
              return (
                <button key={p.id} type="button" onClick={() => onChange({ ...value, packageId: p.id })} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition cursor-pointer ${on ? (tone === 'ember' ? 'border-ember bg-ember-soft/60' : 'border-plum bg-plum-soft/60') : 'border-line bg-white'}`}>
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? (tone === 'ember' ? 'border-ember bg-ember' : 'border-plum bg-plum') : 'border-line'}`}>{on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>
                  <span className="flex-1">
                    <span className="block font-semibold">{p.name}</span>
                    <span className="block text-[12px] text-ink-soft">{p.includes.join(' · ')}</span>
                    {showPrice && <span className="mt-1 block text-[11px] text-muted">{p.duration} · {inr(p.price)} for two · only you see this</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>When</SectionTitle>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:px-0">
          {days.map((d) => <Chip key={d} tone={tone === 'plum' ? 'plum' : 'ember'} active={value.day === d} onClick={() => onChange({ ...value, day: d })}>{d}</Chip>)}
        </div>
        {venue && (
          <div className="mt-3 flex flex-wrap gap-2">
            {venue.slots.map((s) => <Chip key={s} tone="ink" active={value.time === s} onClick={() => onChange({ ...value, time: s })}><Clock size={13} /> {s}</Chip>)}
          </div>
        )}
      </section>
    </div>
  )
}
