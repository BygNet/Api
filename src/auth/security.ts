import { createHmac, randomBytes, randomInt } from 'node:crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const TOTP_DIGITS = 6
const TOTP_STEP_SECONDS = 30
const TOTP_WINDOW = 1
const TOTP_ISSUER = process.env.TOTP_ISSUER ?? 'Byg'
const RESEND_API_URL = 'https://api.resend.com/emails'
const RESEND_FROM = process.env.RESEND_FROM ?? 'Byg <onboarding@resend.dev>'

function normalizeBase32(input: string): string {
  return input.replace(/[\s-]+/g, '').toUpperCase()
}

function decodeBase32(input: string): Uint8Array {
  const normalized = normalizeBase32(input)
  let buffer = 0
  let bitsLeft = 0
  const output: number[] = []

  for (const char of normalized) {
    const value = BASE32_ALPHABET.indexOf(char)
    if (value < 0) {
      throw new Error('Invalid base32 secret')
    }

    buffer = (buffer << 5) | value
    bitsLeft += 5

    if (bitsLeft >= 8) {
      output.push((buffer >>> (bitsLeft - 8)) & 0xff)
      bitsLeft -= 8
    }
  }

  return Uint8Array.from(output)
}

function encodeBase32(bytes: Uint8Array): string {
  let output = ''
  let buffer = 0
  let bitsLeft = 0

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte
    bitsLeft += 8

    while (bitsLeft >= 5) {
      output += BASE32_ALPHABET[(buffer >>> (bitsLeft - 5)) & 31]
      bitsLeft -= 5
    }
  }

  if (bitsLeft > 0) {
    output += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 31]
  }

  return output
}

function formatBase32Secret(secret: string): string {
  return (
    normalizeBase32(secret)
      .match(/.{1,4}/g)
      ?.join(' ') ?? secret
  )
}

function generateTotpTokenForCounter(secret: string, counter: number): string {
  const key = Buffer.from(decodeBase32(secret))
  const message = Buffer.alloc(8)
  message.writeBigUInt64BE(BigInt(counter))

  const digest = createHmac('sha1', key).update(message).digest()
  const offset = digest[digest.length - 1] & 0xf
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0')
}

export function normalizeOneTimeCode(code: string): string {
  return code.replace(/\s+/g, '').trim()
}

export function generateEmailVerificationCode(): string {
  let output = ''

  for (let index = 0; index < 6; index += 1) {
    output += String(randomInt(0, 10))
  }

  return output
}

export function generateTwoFactorSecret(): {
  secret: string
  manualEntryKey: string
} {
  const secret = encodeBase32(randomBytes(20))

  return {
    secret,
    manualEntryKey: formatBase32Secret(secret),
  }
}

export function createTotpProvisioningUri(input: {
  email: string
  username: string
  secret: string
}): string {
  const accountLabel = encodeURIComponent(
    `${TOTP_ISSUER}:${input.email || input.username}`
  )
  const issuer = encodeURIComponent(TOTP_ISSUER)
  const secret = encodeURIComponent(normalizeBase32(input.secret))

  return `otpauth://totp/${accountLabel}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const normalizedCode = normalizeOneTimeCode(code)
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false
  }

  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS)

  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    const expected = generateTotpTokenForCounter(
      secret,
      currentCounter + offset
    )

    if (expected === normalizedCode) {
      return true
    }
  }

  return false
}

export async function sendEmailVerificationEmail(input: {
  email: string
  username: string
  code: string
}): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim()

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY is missing, skipping email verification send')
    return
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [input.email],
      subject: 'Verify your Byg email',
      text: `Hi ${input.username}, your Byg email verification code is ${input.code}.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Verify your Byg email</h2>
          <p>Hi ${input.username},</p>
          <p>Your verification code is:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.35em;">${input.code}</p>
          <p>Enter this code in Byg to verify your email address.</p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Resend email send failed: ${response.status} ${body}`)
  }
}
