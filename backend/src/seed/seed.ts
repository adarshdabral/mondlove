import mongoose, { type Types } from 'mongoose'
import bcrypt from 'bcryptjs'
import { pathToFileURL } from 'node:url'
import { config, redactUri } from '../config.js'
import { connectDb } from '../db.js'
import { Block, Booking, Couple, Experience, Memory, Payment, Proposal, Report, Revenue, Slot, User, Venue } from '../models/index.js'
import { ALL_INTERESTS, BGS, DATE_STYLES, FOODS, HAIR_COLORS, INTENTIONS, ME_AVATAR, PEOPLE, SEED_MEMORIES, SHIRTS, SKINS, TRAITS, VENUES, dayLabel } from './catalog.js'

export const DEMO_PASSWORD = 'mingleo-demo'
const demoEmail = (h: string) => `${h}@demo.mingleo.app`
const day = 864e5

/** Deterministic PRNG so every seed produces the same dummy data. */
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
}
const r = rng(42)
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)]
const sample = <T,>(xs: readonly T[], n: number) => [...xs].sort(() => r() - 0.5).slice(0, n)
const timeLabel = (h: number, m = 0) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/* ---------- Dummy-user pools ---------- */

const WOMEN = ['Aditi', 'Kavya', 'Riya', 'Sneha', 'Diya', 'Ira', 'Tanya', 'Nisha', 'Shreya', 'Anika', 'Naina', 'Ritika', 'Prisha', 'Mehak', 'Saanvi', 'Simran', 'Kiara', 'Ishita', 'Avni', 'Garima', 'Tanishka', 'Bhavya', 'Akshita', 'Nitika', 'Prachi', 'Mansi', 'Shivani', 'Pragya', 'Muskan', 'Kritika']
const MEN = ['Arjun', 'Vihaan', 'Karan', 'Aditya', 'Nikhil', 'Varun', 'Aryan', 'Dhruv', 'Yash', 'Pranav', 'Abhay', 'Samar', 'Raghav', 'Manav', 'Ayaan', 'Tejas', 'Harsh', 'Akash', 'Shaurya', 'Ansh', 'Vansh', 'Aayush', 'Harshit', 'Shubham', 'Chirag', 'Pranjal', 'Ujjwal', 'Devansh', 'Kartik', 'Sarthak']
const NONBINARY = ['Sam', 'Ari', 'Kiran', 'Noor', 'Rumi', 'Jai']
// Dehradun neighbourhoods with rough distances from the city centre (Clock Tower), in km.
const AREAS = [['Rajpur Road', 2.0], ['Dalanwala', 1.8], ['Jakhan', 3.5], ['Vasant Vihar', 3.1], ['Prem Nagar', 7.4], ['Clement Town', 6.2], ['Ballupur', 4.0], ['Sahastradhara Road', 5.5], ['Race Course', 2.5], ['Kishanpur', 4.8], ['Patel Nagar', 3.0], ['Raipur', 6.0], ['Mothrowala', 8.0], ['Karanpur', 1.6]] as const
const JOBS = ['BTech student', 'design student', 'content creator', 'law student', 'MBA student', 'BCA student', 'junior developer', 'photographer', 'hotel-management student', 'musician', 'graphic designer', 'fitness coach', 'nursing student', 'freelance illustrator', 'barista', 'UPSC aspirant', 'journalism student', 'architecture student']
const ABOUT_TAILS = [
  'Weekends are for Mussoorie drives and long café breakfasts.',
  'I’ll always say yes to an open mic at Astley Hall.',
  'Looking for someone who laughs easily and plans spontaneously.',
  'I make great playlists and an average Maggi.',
  'Ask me about the best momos in Paltan Bazaar. I have strong opinions.',
  'Fog season is my favourite season. Fight me.',
  'Equal parts homebody and trek person.',
  'Currently learning guitar. My neighbours are very patient.',
  'Will rate your café pick out of 10, lovingly.',
  'Sunrise at Maldevta > sleeping in. Most days.',
]
const PROMPTS = [
  ['A perfect Sunday looks like…', ['Bun maska, chai and a slow walk down Rajpur Road.', 'A sunrise trek, then Maggi with a view.', 'Brunch that turns into thrifting that turns into momos.']],
  ['I’ll know it’s a good date if…', ['We forget to check our phones.', 'We’re the last ones at the café.', 'We’re already planning a Mussoorie trip.']],
  ['My most irrational fear…', ['Monkeys at the Mussoorie Mall Road.', 'Ordering the wrong thing at a new café.', 'Running out of battery mid-road trip.']],
  ['Together we could…', ['Find Doon’s best hot chocolate.', 'Take a pottery class and make wonky mugs.', 'Do a momo crawl and rank every plate.']],
  ['Green flag I look for…', ['You say thank you to the momo bhaiya.', 'You share your fries without being asked.', 'You remember my chai order.']],
] as const
const FEEDBACK_TAGS = ['Great conversation', 'Loved the venue', 'The food swap was fun', 'Felt safe & comfortable', 'Good vibes']
const CONVERSATION = ['Deep talks over small talk', 'Banter first, depth later', 'Good listener, terrible puns', 'Thoughtful, asks follow-up questions', 'Energetic and direct', 'Playful and curious']

