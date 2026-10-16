import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { saveUploadFile } from '@/lib/material-files'
import { validateMaterialFields } from '@/lib/material-validation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FIELD_KEYS = [
  'title',
  'courseName',
  'courseCode',
  'programme',
  'level',
  'semester',
  'materialType',
  'description',
  'lecturer',
] as const

// POST /api/admin/materials — create a material (admin only, multipart/form-data).
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in as administrator.' },
      { status: 401 }
    )
  }

  try {
    const formData = await req.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json(
        { error: 'Invalid form submission. Please try again.' },
        { status: 400 }
      )
    }

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: 'Please choose a file to upload.' },
        { status: 400 }
      )
    }

    const fields: Record<string, string> = {}
    for (const key of FIELD_KEYS) {
      const value = formData.get(key)
      if (typeof value === 'string') fields[key] = value
    }

    const validation = validateMaterialFields(fields)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    let saved: { filePath: string; fileSize: number }
    try {
      saved = await saveUploadFile(file)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'File upload failed.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const material = await db.material.create({
      data: {
        ...validation.data,
        filePath: saved.filePath,
        fileType: saved.filePath.split('.').pop() ?? '',
        fileSize: saved.fileSize,
      },
    })

    return NextResponse.json(material, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/materials failed:', err)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
