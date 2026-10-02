import { Router } from 'express'
import { z } from 'zod'
import { Booking, Couple, Media, User } from '../models/index.js'
import { badRequest, forbidden, me, notFound, requireAuth } from '../lib/http.js'

/**
 * Photos. Profile photos are the core of "know the person before seeing the person":
 * they are only served to their owner and to people who have a confirmed date or a couple
 * with them. Memory photos are only served to the two partners.
 */
export const media = Router()
media.use(requireAuth)

const TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_PROFILE_PHOTOS = 6

media.post('/', async (req, res) => {
  const kind = z.enum(['profile', 'memory']).parse(req.query.kind)
  const contentType = String(req.headers['content-type'] ?? '').split(';')[0] as (typeof TYPES)[number]
  if (!TYPES.includes(contentType)) throw badRequest('Upload a JPEG, PNG or WebP image')
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw badRequest('Empty upload')
  const user = me(req)

  let couple
  if (kind === 'memory') {
    couple = await Couple.findOne({ members: user._id, status: 'verified' })
    if (!couple) throw badRequest('Memory photos are shared with your partner. Link your partner first.')
  } else if (user.photos.length >= MAX_PROFILE_PHOTOS) {
    throw badRequest(`You can add up to ${MAX_PROFILE_PHOTOS} photos`)
  }

  const m = await Media.create({ owner: user._id, kind, couple: couple?._id, contentType, data: req.body, size: req.body.length })
  const url = `/api/media/${m._id}`
  if (kind === 'profile') await User.updateOne({ _id: user._id }, { $push: { photos: url } })
  res.status(201).json({ url })
})

media.get('/:id', async (req, res) => {
  const viewer = me(req)
  const m = await Media.findById(req.params.id).select('+data')
  if (!m) throw notFound()
  const own = String(m.owner) === String(viewer._id)
  let allowed = own
  if (!allowed && m.kind === 'memory') {
    allowed = !!(await Couple.exists({ _id: m.couple, members: viewer._id }))
  }
  if (!allowed && m.kind === 'profile') {
    allowed =
      !!(await Couple.exists({ members: { $all: [viewer._id, m.owner] } })) ||
      !!(await Booking.exists({ kind: 'date', users: { $all: [viewer._id, m.owner] }, status: { $in: ['confirmed', 'arrived', 'completed'] } }))
  }
  // Same response as a missing file so locked photos can't be probed.
  if (!allowed) throw notFound()
  res.setHeader('Content-Type', m.contentType)
  res.setHeader('Cache-Control', 'private, max-age=3600')
  res.send(m.data)
})

media.delete('/:id', async (req, res) => {
  const user = me(req)
  const m = await Media.findById(req.params.id)
  if (!m) throw notFound()
  if (String(m.owner) !== String(user._id)) throw forbidden()
  await m.deleteOne()
  await User.updateOne({ _id: user._id }, { $pull: { photos: `/api/media/${m._id}` } })
  res.json({ ok: true })
})
