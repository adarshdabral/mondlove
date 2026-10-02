'use client'

import { useState, type ReactNode } from 'react'
import { Accessibility, Armchair, Car, ChevronDown, Clock, CreditCard, GraduationCap, Leaf, MapPin, Navigation, ShieldCheck, Sparkles, Star, Volume2, Wine } from 'lucide-react'
import type { OpeningHours, Treat, Venue } from '../lib/types'
import { inr } from '../lib/constants'
import { VenueArt } from './ui'

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** "Every day", "Wed–Sun" or "Fri, Sat, Sun". */
export function formatDays(days: string[]) {
  const idx = days.map((d) => WEEK.indexOf(d)).filter((i) => i >= 0).sort((a, b) => a - b)
  if (idx.length === 7) return 'Every day'
  const consecutive = idx.length > 2 && idx.every((d, i) => i === 0 || d === idx[i - 1] + 1)
  return consecutive ? `${WEEK[idx[0]]}–${WEEK[idx[idx.length - 1]]}` : idx.map((i) => WEEK[i]).join(', ')
}
export const formatHours = (h: OpeningHours) => `${formatDays(h.days)} · ${h.open} – ${h.close}`

export function DietMark({ diet }: { diet?: Treat['diet'] }) {
  if (!diet) return null
  const c = diet === 'veg' ? 'border-green-600 text-green-600' : diet === 'nonveg' ? 'border-red-700 text-red-700' : 'border-amber-600 text-amber-600'
  const label = diet === 'veg' ? 'Vegetarian' : diet === 'nonveg' ? 'Non-vegetarian' : 'Contains egg'
  return (
    <span title={label} aria-label={label} className={`inline-grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[3px] border-[1.5px] ${c}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </span>
  )
}

export function VenueGallery({ venue, className = 'h-44' }: { venue: Pick<Venue, 'photos' | 'emoji' | 'tone' | 'name'>; className?: string }) {
  const photos = venue.photos ?? []
  if (!photos.length) return <VenueArt emoji={venue.emoji} tone={venue.tone} className={`${className} rounded-3xl`} size="lg" />
  return (
    <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
      {photos.map((p, i) => (
        <figure key={p.url} className={`relative shrink-0 snap-start overflow-hidden rounded-3xl bg-sand ${className} ${i === 0 ? 'w-[85%]' : 'w-[60%]'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt={p.caption || `${venue.name} photo ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
          {p.caption && <figcaption className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">{p.caption}</figcaption>}
        </figure>
      ))}
    </div>
  )
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5">
      <span className="mt-0.5 text-ink-soft">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
        <div className="text-[14px] leading-snug">{children}</div>
      </div>
    </div>
  )
}

/** The practical facts people check before saying yes to a date somewhere. */
export function KnowBeforeYouGo({ venue }: { venue: Pick<Venue, 'goodToKnow'> }) {
  const g = venue.goodToKnow ?? {}
  const join = (xs?: string[]) => (xs?.length ? xs.join(' · ') : null)
  const rows: [ReactNode, string, ReactNode][] = []
  if (join(g.food)) rows.push([<Leaf size={17} key="i" />, 'Food', join(g.food)])
  if (g.alcohol) rows.push([<Wine size={17} key="i" />, 'Alcohol', g.alcohol])
  if (join(g.seating)) rows.push([<Armchair size={17} key="i" />, 'Seating', join(g.seating)])
  if (g.vibe) rows.push([<Volume2 size={17} key="i" />, 'Vibe', g.vibe])
  if (join(g.payment)) rows.push([<CreditCard size={17} key="i" />, 'Payment', join(g.payment)])
  if (g.parking) rows.push([<Car size={17} key="i" />, 'Parking', g.parking])
  if (join(g.accessibility)) rows.push([<Accessibility size={17} key="i" />, 'Accessibility', join(g.accessibility)])
  if (join(g.amenities)) rows.push([<Sparkles size={17} key="i" />, 'Also here', join(g.amenities)])
  if (join(g.safety)) rows.push([<ShieldCheck size={17} key="i" />, 'Safety', join(g.safety)])
  if (!rows.length && !g.studentDiscount) return null
  return (
    <div>
      {g.studentDiscount ? (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1 text-[12px] font-semibold text-sage">
          <GraduationCap size={14} /> {g.studentDiscount}% off with a student ID
        </div>
      ) : null}
      <div className="grid gap-x-6 divide-y divide-line/70 sm:grid-cols-2 sm:divide-y-0">
        {rows.map(([icon, label, value]) => <Fact key={label} icon={icon} label={label}>{value}</Fact>)}
      </div>
    </div>
  )
}

export function MenuList({ items, showPrices }: { items: Treat[]; showPrices: boolean }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((t) => (
        <div key={t.name} className="flex items-center gap-3 rounded-2xl border border-line/70 bg-white p-2.5">
          {t.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.photo} alt={t.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
          ) : (
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-sand text-2xl">{t.emoji}</span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[14px] font-semibold"><DietMark diet={t.diet} /> <span className="truncate">{t.name}</span></div>
            {t.note && <div className="truncate text-[12px] text-muted">{t.note}</div>}
          </div>
          {showPrices && t.price ? <span className="shrink-0 text-[13px] font-semibold">{inr(t.price)}</span> : null}
        </div>
      ))}
    </div>
  )
}

/**
 * Everything someone needs to know about a venue before booking a date there.
 * `showPrices` is off for invitees: prices are only shown to the person booking.
 */
export function VenueDetails({ venue, showPrices = true, gallery = true }: { venue: Venue; showPrices?: boolean; gallery?: boolean }) {
  const mapLink = venue.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(`${venue.name} ${venue.address || venue.area} Dehradun`)}`
  return (
    <div className="space-y-5">
      {gallery && <VenueGallery venue={venue} />}
      <div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold text-muted">
          <span>{venue.category}</span>·<span>{venue.area}</span>
          {venue.rating > 0 && <>·<span className="inline-flex items-center gap-0.5"><Star size={12} className="fill-gold text-gold" /> {venue.rating} ({venue.reviews})</span></>}
          {showPrices && venue.priceForTwo ? <>·<span>About {inr(venue.priceForTwo)} for two</span></> : null}
        </div>
        <h3 className="mt-1 font-display text-[26px] leading-tight">{venue.name}</h3>
        {venue.description && <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{venue.description}</p>}
        {venue.ambience.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{venue.ambience.map((a) => <span key={a} className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold text-ink-soft">{a}</span>)}</div>}
      </div>

      <div className="grid gap-2 rounded-2xl bg-sand/60 p-4 text-[13px] sm:grid-cols-2">
        {(venue.address || venue.landmark) && (
          <div className="flex gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-ink-soft" />
            <div>
              {venue.address && <div>{venue.address}</div>}
              {venue.landmark && <div className="text-muted">{venue.landmark}</div>}
              <a href={mapLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-ember"><Navigation size={13} /> Open in Maps</a>
            </div>
          </div>
        )}
        {venue.hours && (
          <div className="flex gap-2">
            <Clock size={16} className="mt-0.5 shrink-0 text-ink-soft" />
            <div>
              <div>{formatHours(venue.hours)}</div>
              <div className="text-muted">Date slots: {venue.slots.join(', ')}</div>
            </div>
          </div>
        )}
      </div>

      {Object.keys(venue.goodToKnow ?? {}).length > 0 && (
        <section>
          <h4 className="mb-1 font-display text-lg">Know before you go</h4>
          <KnowBeforeYouGo venue={venue} />
        </section>
      )}

      {venue.treats.length > 0 && (
        <section>
          <h4 className="mb-2 font-display text-lg">{venue.kind === 'activity' ? 'What you can do' : 'On the menu'}</h4>
          <MenuList items={venue.treats} showPrices={showPrices} />
        </section>
      )}

      {(venue.policies?.cancellation || venue.policies?.lateArrival || venue.policies?.houseRules) && (
        <section className="rounded-2xl border border-line p-4 text-[13px]">
          <h4 className="mb-2 font-semibold">Policies</h4>
          <ul className="space-y-1 text-ink-soft">
            {venue.policies?.cancellation && <li>Cancellation: {venue.policies.cancellation}</li>}
            {venue.policies?.lateArrival && <li>Running late: {venue.policies.lateArrival}</li>}
            {venue.policies?.houseRules && <li>{venue.policies.houseRules}</li>}
          </ul>
        </section>
      )}
    </div>
  )
}

/** Collapsible version for places where the venue is one decision among several. */
export function VenueDetailsToggle({ venue, showPrices }: { venue: Venue; showPrices: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-3xl border border-line bg-white">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer">
        <span>
          <span className="block text-[14px] font-semibold">Know before you go: {venue.name}</span>
          <span className="block text-[12px] text-muted">Photos, menu, timings, food options, parking, policies</span>
        </span>
        <ChevronDown size={18} className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-line p-4"><VenueDetails venue={venue} showPrices={showPrices} /></div>}
    </div>
  )
}
