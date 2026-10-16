// Shared StudyShelf constants used by both the API and the UI.

export const PROGRAMMES = [
  "Computer Science",
  "Information Technology",
  "Business Administration",
  "Accounting",
  "Economics",
  "Engineering",
  "Nursing",
  "Medicine",
  "Law",
  "Education",
  "Agriculture",
  "Liberal Arts",
  "Other",
] as const;

export const LEVELS = ["100", "200", "300", "400"] as const;

export const SEMESTERS = ["Semester 1", "Semester 2"] as const;

export const MATERIAL_TYPES = [
  "Lecture Slides",
  "Lecture Notes",
  "Past Questions",
  "Assignments",
  "Lab Manuals",
  "Textbooks",
  "Other",
] as const;

export type Programme = (typeof PROGRAMMES)[number];
export type Level = (typeof LEVELS)[number];
export type Semester = (typeof SEMESTERS)[number];
export type MaterialType = (typeof MATERIAL_TYPES)[number];

// Accepted file types. New educational file types can be added here later
// (e.g. docx, xlsx) — the API and UI both read from this list.
export const ACCEPTED_FILE_TYPES = [
  {
    ext: "pdf",
    label: "PDF",
    mimes: ["application/pdf"],
  },
  {
    ext: "ppt",
    label: "PowerPoint (PPT)",
    mimes: ["application/vnd.ms-powerpoint"],
  },
  {
    ext: "pptx",
    label: "PowerPoint (PPTX)",
    mimes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  },
] as const;

export const ACCEPTED_EXTENSIONS = ACCEPTED_FILE_TYPES.map((t) => t.ext);

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
