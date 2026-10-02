import { Router, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { config } from '../config.js'
import { User, Venue, type UserDoc } from '../models/index.js'
import { HttpError, SESSION_COOKIE, conflict, me, requireAuth, signToken } from '../lib/http.js'
import { selfDto } from '../lib/dto.js'

/** Auth service: registration (people and businesses), login, session, logout. */
export const auth = Router()

const DEFAULT_AVATAR = { skin: '#D9A27C', hair: 'short', hairColor: '#1F1A1C', bg: ['#FDE3D3', '#F6C9A8'], shirt: '#1E1B2E', accessory: 'none' }

function startSession(res: Response, user: { _id: unknown }) {
  res.cookie(SESSION_COOKIE, signToken(String(user._id)), {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    path: '/',
    maxAge: 7 * 864e5,
  })
}

async function uniqueHandle(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 16) || 'user'
  for (let i = 0; i < 5; i++) {
    const h = `${base}${Math.random().toString(36).slice(2, 6)}`
    if (!(await User.exists({ handle: h }))) return h
  }
  return `${base}${Date.now().toString(36)}`
}

const Person = z.object({
  account: z.literal('person'),
  name: z.string().trim().min(1).max(40),
  email: z.string().trim().email(),
  password: z.string().min(8, 'Use at least 8 characters').max(200),
  age: z.number().int().min(18, 'Mingleo is for adults (18+)').max(100),
  intent: z.enum(['meet', 'plan', 'both']).default('meet'),
})

const Business = z.object({
  account: z.literal('partner'),
  name: z.string().trim().min(1).max(60),
  email: z.string().trim().email(),
  password: z.string().min(8, 'Use at least 8 characters').max(200),
  business: z.object({
    name: z.string().trim().min(2).max(80),
    kind: z.enum(['cafe', 'restaurant', 'activity']),
    category: z.string().trim().min(2).max(40),
    area: z.string().trim().min(2).max(60),
  }),
})

auth.post('/register', async (req, res) => {
  const body = z.discriminatedUnion('account', [Person, Business]).parse({ account: 'person', ...req.body })
  if (await User.exists({ email: body.email.toLowerCase() })) throw conflict('An account with this email already exists')
  const passwordHash = await bcrypt.hash(body.password, 10)

  if (body.account === 'partner') {
    const user = await User.create({ handle: await uniqueHandle(body.name), name: body.name, email: body.email, passwordHash, role: 'partner', avatar: DEFAULT_AVATAR })
    const slug = `${body.business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Math.random().toString(36).slice(2, 5)}`
    // New businesses start pending; an admin verifies documents before they appear to users.
    await Venue.create({
      slug, name: body.business.name, kind: body.business.kind, category: body.business.category, area: body.business.area, owner: user._id, status: 'draft', // completed through the listing wizard, then submitted for review
      emoji: body.business.kind === 'activity' ? '🎨' : body.business.kind === 'cafe' ? '☕' : '🍽️', tone: ['#FBEFD3', '#D9A23B'], slots: [],
    })
    startSession(res, user)
    return res.status(201).json({ user: selfDto(user.toObject() as UserDoc) })
  }

  const mode = body.intent === 'plan' ? 'couple' : body.intent === 'both' ? 'both' : 'single'
  const user = await User.create({
    handle: await uniqueHandle(body.name),
    name: body.name,
    email: body.email,
    passwordHash,
    age: body.age,
    mode,
    onboarded: false,
    avatar: DEFAULT_AVATAR,
    verification: { status: 'pending', method: 'Selfie liveness' },
  })
  startSession(res, user)
  res.status(201).json({ user: selfDto(user.toObject() as UserDoc) })
})

const Login = z.object({ email: z.string().trim().email(), password: z.string().min(1) })

auth.post('/login', async (req, res) => {
  const { email, password } = Login.parse(req.body)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
  // Same message for unknown email and wrong password to avoid account enumeration.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(401, 'Email or password is incorrect', 'invalid_credentials')
  if (user.status === 'suspended') throw new HttpError(403, 'This account is suspended. Contact support@mingleo.app.', 'suspended')
  startSession(res, user)
  res.json({ user: selfDto(user.toObject() as UserDoc) })
})

auth.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: '/' })
  res.json({ ok: true })
})

auth.get('/me', requireAuth, (req, res) => {
  res.json({ user: selfDto(me(req)) })
})
