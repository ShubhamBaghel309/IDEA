import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Calendar, 
  Users, 
  Plus, 
  BookOpen, 
  ClipboardList, 
  Download, 
  Eye,
  Send,
  Copy
} from 'lucide-react';
import { classroomService } from '@/lib/classroom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Classroom, Assignment } from '@/lib/types';

interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  student_name: string;
  file_name?: string;
  file_path?: string;
  text_content?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
}

export default function ClassroomDetailPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stream');
  // Assignment creation state
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'upload' | 'generate' | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    instructions: '',
    max_points: 100,
    due_date: '',
    allowed_file_types: ['pdf', 'docx', 'txt', 'py'],
    max_file_size_mb: 10
  });
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);

  // Submission state
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  useEffect(() => {
    if (classroomId) {
      loadClassroomData();
    }
  }, [classroomId]);  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/classrooms/${classroomId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const assignments = await response.json();
        setAssignments(assignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleDownloadAssignment = async (assignmentId: number, fileName: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to download files",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`http://localhost:8000/assignments/${assignmentId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading assignment:', error);
      toast({
        title: "Error",
        description: "Failed to download assignment file",
        variant: "destructive",
      });
    }
  };

  const loadClassroomData = async () => {
    try {
      setLoading(true);
      
      // Load classroom details
      const classroomResponse = await classroomService.getClassroom(parseInt(classroomId!));
      setClassroom(classroomResponse);

      // Load assignments from API
      await fetchAssignments();

    } catch (error: any) {
      console.error('Error loading classroom data:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load classroom data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };  const handleCreateAssignment = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to create assignments",
          variant: "destructive",
        });
        return;
      }

      let response;
      
      if (assignmentType === 'upload' && assignmentFile) {
        // Use the file upload endpoint
        const formData = new FormData();
        formData.append('title', newAssignment.title);
        formData.append('description', newAssignment.description);
        formData.append('instructions', newAssignment.instructions);
        formData.append('max_points', newAssignment.max_points.toString());
        if (newAssignment.due_date) {
          formData.append('due_date', new Date(newAssignment.due_date).toISOString());
        }
        formData.append('assignment_type', 'file');
        formData.append('file', assignmentFile);

        response = await fetch(`http://localhost:8000/classrooms/${classroomId}/assignments/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        // Use the regular text assignment endpoint
        response = await fetch(`http://localhost:8000/classrooms/${classroomId}/assignments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newAssignment,
            due_date: newAssignment.due_date ? new Date(newAssignment.due_date).toISOString() : null,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create assignment');
      }

      const result = await response.json();
      
      // Refresh assignments list
      await fetchAssignments();
      
      setShowCreateAssignment(false);
      setAssignmentType(null);
      setNewAssignment({
        title: '',
        description: '',
        instructions: '',
        max_points: 100,
        due_date: '',
        allowed_file_types: ['pdf', 'docx', 'txt', 'py'],
        max_file_size_mb: 10
      });
      setAssignmentFile(null);
      
      toast({
        title: "Success",
        description: assignmentType === 'upload' ? "Assignment uploaded successfully" : "Assignment created successfully",
      });
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create assignment",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAssignment = () => {
    // Placeholder for future LangGraph integration
    toast({
      title: "Coming Soon",
      description: "AI-powered assignment generation will be available soon!",
    });
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      // Mock submission for now
      const newSubmission = {
        id: Date.now(),
        assignment_id: selectedAssignment.id,
        student_id: user?.id || 1,
        student_name: user?.name || 'Test Student',
        file_name: submissionFile?.name,
        text_content: submissionText,
        submitted_at: new Date().toISOString(),
        status: 'submitted' as const
      };

      setSubmissions([newSubmission, ...submissions]);
      setShowSubmissionDialog(false);
      setSelectedAssignment(null);
      setSubmissionFile(null);
      setSubmissionText('');
      
      toast({
        title: "Success",
        description: "Assignment submitted successfully",
      });
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assignment",
        variant: "destructive",
      });
    }
  };

  const copyClassCode = async () => {
    if (classroom?.class_code) {
      try {
        await navigator.clipboard.writeText(classroom.class_code);
        toast({
          title: "Copied!",
          description: "Class code copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to copy class code",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAssignmentSubmitted = (assignmentId: number) => {
    return submissions.some(sub => sub.assignment_id === assignmentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>
            Classroom not found or you don't have access to it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-600">{classroom.description}</p>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Class Code:</span>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-gray-200"
                      onClick={copyClassCode}
                    >
                      {classroom.class_code}
                      <Copy className="w-3 h-3 ml-1" />
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline">
                <Users className="w-4 h-4 mr-1" />
                {students.length} Students
              </Badge>              {user?.role === 'teacher' && (
                <Dialog open={showCreateAssignment} onOpenChange={setShowCreateAssignment}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create New Assignment</DialogTitle>
                      <DialogDescription>
                        Choose how you want to create your assignment
                      </DialogDescription>
                    </DialogHeader>
                    
                    {!assignmentType ? (
                      // Assignment Type Selection
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card 
                            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                            onClick={() => setAssignmentType('upload')}
                          >
                            <CardHeader className="text-center">
                              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Upload className="w-8 h-8 text-blue-600" />
                              </div>
                              <CardTitle className="text-lg">Upload Assignment</CardTitle>
                              <CardDescription>
                                Upload a file (PDF, images, documents) as your assignment
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">
                                  Perfect for worksheets, PDFs, images, or any document-based assignments
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          <Card 
                            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-300"
                            onClick={() => setAssignmentType('generate')}
                          >
                            <CardHeader className="text-center">
                              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FileText className="w-8 h-8 text-green-600" />
                              </div>
                              <CardTitle className="text-lg">Generate Assignment</CardTitle>
                              <CardDescription>
                                AI-powered assignment generation (Coming Soon)
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">
                                  Create custom assignments using AI based on topics and difficulty
                                </p>
                                <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button variant="outline" onClick={() => setShowCreateAssignment(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : assignmentType === 'upload' ? (
                      // Upload Assignment Form
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setAssignmentType(null)}
                          >
                            ← Back
                          </Button>
                          <h3 className="font-semibold">Upload Assignment</h3>
                        </div>
                        
                        <div>
                          <Label htmlFor="title">Assignment Title</Label>
                          <Input
                            id="title"
                            value={newAssignment.title}
                            onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                            placeholder="Enter assignment title"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newAssignment.description}
                            onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                            placeholder="Brief description of the assignment"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="assignment-file">Upload Assignment File</Label>
                          <Input
                            id="assignment-file"
                            type="file"
                            onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx"
                            className="mt-1"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, PPT, PPTX (Max 50MB)
                          </p>
                          {assignmentFile && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">
                                Selected: {assignmentFile.name} ({(assignmentFile.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="max_points">Max Points</Label>
                            <Input
                              id="max_points"
                              type="number"
                              value={newAssignment.max_points}
                              onChange={(e) => setNewAssignment({...newAssignment, max_points: parseInt(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="due_date">Due Date</Label>
                            <Input
                              id="due_date"
                              type="datetime-local"
                              value={newAssignment.due_date}
                              onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowCreateAssignment(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCreateAssignment}
                            disabled={!newAssignment.title.trim() || !assignmentFile}
                          >
                            Upload Assignment
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Generate Assignment Form (Placeholder)
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setAssignmentType(null)}
                          >
                            ← Back
                          </Button>
                          <h3 className="font-semibold">Generate Assignment with AI</h3>
                          <Badge variant="secondary">Coming Soon</Badge>
                        </div>
                        
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">AI Assignment Generation</h3>
                          <p className="text-gray-600 mb-4">
                            This feature will allow you to generate custom assignments using AI based on:
                          </p>
                          <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-600">
                            <p>• Subject and topic selection</p>
                            <p>• Difficulty level customization</p>
                            <p>• Learning objectives</p>
                            <p>• Question types and formats</p>
                            <p>• Automatic rubric generation</p>
                          </div>
                          <Button 
                            className="mt-6" 
                            onClick={handleGenerateAssignment}
                            variant="outline"
                          >
                            Learn More
                          </Button>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button variant="outline" onClick={() => setShowCreateAssignment(false)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stream">Stream</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>

          {/* Stream Tab */}
          <TabsContent value="stream" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Welcome to {classroom.name}
                </CardTitle>
                <CardDescription>
                  {classroom.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Getting Started</h3>
                  <div className="text-blue-800 text-sm space-y-1">
                    {user?.role === 'teacher' ? (
                      <>
                        <p>• Create assignments for your students</p>
                        <p>• Monitor student submissions and progress</p>
                        <p>• Provide AI-powered grading and feedback</p>
                      </>
                    ) : (
                      <>
                        <p>• Check the Assignments tab for new work</p>
                        <p>• Submit your assignments before the due date</p>
                        <p>• Review your grades and feedback</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              {assignments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No assignments yet</p>
                    {user?.role === 'teacher' && (
                      <p className="text-sm text-gray-500 mt-2">Create your first assignment to get started</p>
                    )}
                  </CardContent>
                </Card>
              ) : (                assignments.slice(0, 3).map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{assignment.title}</CardTitle>
                            {assignment.assignment_type === 'upload' && (
                              <Badge variant="outline" className="text-xs">
                                <Upload className="w-3 h-3 mr-1" />
                                File
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">
                            {assignment.description}
                          </CardDescription>                          {assignment.file_name && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-700">{assignment.file_name}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-blue-600"
                                onClick={() => handleDownloadAssignment(assignment.id, assignment.file_name!)}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(assignment.due_date)}
                        </Badge>
                      </div>
                    </CardHeader>
                    {user?.role === 'student' && (
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {isAssignmentSubmitted(assignment.id) ? 'Submitted' : 'Not submitted'}
                          </span>
                          {!isAssignmentSubmitted(assignment.id) && (
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setShowSubmissionDialog(true);
                              }}
                            >
                              Submit
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">All Assignments</h3>
              {user?.role === 'teacher' && (
                <Button onClick={() => setShowCreateAssignment(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              )}
            </div>

            {assignments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No assignments yet</h3>
                  {user?.role === 'teacher' ? (
                    <p className="text-gray-500 mb-4">Create your first assignment to get started</p>
                  ) : (
                    <p className="text-gray-500">Your teacher hasn't posted any assignments yet</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{assignment.title}</CardTitle>
                            {assignment.assignment_type === 'upload' && (
                              <Badge variant="outline" className="text-xs">
                                <Upload className="w-3 h-3 mr-1" />
                                Uploaded File
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-2">
                            {assignment.description}
                          </CardDescription>
                          
                          {/* Show uploaded file */}
                          {assignment.file_name && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">Assignment File</p>
                                    <p className="text-xs text-blue-700">{assignment.file_name}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:bg-blue-100">
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 px-2 text-blue-600 hover:bg-blue-100"
                                    onClick={() => handleDownloadAssignment(assignment.id, assignment.file_name!)}
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Show text instructions if available */}
                          {assignment.instructions && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-1">Instructions</p>
                              <p className="text-sm text-gray-700">{assignment.instructions}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          <Badge variant="outline">
                            <Calendar className="w-3 h-3 mr-1" />
                            Due: {formatDate(assignment.due_date)}
                          </Badge>
                          <div className="text-sm text-gray-600">
                            {assignment.max_points} points
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {user?.role === 'student' && (
                      <CardContent>
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                              Status: {isAssignmentSubmitted(assignment.id) ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">Submitted</Badge>
                              ) : (
                                <Badge variant="secondary">Not submitted</Badge>
                              )}
                            </span>
                          </div>
                          {!isAssignmentSubmitted(assignment.id) && (
                            <Button 
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setShowSubmissionDialog(true);
                              }}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Submit Assignment
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* People Tab */}
          <TabsContent value="people" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teacher</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">T</span>
                    </div>
                    <div>
                      <p className="font-medium">Teacher Name</p>
                      <p className="text-sm text-gray-600">teacher@example.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Students ({students.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No students have joined yet</p>
                  ) : (
                    <div className="space-y-3">
                      {students.map((student, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 text-sm font-semibold">
                              {student.name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{student.name || 'Student'}</p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Submission Dialog */}
      <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              Submit your work for: {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="submission-text">Text Response</Label>
              <Textarea
                id="submission-text"
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Enter your response or code here..."
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="submission-file">Upload File (Optional)</Label>
              <Input
                id="submission-file"
                type="file"
                onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.txt,.py,.js,.html,.css"
              />
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: PDF, DOC, DOCX, TXT, PY, JS, HTML, CSS
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSubmissionDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitAssignment}
                disabled={!submissionText.trim() && !submissionFile}
              >
                Submit Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
