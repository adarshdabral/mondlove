import type { Types } from 'mongoose'
import { config } from '../config.js'
import { Block, Booking, Couple, Experience, Memory, Payment, Proposal, Report, Revenue, User, Venue, type UserDoc } from '../models/index.js'
import { HttpError, badRequest, bookingRef, conflict, forbidden, notFound, parseSlot } from '../lib/http.js'
import { idEq } from '../lib/dto.js'
import { releaseSlot, reserveSlot, resolveExperience } from './experience.js'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Booking service: the proposal state machine, bookings, payments and the revenue ledger.
 *
 *   sent ──accept──────────────► confirmed ──► Booking + Payment + Revenue
 *     │                            ▲
 *     ├─customize─► customized ────┘ confirm (by the other person)
 *     │                 │  ▲
 *     │                 └──┘ customize again (counter-proposal)
 *     └─decline (from sent or customized) ─► declined   ("Not this time", no block)
 */

type Treat = { name: string; emoji: string; note?: string }

const POPULATE = [
  { path: 'from', select: 'handle name' },
  { path: 'to', select: 'handle name' },
  { path: 'lastEditedBy', select: 'handle' },
  { path: 'venue', select: 'slug name area emoji' },
  { path: 'experience', select: 'code name' },
  { path: 'booking', select: 'ref' },
]

export async function isBlocked(a: Types.ObjectId, b: Types.ObjectId) {
  return !!(await Block.exists({ $or: [{ blocker: a, blocked: b }, { blocker: b, blocked: a }] }))
}

async function nextReportCode(prefix = 'R') {
  return `${prefix}-${String((await Report.countDocuments()) + 2001)}`
}

/* ---------------- Proposals ---------------- */

export interface ProposalInput {
  to: string
  venueId: string
  packageId?: string
  day: string
  time: string
  treatForReceiver: Treat
  note?: string
}

export async function createProposal(sender: UserDoc, input: ProposalInput) {
  const receiver = await User.findOne({ handle: input.to })
  if (!receiver || receiver.status !== 'active') throw notFound('That person isn’t available')
  if (idEq(receiver._id, sender._id)) throw badRequest('You can’t propose a date to yourself')
  if (await isBlocked(sender._id, receiver._id)) throw notFound('That person isn’t available')

  // Abuse protection: a burst of proposals is rate-limited and flagged for Trust & Safety.
  const recent = await Proposal.countDocuments({ from: sender._id, createdAt: { $gt: new Date(Date.now() - 3600e3) } })
  if (recent >= config.proposalsPerHour) {
    await Report.create({
      code: await nextReportCode('A'),
      targetType: 'user',
      target: sender._id,
      targetLabel: sender.handle,
      type: `Automated: ${recent + 1} proposals in 1 hour`,
      severity: 'High',
      automated: true,
    })
    throw new HttpError(429, 'You’ve sent a lot of proposals. Take a breather and try again later.', 'rate_limited')
  }

  const open = await Proposal.exists({ from: sender._id, to: receiver._id, status: { $in: ['sent', 'customized'] } })
  if (open) throw conflict('You already have an open proposal with this person')

  const { venue, exp } = await resolveExperience(input.venueId, input.packageId)
  if (!venue.treats.some((t: any) => t.name === input.treatForReceiver.name)) throw badRequest('Pick a treat from this venue’s menu')
  const startsAt = parseSlot(input.day, input.time)

  const p = await Proposal.create({
    from: sender._id,
    to: receiver._id,
    venue: venue._id,
    experience: exp._id,
    day: input.day,
    time: input.time,
    startsAt,
    treatForReceiver: input.treatForReceiver,
    note: input.note,
    lastEditedBy: sender._id,
    history: [{ by: sender._id, action: 'sent', changes: [] }],
  })
  return p.populate(POPULATE)
}

export async function listProposals(user: UserDoc, box: 'sent' | 'received' | 'all' = 'all') {
  const q = box === 'sent' ? { from: user._id } : box === 'received' ? { to: user._id } : { $or: [{ from: user._id }, { to: user._id }] }
  return Proposal.find(q).sort({ updatedAt: -1 }).limit(50).populate(POPULATE)
}

async function loadParticipantProposal(id: string, user: UserDoc) {
  const p = await Proposal.findById(id)
  if (!p) throw notFound('Proposal not found')
  if (!idEq(p.from, user._id) && !idEq(p.to, user._id)) throw notFound('Proposal not found')
  return p
}

