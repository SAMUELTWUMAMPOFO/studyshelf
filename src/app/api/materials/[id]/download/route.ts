import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readStoredFile, sanitizeDownloadName } from '@/lib/material-files'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function contentTypeFor(fileType: string): string {
  switch (fileType) {
    case 'pdf':
      return 'application/pdf'
    case 'ppt':
      return 'application/vnd.ms-powerpoint'
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    default:
      return 'application/octet-stream'
  }
}

// GET /api/materials/[id]/download — public file download.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const material = await db.material.findUnique({ where: { id } })
    if (!material) {
      return NextResponse.json({ error: 'Material not found.' }, { status: 404 })
    }

    const buffer = await readStoredFile(material.filePath)
    if (!buffer) {
      return NextResponse.json(
        { error: 'File not found on server.' },
        { status: 404 }
      )
    }

    await db.material.update({
      where: { id: material.id },
      data: { downloads: { increment: 1 } },
    })

    const downloadName = sanitizeDownloadName(
      material.title,
      material.courseCode,
      material.fileType
    )

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentTypeFor(material.fileType),
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${downloadName.replace(/["\\]/g, '')}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      },
    })
  } catch (err) {
    console.error('GET /api/materials/[id]/download failed:', err)
    return NextResponse.json(
      { error: 'Download failed. Please try again.' },
      { status: 500 }
    )
  }
}
