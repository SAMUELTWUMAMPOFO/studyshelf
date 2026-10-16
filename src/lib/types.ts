// Shared API types for StudyShelf.

export interface Material {
  id: string;
  title: string;
  courseName: string;
  courseCode: string;
  programme: string;
  level: string;
  semester: string;
  materialType: string;
  description: string | null;
  lecturer: string | null;
  filePath: string; // internal stored filename (not used by the UI)
  fileType: string; // "pdf" | "ppt" | "pptx"
  fileSize: number; // bytes
  downloads: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface CourseFacet {
  courseCode: string;
  courseName: string;
}

export interface MaterialsResponse {
  materials: Material[];
  courses: CourseFacet[];
  stats: {
    materials: number;
    downloads: number;
  };
}

export interface AdminStatus {
  authenticated: boolean;
  email?: string;
  needsSetup: boolean; // true when no administrator account exists yet
  requiresCode: boolean; // true when ADMIN_SETUP_CODE env var is configured
}

// All API errors use this shape: { "error": "human readable message" }
