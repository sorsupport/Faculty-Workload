export interface Faculty {
  id: number;
  name: string;
  email: string;
  department: string;
  employmentType: string;
  maxLoad: number;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  creditHours: number;
  department: string;
}

export interface Term {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Section {
  id: number;
  sectionNumber: string;
  courseId: number;
  termId: number;
  capacity: number | null;
  course: Course;
  term: Term;
  assignments: Assignment[];
}

export interface Assignment {
  id: number;
  facultyId: number;
  sectionId: number;
  role: string;
  loadHours: number;
  faculty?: Faculty;
  section?: Section;
}

export interface FacultyLoad {
  facultyId: number;
  name: string;
  department: string;
  employmentType: string;
  maxLoad: number;
  totalLoad: number;
  status: "under" | "at" | "over";
  assignments: {
    id: number;
    role: string;
    loadHours: number;
    courseCode: string;
    courseTitle: string;
    sectionNumber: string;
  }[];
}
