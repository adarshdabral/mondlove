import mongoose from 'mongoose'
import { config, redactUri } from './config.js'

mongoose.set('strictQuery', true)

/** Connects to MongoDB with a clear error if the server can't be reached. */
export async function connectDb(uri = config.mongoUri, { watch = false } = {}) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, maxPoolSize: 20 })
  } catch (e) {
    const err = e as Error
    console.error(`\n✖ Could not connect to MongoDB at ${redactUri(uri)}\n  ${err.message}\n`)
    if (/ECONNREFUSED/.test(err.message)) console.error('  Is MongoDB running? Set MONGODB_URI in backend/.env.\n')
    if (/auth|Authentication/i.test(err.message)) console.error('  Check the username and password in MONGODB_URI.\n')
    if (/ENOTFOUND|querySrv/i.test(err.message)) console.error('  The cluster host could not be resolved. Check MONGODB_URI and your network.\n')
    if (/whitelist|IP|not authorized|Server selection timed out/i.test(err.message)) console.error('  If this is Atlas, make sure this machine’s IP is allowed under Network Access.\n')
    throw err
  }
  // Long-running processes log connection drops; one-off scripts (seed) disconnect on purpose.
  if (watch) {
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'))
    mongoose.connection.on('reconnected', () => console.info('MongoDB reconnected'))
    mongoose.connection.on('error', (e) => console.error('MongoDB error:', e.message))
  }
  return mongoose.connection
}

const STATES: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
export const dbState = () => STATES[mongoose.connection.readyState] ?? 'unknown'
