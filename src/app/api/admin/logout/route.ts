import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME, destroySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/admin/logout — invalidate the session and clear the cookie.
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
    if (token) {
      await destroySession(token)
    }
  } catch (err) {
    console.error('POST /api/admin/logout failed:', err)
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return res
}
