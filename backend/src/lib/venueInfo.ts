import { z } from 'zod'

/**
 * What a venue tells people before they book a date there.
 * The partner wizard reads these lists from GET /api/partner/venue, so this is the single source.
 */
export const VENUE_OPTIONS = {
  food: ['Pure veg', 'Veg & non-veg', 'Vegan options', 'Jain options', 'Eggless desserts', 'Gluten-free options'],
  alcohol: ['Not served', 'Served', 'BYOB allowed'],
  seating: ['Couple tables', 'Indoor', 'Outdoor', 'Rooftop', 'Private corner', 'Floor seating'],
  vibe: ['Quiet', 'Chatty', 'Lively'],
  payment: ['UPI', 'Card', 'Cash'],
  parking: ['No parking', 'Two-wheeler parking', 'Car parking', 'Valet'],
  accessibility: ['Step-free entry', 'Accessible washroom', 'Lift'],
  amenities: ['Wi-Fi', 'Pet friendly', 'Smoking zone', 'Live music', 'Board games', 'Charging points', 'Heater or bonfire'],
  safety: ['CCTV', 'Well-lit entrance', 'Women staff on every shift', 'Staff briefed on Mingleo dates', 'On a main road'],
  cancellation: ['Free until 24 hours before', 'Free until 3 hours before', 'No free cancellation'],
  lateArrival: ['Table held for 15 minutes', 'Table held for 30 minutes'],
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
} as const

type Opts = readonly [string, ...string[]]
const opt = (xs: readonly string[]) => z.enum(xs as Opts)
const many = (xs: readonly string[]) => z.array(z.enum(xs as Opts)).max(xs.length)
const time = z.string().regex(/^\d{1,2}:\d{2} (AM|PM)$/, 'Use a time like 7:30 PM')
const mediaUrl = z.string().regex(/^\/api\/media\/[a-f0-9]{24}$/, 'Upload photos through Mingleo')

export const GoodToKnow = z.object({
  food: many(VENUE_OPTIONS.food).default([]),
  alcohol: opt(VENUE_OPTIONS.alcohol).optional(),
  seating: many(VENUE_OPTIONS.seating).default([]),
  vibe: opt(VENUE_OPTIONS.vibe).optional(),
  payment: many(VENUE_OPTIONS.payment).default([]),
  parking: opt(VENUE_OPTIONS.parking).optional(),
  accessibility: many(VENUE_OPTIONS.accessibility).default([]),
  amenities: many(VENUE_OPTIONS.amenities).default([]),
  safety: many(VENUE_OPTIONS.safety).default([]),
  studentDiscount: z.number().int().min(0).max(50).optional(),
})

export const MenuItem = z.object({
  name: z.string().trim().min(2).max(50),
  emoji: z.string().max(8).default('🍽️'),
  note: z.string().trim().max(100).optional(),
  photo: mediaUrl.optional(),
  price: z.number().int().min(0).max(20000).optional(),
  diet: z.enum(['veg', 'nonveg', 'egg']).optional(),
})

export const VenueListing = z
  .object({
    name: z.string().trim().min(2).max(80),
    category: z.string().trim().min(2).max(40),
    area: z.string().trim().min(2).max(60),
    description: z.string().trim().max(600),
    address: z.string().trim().max(200),
    landmark: z.string().trim().max(120),
    mapsUrl: z.string().trim().url().max(300).refine((u) => /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/.test(u), 'Paste a Google Maps link').or(z.literal('')),
    phone: z.string().trim().regex(/^[+\d][\d\s-]{7,15}$/, 'Enter a valid phone number').or(z.literal('')),
    priceForTwo: z.number().int().min(50).max(50000),
    ambience: z.array(z.string().trim().min(2).max(30)).max(8),
    hours: z.object({ days: z.array(z.enum(VENUE_OPTIONS.days)).min(1), open: time, close: time }),
    slots: z.array(time).min(1).max(8),
    photos: z.array(z.object({ url: mediaUrl, caption: z.string().trim().max(80).optional() })).max(12),
    treats: z.array(MenuItem).max(16),
    goodToKnow: GoodToKnow,
    policies: z.object({
      cancellation: opt(VENUE_OPTIONS.cancellation).optional(),
      lateArrival: opt(VENUE_OPTIONS.lateArrival).optional(),
      houseRules: z.string().trim().max(300).optional(),
    }),
    licence: z.object({ fssai: z.string().trim().regex(/^\d{14}$/, 'FSSAI licence numbers have 14 digits').or(z.literal('')).optional(), gst: z.string().trim().regex(/^[0-9A-Z]{15}$/, 'GSTIN has 15 characters').or(z.literal('')).optional() }),
  })
  .partial()

export const MIN_PHOTOS = 3
export const MIN_MENU = 2

/** What's still missing before a venue can be submitted for verification. */
export function missingForSubmit(v: {
  kind: string
  description?: string | null
  address?: string | null
  priceForTwo?: number | null
  hours?: { days?: string[] } | null
  slots?: string[]
  photos?: unknown[]
  treats?: unknown[]
  goodToKnow?: { food?: string[]; payment?: string[] } | null
  policies?: { cancellation?: string | null } | null
  licence?: { fssai?: string | null } | null
}, activePackages: number) {
  const missing: string[] = []
  if (!v.description || v.description.trim().length < 40) missing.push('A description of at least 40 characters')
  if (!v.address) missing.push('Full address')
  if (!v.priceForTwo) missing.push('Average price for two')
  if (!v.hours?.days?.length) missing.push('Opening days and hours')
  if (!v.slots?.length) missing.push('At least one date slot')
  if ((v.photos?.length ?? 0) < MIN_PHOTOS) missing.push(`At least ${MIN_PHOTOS} venue photos`)
  if ((v.treats?.length ?? 0) < MIN_MENU) missing.push(`At least ${MIN_MENU} ${v.kind === 'activity' ? 'activity options' : 'menu items'}`)
  if (v.kind !== 'activity' && !v.goodToKnow?.food?.length) missing.push('Food options (veg / non-veg)')
  if (!v.goodToKnow?.payment?.length) missing.push('Payment methods')
  if (!v.policies?.cancellation) missing.push('Cancellation policy')
  if (v.kind !== 'activity' && !v.licence?.fssai) missing.push('FSSAI licence number')
  if (activePackages < 1) missing.push('At least one date package')
  return missing
}
