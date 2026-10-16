// Shared guard for admin API routes.
//
// Accepts the session token from either the X-Session-Token header (works
// everywhere, including embedded preview iframes where third-party cookies
// are blocked) or the httpOnly session cookie (top-level browsing).
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, getSessionAccount } from '@/lib/auth'

export const SESSION_TOKEN_HEADER = 'x-session-token'

export async function requireAdmin(
  req: NextRequest
): Promise<{ account: { id: string; email: string } } | null> {
  const token =
    req.headers.get(SESSION_TOKEN_HEADER) ??
    req.cookies.get(SESSION_COOKIE_NAME)?.value ??
    undefined
  const account = await getSessionAccount(token)
  if (!account) return null
  return { account }
}

export function requestSessionToken(req: NextRequest): string | undefined {
  return (
    req.headers.get(SESSION_TOKEN_HEADER) ??
    req.cookies.get(SESSION_COOKIE_NAME)?.value ??
    undefined
  )
}
