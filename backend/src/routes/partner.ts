import { Router } from 'express'
import { z } from 'zod'
import type { Types } from 'mongoose'
import { Booking, Experience, Media, Revenue, Venue } from '../models/index.js'
import { badRequest, conflict, forbidden, me, notFound, requireAuth, requireRole } from '../lib/http.js'
import { MIN_MENU, MIN_PHOTOS, VENUE_OPTIONS, VenueListing, missingForSubmit } from '../lib/venueInfo.js'
import { experienceDto } from '../lib/dto.js'
import { partnerUpdateBooking } from '../services/booking.js'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Business dashboards for cafés, restaurants and activity providers. */
export const partner = Router()
partner.use(requireAuth, requireRole('partner', 'admin'))

async function myVenue(req: any) {
  const user = me(req)
  const slug = typeof req.query.venue === 'string' ? req.query.venue : undefined
  // Owners with several venues get their first one unless they ask for a specific slug.
  const v = await Venue.findOne(user.role === 'admin' && slug ? { slug } : { owner: user._id, ...(slug ? { slug } : {}) }).sort({ createdAt: 1 })
  if (!v) throw notFound('No venue linked to this account')
  return v
}

const day = 864e5

/* ---------------- Listing (registration wizard) ---------------- */

async function listingDto(v: any) {
  const packages = await Experience.find({ venue: v._id }).lean()
  return {
    venue: {
      id: v.slug, status: v.status, kind: v.kind, name: v.name, category: v.category, area: v.area,
      description: v.description ?? '', address: v.address ?? '', landmark: v.landmark ?? '', mapsUrl: v.mapsUrl ?? '', phone: v.phone ?? '',
      priceForTwo: v.priceForTwo ?? null, ambience: v.ambience ?? [], hours: v.hours?.days?.length ? v.hours : null, slots: v.slots ?? [],
      photos: v.photos ?? [], treats: v.treats ?? [], goodToKnow: v.goodToKnow ?? {}, policies: v.policies ?? {}, licence: v.licence ?? {},
      submittedAt: v.submittedAt ?? null,
    },
    packages: packages.map(experienceDto),
    missing: missingForSubmit(v, packages.filter((p) => p.active).length),
    options: VENUE_OPTIONS,
    limits: { minPhotos: MIN_PHOTOS, minMenu: MIN_MENU, maxPhotos: 12, maxMenu: 16 },
  }
}

partner.get('/venue', async (req, res) => {
  res.json(await listingDto(await myVenue(req)))
})

/** Saves any part of the listing. Photo URLs must be this owner's own uploads. */
partner.patch('/venue', async (req, res) => {
  const venue = await myVenue(req)
  if (venue.status === 'suspended') throw forbidden('This venue is suspended. Contact partners@mingleo.app.')
  const body = VenueListing.parse(req.body)
  if (body.name && venue.status === 'verified' && body.name !== venue.name) throw conflict('Contact partners@mingleo.app to rename a verified venue')

  const urls = [...(body.photos ?? []).map((p) => p.url), ...(body.treats ?? []).flatMap((t) => (t.photo ? [t.photo] : []))]
  if (urls.length) {
    const ids = [...new Set(urls.map((u) => u.split('/').pop()))]
    const owned = await Media.countDocuments({ _id: { $in: ids }, owner: me(req)._id, kind: { $in: ['venue', 'menu'] } })
    if (owned !== ids.length) throw badRequest('Some photos could not be found. Upload them again.')
  }

  Object.assign(venue, body)
  if (body.goodToKnow) venue.markModified('goodToKnow')
  await venue.save()
  res.json(await listingDto(venue))
})

/** Draft → pending. An admin then reviews the listing and approves it. */
partner.post('/venue/submit', async (req, res) => {
  const venue = await myVenue(req)
  if (venue.status !== 'draft') throw conflict(venue.status === 'pending' ? 'Your listing is already with our team' : 'This listing is already live')
  const dto = await listingDto(venue)
  if (dto.missing.length) return res.status(422).json({ error: 'Your listing is not complete yet', code: 'incomplete', missing: dto.missing })
  venue.status = 'pending'
  venue.submittedAt = new Date()
  await venue.save()
  res.json(await listingDto(venue))
})
const firstName = (n: string) => n.split(' ')[0]

