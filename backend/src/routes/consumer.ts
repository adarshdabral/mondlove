import { Router } from 'express'
import { z } from 'zod'
import type { Types } from 'mongoose'
import { Block, Booking, Couple, Experience, Memory, Proposal, Report, User, Venue, type UserDoc } from '../models/index.js'
import { badRequest, conflict, me, notFound, requireAuth } from '../lib/http.js'
import { COMPAT_DISCLAIMER } from '../lib/compat.js'
import { idEq, personDto, proposalDto, selfDto, venueDto } from '../lib/dto.js'
import {
  acceptProposal, bookDirect, cancelBooking, confirmProposal, createProposal, customizeProposal, declineProposal,
  listProposals, nextReportCode, submitFeedback,
} from '../services/booking.js'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const consumer = Router()
consumer.use(requireAuth)

const Treat = z.object({ name: z.string().min(1).max(60), emoji: z.string().max(16), note: z.string().max(120).optional() })
const mini = (u: any) => ({ id: u.handle, name: u.name, avatar: u.avatar, verified: u.verification?.status === 'verified' })

async function blockedIds(user: UserDoc) {
  const blocks = await Block.find({ $or: [{ blocker: user._id }, { blocked: user._id }] }).lean()
  return blocks.map((b) => (idEq(b.blocker, user._id) ? b.blocked : b.blocker))
}

/** People whose photos you can see: confirmed dates and your partner. */
async function revealedIds(user: UserDoc) {
  const [bookings, couple] = await Promise.all([
    Booking.find({ users: user._id, kind: 'date', status: { $in: ['confirmed', 'arrived', 'completed'] } }).select('users').lean(),
    Couple.findOne({ members: user._id, status: 'verified' }).lean(),
  ])
  return new Set([...bookings.flatMap((b) => b.users.map(String)), ...(couple?.members.map(String) ?? [])])
}

async function coupledIds() {
  const couples = await Couple.find({ status: 'verified' }).select('members').lean()
  return couples.flatMap((c) => c.members)
}

async function isBlockedPair(a: Types.ObjectId, b: Types.ObjectId) {
  return !!(await Block.exists({ $or: [{ blocker: a, blocked: b }, { blocker: b, blocked: a }] }))
}

/* ---------------- Users & discovery ---------------- */

consumer.get('/users/discover', async (req, res) => {
  const viewer = me(req)
  const excluded = [viewer._id, ...(await blockedIds(viewer)), ...(await coupledIds())]
  const gender = viewer.interestedIn === 'women' ? 'woman' : viewer.interestedIn === 'men' ? 'man' : undefined
  const users = await User.find({ _id: { $nin: excluded }, role: 'user', status: 'active', onboarded: true, mode: { $ne: 'couple' }, ...(gender ? { gender } : {}) })
    .limit(60)
    .lean<UserDoc[]>()
  const revealed = await revealedIds(viewer)
  const people = users.map((u) => personDto(u, viewer, revealed.has(String(u._id)))).sort((a, b) => (b.compat ?? 0) - (a.compat ?? 0))
  res.json({ people, disclaimer: COMPAT_DISCLAIMER })
})

consumer.get('/users/:handle', async (req, res) => {
  const viewer = me(req)
  const u = await User.findOne({ handle: req.params.handle, status: 'active', role: 'user' }).lean<UserDoc>()
  if (!u || (await blockedIds(viewer)).some((id) => idEq(id, u._id))) throw notFound('Profile not found')
  const open = await Proposal.findOne({ status: { $in: ['sent', 'customized'] }, $or: [{ from: viewer._id, to: u._id }, { from: u._id, to: viewer._id }] }).select('_id').lean()
  res.json({ person: personDto(u, viewer, (await revealedIds(viewer)).has(String(u._id))), openProposalId: open ? String(open._id) : null, disclaimer: COMPAT_DISCLAIMER })
})