/** Whose turn is it? The person who did NOT make the latest edit. */
const isTheirTurn = (p: any, user: UserDoc) => !idEq(p.lastEditedBy, user._id)

export async function acceptProposal(id: string, user: UserDoc, treatForSender?: Treat) {
  const p = await loadParticipantProposal(id, user)
  if (p.status !== 'sent' || !idEq(p.to, user._id)) throw conflict('This proposal can’t be accepted right now')
  if (!treatForSender && !p.treatForSender) throw badRequest('Pick something for them to try')
  if (treatForSender) p.treatForSender = treatForSender as any
  return finalize(p, user, 'accepted')
}

export async function confirmProposal(id: string, user: UserDoc) {
  const p = await loadParticipantProposal(id, user)
  if (p.status !== 'customized' || !isTheirTurn(p, user)) throw conflict('Nothing to confirm on this proposal')
  return finalize(p, user, 'confirmed')
}

async function finalize(p: any, user: UserDoc, action: string) {
  const [v, e] = await Promise.all([Venue.findById(p.venue).lean(), Experience.findById(p.experience).lean()])
  if (!v || !e) throw notFound('Venue or experience no longer exists')
  const { venue, exp } = await resolveExperience(v.slug, e.code)
  await reserveSlot(exp, venue, p.startsAt, p.time)
  // Claim the transition atomically so a double-tap can't create two bookings.
  const claimed = await Proposal.findOneAndUpdate(
    { _id: p._id, status: p.status },
    { $set: { status: 'confirmed', treatForSender: p.treatForSender }, $push: { history: { by: user._id, action, changes: [] } } },
    { returnDocument: 'after' },
  )
  if (!claimed) {
    await releaseSlot(exp._id, p.startsAt, p.time)
    throw conflict('This proposal was already updated')
  }
  const booking = await createBooking({
    kind: 'date',
    venue,
    exp,
    users: [p.from, p.to],
    bookedBy: p.from, // the proposer pays by default; the invite never shows a price
    proposal: p._id,
    title: exp.name,
    day: p.day,
    time: p.time,
    startsAt: p.startsAt,
    items: exp.includes,
    treats: { forReceiver: p.treatForReceiver, forSender: p.treatForSender },
    slotReserved: true,
  })
  claimed.booking = booking._id
  await claimed.save()
  return { proposal: await claimed.populate(POPULATE), booking }
}

export interface CustomizeInput {
  venueId?: string
  packageId?: string
  day?: string
  time?: string
  treatForSender?: Treat
  treatForReceiver?: Treat
}

export async function customizeProposal(id: string, user: UserDoc, input: CustomizeInput) {
  const p = await loadParticipantProposal(id, user)
  const canCounter = (p.status === 'sent' && idEq(p.to, user._id)) || (p.status === 'customized' && isTheirTurn(p, user))
  if (!canCounter) throw conflict('It’s not your turn to change this proposal')

  const changes: string[] = []
  const currentVenue = await Venue.findById(p.venue)
  if (input.venueId && input.venueId !== currentVenue?.slug) {
    const { venue, exp } = await resolveExperience(input.venueId, input.packageId)
    changes.push(`Venue: ${currentVenue?.name} → ${venue.name}`)
    p.venue = venue._id
    p.experience = exp._id
    // Treats are venue-specific; keep the sender's pick only if it exists at the new venue.
    if (p.treatForReceiver && !venue.treats.some((t: any) => t.name === p.treatForReceiver!.name)) p.treatForReceiver = venue.treats[0] as any
  } else if (input.packageId) {
    const { exp } = await resolveExperience(currentVenue!.slug, input.packageId)
    if (!idEq(exp._id, p.experience)) changes.push(`Experience: ${exp.name}`)
    p.experience = exp._id
  }
  if (input.day && input.day !== p.day) changes.push(`Day: ${p.day} → ${input.day}`)
  if (input.time && input.time !== p.time) changes.push(`Time: ${p.time} → ${input.time}`)
  p.day = input.day ?? p.day
  p.time = input.time ?? p.time
  p.startsAt = parseSlot(p.day, p.time)
  if (input.treatForSender) {
    p.treatForSender = input.treatForSender as any
    changes.push(`Picked ${input.treatForSender.emoji} ${input.treatForSender.name}`)
  }
  if (input.treatForReceiver && idEq(p.from, user._id)) p.treatForReceiver = input.treatForReceiver as any
  if (!changes.length) throw badRequest('Change at least one thing before sending it back')

  p.status = 'customized'
  p.lastEditedBy = user._id
  p.history.push({ by: user._id, action: 'customized', changes } as any)
  await p.save()
  return p.populate(POPULATE)
}

