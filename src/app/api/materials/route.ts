import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/materials — public browse/search endpoint.
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const search = sp.get('search')?.trim() ?? ''
    const programme = sp.get('programme')?.trim() ?? ''
    const level = sp.get('level')?.trim() ?? ''
    const semester = sp.get('semester')?.trim() ?? ''
    const course = sp.get('course')?.trim() ?? ''
    const type = sp.get('type')?.trim() ?? ''

    const where: Prisma.MaterialWhereInput = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { courseName: { contains: search } },
        { courseCode: { contains: search } },
        { description: { contains: search } },
        { lecturer: { contains: search } },
      ]
    }
    if (programme) where.programme = programme
    if (level) where.level = level
    if (semester) where.semester = semester
    if (course) where.courseCode = course
    if (type) where.materialType = type

    const [materials, totalCountUnfiltered, downloadsAgg, courses] = await Promise.all([
      db.material.findMany({ where, orderBy: { createdAt: 'desc' } }),
      db.material.count(),
      db.material.aggregate({ _sum: { downloads: true } }),
      db.material.findMany({
        distinct: ['courseCode'],
        select: { courseCode: true, courseName: true },
        orderBy: { courseCode: 'asc' },
      }),
    ])

    return NextResponse.json({
      materials,
      courses,
      stats: {
        materials: totalCountUnfiltered,
        downloads: downloadsAgg._sum.downloads ?? 0,
      },
    })
  } catch (err) {
    console.error('GET /api/materials failed:', err)
    return NextResponse.json(
      { error: 'Could not load study materials. Please try again.' },
      { status: 500 }
    )
  }
}