function dummyPerson(i: number) {
  const gender = i % 13 === 0 ? 'nonbinary' : i % 2 ? 'man' : 'woman'
  const first = gender === 'nonbinary' ? NONBINARY[i % NONBINARY.length] : gender === 'man' ? MEN[(i * 7) % MEN.length] : WOMEN[(i * 7) % WOMEN.length]
  const [area, distanceKm] = pick(AREAS)
  const interests = sample(ALL_INTERESTS, 4 + Math.floor(r() * 3))
  const prompts = sample(PROMPTS, 2).map(([q, as]) => ({ q, a: pick(as) }))
  const job = pick(JOBS)
  return {
    handle: `${first.toLowerCase()}${i}`,
    name: first,
    email: `${first.toLowerCase()}.${i}@example.mingleo.app`,
    age: 19 + Math.floor(r() * 9), // Gen Z launch audience: 19–27
    gender,
    pronouns: gender === 'woman' ? 'she/her' : gender === 'man' ? 'he/him' : 'they/them',
    interestedIn: gender === 'nonbinary' || r() < 0.2 ? 'everyone' : gender === 'man' ? 'women' : 'men',
    area,
    distanceKm: Math.round((distanceKm + r() * 2) * 10) / 10,
    avatar: {
      skin: pick(SKINS),
      hair: gender === 'man' ? pick(['short', 'wavy', 'curly', 'buzz']) : pick(['long', 'bob', 'bun', 'wavy', 'curly']),
      hairColor: pick(HAIR_COLORS.slice(0, 5)),
      bg: pick(BGS),
      shirt: pick(SHIRTS),
      accessory: pick(['none', 'none', 'glasses', gender === 'man' ? 'beanie' : 'earrings']),
      beard: gender === 'man' && r() < 0.5,
    },
    interests,
    traits: sample(TRAITS, 3 + Math.floor(r() * 2)),
    food: sample(FOODS, 3),
    datePrefs: sample(DATE_STYLES, 3),
    lifestyle: [
      { label: 'Drinks', value: pick(['Never', 'Never', 'Socially', 'Socially']) },
      { label: 'Weekends', value: pick(['Cosy at home', 'Out and about', 'A bit of both']) },
    ],
    intention: pick(INTENTIONS),
    conversation: pick(CONVERSATION),
    about: `${job[0].toUpperCase() + job.slice(1)} in ${area}. ${pick(ABOUT_TAILS)}`,
    prompts,
    favoriteVenue: pick(VENUES.filter((v) => v.kind !== 'activity' || r() < 0.3)).id,
    verification: r() < 0.88 ? { status: 'verified', method: 'Selfie + ID', score: 95 + Math.floor(r() * 5) } : { status: 'pending', method: 'Selfie liveness', score: 85 + Math.floor(r() * 10) },
  }
}