export async function declineProposal(id: string, user: UserDoc) {
  const p = await loadParticipantProposal(id, user)
  if (!['sent', 'customized'].includes(p.status) || !isTheirTurn(p, user)) throw conflict('This proposal can’t be declined now')
  p.status = 'declined'
  p.history.push({ by: user._id, action: 'declined', changes: [] } as any)
  await p.save()
  // "Not this time" — deliberately no block and no reason shared.
  return p.populate(POPULATE)
}

/* ---------------- Bookings, payments, revenue ---------------- */

interface CreateBookingArgs {
  kind: 'date' | 'lab' | 'surprise' | 'marketplace'
  venue: any
  exp: any
  users: Types.ObjectId[]
  bookedBy: Types.ObjectId
  proposal?: Types.ObjectId
  title: string
  day: string
  time: string
  startsAt: Date
  items: string[]
  price?: number
  treats?: { forReceiver?: Treat; forSender?: Treat }
  gift?: { id: string; label: string; price: number }
  secret?: { hint?: string; message?: string }
  slotReserved?: boolean
}

async function createBooking(a: CreateBookingArgs) {
  if (!a.slotReserved) await reserveSlot(a.exp, a.venue, a.startsAt, a.time)
  const price = a.price ?? a.exp.price
  const booking = await Booking.create({
    ref: bookingRef(),
    kind: a.kind,
    venue: a.venue._id,
    experience: a.exp._id,
    users: a.users,
    bookedBy: a.bookedBy,
    proposal: a.proposal,
    title: a.title,
    day: a.day,
    time: a.time,
    startsAt: a.startsAt,
    items: a.items,
    treats: a.treats,
    price,
    gift: a.gift,
    secret: a.secret,
    status: 'confirmed',
  })
  const giftPrice = a.gift?.price ?? 0
  const payment = await Payment.create({ booking: booking._id, payer: a.bookedBy, amount: price + giftPrice, providerRef: `mock_${booking.ref}`, status: 'authorized' })

  const rate = a.venue.commissionRate ?? config.defaultCommission
  const ledger: any[] = [
    { stream: a.kind === 'date' || a.kind === 'marketplace' ? 'booking_commission' : 'experience_commission', amount: Math.round(price * rate), gross: price, rate, booking: booking._id, payment: payment._id, venue: a.venue._id },
  ]
  if (giftPrice) ledger.push({ stream: 'gifts_addons', amount: Math.round(giftPrice * config.giftCommission), gross: giftPrice, rate: config.giftCommission, booking: booking._id, payment: payment._id, venue: a.venue._id })
  await Revenue.insertMany(ledger)
  return booking
}

export interface DirectBookingInput {
  kind: 'lab' | 'surprise' | 'marketplace'
  venueId: string
  packageId?: string
  day: string
  time: string
  title?: string
  items?: string[]
  price?: number
  gift?: { id: string; label: string; price: number }
  hint?: string
  message?: string
}

export async function bookDirect(user: UserDoc, input: DirectBookingInput) {
  const { venue, exp } = await resolveExperience(input.venueId, input.packageId)
  const couple = await Couple.findOne({ members: user._id, status: 'verified' })
  const users = couple ? (couple.members as Types.ObjectId[]) : [user._id]
  if (input.kind === 'surprise' && !couple) throw badRequest('Surprises are for couples. Link your partner first.')
  return createBooking({
    kind: input.kind,
    venue,
    exp,
    users,
    bookedBy: user._id,
    title: input.title ?? exp.name,
    day: input.day,
    time: input.time,
    startsAt: parseSlot(input.day, input.time),
    items: input.items ?? exp.includes,
    // Curated bundles can price above a single package, but never below it.
    price: Math.max(exp.price, input.price ?? exp.price),
    gift: input.gift?.price ? input.gift : undefined,
    secret: input.kind === 'surprise' ? { hint: input.hint, message: input.message } : undefined,
  })
}

const BOOKING_POPULATE = [
  { path: 'venue', select: 'slug name area emoji owner' },
  { path: 'experience', select: 'code name' },
  { path: 'users', select: 'handle name' },
]

