import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { deleteStoredFile, saveUploadFile } from '@/lib/material-files'
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

// PATCH /api/admin/materials/[id] — update metadata, optionally replace the file.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req)
  if (!guard) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in as administrator.' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const material = await db.material.findUnique({ where: { id } })
    if (!material) {
      return NextResponse.json({ error: 'Material not found.' }, { status: 404 })
    }

    const contentType = req.headers.get('content-type') ?? ''
    const isMultipart = contentType.includes('multipart/form-data')

    let fields: Record<string, string> = {}
    let fileUpdate: {
      filePath: string
      fileType: string
      fileSize: number
    } | null = null

    if (isMultipart) {
      const formData = await req.formData().catch(() => null)
      if (!formData) {
        return NextResponse.json(
          { error: 'Invalid form submission. Please try again.' },
          { status: 400 }
        )
      }
      for (const key of FIELD_KEYS) {
        const value = formData.get(key)
        if (typeof value === 'string') fields[key] = value
      }

      const file = formData.get('file')
      if (file instanceof File && file.size > 0) {
        try {
          const saved = await saveUploadFile(file)
          await deleteStoredFile(material.filePath) // best effort cleanup of old file
          fileUpdate = {
            filePath: saved.filePath,
            fileType: saved.filePath.split('.').pop() ?? '',
            fileSize: saved.fileSize,
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'File upload failed.'
          return NextResponse.json({ error: message }, { status: 400 })
        }
      }
    } else {
      const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
      if (!body) {
        return NextResponse.json(
          { error: 'Invalid request body. Please try again.' },
          { status: 400 }
        )
      }
      for (const key of FIELD_KEYS) {
        const value = body[key]
        if (typeof value === 'string') fields[key] = value
      }
    }

    if (Object.keys(fields).length > 0 || fileUpdate) {
      const data: Prisma.MaterialUpdateInput = {}

      if (Object.keys(fields).length > 0) {
        const validation = validateMaterialFields(fields, { partial: true })
        if (!validation.ok) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }
        const { description, lecturer, ...requiredFields } = validation.data
        // Required fields: only set the ones actually sent and non-empty.
        if (requiredFields.title) data.title = requiredFields.title
        if (requiredFields.courseName) data.courseName = requiredFields.courseName
        if (requiredFields.courseCode) data.courseCode = requiredFields.courseCode
        if (requiredFields.programme) data.programme = requiredFields.programme
        if (requiredFields.level) data.level = requiredFields.level
        if (requiredFields.semester) data.semester = requiredFields.semester
        if (requiredFields.materialType) data.materialType = requiredFields.materialType
        // Optional fields: only update when the key was actually sent.
        if ('description' in fields) data.description = description
        if ('lecturer' in fields) data.lecturer = lecturer
      }

      if (fileUpdate) {
        data.filePath = fileUpdate.filePath
        data.fileType = fileUpdate.fileType
        data.fileSize = fileUpdate.fileSize
      }

      const updated = await db.material.update({ where: { id }, data })
      return NextResponse.json(updated)
    }

    return NextResponse.json(
      { error: 'Nothing to update. Please change at least one field.' },
      { status: 400 }
    )
  } catch (err) {
    console.error('PATCH /api/admin/materials/[id] failed:', err)
    return NextResponse.json(
      { error: 'Update failed. Please try again.' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/materials/[id] — remove a material and its file.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req)
  if (!guard) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in as administrator.' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const material = await db.material.findUnique({ where: { id } })
    if (!material) {
      return NextResponse.json({ error: 'Material not found.' }, { status: 404 })
    }

    await deleteStoredFile(material.filePath)
    await db.material.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/materials/[id] failed:', err)
    return NextResponse.json(
      { error: 'Delete failed. Please try again.' },
      { status: 500 }
    )
  }
}