const ProfilePatch = z
  .object({
    name: z.string().trim().min(1).max(40),
    age: z.number().int().min(18).max(100),
    area: z.string().trim().max(80),
    pronouns: z.string().max(30),
    gender: z.enum(['woman', 'man', 'nonbinary']),
    intention: z.string().max(60),
    about: z.string().max(400),
    conversation: z.string().max(80),
    prompts: z.array(z.object({ q: z.string().max(80), a: z.string().max(200) })).max(3),
    interests: z.array(z.object({ emoji: z.string(), label: z.string() })).max(15),
    traits: z.array(z.string()).max(6),
    food: z.array(z.string()).max(12),
    datePrefs: z.array(z.string()).max(10),
    lifestyle: z.array(z.object({ label: z.string(), value: z.string() })).max(8),
    interestedIn: z.enum(['women', 'men', 'everyone']),
    avatar: z.record(z.string(), z.unknown()),
    mode: z.enum(['single', 'couple', 'both']),
    favoriteVenue: z.string().max(80),
    trustedContact: z.object({ name: z.string().max(40), phone: z.string().max(20) }),
    onboarded: z.boolean(),
  })
  .partial()

consumer.patch('/users/me', async (req, res) => {
  const patch = ProfilePatch.parse(req.body)
  const user = await User.findByIdAndUpdate(me(req)._id, patch, { returnDocument: 'after' }).lean<UserDoc>()
  res.json({ user: selfDto(user!) })
})

/* ---------------- Proposals ---------------- */

const P_POP = [
  { path: 'from', select: 'handle name avatar verification' },
  { path: 'to', select: 'handle name avatar verification' },
  { path: 'lastEditedBy', select: 'handle' },
  { path: 'venue', select: 'slug name area emoji tone category address landmark mapsUrl phone photos goodToKnow policies' },
  { path: 'experience', select: 'code name' },
  { path: 'booking', select: 'ref' },
]

function proposalView(p: any, viewer: UserDoc) {
  const iSent = idEq(p.from._id, viewer._id)
  const other = iSent ? p.to : p.from
  const open = ['sent', 'customized'].includes(p.status)
  return {
    ...proposalDto(p),
    role: iSent ? 'sender' : 'receiver',
    other: mini(other),
    venue: { id: p.venue.slug, name: p.venue.name, area: p.venue.area, emoji: p.venue.emoji, tone: p.venue.tone, category: p.venue.category },
    experienceName: p.experience.name,
    // It's your move if the proposal is open and you didn't make the latest edit.
    myTurn: open && !idEq(p.lastEditedBy._id ?? p.lastEditedBy, viewer._id),
    bookingId: p.booking ? String(p.booking._id) : null,
  }
}

consumer.post('/proposals', async (req, res) => {
  const body = z.object({ to: z.string(), venueId: z.string(), packageId: z.string().optional(), day: z.string(), time: z.string(), treatForReceiver: Treat, note: z.string().max(140).optional() }).parse(req.body)
  const coupled = (await coupledIds()).map(String)
  if (coupled.includes(String(me(req)._id))) throw conflict('You’re in Couple Mode. Proposals are for meeting someone new.')
  const target = await User.findOne({ handle: body.to }).select('_id').lean()
  if (target && coupled.includes(String(target._id))) throw notFound('That person isn’t available')
  const p = await createProposal(me(req), body)
  await p.populate(P_POP)
  res.status(201).json({ proposal: proposalView(p, me(req)) })
})

consumer.get('/proposals', async (req, res) => {
  const box = z.enum(['sent', 'received', 'all']).catch('all').parse(req.query.box)
  const list = await listProposals(me(req), box)
  await Proposal.populate(list, P_POP)
  res.json({ proposals: list.map((p) => proposalView(p, me(req))) })
})

consumer.get('/proposals/:id', async (req, res) => {
  const viewer = me(req)
  const p = await Proposal.findById(req.params.id).populate(P_POP)
  if (!p || (!idEq((p.from as any)._id, viewer._id) && !idEq((p.to as any)._id, viewer._id))) throw notFound('Proposal not found')
  const [venue, exps, otherUser] = await Promise.all([
    Venue.findById((p.venue as any)._id).lean(),
    Experience.find({ venue: (p.venue as any)._id, active: true }).lean(),
    User.findById(idEq((p.from as any)._id, viewer._id) ? (p.to as any)._id : (p.from as any)._id).lean<UserDoc>(),
  ])
  res.json({
    proposal: proposalView(p, viewer),
    venue: venueDto(venue, exps),
    person: personDto(otherUser!, viewer, (await revealedIds(viewer)).has(String(otherUser!._id))),
    history: p.history.map((h: any) => ({ action: h.action, changes: h.changes, at: h.at, byMe: idEq(h.by, viewer._id) })),
  })
})

