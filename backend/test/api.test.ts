import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { runSeed } from '../src/seed/seed.js'
import { Booking, Payment, Proposal, Report, Revenue, Slot, User } from '../src/models/index.js'
import { DAYS } from '../src/seed/catalog.js'

const app = createApp()
const api = request(app)
const agents: Record<string, ReturnType<typeof request.agent>> = {}
const EMAIL: Record<string, string> = { nandini: 'admin@demo.mingleo.app' }

/** A logged-in cookie session per person; mutating calls send the CSRF header. */
function as(h: string) {
  const a = agents[h]
  const csrf = { 'x-mingleo-csrf': '1' }
  return {
    get: (u: string) => a.get(u),
    post: (u: string, body?: object) => a.post(u).set(csrf).send(body ?? {}),
    patch: (u: string, body?: object) => a.patch(u).set(csrf).send(body ?? {}),
    put: (u: string, body?: object) => a.put(u).set(csrf).send(body ?? {}),
    delete: (u: string) => a.delete(u).set(csrf),
  }
}
const cappuccino = { name: 'Cappuccino', emoji: '☕', note: 'Velvety' }
const matcha = { name: 'Matcha Latte', emoji: '🍵' }

beforeAll(async () => {
  // Tests drop their database afterwards, so only ever point them at a dedicated *_test database.
  const uri = process.env.MONGODB_TEST_URI ?? 'mongodb://127.0.0.1:27017/mingleo_test'
  const dbName = new URL(uri.replace(/^mongodb(\+srv)?:/, 'http:')).pathname.slice(1)
  if (!dbName.endsWith('_test')) throw new Error(`Refusing to run tests against "${dbName}": the database name must end in _test`)
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  await runSeed({ quiet: true })
  for (const h of ['aarav', 'ananya', 'kabir', 'zoya', 'meera', 'rohan', 'ishaan', 'rhea', 'vikram', 'nandini', 'isha', 'dev']) {
    agents[h] = request.agent(app)
    const res = await agents[h].post('/api/auth/login').set('x-mingleo-csrf', '1').send({ email: EMAIL[h] ?? `${h}@demo.mingleo.app`, password: 'mingleo-demo' })
    if (res.status !== 200) throw new Error(`login failed for ${h}`)
  }
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

describe('auth', () => {
  it('logs in with valid credentials and rejects bad ones with the same message', async () => {
    const ok = await api.post('/api/auth/login').set('x-mingleo-csrf', '1').send({ email: 'aarav@demo.mingleo.app', password: 'mingleo-demo' })
    expect(ok.status).toBe(200)
    expect(ok.body.user.id).toBe('aarav')
    expect(ok.body.user).not.toHaveProperty('passwordHash')
    const bad = await api.post('/api/auth/login').set('x-mingleo-csrf', '1').send({ email: 'aarav@demo.mingleo.app', password: 'nope' })
    const unknown = await api.post('/api/auth/login').set('x-mingleo-csrf', '1').send({ email: 'ghost@demo.mingleo.app', password: 'nope' })
    expect(bad.status).toBe(401)
    expect(unknown.body.error).toBe(bad.body.error)
  })

  it('rejects under-18 registrations', async () => {
    const res = await api.post('/api/auth/register').set('x-mingleo-csrf', '1').send({ name: 'Kid', email: 'kid@example.com', password: 'longenough', age: 16 })
    expect(res.status).toBe(400)
  })

  it('requires a token', async () => {
    expect((await api.get('/api/users/discover')).status).toBe(401)
  })
})

describe('blind discovery', () => {
  it('returns avatars and compatibility, never photos or email', async () => {
    const res = await as('aarav').get('/api/users/discover')
    expect(res.status).toBe(200)
    const ids = res.body.people.map((p: { id: string }) => p.id)
    expect(ids).toContain('ananya')
    expect(ids).not.toContain('aarav')
    expect(ids).not.toContain('dev') // people in a couple aren't discoverable
    const zoya = res.body.people.find((p: { id: string }) => p.id === 'zoya')
    expect(zoya.photos).toEqual([])
    expect(zoya.photosLocked).toBe(true)
    expect(zoya).not.toHaveProperty('email')
    expect(zoya.compat).toBeGreaterThan(60)
    expect(zoya.sharedLine).toMatch(/indie music/i)
    expect(res.body.disclaimer).toMatch(/not a scientific/i)
  })
})

describe('date proposal → booking → couple', () => {
  let proposalId = ''
  let bookingId = ''

  it('sends a proposal', async () => {
    const res = await as('aarav').post('/api/proposals', { to: 'ananya', venueId: 'pine-pour', packageId: 'pp-cd', day: DAYS[1], time: '7:30 PM', treatForReceiver: cappuccino, note: 'Coffee?' })
    expect(res.status).toBe(201)
    expect(res.body.proposal.status).toBe('sent')
    proposalId = res.body.proposal.id
  })

  it('blocks a duplicate open proposal and treats not on the venue menu', async () => {
    const dup = await as('aarav').post('/api/proposals', { to: 'ananya', venueId: 'pine-pour', day: DAYS[1], time: '7:30 PM', treatForReceiver: cappuccino })
    expect(dup.status).toBe(409)
    const wrong = await as('aarav').post('/api/proposals', { to: 'kabir', venueId: 'pine-pour', day: DAYS[1], time: '7:30 PM', treatForReceiver: { name: 'Caviar', emoji: '🐟' } })
    expect(wrong.status).toBe(400)
  })

  it('enforces turns: the sender cannot accept their own proposal', async () => {
    expect((await as('aarav').post(`/api/proposals/${proposalId}/accept`, { treatForSender: matcha })).status).toBe(409)
    expect((await as('kabir').post(`/api/proposals/${proposalId}/accept`, { treatForSender: matcha })).status).toBe(404)
  })

  it('lets the receiver customize, then the sender confirms', async () => {
    const c = await as('ananya').post(`/api/proposals/${proposalId}/customize`, { day: DAYS[2], time: '6:30 PM', treatForSender: matcha })
    expect(c.status).toBe(200)
    expect(c.body.proposal.status).toBe('customized')
    expect(c.body.proposal.changes).toEqual(expect.arrayContaining([expect.stringMatching(/^Time: 7:30 PM → 6:30 PM/)]))
    // Ananya made the last edit, so she can't confirm her own version.
    expect((await as('ananya').post(`/api/proposals/${proposalId}/confirm`)).status).toBe(409)
    const ok = await as('aarav').post(`/api/proposals/${proposalId}/confirm`)
    expect(ok.status).toBe(200)
    expect(ok.body.proposal.status).toBe('confirmed')
    expect(ok.body.booking.ref).toMatch(/^MGL-/)
    bookingId = ok.body.booking.id
    // Double-confirm must not create a second booking.
    expect((await as('aarav').post(`/api/proposals/${proposalId}/confirm`)).status).toBe(409)
    expect(await Booking.countDocuments({ proposal: proposalId })).toBe(1)
  })

  it('records a payment and a 12% commission in the revenue ledger', async () => {
    const payment = await Payment.findOne({ booking: bookingId }).lean()
    expect(payment?.amount).toBe(450)
    expect(payment?.status).toBe('authorized')
    const rev = await Revenue.find({ booking: bookingId }).lean()
    expect(rev).toHaveLength(1)
    expect(rev[0].stream).toBe('booking_commission')
    expect(rev[0].amount).toBe(54)
  })

  it('reveals photos only after a confirmed date', async () => {
    const res = await as('aarav').get('/api/users/ananya')
    expect(res.body.person.photosLocked).toBe(false)
    const other = await as('kabir').get('/api/users/ananya')
    expect(other.body.person.photos).toEqual([])
  })

  it('appears on the café partner dashboard with first names only', async () => {
    const res = await as('rhea').get('/api/partner/dashboard')
    expect(res.status).toBe(200)
    const row = res.body.bookings.find((b: { id: string }) => b.id === bookingId)
    expect(row.guests).toBe('Aarav & Ananya')
    expect(row.exchange).toContain('Cappuccino')
  })

  it('creates a couple and first memory only when both say yes', async () => {
    const first = await as('aarav').post(`/api/bookings/${bookingId}/feedback`, { rating: 5, continue: 'yes' })
    expect(first.body.connected).toBe(false)
    const second = await as('ananya').post(`/api/bookings/${bookingId}/feedback`, { rating: 4, continue: 'yes' })
    expect(second.body.connected).toBe(true)
    const mem = await as('ananya').get('/api/memories')
    expect(mem.body.memories[0].title).toBe('First Mingleo Date')
    const disc = await as('aarav').get('/api/users/discover')
    expect(disc.body.people.map((p: { id: string }) => p.id)).not.toContain('ananya')
  })
})

describe('decline, block, cancel', () => {
  it('declining is “not this time”, not a block', async () => {
    const incoming = (await as('aarav').get('/api/proposals?box=received')).body.proposals.find((p: { from: string }) => p.from === 'zoya')
    const res = await as('aarav').post(`/api/proposals/${incoming.id}/decline`)
    expect(res.body.proposal.status).toBe('declined')
    const disc = await as('zoya').get('/api/users/discover')
    expect(disc.body.people.map((p: { id: string }) => p.id)).toContain('kabir')
    expect((await as('kabir').get('/api/users/zoya')).status).toBe(200)
  })

  it('blocking hides both people from each other and stops proposals', async () => {
    await as('meera').post('/api/blocks', { handle: 'rohan' })
    const disc = await as('rohan').get('/api/users/discover')
    expect(disc.body.people.map((p: { id: string }) => p.id)).not.toContain('meera')
    const p = await as('rohan').post('/api/proposals', { to: 'meera', venueId: 'strike-zone', day: DAYS[1], time: '7:00 PM', treatForReceiver: { name: 'Loaded Nachos', emoji: '🧀' } })
    expect(p.status).toBe(404)
  })

  it('cancelling refunds the payment, frees the slot and reverses revenue', async () => {
    const b = await as('kabir').post('/api/bookings', { kind: 'marketplace', venueId: 'strike-zone', day: DAYS[3], time: '9:00 PM' })
    expect(b.status).toBe(201)
    const id = b.body.booking.id
    const bk = await Booking.findById(id).lean()
    const d = bk!.startsAt!
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const slotBefore = await Slot.findOne({ experience: bk!.experience, date, time: '9:00 PM' }).lean()
    expect(slotBefore?.booked).toBe(1)
    expect((await as('kabir').post(`/api/bookings/${id}/cancel`)).status).toBe(200)
    expect((await Payment.findOne({ booking: id }).lean())?.status).toBe('refunded')
    const net = (await Revenue.find({ booking: id }).lean()).reduce((s, r) => s + r.amount, 0)
    expect(net).toBe(0)
    expect((await Slot.findById(slotBefore!._id).lean())?.booked).toBe(0)
  })
})

describe('inventory & abuse protection', () => {
  it('never oversells the last table under concurrent requests', async () => {
    await as('vikram').put('/api/partner/availability', { [`${DAYS[4].slice(0, 3)}-11:00 AM`]: 1 })
    const book = (h: string) => as(h).post('/api/bookings', { kind: 'marketplace', venueId: 'clay-kiln', day: DAYS[4], time: '11:00 AM' })
    const results = await Promise.all([book('ishaan'), book('meera'), book('rohan')])
    expect(results.filter((r) => r.status === 201)).toHaveLength(1)
    expect(results.filter((r) => r.status === 409)).toHaveLength(2)
  })

  it('rate-limits proposal bursts and files an automated report', async () => {
    const ishaan = await User.findOne({ handle: 'ishaan' }).lean()
    const meera = await User.findOne({ handle: 'meera' }).lean()
    const sample = await Proposal.findOne().lean()
    await Proposal.insertMany(Array.from({ length: 20 }, () => ({ ...sample, _id: new mongoose.Types.ObjectId(), from: ishaan!._id, to: meera!._id, status: 'declined', createdAt: new Date() })))
    const res = await as('ishaan').post('/api/proposals', { to: 'zoya', venueId: 'pine-pour', day: DAYS[1], time: '5:00 PM', treatForReceiver: cappuccino })
    expect(res.status).toBe(429)
    expect(await Report.exists({ automated: true, targetLabel: 'ishaan' })).toBeTruthy()
  })
})

describe('roles', () => {
  it('keeps admin and partner APIs behind their roles', async () => {
    expect((await as('aarav').get('/api/admin/overview')).status).toBe(403)
    expect((await as('aarav').get('/api/partner/dashboard')).status).toBe(403)
    const overview = await as('nandini').get('/api/admin/overview')
    expect(overview.status).toBe(200)
    expect(overview.body.kpis.revenue30d).toBeGreaterThan(0)
    expect(Object.keys(overview.body.streams)).toHaveLength(8)
  })

  it('stops partners editing another venue’s packages', async () => {
    expect((await as('rhea').patch('/api/partner/experiences/ck-cp', { price: 1 })).status).toBe(403)
    const created = await as('rhea').post('/api/partner/experiences', { name: 'Sunset Coffee Date', includes: ['2 drinks'], price: 720, days: ['Fri', 'Sat'], capacity: 4 })
    expect(created.status).toBe(201)
    const venues = await api.get('/api/venues')
    const eo = venues.body.venues.find((v: { id: string }) => v.id === 'pine-pour')
    expect(eo.packages.map((p: { name: string }) => p.name)).toContain('Sunset Coffee Date')
  })

  it('generates a Date Lab plan from real venues', async () => {
    const res = await as('aarav').post('/api/date-lab/generate', { mood: 'relaxing', occasion: 'regular', cuisine: 'coffee', activity: 'pottery', tier: 'classic' })
    expect(res.status).toBe(200)
    expect(res.body.plan.steps.map((s: { venue: string }) => s.venue)).toContain('Clay & Kiln Studio')
    expect(res.body.plan.bookable.venueId).toBe('clay-kiln')
    // The bookable step uses a slot the venue actually offers.
    const venue = (await api.get('/api/venues/clay-kiln')).body.venue
    expect(venue.slots).toContain(res.body.plan.bookable.time)
    const late = await as('aarav').post('/api/date-lab/generate', { mood: 'fun', occasion: 'regular', cuisine: 'momos', activity: 'openmic', tier: 'easy' })
    expect(late.body.plan.steps).toHaveLength(2)
    expect(['8:00 PM', '9:30 PM']).toContain(late.body.plan.bookable.time)
  })
})

describe('sessions & CSRF', () => {
  it('sets an httpOnly session cookie and logs out', async () => {
    const agent = request.agent(app)
    const res = await agent.post('/api/auth/login').set('x-mingleo-csrf', '1').send({ email: 'kabir@demo.mingleo.app', password: 'mingleo-demo' })
    expect(String(res.headers['set-cookie'])).toMatch(/mingleo_session=.*HttpOnly/i)
    expect((await agent.get('/api/auth/me')).body.user.id).toBe('kabir')
    await agent.post('/api/auth/logout').set('x-mingleo-csrf', '1')
    expect((await agent.get('/api/auth/me')).status).toBe(401)
  })

  it('rejects state-changing cookie requests without the CSRF header', async () => {
    const res = await agents.aarav.post('/api/blocks').send({ handle: 'rohan' })
    expect(res.status).toBe(403)
  })
})

describe('registration', () => {
  it('signs up a person who stays out of Discover until onboarding is done', async () => {
    const agent = request.agent(app)
    const res = await agent.post('/api/auth/register').set('x-mingleo-csrf', '1').send({ account: 'person', name: 'Tara', email: 'tara.new@example.com', password: 'longenough1', age: 26, intent: 'meet' })
    expect(res.status).toBe(201)
    expect(res.body.user.onboarded).toBe(false)
    const handle = res.body.user.id
    expect((await as('kabir').get('/api/users/discover')).body.people.map((p: { id: string }) => p.id)).not.toContain(handle)
    await agent.patch('/api/users/me').set('x-mingleo-csrf', '1').send({ onboarded: true, gender: 'woman', interests: [{ emoji: '☕', label: 'Coffee' }] })
    expect((await as('kabir').get('/api/users/discover')).body.people.map((p: { id: string }) => p.id)).toContain(handle)
  })

  it('signs up a business whose venue stays hidden until an admin verifies it', async () => {
    const agent = request.agent(app)
    const res = await agent.post('/api/auth/register').set('x-mingleo-csrf', '1').send({ account: 'partner', name: 'Owner', email: 'owner@newplace.com', password: 'longenough1', business: { name: 'Sunny Side Café', kind: 'cafe', category: 'Brunch', area: 'Jayanagar' } })
    expect(res.status).toBe(201)
    expect(res.body.user.role).toBe('partner')
    const dash = await agent.get('/api/partner/dashboard')
    expect(dash.body.venue.status).toBe('pending')
    expect((await api.get('/api/venues')).body.venues.map((v: { name: string }) => v.name)).not.toContain('Sunny Side Café')
    await as('nandini').post(`/api/admin/venues/${dash.body.venue.id}/verify`, { approve: true })
    expect((await api.get('/api/venues')).body.venues.map((v: { name: string }) => v.name)).toContain('Sunny Side Café')
  })
})

describe('couples', () => {
  it('links partners by invite and keeps couples out of proposals', async () => {
    expect((await as('kabir').post('/api/couples/invite', { email: 'zoya@demo.mingleo.app' })).status).toBe(202)
    const inv = (await as('zoya').get('/api/couples/me')).body.invites[0]
    expect(inv.incoming).toBe(true)
    expect(inv.person.id).toBe('kabir')
    expect((await as('kabir').post(`/api/couples/${inv.id}/accept`)).status).toBe(404) // only the invitee can accept
    expect((await as('zoya').post(`/api/couples/${inv.id}/accept`)).status).toBe(200)
    expect((await as('kabir').get('/api/couples/me')).body.couple.partner.id).toBe('zoya')
    const p = await as('kabir').post('/api/proposals', { to: 'meera', venueId: 'pine-pour', day: DAYS[1], time: '5:00 PM', treatForReceiver: cappuccino })
    expect(p.status).toBe(409)
  })

  it('keeps a surprise secret from the partner', async () => {
    const isha = (await as('isha').get('/api/bookings')).body.bookings.find((b: { kind: string }) => b.kind === 'surprise')
    expect(isha.secret).toBe(true)
    expect(isha.hint).toBe('Dress up a little.')
    expect(isha).not.toHaveProperty('venue')
    expect(isha).not.toHaveProperty('price')
    const dev = (await as('dev').get('/api/bookings')).body.bookings.find((b: { kind: string }) => b.kind === 'surprise')
    expect(dev.secret).toBe(false)
    expect(dev.venue.name).toBe('Skyline Terrace')
    expect(dev.price).toBeGreaterThan(0)
  })
})

describe('photos', () => {
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex')

  it('serves profile photos only to people with a confirmed date', async () => {
    const up = await agents.rohan.post('/api/media?kind=profile').set('x-mingleo-csrf', '1').set('Content-Type', 'image/png').send(png)
    expect(up.status).toBe(201)
    expect((await agents.rohan.get(up.body.url)).status).toBe(200)
    expect((await agents.ishaan.get(up.body.url)).status).toBe(404)
    const me = await agents.rohan.get('/api/auth/me')
    expect(me.body.user.photos).toContain(up.body.url)
  })

  it('shares memory photos between partners only', async () => {
    const up = await agents.isha.post('/api/media?kind=memory').set('x-mingleo-csrf', '1').set('Content-Type', 'image/png').send(png)
    expect((await agents.dev.get(up.body.url)).status).toBe(200)
    expect((await agents.aarav.get(up.body.url)).status).toBe(404)
    const m = await as('isha').post('/api/memories', { title: 'Picnic', photos: [up.body.url] })
    expect(m.status).toBe(201)
    expect((await as('isha').post('/api/memories', { title: 'Sneaky', photos: ['https://evil.example/x.png'] })).status).toBe(400)
  })
})