export async function listBookings(user: UserDoc) {
  return Booking.find({ users: user._id }).sort({ startsAt: 1 }).populate(BOOKING_POPULATE)
}

async function loadBookingFor(user: UserDoc, id: string) {
  const b = await Booking.findById(id)
  if (!b || !b.users.some((u) => idEq(u, user._id))) throw notFound('Booking not found')
  return b
}

export async function getBooking(user: UserDoc, id: string) {
  await loadBookingFor(user, id)
  return Booking.findById(id).populate(BOOKING_POPULATE)
}

export async function cancelBooking(user: UserDoc, id: string) {
  const b = await loadBookingFor(user, id)
  if (!['pending', 'confirmed'].includes(b.status)) throw conflict('This booking can’t be cancelled')
  b.status = 'cancelled'
  await b.save()
  await releaseSlot(b.experience as Types.ObjectId, b.startsAt!, b.time!)
  await Payment.updateMany({ booking: b._id }, { status: 'refunded' })
  // Reverse the ledger with negative entries; history is never rewritten.
  const entries = await Revenue.find({ booking: b._id, amount: { $gt: 0 } }).lean()
  await Revenue.insertMany(entries.map((e) => ({ stream: e.stream, amount: -e.amount, gross: -(e.gross ?? 0), rate: e.rate, booking: e.booking, payment: e.payment, venue: e.venue, note: 'reversal: cancelled' })))
  if (b.proposal) await Proposal.updateOne({ _id: b.proposal }, { status: 'cancelled' })
  return b
}

export async function submitFeedback(user: UserDoc, id: string, input: { rating: number; tags?: string[]; continue: 'yes' | 'unsure' | 'no' }) {
  const b = await loadBookingFor(user, id)
  if (b.status === 'cancelled') throw conflict('This date was cancelled')
  b.feedback = b.feedback.filter((f) => !idEq(f.user, user._id)) as any
  b.feedback.push({ user: user._id, rating: input.rating, tags: input.tags ?? [], continue: input.continue } as any)
  if (b.status !== 'completed') b.status = 'completed'
  await b.save()
  await Payment.updateMany({ booking: b._id, status: 'authorized' }, { status: 'captured' })

  // Mutual opt-in: only when every participant says yes does the connection continue.
  const allYes = b.kind === 'date' && b.users.length === 2 && b.users.every((u) => b.feedback.some((f) => idEq(f.user, u) && f.continue === 'yes'))
  if (!allYes) return { connected: false, waitingFor: b.users.length - b.feedback.length }

  let couple = await Couple.findOne({ members: { $all: b.users }, status: 'verified' })
  if (!couple) {
    await Couple.deleteMany({ members: { $in: b.users }, status: 'pending' })
    couple = await Couple.create({ members: b.users, source: 'mingleo_date', status: 'verified' })
    await User.updateMany({ _id: { $in: b.users } }, { mode: 'couple' })
    const venue = await Venue.findById(b.venue).lean()
    await Memory.create({
      couple: couple._id,
      createdBy: user._id,
      booking: b._id,
      title: 'First Mingleo Date',
      venueName: venue?.name,
      emoji: venue?.emoji,
      tone: venue?.tone,
      date: b.startsAt ?? undefined,
      occasion: 'First date',
      note: b.treats?.forReceiver && b.treats?.forSender ? `${b.treats.forReceiver.name} for one, ${b.treats.forSender.name} for the other.` : 'Where it all started.',
      rating: Math.round(b.feedback.reduce((s, f) => s + (f.rating ?? 0), 0) / b.feedback.length),
    })
  }
  return { connected: true, coupleId: String(couple._id) }
}

/* ---------------- Partner actions ---------------- */

export async function partnerUpdateBooking(owner: UserDoc, id: string, status: 'confirmed' | 'arrived') {
  const b = await Booking.findById(id).populate<{ venue: any }>('venue', 'owner')
  if (!b) throw notFound('Booking not found')
  if (!idEq(b.venue.owner, owner._id) && owner.role !== 'admin') throw forbidden()
  if (status === 'arrived' && b.status !== 'confirmed') throw conflict('Only confirmed bookings can be checked in')
  if (status === 'confirmed' && b.status !== 'pending') throw conflict('Only pending bookings can be accepted')
  b.status = status
  await b.save()
  if (status === 'arrived') await Payment.updateMany({ booking: b._id, status: 'authorized' }, { status: 'captured' })
  return b
}

export { nextReportCode }