const proposalAction = (fn: (id: string, user: UserDoc, body: any) => Promise<any>) => async (req: any, res: any) => {
  const result = await fn(req.params.id, me(req), req.body ?? {})
  const doc = result.proposal ?? result
  await doc.populate(P_POP)
  res.json({ proposal: proposalView(doc, me(req)), booking: result.booking ? { id: String(result.booking._id), ref: result.booking.ref } : undefined })
}

consumer.post('/proposals/:id/accept', proposalAction((id, u, b) => acceptProposal(id, u, z.object({ treatForSender: Treat.optional() }).parse(b).treatForSender)))
consumer.post(
  '/proposals/:id/customize',
  proposalAction((id, u, b) => customizeProposal(id, u, z.object({ venueId: z.string().optional(), packageId: z.string().optional(), day: z.string().optional(), time: z.string().optional(), treatForSender: Treat.optional(), treatForReceiver: Treat.optional() }).parse(b))),
)
consumer.post('/proposals/:id/confirm', proposalAction((id, u) => confirmProposal(id, u)))
consumer.post('/proposals/:id/decline', proposalAction((id, u) => declineProposal(id, u)))

/* ---------------- Bookings ---------------- */

const B_POP = [
  { path: 'venue', select: 'slug name area emoji tone category address landmark mapsUrl phone photos goodToKnow policies' },
  { path: 'experience', select: 'code name includes duration' },
  { path: 'users', select: 'handle name avatar verification' },
  { path: 'bookedBy', select: 'handle name avatar' },
]

/**
 * A surprise is secret from everyone except the person who planned it: the partner only
 * sees the day, the time, the hint and who it's from.
 */
function bookingView(b: any, viewer: UserDoc) {
  const planner = idEq(b.bookedBy._id, viewer._id)
  const others = b.users.filter((u: any) => !idEq(u._id, viewer._id)).map(mini)
  const myFeedback = b.feedback.find((f: any) => idEq(f.user, viewer._id))
  const base = { id: String(b._id), ref: b.ref, kind: b.kind, day: b.day, time: b.time, startsAt: b.startsAt, status: b.status, with: others, iPlanned: planner, myFeedback: myFeedback ? { rating: myFeedback.rating, continue: myFeedback.continue } : null }
  if (b.kind === 'surprise' && !planner && ['confirmed', 'pending'].includes(b.status)) {
    return { ...base, secret: true, title: `A surprise from ${b.bookedBy.name}`, hint: b.secret?.hint ?? 'Just show up.', from: mini(b.bookedBy) }
  }
  return {
    ...base,
    secret: false,
    title: b.title,
    venue: {
      id: b.venue.slug, name: b.venue.name, area: b.venue.area, emoji: b.venue.emoji, tone: b.venue.tone, category: b.venue.category,
      // Booked guests get the practical details, including the venue's phone number.
      address: b.venue.address ?? '', landmark: b.venue.landmark ?? '', mapsUrl: b.venue.mapsUrl ?? '', phone: b.venue.phone ?? '',
      cover: b.venue.photos?.[0]?.url ?? null, goodToKnow: b.venue.goodToKnow ?? {}, policies: b.venue.policies ?? {},
    },
    experience: { id: b.experience.code, name: b.experience.name, includes: b.experience.includes, duration: b.experience.duration },
    items: b.items,
    treats: b.treats,
    gift: b.gift?.id ? b.gift : null,
    hint: b.secret?.hint,
    message: b.secret?.message,
    // Price is only ever shown to the person who paid.
    price: planner ? b.price : null,
    proposalId: b.proposal ? String(b.proposal) : null,
  }
}

consumer.get('/bookings', async (req, res) => {
  const list = await Booking.find({ users: me(req)._id }).sort({ startsAt: 1 }).populate(B_POP)
  res.json({ bookings: list.map((b) => bookingView(b, me(req))) })
})

consumer.get('/bookings/:id', async (req, res) => {
  const b = await Booking.findById(req.params.id).populate(B_POP)
  if (!b || !b.users.some((u: any) => idEq(u._id, me(req)._id))) throw notFound('Booking not found')
  res.json({ booking: bookingView(b, me(req)) })
})

