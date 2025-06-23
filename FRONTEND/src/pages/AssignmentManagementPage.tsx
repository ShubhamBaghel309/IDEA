
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Trash2, Plus, CheckCircle } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  classroom: string;
  dueDate: string;
  maxPoints: number;
  submissions: number;
  totalStudents: number;
  status: 'active' | 'closed' | 'draft';
}

interface AssignmentManagementPageProps {
  onCreateAssignment: () => void;
  onEditAssignment: (assignmentId: string) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onGradeAssignment: (assignmentId: string) => void;
}

const AssignmentManagementPage: React.FC<AssignmentManagementPageProps> = ({
  onCreateAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onGradeAssignment
}) => {
  // Mock data - in real app this would come from props or API
  const assignments: Assignment[] = [
    {
      id: '1',
      title: 'Calculus Problem Set 1',
      classroom: 'Advanced Mathematics',
      dueDate: '2024-06-15',
      maxPoints: 100,
      submissions: 25,
      totalStudents: 28,
      status: 'active'
    },
    {
      id: '2',
      title: 'Programming Assignment: Algorithms',
      classroom: 'Computer Science 101',
      dueDate: '2024-06-12',
      maxPoints: 150,
      submissions: 32,
      totalStudents: 32,
      status: 'closed'
    },
    {
      id: '3',
      title: 'Lab Report: Wave Mechanics',
      classroom: 'Physics Lab',
      dueDate: '2024-06-20',
      maxPoints: 75,
      submissions: 18,
      totalStudents: 24,
      status: 'active'
    }
  ];

  const getStatusBadge = (status: Assignment['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSubmissionProgress = (submissions: number, total: number) => {
    const percentage = (submissions / total) * 100;
    return `${submissions}/${total} (${percentage.toFixed(0)}%)`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Assignment Management</h1>
          <Button onClick={onCreateAssignment} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment Title</TableHead>
                  <TableHead>Classroom</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell className="text-muted-foreground">{assignment.classroom}</TableCell>
                    <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{assignment.maxPoints} pts</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {getSubmissionProgress(assignment.submissions, assignment.totalStudents)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onGradeAssignment(assignment.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditAssignment(assignment.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteAssignment(assignment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssignmentManagementPage;
