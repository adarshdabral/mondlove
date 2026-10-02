import type { Types } from 'mongoose'
import { Experience, Slot, Venue } from '../models/index.js'
import { conflict, isoDate, notFound } from '../lib/http.js'
import { venueDto } from '../lib/dto.js'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Experience service: venues, packages, inventory and Date Lab curation. */

export async function listVenues(filter: { category?: string; q?: string } = {}) {
  const query: Record<string, unknown> = { status: 'verified' }
  if (filter.category && filter.category !== 'all') {
    query.$or = [{ kind: filter.category }, { tags: filter.category }]
  }
  let venues = await Venue.find(query).sort({ featured: -1, rating: -1 }).lean()
  const experiences = await Experience.find({ venue: { $in: venues.map((v) => v._id) }, active: true }).lean()
  if (filter.q) {
    const q = filter.q.toLowerCase()
    venues = venues.filter((v) => {
      const pkgs = experiences.filter((e) => String(e.venue) === String(v._id)).map((e) => e.name).join(' ')
      return `${v.name} ${v.category} ${v.area} ${pkgs}`.toLowerCase().includes(q)
    })
  }
  return venues.map((v) => venueDto(v, experiences))
}

export async function getVenueBySlug(slug: string) {
  const v = await Venue.findOne({ slug })
  if (!v) throw notFound('Venue not found')
  return v
}

export async function resolveExperience(venueSlug: string, code?: string) {
  const venue = await getVenueBySlug(venueSlug)
  if (venue.status !== 'verified') throw conflict('This venue isn’t taking bookings right now')
  const exp = code ? await Experience.findOne({ code, venue: venue._id }) : await Experience.findOne({ venue: venue._id, active: true })
  if (!exp || !exp.active) throw notFound('Experience not available')
  return { venue, exp }
}

/**
 * Atomically reserves one unit of capacity for an experience at a date/time.
 * Two concurrent requests for the last table can't both succeed.
 */
export async function reserveSlot(exp: { _id: Types.ObjectId; capacity: number }, venue: any, startsAt: Date, time: string) {
  const date = isoDate(startsAt)
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][startsAt.getDay()]
  const capacity = Number(venue.availability?.[`${day}-${time}`] ?? exp.capacity)
  await Slot.updateOne({ experience: exp._id, date, time }, { $setOnInsert: { capacity, booked: 0 } }, { upsert: true })
  const res = await Slot.findOneAndUpdate(
    { experience: exp._id, date, time, $expr: { $lt: ['$booked', '$capacity'] } },
    { $inc: { booked: 1 } },
    { returnDocument: 'after' },
  )
  if (!res) throw conflict('That time is fully booked. Try another slot.')
  return res
}

export async function releaseSlot(experience: Types.ObjectId, startsAt: Date, time: string) {
  await Slot.updateOne({ experience, date: isoDate(startsAt), time, booked: { $gt: 0 } }, { $inc: { booked: -1 } })
}

/* ---------------- Date Lab ---------------- */

