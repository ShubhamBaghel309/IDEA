import api from './api';
import { Classroom, ClassroomCreate, ClassroomEnrollment } from './types';

export const classroomService = {
  // Create a new classroom (teachers only)
  async createClassroom(classroomData: ClassroomCreate): Promise<{ classroom_id: number; class_code: string }> {
    const response = await api.post('/classrooms/create', classroomData);
    return response.data;
  },

  // Get all classrooms for current user
  async getClassrooms(): Promise<Classroom[]> {
    const response = await api.get<Classroom[]>('/classrooms');
    return response.data;
  },

  // Get specific classroom by ID
  async getClassroom(id: number): Promise<Classroom> {
    const response = await api.get<Classroom>(`/classrooms/${id}`);
    return response.data;
  },

  // Join classroom with class code (students only)
  async joinClassroom(classCode: string): Promise<{ message: string }> {
    const response = await api.post(`/classrooms/join/${classCode}`);
    return response.data;
  },

  // Get enrolled students for a classroom (teachers only)
  async getClassroomStudents(classroomId: number): Promise<ClassroomEnrollment[]> {
    const response = await api.get<ClassroomEnrollment[]>(`/classrooms/${classroomId}/students`);
    return response.data;
  },

  // Update classroom
  async updateClassroom(id: number, updates: Partial<ClassroomCreate>): Promise<Classroom> {
    const response = await api.put<Classroom>(`/classrooms/${id}`, updates);
    return response.data;
  },

  // Delete classroom
  async deleteClassroom(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/classrooms/${id}`);
    return response.data;
  },
};
