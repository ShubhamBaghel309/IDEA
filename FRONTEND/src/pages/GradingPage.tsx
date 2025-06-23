
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, Eye, CheckCircle, Clock } from 'lucide-react';

interface Submission {
  id: string;
  studentName: string;
  studentEmail: string;
  submittedDate: string;
  fileName: string;
  status: 'submitted' | 'graded' | 'late';
  currentGrade?: number;
  aiAnalysis?: string;
}

interface GradingPageProps {
  assignmentTitle: string;
  maxPoints: number;
  onBack: () => void;
  onSaveGrade: (submissionId: string, grade: number, feedback: string) => void;
  onReturnGrade: (submissionId: string) => void;
}

const GradingPage: React.FC<GradingPageProps> = ({
  assignmentTitle,
  maxPoints,
  onBack,
  onSaveGrade,
  onReturnGrade
}) => {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  // Mock data - in real app this would come from props or API
  const submissions: Submission[] = [
    {
      id: '1',
      studentName: 'Alice Johnson',
      studentEmail: 'alice.johnson@school.edu',
      submittedDate: '2024-06-10T14:30:00Z',
      fileName: 'calculus_assignment.pdf',
      status: 'submitted',
      aiAnalysis: 'The solution demonstrates good understanding of derivative concepts. Minor calculation error in problem 3.'
    },
    {
      id: '2',
      studentName: 'Bob Smith',
      studentEmail: 'bob.smith@school.edu',
      submittedDate: '2024-06-09T16:45:00Z',
      fileName: 'math_homework.pdf',
      status: 'graded',
      currentGrade: 85,
      aiAnalysis: 'Excellent work overall. Clear methodology and correct solutions for all problems.'
    },
    {
      id: '3',
      studentName: 'Carol Davis',
      studentEmail: 'carol.davis@school.edu',
      submittedDate: '2024-06-11T23:59:00Z',
      fileName: 'assignment_1.pdf',
      status: 'late',
      aiAnalysis: 'Late submission. Solutions are mostly correct but lack detailed explanations.'
    }
  ];

  const getStatusBadge = (status: Submission['status']) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="default"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'graded':
        return <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3" />Graded</Badge>;
      case 'late':
        return <Badge variant="destructive">Late</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleGradeSubmission = (submission: Submission) => {
    setSelectedSubmission(submission.id);
    setGrade(submission.currentGrade || 0);
    setFeedback('');
  };

  const handleSaveGrade = () => {
    if (selectedSubmission) {
      onSaveGrade(selectedSubmission, grade, feedback);
      setSelectedSubmission(null);
      setGrade(0);
      setFeedback('');
    }
  };

  const selectedSub = submissions.find(s => s.id === selectedSubmission);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Grading: {assignmentTitle}</h1>
            <p className="text-muted-foreground">Maximum Points: {maxPoints}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submissions List */}
          <Card>
            <CardHeader>
              <CardTitle>Student Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{submission.studentName}</h3>
                        <p className="text-sm text-muted-foreground">{submission.studentEmail}</p>
                      </div>
                      {getStatusBadge(submission.status)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-3">
                      <p>Submitted: {new Date(submission.submittedDate).toLocaleString()}</p>
                      <p>File: {submission.fileName}</p>
                      {submission.currentGrade && (
                        <p className="font-medium text-foreground">
                          Grade: {submission.currentGrade}/{maxPoints}
                        </p>
                      )}
                    </div>

                    {submission.aiAnalysis && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                        <p className="text-sm font-medium text-blue-900 mb-1">AI Analysis:</p>
                        <p className="text-sm text-blue-800">{submission.aiAnalysis}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleGradeSubmission(submission)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Grade
                      </Button>
                      {submission.status === 'graded' && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => onReturnGrade(submission.id)}
                        >
                          Return
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grading Interface */}
          {selectedSubmission && selectedSub && (
            <Card>
              <CardHeader>
                <CardTitle>Grade Submission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Student: {selectedSub.studentName}</h3>
                    <p className="text-sm text-muted-foreground">File: {selectedSub.fileName}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade (out of {maxPoints})</Label>
                    <Input
                      id="grade"
                      type="number"
                      value={grade}
                      onChange={(e) => setGrade(Number(e.target.value))}
                      min="0"
                      max={maxPoints}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Enter feedback for the student..."
                      rows={6}
                    />
                  </div>

                  {selectedSub.aiAnalysis && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">AI Analysis:</p>
                      <p className="text-sm text-blue-800">{selectedSub.aiAnalysis}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button onClick={handleSaveGrade} className="bg-primary hover:bg-primary/90">
                      Save Grade
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedSubmission(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradingPage;