// Keep the keys in sync with CUISINES / ACTIVITIES in frontend/src/lib/constants.ts.
const FOOD_VENUE: Record<string, { venue: string; label: string; emoji: string }> = {
  coffee: { venue: 'pine-pour', label: 'Specialty coffee', emoji: '☕' },
  chai: { venue: 'lantern-house', label: 'Chai & Maggi', emoji: '🫖' },
  momos: { venue: 'momo-mill', label: 'Momo crawl', emoji: '🥟' },
  korean: { venue: 'seoul-steam', label: 'Ramen & boba', emoji: '🍜' },
  italian: { venue: 'olive-oak', label: 'Wood-fired pizza', emoji: '🍕' },
  pahadi: { venue: 'skyline-terrace', label: 'Pahadi dinner', emoji: '🍲' },
}
const ACTIVITY_VENUE: Record<string, { venue?: string; label: string; emoji: string; place?: string }> = {
  pottery: { venue: 'clay-kiln', label: 'Pottery workshop', emoji: '🏺' },
  openmic: { venue: 'acoustic-room', label: 'Open mic night', emoji: '🎤' },
  boardgames: { venue: 'dice-dosti', label: 'Board games', emoji: '🎲' },
  arcade: { venue: 'strike-zone', label: 'Bowling & arcade', emoji: '🎳' },
  cooking: { venue: 'pahadi-kitchen', label: 'Cook Garhwali together', emoji: '🍳' },
  trek: { venue: 'doon-trails', label: 'Maldevta sunrise trek', emoji: '🌄' },
  sunset: { label: 'Sunset at Sahastradhara', emoji: '🌅', place: 'Sahastradhara' },
  walk: { label: 'Evening walk', emoji: '🌳', place: 'Rajpur Road' },
}
const TITLES: Record<string, string> = {
  romantic: 'The Slow Evening',
  fun: 'Game On, Then Dessert',
  relaxing: 'The Creative Unwind',
  adventurous: 'The Story-Worthy Day',
  surprise: 'The Mystery Itinerary',
}
const TAGLINES: Record<string, string[]> = {
  romantic: ['Soft lights, slow conversation, zero rush.', 'Built for lingering looks and long talks.'],
  fun: ['Equal parts laughter and friendly competition.', 'A playful evening with a sweet finish.'],
  relaxing: ['Perfect for a relaxed creative evening.', 'Unhurried, cosy and quietly lovely.'],
  adventurous: ['For the couple that says yes first.', 'A little bit of thrill, a lot of story.'],
  surprise: ['We picked the twists. You just show up.', 'An evening of happy unknowns.'],
}
// Student-friendly tiers for the Dehradun launch; keep in sync with TIERS in the frontend.
const TIER_RANGE: Record<string, [number, number]> = { easy: [0, 500], classic: [500, 1500], special: [1500, 3000], unforgettable: [3000, 1e9] }

export interface LabInput {
  mood: string
  occasion: string
  cuisine: string
  activity: string
  tier: string
  seed?: number
}

