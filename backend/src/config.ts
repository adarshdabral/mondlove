import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Load backend/.env when present (Node >= 20.12). Real environment variables take precedence,
// so hosting platforms can inject config without a file.
const envFile = resolve(process.cwd(), '.env')
if (existsSync(envFile)) process.loadEnvFile(envFile)

const env = process.env
const isProd = env.NODE_ENV === 'production'

function required(name: string, devDefault: string) {
  const v = env[name]
  if (v) return v
  if (isProd) throw new Error(`${name} must be set in production`)
  return devDefault
}

export const config = {
  isProd,
  port: Number(env.PORT ?? 4000),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/mingleo'),
  jwtSecret: required('JWT_SECRET', 'mingleo-dev-secret-do-not-use-in-production'),
  jwtTtl: '7d',
  // Comma-separated list of allowed frontend origins.
  webOrigins: (env.WEB_ORIGIN ?? 'http://localhost:3100').split(',').map((s) => s.trim()).filter(Boolean),
  proposalsPerHour: Number(env.PROPOSALS_PER_HOUR ?? 20),
  defaultCommission: 0.12,
  giftCommission: 0.2,
}

/** Connection string safe to print: credentials removed. */
export const redactUri = (uri: string) => uri.replace(/\/\/[^@/]+@/, '//***@')
