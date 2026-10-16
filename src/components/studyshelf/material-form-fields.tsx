"use client";

import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEVELS, MATERIAL_TYPES, PROGRAMMES, SEMESTERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Full editable shape of a material, shared by the upload form and the edit dialog.
export interface MaterialFormValues {
  title: string;
  courseName: string;
  courseCode: string;
  programme: string;
  level: string;
  semester: string;
  materialType: string;
  lecturer: string;
  description: string;
}

export const EMPTY_MATERIAL_FORM: MaterialFormValues = {
  title: "",
  courseName: "",
  courseCode: "",
  programme: "",
  level: "",
  semester: "",
  materialType: "",
  lecturer: "",
  description: "",
};

interface MaterialFormFieldsProps {
  values: MaterialFormValues;
  onChange: (update: Partial<MaterialFormValues>) => void;
  disabled?: boolean;
}

export function MaterialFormFields({
  values,
  onChange,
  disabled = false,
}: MaterialFormFieldsProps) {
  const idPrefix = useId();

  return (
    <div className="space-y-4">
      {/* Level — required, prominent category picker */}
      <div className="space-y-2">
        <Label>Level <span className="text-destructive">*</span></Label>
        <div
          role="group"
          aria-label="Level"
          className="grid grid-cols-4 gap-2"
        >
          {LEVELS.map((level) => {
            const selected = values.level === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onChange({ level })}
                className={cn(
                  "min-h-12 rounded-lg border text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-title`}
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="e.g. Introduction to Algorithms — Week 6"
          className="h-11"
          disabled={disabled}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-course-name`}>
            Course name <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-course-name`}
            value={values.courseName}
            onChange={(event) => onChange({ courseName: event.target.value })}
            placeholder="e.g. Data Structures"
            className="h-11"
            disabled={disabled}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-course-code`}>
            Course code <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-course-code`}
            value={values.courseCode}
            onChange={(event) => onChange({ courseCode: event.target.value })}
            placeholder="e.g. CSC 201"
            className="h-11 uppercase"
            disabled={disabled}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-programme`}>
          Programme <span className="text-destructive">*</span>
        </Label>
        <Select
          value={values.programme || undefined}
          onValueChange={(value) => onChange({ programme: value })}
          disabled={disabled}
        >
          <SelectTrigger
            id={`${idPrefix}-programme`}
            className="h-11! w-full bg-white"
          >
            <SelectValue placeholder="Select programme" />
          </SelectTrigger>
          <SelectContent>
            {PROGRAMMES.map((programme) => (
              <SelectItem key={programme} value={programme}>
                {programme}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-semester`}>
            Semester <span className="text-destructive">*</span>
          </Label>
          <Select
            value={values.semester || undefined}
            onValueChange={(value) => onChange({ semester: value })}
            disabled={disabled}
          >
            <SelectTrigger
              id={`${idPrefix}-semester`}
              className="h-11! w-full bg-white"
            >
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((semester) => (
                <SelectItem key={semester} value={semester}>
                  {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-material-type`}>
            Material type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={values.materialType || undefined}
            onValueChange={(value) => onChange({ materialType: value })}
            disabled={disabled}
          >
            <SelectTrigger
              id={`${idPrefix}-material-type`}
              className="h-11! w-full bg-white"
            >
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_TYPES.map((materialType) => (
                <SelectItem key={materialType} value={materialType}>
                  {materialType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-lecturer`}>Lecturer (optional)</Label>
        <Input
          id={`${idPrefix}-lecturer`}
          value={values.lecturer}
          onChange={(event) => onChange({ lecturer: event.target.value })}
          placeholder="e.g. Dr. A. Mensah"
          className="h-11"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description (optional)</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Short summary shown on the material card..."
          rows={3}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
