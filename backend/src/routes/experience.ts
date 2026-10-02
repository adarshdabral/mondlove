import { Router } from 'express'
import { z } from 'zod'
import { Experience } from '../models/index.js'
import { requireAuth } from '../lib/http.js'
import { venueDto } from '../lib/dto.js'
import { generateDate, getVenueBySlug, listVenues } from '../services/experience.js'

/** Experience service: public catalogue of venues + packages, and Date Lab. */
export const experience = Router()

experience.get('/venues', async (req, res) => {
  const q = z.object({ category: z.string().optional(), q: z.string().max(60).optional() }).parse(req.query)
  res.json({ venues: await listVenues(q) })
})

experience.get('/venues/:slug', async (req, res) => {
  const v = await getVenueBySlug(req.params.slug)
  if (v.status !== 'verified') return res.status(404).json({ error: 'Venue not found' })
  const exps = await Experience.find({ venue: v._id, active: true }).lean()
  res.json({ venue: venueDto(v.toObject(), exps) })
})

experience.post('/date-lab/generate', requireAuth, async (req, res) => {
  const body = z
    .object({
      mood: z.enum(['romantic', 'fun', 'relaxing', 'adventurous', 'surprise']),
      occasion: z.string().max(30),
      cuisine: z.string().max(30),
      activity: z.string().max(30),
      tier: z.enum(['easy', 'classic', 'special', 'unforgettable']),
      location: z.string().max(30).optional(),
      seed: z.number().int().min(0).max(1000).optional(),
    })
    .parse(req.body)
  res.json({ plan: await generateDate(body) })
})
