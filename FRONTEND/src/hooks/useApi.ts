import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomService } from '@/lib/classroom';
import { assignmentService } from '@/lib/assignments';
import { userService } from '@/lib/users';
import { toast } from 'sonner';

// Classroom hooks
export const useClassrooms = () => {
  return useQuery({
    queryKey: ['classrooms'],
    queryFn: classroomService.getClassrooms,
  });
};

export const useClassroom = (id: number) => {
  return useQuery({
    queryKey: ['classroom', id],
    queryFn: () => classroomService.getClassroom(id),
    enabled: !!id,
  });
};

export const useCreateClassroom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: classroomService.createClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      toast.success('Classroom created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create classroom');
    },
  });
};

export const useJoinClassroom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: classroomService.joinClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      toast.success('Joined classroom successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to join classroom');
    },
  });
};

// Assignment hooks
export const useAssignments = (classroomId: number) => {
  return useQuery({
    queryKey: ['assignments', classroomId],
    queryFn: () => assignmentService.getAssignments(classroomId),
    enabled: !!classroomId,
  });
};

export const useAssignment = (assignmentId: number) => {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => assignmentService.getAssignment(assignmentId),
    enabled: !!assignmentId,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ classroomId, data }: { classroomId: number; data: any }) =>
      assignmentService.createAssignment(classroomId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', variables.classroomId] });
      toast.success('Assignment created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create assignment');
    },
  });
};

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assignmentId, submission }: { assignmentId: number; submission: any }) =>
      assignmentService.submitAssignment(assignmentId, submission),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignment', variables.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      toast.success('Assignment submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit assignment');
    },
  });
};

export const useMySubmissions = () => {
  return useQuery({
    queryKey: ['my-submissions'],
    queryFn: assignmentService.getMySubmissions,
  });
};

export const useAssignmentSubmissions = (assignmentId: number) => {
  return useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: () => assignmentService.getAssignmentSubmissions(assignmentId),
    enabled: !!assignmentId,
  });
};

// User hooks
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    },
  });
};