export async function generateDate(input: LabInput) {
  const seed = input.seed ?? 0
  const food = FOOD_VENUE[input.cuisine] ?? FOOD_VENUE.coffee
  const act = ACTIVITY_VENUE[input.activity] ?? ACTIVITY_VENUE.pottery
  const sweet = seed % 2 === 0 ? { venue: 'lantern-house', label: 'Hot chocolate', emoji: '🍫' } : { venue: 'skyline-terrace', label: 'Jhangora kheer', emoji: '🍮' }
  const slugs = [food.venue, act.venue, sweet.venue].filter(Boolean) as string[]
  const venues = await Venue.find({ slug: { $in: slugs }, status: 'verified' }).lean()
  const exps = await Experience.find({ venue: { $in: venues.map((v) => v._id) }, active: true }).lean()
  const name = (slug?: string, fallback = '') => venues.find((v) => v.slug === slug)?.name ?? fallback
  const priceOf = (slug?: string) => {
    const v = venues.find((x) => x.slug === slug)
    return exps.filter((e) => String(e.venue) === String(v?._id)).sort((a, b) => a.price - b.price)[0]?.price ?? 0
  }

  // Times come from each venue's real slots, in order, so the bookable step is always a slot the venue offers.
  const toMin = (t: string) => {
    const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(t)
    return m ? ((Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(m[2]) : 0
  }
  const fmt = (min: number) => `${((Math.floor(min / 60) + 11) % 12) + 1}:${String(min % 60).padStart(2, '0')} ${min >= 720 ? 'PM' : 'AM'}`
  const slotsOf = (slug?: string) => (venues.find((v) => v.slug === slug)?.slots ?? []).slice().sort((a, b) => toMin(a) - toMin(b))
  /** First slot at `slug` at or after `after`, else null. */
  const firstFrom = (slug: string | undefined, after: number) => slotsOf(slug).find((t) => toMin(t) >= after) ?? null
  /** Latest slot at `slug` at or before `before`, else null. */
  const lastBefore = (slug: string | undefined, before: number) => [...slotsOf(slug)].reverse().find((t) => toMin(t) <= before) ?? null
  // Non-bookable stops (food before, dessert after) only need a sensible time, not a reserved slot.
  const ACT_LEN = 100

  let steps: { emoji: string; label: string; venue: string; venueId: string | null; time: string }[]
  if (input.activity === 'trek') {
    const trek = firstFrom(act.venue, 0) ?? '5:30 AM'
    steps = [
      { emoji: act.emoji, label: act.label, venue: name(act.venue), venueId: act.venue ?? null, time: trek },
      { emoji: '🍜', label: 'Maggi & chai at the top', venue: 'Included with the trek', venueId: null, time: fmt(toMin(trek) + 120) },
      { emoji: food.emoji, label: food.label, venue: name(food.venue), venueId: food.venue, time: firstFrom(food.venue, toMin(trek) + 5 * 60) ?? fmt(toMin(trek) + 5 * 60) },
    ]
  } else if (act.venue) {
    // Anchor on the bookable activity's real slot, then fit food before and dessert after it.
    const actTime = firstFrom(act.venue, 17 * 60) ?? slotsOf(act.venue).at(-1) ?? '6:00 PM'
    const foodTime = lastBefore(food.venue, toMin(actTime) - 60) ?? fmt(toMin(actTime) - 75)
    steps = [
      { emoji: food.emoji, label: food.label, venue: name(food.venue), venueId: food.venue, time: foodTime },
      { emoji: act.emoji, label: act.label, venue: name(act.venue), venueId: act.venue, time: actTime },
    ]
    if (input.tier !== 'easy') {
      const after = toMin(actTime) + ACT_LEN
      steps.push({ emoji: sweet.emoji, label: sweet.label, venue: name(sweet.venue), venueId: sweet.venue, time: firstFrom(sweet.venue, after) ?? fmt(after) })
    }
  } else {
    // A free activity (sunset, walk): the food stop is the booking.
    const foodTime = firstFrom(food.venue, 16 * 60) ?? slotsOf(food.venue)[0] ?? '5:00 PM'
    steps = [
      { emoji: food.emoji, label: food.label, venue: name(food.venue), venueId: food.venue, time: foodTime },
      { emoji: act.emoji, label: act.label, venue: act.place!, venueId: null, time: fmt(toMin(foodTime) + 90) },
    ]
    if (input.tier !== 'easy') {
      const after = toMin(foodTime) + 180
      steps.push({ emoji: sweet.emoji, label: sweet.label, venue: name(sweet.venue), venueId: sweet.venue, time: firstFrom(sweet.venue, after) ?? fmt(after) })
    }
  }

  // Real package prices from partners. The tier is a floor (upgrades) and a ceiling we try to respect:
  // if the plan runs over, the optional dessert stop goes first; anything still over is flagged honestly.
  const [lo, hi] = TIER_RANGE[input.tier] ?? TIER_RANGE.classic
  const total = () => steps.reduce((sum, s) => sum + priceOf(s.venueId ?? undefined), 0)
  if (total() > hi && steps.length > 2 && steps[2].venueId === sweet.venue) steps.pop()
  const base = total()
  const price = Math.max(base, lo)
  const overBudget = base > hi
  const primary = steps.find((s) => s.venueId && s.venueId === act.venue) ?? steps.find((s) => s.venueId)!

  return {
    title: (input.occasion === 'anniversary' ? 'Anniversary: ' : input.occasion === 'birthday' ? 'Birthday: ' : '') + (TITLES[input.mood] ?? TITLES.relaxing),
    tagline: (TAGLINES[input.mood] ?? TAGLINES.relaxing)[seed % 2],
    steps,
    price: Math.round(price / 10) * 10,
    mood: input.mood,
    occasion: input.occasion,
    bookable: { venueId: primary.venueId, time: primary.time },
    overBudget,
    tierMax: hi === 1e9 ? null : hi,
  }
}
