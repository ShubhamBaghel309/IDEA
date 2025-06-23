import api from './api';
import { Assignment, AssignmentCreate, Submission } from './types';

export const assignmentService = {
  // Create a new assignment (teachers only)
  async createAssignment(classroomId: number, assignmentData: AssignmentCreate): Promise<{ assignment_id: number }> {
    const response = await api.post(`/classrooms/${classroomId}/assignments`, assignmentData);
    return response.data;
  },

  // Get all assignments for a classroom
  async getAssignments(classroomId: number): Promise<Assignment[]> {
    const response = await api.get<Assignment[]>(`/classrooms/${classroomId}/assignments`);
    return response.data;
  },

  // Get specific assignment by ID
  async getAssignment(assignmentId: number): Promise<Assignment> {
    const response = await api.get<Assignment>(`/assignments/${assignmentId}`);
    return response.data;
  },

  // Update assignment
  async updateAssignment(assignmentId: number, updates: Partial<AssignmentCreate>): Promise<Assignment> {
    const response = await api.put<Assignment>(`/assignments/${assignmentId}`, updates);
    return response.data;
  },

  // Delete assignment
  async deleteAssignment(assignmentId: number): Promise<{ message: string }> {
    const response = await api.delete(`/assignments/${assignmentId}`);
    return response.data;
  },

  // Submit assignment (students only)
  async submitAssignment(
    assignmentId: number, 
    submission: { text_content?: string; file?: File }
  ): Promise<{ message: string; submission_id: number }> {
    const formData = new FormData();
    
    if (submission.text_content) {
      formData.append('text_content', submission.text_content);
    }
    
    if (submission.file) {
      formData.append('file', submission.file);
    }

    const response = await api.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Get submissions for an assignment (teachers only)
  async getAssignmentSubmissions(assignmentId: number): Promise<Submission[]> {
    const response = await api.get<Submission[]>(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  // Get student's own submission
  async getMySubmission(assignmentId: number): Promise<Submission | null> {
    try {
      const response = await api.get<Submission>(`/assignments/${assignmentId}/my-submission`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No submission found
      }
      throw error;
    }
  },

  // Grade a submission (teachers only)
  async gradeSubmission(
    submissionId: number, 
    grading: { grade: string; points_earned: number; feedback: string }
  ): Promise<Submission> {
    const response = await api.put<Submission>(`/submissions/${submissionId}/grade`, grading);
    return response.data;
  },

  // Get all submissions for current user (students only)
  async getMySubmissions(): Promise<Submission[]> {
    const response = await api.get<Submission[]>('/submissions/my-submissions');
    return response.data;
  },
};