// Fictional owners of the fictional demo venues.
const PARTNER_NAMES: Record<string, string> = {
  'pine-pour': 'Rhea Rawat', 'lantern-house': 'Farhan Ali', 'momo-mill': 'Pema Sherpa', 'seoul-steam': 'Tenzin Dolma', 'olive-oak': 'Kunal Bisht',
  'skyline-terrace': 'Anil Joshi', 'clay-kiln': 'Vikram Negi', 'strike-zone': 'Gautam Thapa', 'acoustic-room': 'Maya Pant', 'dice-dosti': 'Arjun Kandari',
  'pahadi-kitchen': 'Shruti Bhandari', 'doon-trails': 'Rahul Gusain',
}

export async function runSeed({ quiet = false } = {}) {
  const log = (...a: unknown[]) => !quiet && console.log(...a)
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).deleteMany({})))
  await Promise.all([User, Venue, Experience, Slot, Booking, Report, Block, Couple].map((m) => m.syncIndexes()))
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 8)
  const ids: Record<string, Types.ObjectId> = {}

  /* ---------- Demo accounts: a single person ---------- */
  const aarav = await User.create({
    handle: 'aarav', name: 'Aarav', email: demoEmail('aarav'), passwordHash, age: 22, pronouns: 'he/him', gender: 'man', area: 'Rajpur Road', distanceKm: 2.0,
    avatar: ME_AVATAR, interests: ALL_INTERESTS.filter((i) => ['Café hopping', 'Indie music', 'Mussoorie trips', 'Momos', 'Books'].includes(i.label)),
    traits: ['Curious', 'Warm', 'Spontaneous'], food: ['Café bites', 'Momos & street food', 'Desserts'], datePrefs: ['Café hopping', 'Open mic night', 'Sunset spots'],
    lifestyle: [{ label: 'Drinks', value: 'Never' }, { label: 'Weekends', value: 'Out and about' }],
    intention: 'Something long-term', conversation: 'Deep talks over small talk', interestedIn: 'everyone', mode: 'single',
    about: 'Final-year BBA and part-time photographer. I plan weekends around sunsets and will absolutely make us take the scenic route.',
    prompts: [{ q: 'A perfect Sunday looks like…', a: 'Chai at Jakhan, a long walk, and an open mic I didn’t plan to go to.' }],
    verification: { status: 'verified', method: 'Selfie + phone', score: 99 }, trustedContact: { name: 'Priya (sister)', phone: '+91 98370 12345' },
  })
  ids.aarav = aarav._id

  /* ---------- Hand-written profiles ---------- */
  for (const p of PEOPLE) {
    const u = await User.create({
      handle: p.id, name: p.name, email: demoEmail(p.id), passwordHash, age: p.age, pronouns: p.pronouns, gender: p.gender, area: p.area, distanceKm: p.distanceKm,
      avatar: p.avatar, interests: p.interests, traits: p.traits, food: p.food, datePrefs: p.datePrefs, lifestyle: p.lifestyle, intention: p.intention,
      conversation: p.conversation, about: p.about, prompts: p.prompts, favoriteVenue: p.favoriteVenue, interestedIn: p.gender === 'woman' ? 'men' : 'women',
      verification: p.verified ? { status: 'verified', method: 'Selfie + ID', score: 97 } : { status: 'pending', method: 'Selfie liveness', score: 91 },
    })
    ids[p.id] = u._id
  }

  /* ---------- Generated dummy singles ---------- */
  const dummies = Array.from({ length: 120 }, (_, i) => ({ ...dummyPerson(i + 1), passwordHash, role: 'user', mode: 'single' }))
  const created = await User.insertMany(dummies)
  created.forEach((u) => (ids[u.handle] = u._id))

  /* ---------- Demo couple + background couples ---------- */
  const coupleAvatar = (skin: string, hair: string, bg: [string, string], shirt: string, extra = {}) => ({ skin, hair, hairColor: HAIR_COLORS[0], bg, shirt, accessory: 'none', ...extra })
  const isha = await User.create({ handle: 'isha', name: 'Isha', email: demoEmail('isha'), passwordHash, age: 24, gender: 'woman', pronouns: 'she/her', area: 'Dalanwala', mode: 'couple', avatar: coupleAvatar(SKINS[1], 'long', BGS[1], SHIRTS[2], { accessory: 'earrings' }), verification: { status: 'verified' }, trustedContact: { name: 'Mom', phone: '+91 98370 55555' } })
  const devUser = await User.create({ handle: 'dev', name: 'Dev', email: demoEmail('dev'), passwordHash, age: 25, gender: 'man', pronouns: 'he/him', area: 'Dalanwala', mode: 'couple', avatar: coupleAvatar(SKINS[3], 'short', BGS[2], SHIRTS[0], { beard: true }), verification: { status: 'verified' } })
  const demoCouple = await Couple.create({ members: [isha._id, devUser._id], source: 'mingleo_date', status: 'verified', since: new Date(Date.now() - 214 * day), occasions: [{ label: 'Isha’s birthday', date: new Date(Date.now() + 42 * day) }] })
  await Memory.insertMany(SEED_MEMORIES.map((m, i) => ({ couple: demoCouple._id, createdBy: isha._id, title: m.title, venueName: m.venue, emoji: m.emoji, tone: m.tone, occasion: m.occasion, note: m.note.replace(/She/g, 'Isha').replace(/she/g, 'she'), rating: m.rating, date: new Date(Date.now() - [200, 110, 50][i] * day) })))

  const bgCouples: Types.ObjectId[][] = []
  const bgNames = ['Sana', 'Rohan', 'Neha', 'Kiran', 'Leena', 'Sid', 'Maya', 'Kunal', 'Farah', 'Joel', 'Tanvi', 'Ayaan', 'Riya', 'Sameer', 'Pooja', 'Nikhil', 'Aparna', 'Vikas', 'Zoe', 'Ravi']
  for (let i = 0; i < bgNames.length; i += 2) {
    const pair = await User.insertMany(
      [0, 1].map((k) => ({
        handle: `${bgNames[i + k].toLowerCase()}c${i}`, name: bgNames[i + k], email: `${bgNames[i + k].toLowerCase()}.c${i}@example.mingleo.app`, passwordHash, age: 21 + ((i + k) % 7),
        gender: k ? 'man' : 'woman', area: pick(AREAS)[0], mode: 'couple', role: 'user',
        avatar: { skin: pick(SKINS), hair: k ? pick(['short', 'curly', 'wavy']) : pick(['long', 'bob', 'bun']), hairColor: HAIR_COLORS[(i + k) % 4], bg: pick(BGS), shirt: pick(SHIRTS), accessory: 'none' },
        verification: { status: i === 18 && k ? 'pending' : 'verified', method: i === 18 ? 'Partner link (couple)' : 'Selfie + ID', score: 95 },
      })),
    )
    bgCouples.push([pair[0]._id, pair[1]._id])
    await Couple.create({ members: [pair[0]._id, pair[1]._id], source: i % 4 === 0 ? 'mingleo_date' : 'invite', status: 'verified', since: new Date(Date.now() - (60 + i * 9) * day) })
  }

  /* ---------- Partners & admin ---------- */
  const owners: Record<string, Types.ObjectId> = {}
  for (const [slug, name] of Object.entries(PARTNER_NAMES)) {
    const handle = slug === 'pine-pour' ? 'rhea' : slug === 'clay-kiln' ? 'vikram' : `partner-${slug}`
    const u = await User.create({ handle, name, email: slug === 'pine-pour' ? demoEmail('rhea') : slug === 'clay-kiln' ? demoEmail('vikram') : `${slug}@partners.mingleo.app`, passwordHash, role: 'partner', avatar: ME_AVATAR, verification: { status: 'verified' } })
    owners[slug] = u._id
  }
  const pendingOwner = await User.create({ handle: 'partner-pending', name: 'Akash Chauhan', email: demoEmail('newcafe'), passwordHash, role: 'partner', avatar: ME_AVATAR })
  await User.create({ handle: 'nandini', name: 'Nandini Uniyal', email: demoEmail('admin'), passwordHash, role: 'admin', avatar: ME_AVATAR, verification: { status: 'verified' } })

  /* ---------- Venues & experiences ---------- */
  const TAGS: Record<string, string[]> = {
    'pine-pour': ['romantic'], 'olive-oak': ['romantic', 'occasion'], 'seoul-steam': ['budget'], 'clay-kiln': ['creative'], 'momo-mill': ['budget'],
    'lantern-house': ['budget'], 'dice-dosti': ['budget', 'creative'], 'acoustic-room': ['romantic'], 'skyline-terrace': ['romantic', 'occasion'],
    'pahadi-kitchen': ['creative'], 'doon-trails': ['adventure', 'outdoor'], 'strike-zone': [],
  }
  const venueIds: Record<string, Types.ObjectId> = {}
  const expByCode: Record<string, { _id: Types.ObjectId; price: number; name: string; includes: string[]; venue: string }> = {}
  for (const [i, v] of VENUES.entries()) {
    const doc = await Venue.create({
      slug: v.id, name: v.name, kind: v.kind, category: v.category, tags: TAGS[v.id] ?? [], area: v.area, distanceKm: v.distanceKm,
      location: { type: 'Point', coordinates: [78.02 + i * 0.006, 30.31 + i * 0.005] }, // around Dehradun
      rating: v.rating, reviews: v.reviews, emoji: v.emoji, tone: v.tone, ambience: v.ambience, treats: v.treats, slots: v.slots,
      owner: owners[v.id], status: 'verified', city: 'Dehradun', documents: ['FSSAI / trade licence', 'GST'], commissionRate: 0.12,
      plan: ['pine-pour', 'clay-kiln', 'acoustic-room'].includes(v.id) ? 'pro' : 'standard', featured: v.id === 'skyline-terrace' || v.id === 'pine-pour',
    })
    venueIds[v.id] = doc._id
    for (const p of v.packages) {
      const e = await Experience.create({ code: p.id, venue: doc._id, name: p.name, includes: p.includes, price: p.price, duration: p.duration, capacity: v.kind === 'activity' ? 6 : 4, emoji: v.emoji })
      expByCode[p.id] = { _id: e._id, price: p.price, name: p.name, includes: p.includes, venue: v.id }
    }
  }
  for (const [name, kind, area, docs, owner] of [
    ['Kettle & Crumb', 'cafe', 'Prem Nagar', ['FSSAI', 'GST'], pendingOwner._id],
    ['Peak Point Climbing', 'activity', 'Maldevta', ['Trade licence', 'Insurance'], owners['strike-zone']],
    ['Book & Bean', 'cafe', 'Dalanwala', ['FSSAI'], owners['lantern-house']],
  ] as const) {
    await Venue.create({ slug: name.toLowerCase().replace(/[^a-z]+/g, '-'), name, kind, area, category: kind === 'cafe' ? 'Café' : 'Climbing', owner, status: 'pending', city: 'Dehradun', documents: [...docs], emoji: kind === 'cafe' ? '☕' : '🧗', tone: ['#FBEFD3', '#D9A23B'], slots: ['6:00 PM', '7:30 PM'] })
  }

  /* ---------- Booking history (last 30 days + next 10) ---------- */
  const venueByCode = Object.fromEntries(VENUES.map((v) => [v.id, v]))
  // Weighted towards budget-friendly dates, which is what a student audience books most.
  const weights: [string, number][] = [['pp-cd', 5], ['mm-crawl', 4], ['lh-cm', 3], ['dd-gn', 3], ['ar-om', 3], ['ss-rb', 3], ['ck-cp', 2], ['sz-bw', 2], ['pp-br', 1], ['oo-dn', 1], ['st-sd', 1], ['pk-cook', 1], ['dt-sr', 1]]
  const pickCode = () => {
    const total = weights.reduce((s, [, w]) => s + w, 0)
    let x = r() * total
    for (const [code, w] of weights) if ((x -= w) < 0) return code
    return weights[0][0]
  }
  const bookings: Record<string, unknown>[] = []
  const payments: Record<string, unknown>[] = []
  const ledger: Record<string, unknown>[] = []
  const kinds = ['date', 'date', 'date', 'lab', 'lab', 'surprise', 'marketplace'] as const
  const addBooking = (o: { code: string; users: Types.ObjectId[]; startsAt: Date; time: string; kind: (typeof kinds)[number]; status: string; treats?: unknown; gift?: { id: string; label: string; price: number }; title?: string; hint?: string }) => {
    const exp = expByCode[o.code]
    const _id = new mongoose.Types.ObjectId()
    bookings.push({
      _id, ref: `MGL-${_id.toString().slice(-5).toUpperCase()}`, kind: o.kind, venue: venueIds[exp.venue], experience: exp._id, users: o.users, bookedBy: o.users[0],
      title: o.title ?? exp.name, day: dayLabel(o.startsAt), time: o.time, startsAt: o.startsAt, items: exp.includes, treats: o.treats, price: exp.price, gift: o.gift,
      secret: o.hint ? { hint: o.hint } : undefined, status: o.status, createdAt: new Date(o.startsAt.getTime() - 4 * day),
      feedback: o.status === 'completed' && r() < 0.6
        ? o.users.map((u) => ({ user: u, rating: r() < 0.75 ? 5 : r() < 0.7 ? 4 : 3, tags: sample(FEEDBACK_TAGS, 1 + Math.floor(r() * 2)), continue: 'yes', at: new Date(o.startsAt.getTime() + 864e5) }))
        : (o as { feedback?: unknown }).feedback ?? [],
    })
    if (o.status !== 'cancelled') {
      const payId = new mongoose.Types.ObjectId()
      payments.push({ _id: payId, booking: _id, payer: o.users[0], amount: exp.price + (o.gift?.price ?? 0), status: o.status === 'completed' ? 'captured' : 'authorized', providerRef: `mock_${_id}`, createdAt: new Date(o.startsAt.getTime() - 3 * day) })
      const earnedAt = new Date(Math.min(Date.now(), o.startsAt.getTime() - 4 * day))
      ledger.push({ stream: o.kind === 'lab' || o.kind === 'surprise' ? 'experience_commission' : 'booking_commission', amount: Math.round(exp.price * 0.12), gross: exp.price, rate: 0.12, booking: _id, payment: payId, venue: venueIds[exp.venue], at: earnedAt })
      if (o.gift) ledger.push({ stream: 'gifts_addons', amount: Math.round(o.gift.price * 0.2), gross: o.gift.price, rate: 0.2, booking: _id, payment: payId, venue: venueIds[exp.venue], at: earnedAt })
    }
    return _id
  }
  for (let d = -30; d <= 10; d++) {
    const date = new Date(Date.now() + d * day)
    const weekend = [0, 5, 6].includes(date.getDay())
    const n = Math.round((weekend ? 9 : 3) + r() * (weekend ? 5 : 3))
    for (let k = 0; k < n; k++) {
      const code = pickCode()
      const v = venueByCode[expByCode[code].venue]
      const slot = pick(v.slots)
      const [hh, mm] = slot.split(/[: ]/).map(Number)
      const h = (hh % 12) + (slot.endsWith('PM') ? 12 : 0)
      const kind = pick(kinds)
      const cancelled = r() < 0.05
      addBooking({
        code, kind, time: timeLabel(h, mm), users: pick(bgCouples), startsAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, mm),
        status: cancelled ? 'cancelled' : d < 0 ? 'completed' : d === 0 ? 'confirmed' : r() < 0.15 ? 'pending' : 'confirmed',
        treats: v.treats.length > 1 && kind === 'date' ? { forReceiver: pick(v.treats), forSender: pick(v.treats) } : undefined,
        gift: kind === 'surprise' && r() > 0.4 ? { id: 'flowers', label: 'Flower bouquet', price: 499 } : undefined,
      })
    }
  }
  // Aarav & Ananya's first date was two days ago. Ananya already said she'd like to continue;
  // Aarav's answer decides whether they become a couple.
  const firstDate = new Date(Date.now() - 2 * day)
  const firstId = addBooking({ code: 'pp-cd', kind: 'date', users: [aarav._id, ids.ananya], startsAt: new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate(), 19, 30), time: '7:30 PM', status: 'confirmed', treats: { forReceiver: { name: 'Cappuccino', emoji: '☕' }, forSender: { name: 'Matcha Latte', emoji: '🍵' } } })
  ;(bookings.find((b) => b._id === firstId) as { feedback: unknown[] }).feedback = [{ user: ids.ananya, rating: 5, tags: ['Great conversation', 'The food swap was fun'], continue: 'yes', at: new Date(Date.now() - day) }]
  await Proposal.create({ from: aarav._id, to: ids.ananya, venue: venueIds['pine-pour'], experience: expByCode['pp-cd']._id, day: dayLabel(firstDate), time: '7:30 PM', startsAt: new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate(), 19, 30), treatForReceiver: { name: 'Cappuccino', emoji: '☕' }, treatForSender: { name: 'Matcha Latte', emoji: '🍵' }, status: 'confirmed', lastEditedBy: ids.ananya, booking: firstId, history: [{ by: aarav._id, action: 'sent', changes: [] }, { by: ids.ananya, action: 'accepted', changes: [] }] })

  // The demo couple: one past date and a secret surprise Dev planned for Isha.
  const past = new Date(Date.now() - 12 * day)
  addBooking({ code: 'ck-cp', kind: 'lab', users: [isha._id, devUser._id], startsAt: new Date(past.getFullYear(), past.getMonth(), past.getDate(), 18, 30), time: '6:30 PM', status: 'completed', title: 'The Creative Unwind' })
  const soon = new Date(Date.now() + 9 * day)
  addBooking({ code: 'st-sd', kind: 'surprise', users: [devUser._id, isha._id], startsAt: new Date(soon.getFullYear(), soon.getMonth(), soon.getDate(), 19, 30), time: '7:30 PM', status: 'confirmed', title: 'Surprise for Isha', gift: { id: 'flowers', label: 'Flower bouquet', price: 499 }, hint: 'Dress up a little.' })
  await Booking.insertMany(bookings)
  await Payment.insertMany(payments)

  for (let w = 0; w < 4; w++) {
    const at = new Date(Date.now() - w * 7 * day)
    ledger.push(
      { stream: 'subscription', amount: 99 * (14 + w), at, note: 'Mingleo Plus renewals' },
      { stream: 'couple_pass', amount: 149 * (9 + w), at, note: 'Couple Pass renewals' },
      { stream: 'featured_placement', amount: 1499, venue: venueIds['skyline-terrace'], at, note: 'Featured: Skyline Terrace' },
    )
  }
  // Booking commission stays the primary stream; subscriptions and B2B are secondary by design.
  ledger.push({ stream: 'partner_pro', amount: 799 * 3, at: new Date(Date.now() - 2 * day), note: 'Partner Pro: 3 venues' })
  ledger.push({ stream: 'brand_partnership', amount: 5000, at: new Date(Date.now() - 12 * day), note: 'Pilot: fog-season café trail campaign' })
  await Revenue.insertMany(ledger)

  // Keep slot inventory consistent with the seeded bookings.
  const slotCounts = new Map<string, { experience: unknown; date: string; time: string; n: number }>()
  for (const b of bookings as { experience: unknown; startsAt: Date; time: string; status: string }[]) {
    if (b.status === 'cancelled') continue
    const key = `${b.experience}|${isoDate(b.startsAt)}|${b.time}`
    const cur = slotCounts.get(key) ?? { experience: b.experience, date: isoDate(b.startsAt), time: b.time, n: 0 }
    cur.n++
    slotCounts.set(key, cur)
  }
  await Slot.insertMany([...slotCounts.values()].map((s) => ({ experience: s.experience, date: s.date, time: s.time, capacity: Math.max(s.n, 6), booked: s.n })))

  /* ---------- Proposals: Aarav's inbox + platform history ---------- */
  const inDays = (n: number, h: number, m = 0) => {
    const d = new Date(Date.now() + n * day)
    return { day: dayLabel(d), time: timeLabel(h, m), startsAt: new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m) }
  }
  const zoyaSlot = inDays(9, 20)
  await Proposal.create({
    from: ids.zoya, to: aarav._id, venue: venueIds['acoustic-room'], experience: expByCode['ar-om']._id, ...zoyaSlot,
    treatForReceiver: { name: 'Truffle Fries', emoji: '🍟', note: 'Perfect for sharing' },
    note: 'Someone’s doing acoustic covers of old Bollywood songs on Saturday. I think you’d love it.',
    lastEditedBy: ids.zoya, history: [{ by: ids.zoya, action: 'sent', changes: [] }],
  })
  const meeraSlot = inDays(8, 19, 0)
  await Proposal.create({
    from: aarav._id, to: ids.meera, venue: venueIds['olive-oak'], experience: expByCode['oo-dn']._id, ...meeraSlot,
    treatForReceiver: { name: 'Truffle Mushroom Pasta', emoji: '🍝', note: 'Creamy and earthy' }, treatForSender: { name: 'Tiramisu', emoji: '🍮' },
    lastEditedBy: ids.meera,
    history: [{ by: aarav._id, action: 'sent', changes: [] }, { by: ids.meera, action: 'customized', changes: ['Time: 8:00 PM → 7:00 PM', 'Picked 🍮 Tiramisu'] }],
  })
  const outcomes = ['confirmed', 'confirmed', 'declined', 'declined', 'declined', 'customized', 'confirmed', 'cancelled']
  const singles = created.map((u) => u._id)
  const history = []
  for (let i = 0; i < 180; i++) {
    const v = VENUES[i % 6]
    const at = new Date(Date.now() - (1 + (i % 28)) * day)
    const from = singles[i % singles.length]
    const to = singles[(i * 7 + 3) % singles.length]
    history.push({ from, to, venue: venueIds[v.id], experience: expByCode[v.packages[0].id]._id, day: dayLabel(at), time: v.slots[0], startsAt: at, status: outcomes[i % outcomes.length], lastEditedBy: from, createdAt: at, updatedAt: at })
  }
  await Proposal.insertMany(history)

  /* ---------- Trust & safety ---------- */
  const handleOf = async (id: Types.ObjectId) => (await User.findById(id).select('handle').lean())!.handle
  const bg = bgCouples.flat()
  await Report.insertMany([
    { code: 'R-2041', reporter: ids.ananya, targetType: 'user', target: singles[3], targetLabel: await handleOf(singles[3]), type: 'Inappropriate messages', severity: 'High', status: 'Open' },
    { code: 'R-2039', reporter: singles[5], targetType: 'user', target: singles[6], targetLabel: await handleOf(singles[6]), type: 'No-show', severity: 'Low', status: 'In review' },
    { code: 'R-2033', reporter: ids.kabir, targetType: 'user', target: singles[11], targetLabel: await handleOf(singles[11]), type: 'Fake profile', severity: 'High', status: 'Escalated' },
    { code: 'R-2027', reporter: ids.zoya, targetType: 'user', target: singles[14], targetLabel: await handleOf(singles[14]), type: 'Made me feel unsafe', severity: 'High', status: 'Resolved' },
    { code: 'A-2045', targetType: 'user', target: singles[8], targetLabel: await handleOf(singles[8]), type: 'Automated: asked to move date off-platform 3×', severity: 'Medium', status: 'Open', automated: true },
  ])
  await Block.insertMany(Array.from({ length: 12 }, (_, i) => ({ blocker: bg[i], blocked: bg[(i + 7) % bg.length], createdAt: new Date(Date.now() - (i % 7) * day) })))

  log(`Seeded ${await User.countDocuments()} users (${dummies.length} generated singles), ${await Couple.countDocuments()} couples, ${await Venue.countDocuments()} venues, ${bookings.length} bookings, ${await Proposal.countDocuments()} proposals.`)
  log(`\nDemo accounts (password: ${DEMO_PASSWORD})`)
  log('  Single        aarav@demo.mingleo.app   (also ananya, kabir, zoya, meera, rohan, ishaan @demo.mingleo.app)')
  log('  Couple        isha@demo.mingleo.app    (partner: dev@demo.mingleo.app)')
  log('  Café owner    rhea@demo.mingleo.app    Activity owner: vikram@demo.mingleo.app')
  log('  New business  newcafe@demo.mingleo.app (pending verification)')
  log('  Admin         admin@demo.mingleo.app')
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  // Seeding replaces Mingleo's collections, so never run it against production by accident.
  if (config.isProd && !process.argv.includes('--force')) {
    console.error('Refusing to seed with NODE_ENV=production. Pass --force if you really mean it.')
    process.exit(1)
  }
  try {
    await connectDb()
  } catch {
    process.exit(1)
  }
  console.log(`Seeding ${redactUri(config.mongoUri)} …`)
  await runSeed()
  await mongoose.disconnect()
}
