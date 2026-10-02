import mongoose from 'mongoose'
import { config, redactUri } from './config.js'
import { connectDb } from './db.js'
import { createApp } from './app.js'

try {
  await connectDb(undefined, { watch: true })
} catch {
  process.exit(1)
}
console.log(`Connected to MongoDB ${redactUri(config.mongoUri)}`)

const server = createApp().listen(config.port, () => {
  console.log(`Mingleo backend on http://localhost:${config.port} (CORS: ${config.webOrigins.join(', ')})`)
})
server.on('error', (e: NodeJS.ErrnoException) => {
  console.error(e.code === 'EADDRINUSE' ? `✖ Port ${config.port} is already in use. Set PORT in backend/.env.` : e)
  process.exit(1)
})

let closing = false
const shutdown = async (signal: string) => {
  if (closing) return
  closing = true
  console.log(`${signal} received, shutting down…`)
  server.close(async () => {
    await mongoose.disconnect()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('unhandledRejection', (e) => console.error('Unhandled rejection:', e))
