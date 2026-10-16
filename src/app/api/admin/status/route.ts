import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME, getSessionAccount } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/admin/status — public; tells the UI whether setup/login is needed.
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
    const [account, adminCount] = await Promise.all([
      getSessionAccount(token),
      db.adminAccount.count(),
    ])

    return NextResponse.json({
      authenticated: Boolean(account),
      email: account?.email,
      needsSetup: adminCount === 0,
      requiresCode: Boolean(process.env.ADMIN_SETUP_CODE),
    })
  } catch (err) {
    console.error('GET /api/admin/status failed:', err)
    return NextResponse.json(
      { error: 'Could not check administrator status. Please try again.' },
      { status: 500 }
    )
  }
}
