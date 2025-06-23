
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Mail, MoreHorizontal, Search } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledDate: string;
  status: 'active' | 'inactive';
  assignmentsCompleted: number;
  totalAssignments: number;
  averageGrade: number;
}

interface StudentRosterPageProps {
  classroomName: string;
  onBack: () => void;
  onAddStudent: () => void;
  onRemoveStudent: (studentId: string) => void;
  onEmailStudent: (studentId: string) => void;
}

const StudentRosterPage: React.FC<StudentRosterPageProps> = ({
  classroomName,
  onBack,
  onAddStudent,
  onRemoveStudent,
  onEmailStudent
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - in real app this would come from props or API
  const students: Student[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice.johnson@school.edu',
      enrolledDate: '2024-01-15',
      status: 'active',
      assignmentsCompleted: 8,
      totalAssignments: 10,
      averageGrade: 92.5
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob.smith@school.edu',
      enrolledDate: '2024-01-16',
      status: 'active',
      assignmentsCompleted: 9,
      totalAssignments: 10,
      averageGrade: 87.3
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol.davis@school.edu',
      enrolledDate: '2024-01-20',
      status: 'active',
      assignmentsCompleted: 7,
      totalAssignments: 10,
      averageGrade: 78.9
    },
    {
      id: '4',
      name: 'David Wilson',
      email: 'david.wilson@school.edu',
      enrolledDate: '2024-02-01',
      status: 'inactive',
      assignmentsCompleted: 3,
      totalAssignments: 10,
      averageGrade: 65.2
    }
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Student['status']) => {
    return status === 'active' 
      ? <Badge variant="default">Active</Badge>
      : <Badge variant="secondary">Inactive</Badge>;
  };

  const getCompletionRate = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    return `${completed}/${total} (${percentage.toFixed(0)}%)`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">Student Roster</h1>
            <p className="text-muted-foreground">{classroomName}</p>
          </div>
          <Button onClick={onAddStudent} className="bg-primary hover:bg-primary/90">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Students ({filteredStudents.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead>Avg Grade</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell>{new Date(student.enrolledDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell>
                      {getCompletionRate(student.assignmentsCompleted, student.totalAssignments)}
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        student.averageGrade >= 90 ? 'text-green-600' :
                        student.averageGrade >= 80 ? 'text-blue-600' :
                        student.averageGrade >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {student.averageGrade.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEmailStudent(student.id)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <MoreHorizontal className="h-4 w-4" />
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

export default StudentRosterPage;
