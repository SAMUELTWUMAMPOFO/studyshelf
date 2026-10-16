// Validation for material form fields shared by create and update routes.
import { LEVELS, MATERIAL_TYPES, PROGRAMMES, SEMESTERS } from '@/lib/constants'

export interface MaterialFields {
  title: string
  courseName: string
  courseCode: string
  programme: string
  level: string
  semester: string
  materialType: string
  description: string | null
  lecturer: string | null
}

type ValidationResult =
  | { ok: true; data: MaterialFields }
  | { ok: false; error: string }

function checkEnum(
  value: string,
  allowed: readonly string[],
  label: string
): string | null {
  return allowed.includes(value) ? null : `Please select a valid ${label}.`
}

export function validateMaterialFields(
  fields: Record<string, string>,
  opts: { partial?: boolean } = {}
): ValidationResult {
  const { partial = false } = opts
  const errors: string[] = []

  const trimmed: Record<string, string> = {}
  for (const [key, value] of Object.entries(fields)) {
    trimmed[key] = typeof value === 'string' ? value.trim() : value
  }

  const requireField = (key: string, label: string, max: number) => {
    const value = trimmed[key] ?? ''
    if (!value) {
      errors.push(`${label} is required.`)
    } else if (value.length > max) {
      errors.push(`${label} must be at most ${max} characters.`)
    }
  }

  if (!partial || 'title' in trimmed) requireField('title', 'Title', 200)
  if (!partial || 'courseName' in trimmed) requireField('courseName', 'Course name', 150)
  if (!partial || 'courseCode' in trimmed) requireField('courseCode', 'Course code', 40)

  const checkIfPresent = (key: string, allowed: readonly string[], label: string) => {
    if (!(key in trimmed)) return
    const value = trimmed[key] ?? ''
    if (!value) return // empty values are handled by the required-field checks
    const err = checkEnum(value, allowed, label)
    if (err) errors.push(err)
  }

  checkIfPresent('programme', PROGRAMMES, 'programme')
  checkIfPresent('level', LEVELS, 'level')
  checkIfPresent('semester', SEMESTERS, 'semester')
  checkIfPresent('materialType', MATERIAL_TYPES, 'material type')

  const description = trimmed.description ?? ''
  if (description.length > 1000) {
    errors.push('Description must be at most 1000 characters.')
  }
  const lecturer = trimmed.lecturer ?? ''
  if (lecturer.length > 120) {
    errors.push('Lecturer must be at most 120 characters.')
  }

  if (errors.length > 0) {
    return { ok: false, error: errors[0] }
  }

  const data: MaterialFields = {
    title: trimmed.title ?? '',
    courseName: trimmed.courseName ?? '',
    courseCode: trimmed.courseCode ?? '',
    programme: trimmed.programme ?? '',
    level: trimmed.level ?? '',
    semester: trimmed.semester ?? '',
    materialType: trimmed.materialType ?? '',
    description: description ? description : null,
    lecturer: lecturer ? lecturer : null,
  }

  return { ok: true, data }
}
