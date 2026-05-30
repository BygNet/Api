import { logs, SeverityNumber } from '@opentelemetry/api-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { NodeSDK } from '@opentelemetry/sdk-node'

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
type LogAttribute = string | number | boolean
export type LogAttributes = Record<string, unknown>

interface ObservabilityOptions {
  serviceName: string
  serviceVersion?: string
  environment?: string
}

const severityNumbers: Record<LogLevel, SeverityNumber> = {
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
}

let sdk: NodeSDK | null = null
let sdkStarted = false

function posthogLogsUrl(): string {
  const configuredUrl = process.env.POSTHOG_LOGS_URL?.trim()
  if (configuredUrl) return configuredUrl

  const host =
    process.env.POSTHOG_HOST?.trim() ?? process.env.POSTHOG_API_HOST?.trim()

  if (host) {
    return `${host.replace(/\/$/, '')}/i/v1/logs`
  }

  return 'https://us.i.posthog.com/i/v1/logs'
}

function normalizeAttribute(value: unknown): LogAttribute | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return value
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) return value.message
  if (value === null) return 'null'
  if (value === undefined) return undefined

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function normalizeAttributes(
  attributes: LogAttributes = {}
): Record<string, LogAttribute> {
  const normalized: Record<string, LogAttribute> = {}

  for (const [key, value] of Object.entries(attributes)) {
    const normalizedValue = normalizeAttribute(value)
    if (normalizedValue !== undefined) {
      normalized[key] = normalizedValue
    }
  }

  return normalized
}

function errorAttributes(error: unknown): Record<string, LogAttribute> {
  if (!(error instanceof Error)) {
    return {
      'exception.message': normalizeAttribute(error) ?? 'Unknown error',
    }
  }

  return {
    'exception.type': error.name,
    'exception.message': error.message,
    ...(error.stack ? { 'exception.stacktrace': error.stack } : {}),
  }
}

class StructuredLogger {
  private readonly otelLogger = logs.getLogger('byg-api')

  emit(
    level: LogLevel,
    eventName: string,
    attributes: LogAttributes = {}
  ): void {
    const normalizedAttributes = {
      'event.name': eventName,
      ...normalizeAttributes(attributes),
    }

    this.otelLogger.emit({
      severityNumber: severityNumbers[level],
      severityText: level,
      body: eventName,
      attributes: normalizedAttributes,
    })

    const consolePayload = {
      level,
      event: eventName,
      timestamp: new Date().toISOString(),
      ...normalizedAttributes,
    }

    const line = JSON.stringify(consolePayload)
    if (level === 'error' || level === 'fatal') {
      console.error(line)
    } else if (level === 'warn') {
      console.warn(line)
    } else {
      console.info(line)
    }
  }

  trace(eventName: string, attributes?: LogAttributes): void {
    this.emit('trace', eventName, attributes)
  }

  debug(eventName: string, attributes?: LogAttributes): void {
    this.emit('debug', eventName, attributes)
  }

  info(eventName: string, attributes?: LogAttributes): void {
    this.emit('info', eventName, attributes)
  }

  warn(eventName: string, attributes?: LogAttributes): void {
    this.emit('warn', eventName, attributes)
  }

  error(
    eventName: string,
    error?: unknown,
    attributes: LogAttributes = {}
  ): void {
    this.emit('error', eventName, {
      ...attributes,
      ...errorAttributes(error),
    })
  }

  fatal(
    eventName: string,
    error?: unknown,
    attributes: LogAttributes = {}
  ): void {
    this.emit('fatal', eventName, {
      ...attributes,
      ...errorAttributes(error),
    })
  }
}

export const logger = new StructuredLogger()

export function initObservability(options: ObservabilityOptions): void {
  if (sdkStarted) return

  const token =
    process.env.POSTHOG_PROJECT_TOKEN?.trim() ??
    process.env.POSTHOG_TOKEN?.trim()

  if (!token) {
    logger.warn('observability.posthog_logs_disabled', {
      reason: 'missing_posthog_project_token',
    })
    return
  }

  if (token.startsWith('phx_')) {
    logger.warn('observability.posthog_logs_disabled', {
      reason: 'personal_api_key_configured',
    })
    return
  }

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      'service.name': options.serviceName,
      ...(options.serviceVersion
        ? { 'service.version': options.serviceVersion }
        : {}),
      ...(options.environment
        ? { 'deployment.environment': options.environment }
        : {}),
    }),
    logRecordProcessor: new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: posthogLogsUrl(),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    ),
  })

  sdk.start()
  sdkStarted = true

  logger.info('observability.posthog_logs_started', {
    logsUrl: posthogLogsUrl(),
    serviceName: options.serviceName,
    serviceVersion: options.serviceVersion,
    environment: options.environment,
  })
}

export async function shutdownObservability(): Promise<void> {
  if (!sdkStarted || !sdk) return

  await sdk.shutdown()
  sdkStarted = false
  sdk = null
}
