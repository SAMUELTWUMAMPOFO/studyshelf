import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSession,
  verifyPassword,
} from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Simple in-memory brute-force protection per IP.
const MAX_FAILS = 5
const LOCK_MS = 10 * 60 * 1000
const failTracker = new Map<string, { fails: number; lockUntil: number }>()

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
}

// POST /api/admin/login — exchange credentials for a session cookie.
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const record = failTracker.get(ip)
    if (record && record.lockUntil > Date.now()) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again in a few minutes.' },
        { status: 429 }
      )
    }

    const body = (await req.json().catch(() => null)) as
      | { email?: unknown; password?: unknown }
      | null
    const email =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    const account = email ? await db.adminAccount.findUnique({ where: { email } }) : null
    const valid = account ? verifyPassword(password, account.passwordHash) : false

    if (!account || !valid) {
      const fails = (record?.fails ?? 0) + 1
      failTracker.set(ip, {
        fails,
        lockUntil: fails >= MAX_FAILS ? Date.now() + LOCK_MS : 0,
      })
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    failTracker.delete(ip)

    const token = await createSession(account.id)
    const res = NextResponse.json({ ok: true, email: account.email })
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
    return res
  } catch (err) {
    console.error('POST /api/admin/login failed:', err)
    return NextResponse.json(
      { error: 'Sign in failed. Please try again.' },
      { status: 500 }
    )
  }
}
