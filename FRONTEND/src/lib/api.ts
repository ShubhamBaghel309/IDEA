import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 120000, // Increase timeout to 2 minutes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return Promise.reject(new Error('Request timed out. The server is taking too long to respond. Please try again.'));
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
        const { access_token, refresh_token } = response.data;
        
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API Methods
export const apiClient = {
  // Health check
  async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  },

  // Authentication
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    return response.data;
  },

  async register(name: string, email: string, password: string, role: 'teacher' | 'student') {
    const response = await api.post('/auth/register', { name, email, password, role });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    return response.data;
  },

  async requestPasswordReset(email: string) {
    const response = await api.post('/auth/password-reset-request', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string) {
    const response = await api.post('/auth/password-reset', { token, new_password: newPassword });
    return response.data;
  },

  // Assignment submission
  async submitAssignment(assignmentId: number, data: {
    files: Array<{
      file_name: string;
      file_type: string;
      content: string;
      size: number;
    }>;
    text_content?: string;
    submission_notes?: string;
  }) {
    const response = await api.post(`/assignments/${assignmentId}/submit`, data);
    return response.data;
  },

  // Assignment checking endpoints
  async checkTextAssignment(data: {
    student_name: string;
    question: string;
    answer: string;
    reference_material?: string;
  }) {
    const response = await api.post('/check-text-assignment', data);
    return response.data;
  },

  async checkPdfAssignment(data: {
    student_name: string;
    assignment_prompt: string;
    reference_material?: string;
    pdf_file: File;
  }) {
    const formData = new FormData();
    formData.append('student_name', data.student_name);
    formData.append('assignment_prompt', data.assignment_prompt);
    if (data.reference_material) {
      formData.append('reference_material', data.reference_material);
    }
    formData.append('pdf_file', data.pdf_file);

    const response = await api.post('/check-pdf-assignment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Enhanced file analysis endpoints
  async analyzeFile(data: {
    file: File;
    question: string;
    student_name?: string;
  }) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('question', data.question);
    if (data.student_name) {
      formData.append('student_name', data.student_name);
    }

    const response = await api.post('/analyze-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async analyzeCode(data: {
    code: string;
    language: string;
    question?: string;
  }) {
    const formData = new FormData();
    formData.append('code', data.code);
    formData.append('language', data.language);
    if (data.question) {
      formData.append('question', data.question);
    }

    const response = await api.post('/analyze-code', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async analyzeJupyter(data: {
    notebook_content: string;
    assignment_title?: string;
  }) {
    const formData = new FormData();
    formData.append('notebook_content', data.notebook_content);
    if (data.assignment_title) {
      formData.append('assignment_title', data.assignment_title);
    }

    const response = await api.post('/analyze-jupyter', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Classroom endpoints
  async getClassrooms() {
    const response = await api.get('/classrooms');
    return response.data;
  },

  async createClassroom(data: {
    name: string;
    description?: string;
  }) {
    const response = await api.post('/classrooms/create', data);
    return response.data;
  },

  async joinClassroom(classCode: string) {
    const response = await api.post(`/classrooms/join/${classCode}`);
    return response.data;
  },

  async getClassroomAnalytics(classroomId: number) {
    const response = await api.get(`/classrooms/${classroomId}/analytics`);
    return response.data;
  },

  async getStudentProgress(classroomId: number, studentId: number) {
    const response = await api.get(`/classrooms/${classroomId}/students/${studentId}/progress`);
    return response.data;
  },

  async markAttendance(classroomId: number, data: {
    date: string;
    present_student_ids: number[];
  }) {
    const response = await api.post(`/classrooms/${classroomId}/attendance`, data);
    return response.data;
  },

  // Assignment endpoints
  async getAssignments(classroomId: number) {
    const response = await api.get(`/classrooms/${classroomId}/assignments`);
    return response.data;
  },

  async createAssignment(classroomId: number, data: {
    title: string;
    description: string;
    instructions?: string;
    max_points?: number;
    due_date?: string;
    allowed_file_types?: string[];
    max_file_size_mb?: number;
  }) {
    const response = await api.post(`/classrooms/${classroomId}/assignments`, data);
    return response.data;
  },

  async getAssignment(assignmentId: number) {
    const response = await api.get(`/assignments/${assignmentId}`);
    return response.data;
  },

  async getAssignmentSubmissions(assignmentId: number) {
    const response = await api.get(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  async getMySubmission(assignmentId: number) {
    const response = await api.get(`/assignments/${assignmentId}/my-submission`);
    return response.data;
  },

  async getMySubmissions() {
    const response = await api.get('/submissions/my-submissions');
    return response.data;
  },

  async gradeSubmission(submissionId: number, data: {
    grade: string;
    feedback: string;
    points_earned: number;
  }) {
    const response = await api.put(`/submissions/${submissionId}/grade`, data);
    return response.data;
  },

  // User profile endpoints
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async updateProfile(data: {
    name?: string;
    email?: string;
    password?: string;
  }) {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
};

// Export types
export type AssignmentResult = {
  student_name: string;
  grade: string;
  feedback: string;
  analysis: string;
  document_id: string;
  plagiarism: {
    score: number;
    ai_generated: boolean;
    ai_analysis: Record<string, any>;
    similarity_scores: number[];
  };
  file_analysis: Record<string, any>;
  optimized_solutions: any[];
  success: boolean;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type ClassroomAnalytics = {
  total_students: number;
  total_assignments: number;
  average_grade: number;
  submission_rate: number;
  top_performers: Array<{
    student_id: number;
    name: string;
    average_grade: number;
  }>;
  recent_activity: Array<{
    type: string;
    student_name: string;
    assignment_title: string;
    timestamp: string;
  }>;
  assignment_completion: Record<string, number>;
  grade_distribution: Record<string, number>;
};

export type StudentProgress = {
  student_id: number;
  student_name: string;
  completed_assignments: number;
  total_assignments: number;
  average_grade: number;
  recent_submissions: Array<{
    assignment_title: string;
    submitted_at: string;
    grade: string;
    status: string;
  }>;
  grade_trend: Array<{
    assignment_title: string;
    grade: string;
    submitted_at: string;
  }>;
  attendance_rate: number;
};

export default api;
