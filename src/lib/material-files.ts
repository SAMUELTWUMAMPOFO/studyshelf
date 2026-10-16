// Server-only file storage helpers for study material uploads.
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  ACCEPTED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from '@/lib/constants'

export const UPLOAD_DIR = path.join(process.cwd(), 'db', 'uploads')

export function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  if (dot <= 0 || dot === filename.length - 1) return ''
  return filename.slice(dot + 1).toLowerCase()
}

export function isAcceptedExtension(ext: string): boolean {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)
}

export function generateStoredFileName(ext: string): string {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
}

export async function saveUploadFile(
  file: File
): Promise<{ filePath: string; fileSize: number }> {
  const ext = getExtension(file.name)
  if (!isAcceptedExtension(ext)) {
    throw new Error('Unsupported file type. Please upload a PDF, PPT or PPTX file.')
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`)
  }
  if (file.size === 0) {
    throw new Error('The selected file is empty.')
  }
  await mkdir(UPLOAD_DIR, { recursive: true })
  const storedName = generateStoredFileName(ext)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer)
  return { filePath: storedName, fileSize: file.size }
}

export function resolveStoredFilePath(filePath: string): string | null {
  if (!filePath || filePath.includes('/') || filePath.includes('\\') || filePath.includes('..')) {
    return null
  }
  return path.join(UPLOAD_DIR, filePath)
}

export async function deleteStoredFile(filePath: string): Promise<void> {
  const resolved = resolveStoredFilePath(filePath)
  if (!resolved) return
  try {
    await unlink(resolved)
  } catch {
    // File may already be gone; ignore.
  }
}

export async function readStoredFile(filePath: string): Promise<Buffer | null> {
  const resolved = resolveStoredFilePath(filePath)
  if (!resolved) return null
  try {
    return await readFile(resolved)
  } catch {
    return null
  }
}

// Build a safe download filename like "CSC201-Data-Structures.pdf".
export function sanitizeDownloadName(title: string, courseCode: string, ext: string): string {
  const clean = (value: string) =>
    value
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  const parts = [clean(courseCode), clean(title)].filter(Boolean)
  const base = parts.join('-') || 'material'
  return ext ? `${base}.${ext}` : base
}
