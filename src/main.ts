import { createApp } from '@/app'
import { isProd } from '@/data/client'
import {
  logger,
  shutdownObservability,
} from '@/observability/logger'

const app = createApp()
const port = isProd ? 3000 : 2255

app.listen(port)

logger.info('server.started', {
  environment: isProd ? 'production' : 'development',
  hostname: app.server?.hostname,
  port: app.server?.port,
})

async function shutdown(signal: string) {
  logger.info('server.shutdown_requested', { signal })
  await shutdownObservability()
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