partner.get('/dashboard', async (req, res) => {
  const venue = await myVenue(req)
  const now = Date.now()
  const since = new Date(now - 30 * day)
  const [bookings, experiences, ledger] = await Promise.all([
    Booking.find({ venue: venue._id }).sort({ startsAt: -1 }).limit(400).populate<{ users: { _id: unknown; name: string }[] }>('users', 'name').populate<{ experience: any }>('experience', 'name code').lean(),
    Experience.find({ venue: venue._id }).lean(),
    Revenue.find({ venue: venue._id, at: { $gte: since } }).lean(),
  ])
  const live = bookings.filter((b) => b.status !== 'cancelled')
  const recent = live.filter((b) => b.startsAt && b.startsAt >= since && b.startsAt.getTime() <= now)
  const gross = recent.reduce((s, b) => s + b.price, 0)
  const commission = ledger.filter((r) => r.stream !== 'gifts_addons').reduce((s, r) => s + r.amount, 0)
  const giftShare = Math.round(recent.reduce((s, b) => s + (b.gift?.price ?? 0), 0) * 0.8)

  // Daily revenue series for the last 30 days.
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now - (29 - i) * day)
    const key = d.toDateString()
    return { label: `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`, value: recent.filter((b) => b.startsAt!.toDateString() === key).reduce((s, b) => s + b.price, 0) }
  })

  const treatCounts = new Map<string, number>()
  for (const b of recent) for (const t of [b.treats?.forReceiver, b.treats?.forSender]) if (t?.name) treatCounts.set(`${t.emoji} ${t.name}`, (treatCounts.get(`${t.emoji} ${t.name}`) ?? 0) + 1)
  const treatTotal = [...treatCounts.values()].reduce((a, b) => a + b, 0) || 1
  const weekday = [1, 2, 3, 4, 5, 6, 0].map((d) => recent.filter((b) => b.startsAt!.getDay() === d).length)
  const sources = ['date', 'lab', 'surprise', 'marketplace'].map((k) => ({ kind: k, count: recent.filter((b) => b.kind === k).length }))

  // Reviews come from guests' private post-date feedback: rating + tags, first names only.
  const rated = bookings.filter((b) => b.feedback?.length).flatMap((b) => b.feedback.map((f: any) => ({ f, b })))
  const ratingAvg = rated.length ? Math.round((rated.reduce((s, x) => s + (x.f.rating ?? 0), 0) / rated.length) * 10) / 10 : null
  const tagCounts = new Map<string, number>()
  for (const { f } of rated) for (const t of f.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)

  res.json({
    reviews: {
      average: ratingAvg,
      count: rated.length,
      tags: [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, n]) => ({ tag, pct: Math.round((n / rated.length) * 100) })),
      recent: rated
        .sort((a, b) => new Date(b.f.at ?? b.b.startsAt).getTime() - new Date(a.f.at ?? a.b.startsAt).getTime())
        .slice(0, 8)
        .map(({ f, b }) => ({ rating: f.rating, tags: f.tags ?? [], experience: (b.experience as any)?.name, when: f.at ?? b.startsAt, guest: firstName(b.users.find((u: any) => String(u._id) === String(f.user))?.name ?? 'Guest') })),
    },
    venue: { id: venue.slug, status: venue.status, kind: venue.kind, name: venue.name, area: venue.area, category: venue.category, plan: venue.plan, featured: venue.featured, rating: venue.rating, reviews: venue.reviews, commissionRate: venue.commissionRate, availability: venue.availability, slots: venue.slots },
    kpis: {
      bookings30d: recent.length,
      gross30d: gross,
      upcoming7d: live.filter((b) => b.startsAt && b.startsAt.getTime() > now && b.startsAt.getTime() < now + 7 * day).length,
      rating: venue.rating,
    },
    payout: { gross, commission, giftShare, net: gross - commission + giftShare },
    series,
    weekday,
    sources,
    topTreats: [...treatCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, n]) => ({ name, pct: Math.round((n / treatTotal) * 100) })),
    bookings: bookings
      .filter((b) => b.startsAt && b.startsAt.getTime() > now - 2 * 3600e3)
      .sort((a, b) => a.startsAt!.getTime() - b.startsAt!.getTime())
      .slice(0, 100)
      .map((b) => ({
        id: String(b._id),
        ref: b.ref,
        // Privacy: partners see first names only.
        guests: b.users.map((u) => firstName(u.name)).join(' & '),
        when: `${b.day} · ${b.time}`,
        experience: b.experience?.name,
        exchange: b.treats?.forReceiver && b.treats?.forSender ? `${b.treats.forReceiver.emoji} ${b.treats.forReceiver.name} ↔ ${b.treats.forSender.emoji} ${b.treats.forSender.name}` : b.kind === 'lab' ? 'Date Lab' : b.kind === 'surprise' ? `Surprise${b.gift?.label ? ` · ${b.gift.label}` : ''}` : 'Marketplace',
        amount: b.price,
        status: b.kind === 'surprise' && b.status === 'confirmed' ? 'Surprise' : b.status[0].toUpperCase() + b.status.slice(1),
      })),
    packages: experiences.map((e) => ({ ...experienceDto(e), sold: live.filter((b) => String((b.experience as any)?._id ?? b.experience) === String(e._id)).length })),
  })
})

const ExperienceBody = z.object({
  name: z.string().trim().min(3).max(60),
  includes: z.array(z.string().trim().min(1).max(60)).min(1).max(8),
  price: z.number().int().min(100).max(200000),
  days: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])).min(1),
  capacity: z.number().int().min(1).max(50),
  duration: z.string().max(20).optional(),
  emoji: z.string().max(8).optional(),
})

partner.post('/experiences', async (req, res) => {
  const venue = await myVenue(req)
  const body = ExperienceBody.parse(req.body)
  const code = `${venue.slug.slice(0, 6)}-${body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)}-${Math.random().toString(36).slice(2, 5)}`
  const e = await Experience.create({ ...body, code, venue: venue._id, duration: body.duration ?? '90 min' })
  res.status(201).json({ package: { ...experienceDto(e), sold: 0 } })
})

partner.patch('/experiences/:code', async (req, res) => {
  const venue = await myVenue(req)
  const e = await Experience.findOne({ code: req.params.code })
  if (!e) throw notFound('Package not found')
  if (String(e.venue) !== String(venue._id)) throw forbidden()
  Object.assign(e, ExperienceBody.partial().extend({ active: z.boolean().optional() }).parse(req.body))
  await e.save()
  res.json({ package: experienceDto(e) })
})

partner.put('/availability', async (req, res) => {
  const venue = await myVenue(req)
  const grid = z.record(z.string().regex(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)-\d{1,2}:\d{2} (AM|PM)$/), z.number().int().min(0).max(50)).parse(req.body)
  venue.availability = grid
  venue.markModified('availability')
  await venue.save()
  res.json({ availability: venue.availability })
})

partner.patch('/bookings/:id', async (req, res) => {
  const { status } = z.object({ status: z.enum(['confirmed', 'arrived']) }).parse(req.body)
  const b = await partnerUpdateBooking(me(req), req.params.id, status)
  res.json({ booking: { id: String(b._id as Types.ObjectId), status: b.status } })
})