consumer.post('/bookings', async (req, res) => {
  const body = z
    .object({
      kind: z.enum(['lab', 'surprise', 'marketplace']),
      venueId: z.string(),
      packageId: z.string().optional(),
      day: z.string(),
      time: z.string(),
      title: z.string().max(80).optional(),
      items: z.array(z.string().max(60)).max(10).optional(),
      price: z.number().int().min(0).max(500000).optional(),
      gift: z.object({ id: z.string(), label: z.string(), price: z.number().int().min(0).max(50000) }).optional(),
      hint: z.string().max(80).optional(),
      message: z.string().max(280).optional(),
    })
    .parse(req.body)
  const b = await bookDirect(me(req), body)
  await b.populate(B_POP)
  res.status(201).json({ booking: bookingView(b, me(req)) })
})

consumer.post('/bookings/:id/cancel', async (req, res) => {
  const b = await cancelBooking(me(req), req.params.id)
  res.json({ booking: { id: String(b._id), ref: b.ref, status: b.status } })
})

consumer.post('/bookings/:id/feedback', async (req, res) => {
  const body = z.object({ rating: z.number().int().min(1).max(5), tags: z.array(z.string().max(40)).max(8).optional(), continue: z.enum(['yes', 'unsure', 'no']) }).parse(req.body)
  res.json(await submitFeedback(me(req), req.params.id, body))
})

/* ---------------- Couples ---------------- */

consumer.get('/couples/me', async (req, res) => {
  const user = me(req)
  const [couple, invites] = await Promise.all([
    Couple.findOne({ members: user._id, status: 'verified' }).populate<{ members: UserDoc[] }>('members').lean(),
    Couple.find({ members: user._id, status: 'pending' }).populate<{ members: UserDoc[] }>('members').lean(),
  ])
  res.json({
    couple: couple
      ? { id: String(couple._id), since: couple.since, source: couple.source, partner: personDto(couple.members.find((m) => !idEq(m._id, user._id))!, undefined, true) }
      : null,
    invites: invites.map((c) => ({
      id: String(c._id),
      incoming: !idEq(c.invitedBy, user._id),
      person: mini(c.members.find((m) => !idEq(m._id, user._id))!),
    })),
  })
})

consumer.post('/couples/invite', async (req, res) => {
  const { email } = z.object({ email: z.string().trim().email() }).parse(req.body)
  const user = me(req)
  const partner = await User.findOne({ email: email.toLowerCase(), role: 'user', status: 'active' })
  // Don't reveal whether an email is registered; production sends an invite email either way.
  if (!partner || idEq(partner._id, user._id) || (await isBlockedPair(user._id, partner._id))) return res.status(202).json({ status: 'invited' })
  if (await Couple.exists({ members: { $in: [user._id, partner._id] }, status: 'verified' })) throw conflict('One of you is already linked with a partner')
  if (!(await Couple.exists({ members: { $all: [user._id, partner._id] }, status: 'pending' }))) {
    await Couple.create({ members: [user._id, partner._id], status: 'pending', source: 'invite', invitedBy: user._id })
  }
  res.status(202).json({ status: 'invited' })
})

consumer.post('/couples/:id/accept', async (req, res) => {
  const user = me(req)
  const c = await Couple.findOne({ _id: req.params.id, members: user._id, status: 'pending' })
  if (!c || idEq(c.invitedBy, user._id)) throw notFound('Invite not found')
  if (await Couple.exists({ members: { $in: c.members }, status: 'verified' })) throw conflict('One of you is already linked with a partner')
  c.status = 'verified'
  c.since = new Date()
  await c.save()
  await User.updateMany({ _id: { $in: c.members } }, { mode: 'couple' })
  await Couple.deleteMany({ members: { $in: c.members }, status: 'pending' })
  res.json({ coupleId: String(c._id) })
})

consumer.post('/couples/:id/decline', async (req, res) => {
  await Couple.deleteOne({ _id: req.params.id, members: me(req)._id, status: 'pending' })
  res.json({ ok: true })
})

consumer.post('/couples/leave', async (req, res) => {
  const c = await Couple.findOne({ members: me(req)._id, status: 'verified' })
  if (!c) throw notFound('You aren’t linked with a partner')
  await c.deleteOne()
  await User.updateMany({ _id: { $in: c.members } }, { mode: 'single' })
  res.json({ ok: true })
})

