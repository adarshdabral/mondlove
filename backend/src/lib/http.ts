import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { ZodError } from 'zod'
import { config } from '../config.js'
import { User, type UserDoc } from '../models/index.js'

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
  }
}

export const badRequest = (m: string) => new HttpError(400, m, 'bad_request')
export const forbidden = (m = 'You can’t do that') => new HttpError(403, m, 'forbidden')
export const notFound = (m = 'Not found') => new HttpError(404, m, 'not_found')
export const conflict = (m: string) => new HttpError(409, m, 'conflict')

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserDoc
    }
  }
}

export const SESSION_COOKIE = 'mingleo_session'

function readCookie(header: string | undefined, name: string) {
  for (const part of (header ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

/**
 * CSRF protection for cookie sessions: state-changing requests must carry a custom header,
 * which cross-site forms and simple requests cannot set. Bearer-token clients are exempt.
 */
export function csrfGuard(req: Request, _res: Response, next: NextFunction) {
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
  const bearer = (req.headers.authorization ?? '').startsWith('Bearer ')
  if (unsafe && !bearer && req.headers['x-mingleo-csrf'] !== '1') throw new HttpError(403, 'Missing CSRF header', 'csrf')
  next()
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: config.jwtTtl as jwt.SignOptions['expiresIn'] })
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : readCookie(req.headers.cookie, SESSION_COOKIE)
  if (!token) throw new HttpError(401, 'Sign in required', 'unauthenticated')
  let sub: string
  try {
    sub = (jwt.verify(token, config.jwtSecret) as jwt.JwtPayload).sub as string
  } catch {
    throw new HttpError(401, 'Session expired', 'unauthenticated')
  }
  const user = await User.findById(sub).lean<UserDoc>()
  if (!user) throw new HttpError(401, 'Account not found', 'unauthenticated')
  if (user.status === 'suspended') throw forbidden('This account is suspended')
  req.user = user
  next()
}

/** Attaches the user when a valid session is present; never rejects. For mixed public/private routes. */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    await requireAuth(req, res, () => {})
  } catch {
    req.user = undefined
  }
  next()
}

export const requireRole =
  (...roles: Array<'user' | 'partner' | 'admin'>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as 'user')) throw forbidden()
    next()
  }

export function me(req: Request): UserDoc {
  if (!req.user) throw new HttpError(401, 'Sign in required')
  return req.user
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Invalid request', code: 'validation', issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) })
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code })
  if (typeof err === 'object' && err && 'code' in err && (err as { code: number }).code === 11000) {
    return res.status(409).json({ error: 'Already exists', code: 'conflict' })
  }
  console.error(err)
  res.status(500).json({ error: 'Something went wrong', code: 'internal' })
}

export const bookingRef = () => 'MGL-' + Math.random().toString(36).slice(2, 7).toUpperCase()

const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }

/** Parses the UI's "Fri, 9 Oct" + "7:30 PM" labels into a Date (year inferred: next occurrence). */
export function parseSlot(day: string, time: string, now = new Date()): Date {
  const m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(day)
  const t = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(time)
  if (!m || !t || MONTHS[m[2]] === undefined) throw badRequest(`Unrecognised date/time: ${day} ${time}`)
  let h = Number(t[1]) % 12
  if (t[3].toUpperCase() === 'PM') h += 12
  const d = new Date(now.getFullYear(), MONTHS[m[2]], Number(m[1]), h, Number(t[2]))
  if (d.getTime() < now.getTime() - 180 * 864e5) d.setFullYear(d.getFullYear() + 1)
  return d
}

export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const weekday = (d: Date) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
