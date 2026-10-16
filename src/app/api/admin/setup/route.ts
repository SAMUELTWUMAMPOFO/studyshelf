import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE, createSession, hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/admin/setup — one-time creation of the administrator account.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: unknown; password?: unknown; confirmPassword?: unknown; setupCode?: unknown }
      | null

    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const confirmPassword =
      typeof body?.confirmPassword === 'string' ? body.confirmPassword : ''
    const setupCode = typeof body?.setupCode === 'string' ? body.setupCode : ''

    const adminCount = await db.adminAccount.count()
    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Administrator account already configured.' },
        { status: 403 }
      )
    }

    if (process.env.ADMIN_SETUP_CODE && setupCode !== process.env.ADMIN_SETUP_CODE) {
      return NextResponse.json({ error: 'Invalid setup code.' }, { status: 403 })
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      )
    }

    const existing = await db.adminAccount.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Administrator account already configured.' },
        { status: 403 }
      )
    }

    const account = await db.adminAccount.create({
      data: { email, passwordHash: hashPassword(password) },
    })

    // Auto sign-in: the person who just created the account obviously knows
    // the credentials, so take them straight to the dashboard. The token is
    // also returned for cookie-less contexts (embedded preview iframes).
    const token = await createSession(account.id)
    const res = NextResponse.json({ ok: true, email: account.email, token })
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
    return res
  } catch (err) {
    console.error('POST /api/admin/setup failed:', err)
    return NextResponse.json(
      { error: 'Setup failed. Please try again.' },
      { status: 500 }
    )
  }
}