/* ---------------- Memories ---------------- */

const memoryDto = (m: any) => ({ id: String(m._id), title: m.title, venue: m.venueName, emoji: m.emoji, tone: m.tone, date: m.date, occasion: m.occasion, note: m.note, photos: m.photos, rating: m.rating, bookingId: m.booking ? String(m.booking) : null })

consumer.get('/memories', async (req, res) => {
  const couple = await Couple.findOne({ members: me(req)._id, status: 'verified' })
  if (!couple) return res.json({ memories: [] })
  const memories = await Memory.find({ couple: couple._id }).sort({ date: -1 }).lean()
  res.json({ memories: memories.map(memoryDto) })
})

consumer.post('/memories', async (req, res) => {
  const body = z
    .object({
      title: z.string().trim().min(1).max(80),
      venue: z.string().max(80).optional(),
      emoji: z.string().max(16).optional(),
      occasion: z.string().max(40).optional(),
      note: z.string().max(1000).optional(),
      date: z.coerce.date().optional(),
      rating: z.number().int().min(1).max(5).optional(),
      // Only photos uploaded through /api/media are accepted.
      photos: z.array(z.string().regex(/^\/api\/media\/[a-f0-9]{24}$/)).max(10).optional(),
      tone: z.array(z.string()).length(2).optional(),
    })
    .parse(req.body)
  const couple = await Couple.findOne({ members: me(req)._id, status: 'verified' })
  if (!couple) throw badRequest('Memories are shared between partners. Link your partner first.')
  const m = await Memory.create({ couple: couple._id, createdBy: me(req)._id, title: body.title, venueName: body.venue, emoji: body.emoji, occasion: body.occasion, note: body.note, date: body.date, rating: body.rating, photos: body.photos ?? [], tone: body.tone })
  res.status(201).json({ memory: memoryDto(m.toObject()) })
})

consumer.delete('/memories/:id', async (req, res) => {
  const couple = await Couple.findOne({ members: me(req)._id, status: 'verified' })
  const r = await Memory.deleteOne({ _id: req.params.id, couple: couple?._id })
  if (!r.deletedCount) throw notFound('Memory not found')
  res.json({ ok: true })
})

/* ---------------- Safety ---------------- */

consumer.post('/reports', async (req, res) => {
  const body = z.object({ against: z.string(), type: z.string().min(1).max(80), details: z.string().max(1000).optional() }).parse(req.body)
  const target = await User.findOne({ handle: body.against }).lean()
  if (!target) throw notFound('Profile not found')
  const severe = /unsafe|harass|threat|fake/i.test(body.type)
  const r = await Report.create({ code: await nextReportCode(), reporter: me(req)._id, targetType: 'user', target: target._id, targetLabel: target.handle, type: body.type, details: body.details, severity: severe ? 'High' : 'Medium' })
  res.status(201).json({ report: { id: r.code, status: r.status } })
})

consumer.get('/blocks', async (req, res) => {
  const blocks = await Block.find({ blocker: me(req)._id }).populate('blocked', 'handle name avatar').lean()
  res.json({ blocked: blocks.map((b) => mini(b.blocked)) })
})

consumer.post('/blocks', async (req, res) => {
  const { handle } = z.object({ handle: z.string() }).parse(req.body)
  const target = await User.findOne({ handle }).lean()
  if (!target) throw notFound('Profile not found')
  if (idEq(target._id, me(req)._id)) throw badRequest('You can’t block yourself')
  await Block.updateOne({ blocker: me(req)._id, blocked: target._id }, { $setOnInsert: { blocker: me(req)._id, blocked: target._id } }, { upsert: true })
  // Blocking quietly cancels any open proposals between the two people.
  await Proposal.updateMany({ status: { $in: ['sent', 'customized'] }, $or: [{ from: me(req)._id, to: target._id }, { from: target._id, to: me(req)._id }] }, { status: 'cancelled' })
  res.status(201).json({ blocked: handle })
})

consumer.delete('/blocks/:handle', async (req, res) => {
  const target = await User.findOne({ handle: req.params.handle }).select('_id').lean()
  if (target) await Block.deleteOne({ blocker: me(req)._id, blocked: target._id })
  res.json({ ok: true })
})
