import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config.js'
import { csrfGuard, errorHandler } from './lib/http.js'
import { dbState } from './db.js'
import { auth } from './routes/auth.js'
import { consumer } from './routes/consumer.js'
import { experience } from './routes/experience.js'
import { media } from './routes/media.js'
import { partner } from './routes/partner.js'
import { admin } from './routes/admin.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }))
  app.use(cors({ origin: config.webOrigins, credentials: true }))
  app.use('/api/media', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '3mb' }))
  app.use(express.json({ limit: '200kb' }))
  app.use(csrfGuard)

  // Liveness + readiness: 503 while the database is unavailable so load balancers stop routing traffic.
  app.get('/api/health', (_req, res) => {
    const db = dbState()
    res.status(db === 'connected' ? 200 : 503).json({ ok: db === 'connected', service: 'mingleo-backend', db })
  })

  app.use('/api/auth', auth) // Auth service
  app.use('/api/media', media) // Photos with per-request access checks
  app.use('/api', experience) // Experience service (public catalogue + Date Lab)
  app.use('/api/partner', partner) // Business dashboards
  app.use('/api/admin', admin) // Platform admin
  app.use('/api', consumer) // Booking service + users, couples, memories, safety

  app.use((_req, res) => res.status(404).json({ error: 'Not found', code: 'not_found' }))
  app.use(errorHandler)
  return app
}
