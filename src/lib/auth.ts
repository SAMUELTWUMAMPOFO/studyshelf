// Server-only authentication helpers: scrypt password hashing + DB-backed sessions.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { db } from '@/lib/db'

export const SESSION_COOKIE_NAME = 'studyshelf_session'
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

const SESSION_DURATION_MS = SESSION_MAX_AGE * 1000

export function hashPassword(password: string): string {
  const saltHex = randomBytes(16).toString('hex')
  const hashHex = scryptSync(password, saltHex, 64).toString('hex')
  return `${saltHex}:${hashHex}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  const computed = scryptSync(password, saltHex, 64)
  const expected = Buffer.from(hashHex, 'hex')
  if (computed.length !== expected.length) return false
  return timingSafeEqual(computed, expected)
}

export async function createSession(accountId: string): Promise<string> {
  // Housekeeping: remove expired sessions first.
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  const token = randomBytes(48).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  await db.session.create({ data: { token, accountId, expiresAt } })
  return token
}

export async function getSessionAccount(
  token: string | undefined
): Promise<{ id: string; email: string } | null> {
  if (!token) return null
  const session = await db.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
  })
  if (!session) return null
  const account = await db.adminAccount.findUnique({
    where: { id: session.accountId },
  })
  if (!account) return null
  return { id: account.id, email: account.email }
}

export async function destroySession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } })
}
