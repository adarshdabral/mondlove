import { Router } from 'express'
import { z } from 'zod'
import { Block, Booking, Couple, Payment, Proposal, REVENUE_STREAMS, Report, Revenue, User, Venue } from '../models/index.js'
import { notFound, requireAuth, requireRole } from '../lib/http.js'

/** Platform admin: overview, trust & safety, verification, moderation. */
export const admin = Router()
admin.use(requireAuth, requireRole('admin'))

const day = 864e5

admin.get('/overview', async (_req, res) => {
  const since = new Date(Date.now() - 30 * day)
  const [users, couples, proposals, accepted, completed, connected, bookings30, gmv, revenueByStream, openReports, verified, topVenues, weekly, resolvedReports, reports30] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Couple.countDocuments(),
    Proposal.countDocuments({ createdAt: { $gte: since } }),
    Proposal.countDocuments({ createdAt: { $gte: since }, status: { $in: ['confirmed', 'cancelled'] } }),
    // Dates that actually happened, out of the proposals in the same window.
    Proposal.countDocuments({ createdAt: { $gte: since }, status: 'confirmed', startsAt: { $lt: new Date() } }),
    Couple.countDocuments({ source: 'mingleo_date' }),
    Booking.countDocuments({ status: { $ne: 'cancelled' }, startsAt: { $gte: since } }),
    Payment.aggregate([{ $match: { status: { $ne: 'refunded' }, createdAt: { $gte: since } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Revenue.aggregate([{ $match: { at: { $gte: since } } }, { $group: { _id: '$stream', total: { $sum: '$amount' } } }]),
    Report.countDocuments({ status: { $in: ['Open', 'In review', 'Escalated'] } }),
    User.countDocuments({ role: 'user', 'verification.status': 'verified' }),
    Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' }, startsAt: { $gte: new Date(Date.now() - 7 * day) } } },
      { $group: { _id: '$venue', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'venues', localField: '_id', foreignField: '_id', as: 'v' } },
    ]),
    Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' }, startsAt: { $gte: new Date(Date.now() - 84 * day) } } },
      { $group: { _id: { $isoWeek: '$startsAt' }, gmv: { $sum: '$price' } } },
      { $sort: { _id: 1 } },
    ]),
    Report.countDocuments({ status: 'Resolved' }),
    Report.countDocuments({ automated: false, createdAt: { $gte: since } }),
  ])
  const streams = Object.fromEntries(REVENUE_STREAMS.map((s) => [s, revenueByStream.find((r) => r._id === s)?.total ?? 0]))
  res.json({
    kpis: { users, couples, bookings30d: bookings30, gmv30d: gmv[0]?.total ?? 0, revenue30d: Object.values(streams).reduce((a: number, b) => a + (b as number), 0) },
    funnel: [
      { label: 'Proposals sent', value: proposals },
      { label: 'Accepted or confirmed', value: accepted },
      { label: 'Dates that happened', value: completed },
      { label: 'Became couples', value: connected },
    ],
    streams,
    safety: { openReports, resolvedReports, verifiedPct: users ? Math.round((verified / users) * 100) : 0, incidentPct: bookings30 ? Math.round((reports30 / bookings30) * 1000) / 10 : 0 },
    topVenues: topVenues.map((t) => ({ name: t.v[0]?.name, count: t.count })),
    weekly: weekly.map((w) => ({ label: `W${w._id}`, gmv: w.gmv })),
  })
})

/* ---------------- Trust & safety ---------------- */

admin.get('/reports', async (_req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 }).limit(100).populate('reporter', 'name').lean()
  res.json({
    reports: reports.map((r) => ({ id: r.code, _id: String(r._id), type: r.type, against: r.targetLabel, by: (r.reporter as { name?: string } | null)?.name ?? 'Automated', severity: r.severity, status: r.status, automated: r.automated, createdAt: r.createdAt })),
  })
})

admin.patch('/reports/:code', async (req, res) => {
  const { status } = z.object({ status: z.enum(['Open', 'In review', 'Escalated', 'Resolved']) }).parse(req.body)
  const r = await Report.findOneAndUpdate({ code: req.params.code }, { status }, { returnDocument: 'after' })
  if (!r) throw notFound('Report not found')
  res.json({ report: { id: r.code, status: r.status } })
})

