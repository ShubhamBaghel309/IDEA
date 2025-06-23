export interface User {
  id: number;
  email: string;
  name: string;
  role: 'teacher' | 'student';
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
  role: 'teacher' | 'student';
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Classroom {
  id: number;
  name: string;
  description?: string;
  class_code: string;
  teacher_id: number;
  created_at: string;
  is_active: boolean;
}

export interface ClassroomCreate {
  name: string;
  description?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions?: string;
  max_points: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'closed';
  classroom_id: number;
  teacher_id: number;
  allowed_file_types: string[];
  max_file_size_mb: number;
}

export interface AssignmentCreate {
  title: string;
  description: string;
  instructions?: string;
  max_points?: number;
  due_date?: string;
  allowed_file_types?: string[];
  max_file_size_mb?: number;
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  text_content?: string;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  submitted_at?: string;
  status: 'not_submitted' | 'submitted' | 'graded' | 'returned';
  grade?: string;
  points_earned?: number;
  feedback?: string;
  ai_analysis?: string;
  plagiarism_score?: number;
  is_ai_generated?: boolean;
  created_at: string;
  graded_at?: string;
  returned_at?: string;
}

export interface ClassroomEnrollment {
  id: number;
  classroom_id: number;
  user_id: number;
  enrolled_at: string;
}

export interface ApiError {
  detail: string;
}

export interface PlagiarismResult {
  score: number;
  ai_generated: boolean;
  ai_analysis: any;
  similarity_scores: any[];
}

export interface AssignmentResponse {
  student_name: string;
  grade: string;
  feedback: string;
  analysis?: string;
  document_id?: string;
  file_id?: string;
  plagiarism: PlagiarismResult;
  success: boolean;
}
