import { Router } from 'express'
import { z } from 'zod'
import { Booking, Couple, Media, User, Venue } from '../models/index.js'
import { badRequest, forbidden, me, notFound, optionalAuth, requireAuth } from '../lib/http.js'

/**
 * Photos.
 * - profile: the core of "know the person before seeing the person". Served only to the owner and to
 *   people with a confirmed date or a couple with them.
 * - memory: only the two partners.
 * - venue / menu: uploaded by a venue owner for their listing. Public once the venue is verified;
 *   while it's a draft or pending, only the owner and admins can see them.
 */
export const media = Router()

const TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_PROFILE_PHOTOS = 6

media.get('/:id', optionalAuth, async (req, res) => {
  const viewer = req.user
  const m = await Media.findById(req.params.id).select('+data')
  if (!m) throw notFound()
  let allowed = !!viewer && String(m.owner) === String(viewer._id)
  if (!allowed && (m.kind === 'venue' || m.kind === 'menu')) {
    allowed = viewer?.role === 'admin' || !!(await Venue.exists({ _id: m.venue, status: 'verified' }))
  }
  if (!allowed && viewer && m.kind === 'memory') {
    allowed = !!(await Couple.exists({ _id: m.couple, members: viewer._id }))
  }
  if (!allowed && viewer && m.kind === 'profile') {
    allowed =
      !!(await Couple.exists({ members: { $all: [viewer._id, m.owner] } })) ||
      !!(await Booking.exists({ kind: 'date', users: { $all: [viewer._id, m.owner] }, status: { $in: ['confirmed', 'arrived', 'completed'] } }))
  }
  // Same response as a missing file so locked photos can't be probed.
  if (!allowed) throw notFound()
  res.setHeader('Content-Type', m.contentType)
  res.setHeader('Cache-Control', m.kind === 'venue' || m.kind === 'menu' ? 'public, max-age=86400' : 'private, max-age=3600')
  res.send(m.data)
})

media.use(requireAuth)

media.post('/', async (req, res) => {
  const kind = z.enum(['profile', 'memory', 'venue', 'menu']).parse(req.query.kind)
  const contentType = String(req.headers['content-type'] ?? '').split(';')[0] as (typeof TYPES)[number]
  if (!TYPES.includes(contentType)) throw badRequest('Upload a JPEG, PNG or WebP image')
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw badRequest('Empty upload')
  const user = me(req)

  let couple
  let venue
  if (kind === 'memory') {
    couple = await Couple.findOne({ members: user._id, status: 'verified' })
    if (!couple) throw badRequest('Memory photos are shared with your partner. Link your partner first.')
  } else if (kind === 'venue' || kind === 'menu') {
    if (user.role !== 'partner') throw forbidden('Only venue partners can upload listing photos')
    venue = await Venue.findOne({ owner: user._id }).sort({ createdAt: 1 })
    if (!venue) throw badRequest('Create your venue first')
  } else if (user.photos.length >= MAX_PROFILE_PHOTOS) {
    throw badRequest(`You can add up to ${MAX_PROFILE_PHOTOS} photos`)
  }

  const m = await Media.create({ owner: user._id, kind, couple: couple?._id, venue: venue?._id, contentType, data: req.body, size: req.body.length })
  const url = `/api/media/${m._id}`
  if (kind === 'profile') await User.updateOne({ _id: user._id }, { $push: { photos: url } })
  res.status(201).json({ url })
})

media.delete('/:id', async (req, res) => {
  const user = me(req)
  const m = await Media.findById(req.params.id)
  if (!m) throw notFound()
  if (String(m.owner) !== String(user._id)) throw forbidden()
  await m.deleteOne()
  const url = `/api/media/${m._id}`
  if (m.kind === 'profile') await User.updateOne({ _id: user._id }, { $pull: { photos: url } })
  if (m.venue) {
    await Venue.updateOne({ _id: m.venue }, { $pull: { photos: { url } } })
    await Venue.updateOne({ _id: m.venue }, { $unset: { 'treats.$[t].photo': '' } }, { arrayFilters: [{ 't.photo': url }] })
  }
  res.json({ ok: true })
})