admin.get('/verifications', async (_req, res) => {
  const users = await User.find({ 'verification.status': 'pending' }).limit(50).lean()
  res.json({ queue: users.map((u) => ({ id: u.handle, name: `${u.name}, ${u.age}`, method: u.verification?.method, score: u.verification?.score, avatar: u.avatar })) })
})

admin.post('/users/:handle/verify', async (req, res) => {
  const { approve } = z.object({ approve: z.boolean() }).parse(req.body)
  const u = await User.findOneAndUpdate({ handle: req.params.handle }, { 'verification.status': approve ? 'verified' : 'rejected' }, { returnDocument: 'after' })
  if (!u) throw notFound('User not found')
  res.json({ id: u.handle, verification: u.verification })
})

admin.post('/users/:handle/suspend', async (req, res) => {
  const u = await User.findOneAndUpdate({ handle: req.params.handle }, { status: 'suspended' }, { returnDocument: 'after' })
  if (!u) throw notFound('User not found')
  await Proposal.updateMany({ from: u._id, status: { $in: ['sent', 'customized'] } }, { status: 'cancelled' })
  res.json({ id: u.handle, status: u.status })
})

admin.post('/users/:handle/reinstate', async (req, res) => {
  const u = await User.findOneAndUpdate({ handle: req.params.handle }, { status: 'active' }, { returnDocument: 'after' })
  if (!u) throw notFound('User not found')
  res.json({ id: u.handle, status: u.status })
})

admin.get('/users', async (_req, res) => {
  const users = await User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(100).lean()
  const ids = users.map((u) => u._id)
  const [dates, reports] = await Promise.all([
    Booking.aggregate([{ $match: { users: { $in: ids } } }, { $unwind: '$users' }, { $group: { _id: '$users', n: { $sum: 1 } } }]),
    Report.aggregate([{ $match: { target: { $in: ids } } }, { $group: { _id: '$target', n: { $sum: 1 } } }]),
  ])
  const count = (arr: { _id: unknown; n: number }[], id: unknown) => arr.find((x) => String(x._id) === String(id))?.n ?? 0
  res.json({ users: users.map((u) => ({ id: u.handle, name: u.name, age: u.age, area: u.area, mode: u.mode, verified: u.verification?.status === 'verified', status: u.status, dates: count(dates, u._id), reports: count(reports, u._id), avatar: u.avatar })) })
})

admin.get('/venues', async (req, res) => {
  const status = z.enum(['pending', 'verified', 'suspended']).optional().parse(req.query.status)
  const venues = await Venue.find(status ? { status } : {}).lean()
  res.json({ venues: venues.map((v) => ({ id: v.slug, name: v.name, kind: v.kind, area: v.area, documents: v.documents, status: v.status, plan: v.plan, featured: v.featured })) })
})

admin.post('/venues/:slug/verify', async (req, res) => {
  const { approve } = z.object({ approve: z.boolean() }).parse(req.body)
  const v = await Venue.findOneAndUpdate({ slug: req.params.slug }, { status: approve ? 'verified' : 'suspended' }, { returnDocument: 'after' })
  if (!v) throw notFound('Venue not found')
  res.json({ id: v.slug, status: v.status })
})

admin.get('/bookings', async (_req, res) => {
  const list = await Booking.find().sort({ createdAt: -1 }).limit(60).populate('venue', 'name').populate('users', 'name').lean()
  const ledger = await Revenue.aggregate([{ $match: { booking: { $in: list.map((b) => b._id) } } }, { $group: { _id: '$booking', total: { $sum: '$amount' } } }])
  res.json({
    bookings: list.map((b) => ({
      id: String(b._id), ref: b.ref, kind: b.kind, venue: (b.venue as { name?: string } | null)?.name, when: `${b.day} · ${b.time}`,
      guests: (b.users as unknown as { name: string }[]).map((u) => u.name).join(' & '), gmv: b.price + (b.gift?.price ?? 0), status: b.status,
      commission: ledger.find((l) => String(l._id) === String(b._id))?.total ?? 0,
    })),
  })
})

admin.get('/blocks/stats', async (_req, res) => {
  const since = new Date(Date.now() - 7 * day)
  const perDay = await Block.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dayOfWeek: '$createdAt' }, n: { $sum: 1 } } }])
  res.json({ total: perDay.reduce((s, d) => s + d.n, 0), perDay })
})
