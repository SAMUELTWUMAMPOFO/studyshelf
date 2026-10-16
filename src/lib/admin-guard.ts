// Shared guard for admin API routes.
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, getSessionAccount } from '@/lib/auth'

export async function requireAdmin(
  req: NextRequest
): Promise<{ account: { id: string; email: string } } | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  const account = await getSessionAccount(token)
  if (!account) return null
  return { account }
}
