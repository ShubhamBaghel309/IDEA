
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown, Minus, CheckCircle, Clock, XCircle } from 'lucide-react';

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  overallGrade: number;
  submissionRate: number;
  trend: 'up' | 'down' | 'stable';
  recentAssignments: {
    title: string;
    grade?: number;
    status: 'submitted' | 'pending' | 'overdue';
    dueDate: string;
  }[];
}

interface StudentProgressTrackerProps {
  students: StudentProgress[];
  onViewStudent: (studentId: string) => void;
}

const StudentProgressTracker: React.FC<StudentProgressTrackerProps> = ({
  students,
  onViewStudent
}) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'overdue':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-yellow-500" />;
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Mock data for demo
  const mockStudents: StudentProgress[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@school.edu',
      overallGrade: 87,
      submissionRate: 95,
      trend: 'up',
      recentAssignments: [
        { title: 'Assignment 1', grade: 85, status: 'submitted', dueDate: '2024-06-10' },
        { title: 'Assignment 2', grade: 90, status: 'submitted', dueDate: '2024-06-12' },
        { title: 'Assignment 3', status: 'pending', dueDate: '2024-06-15' }
      ]
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@school.edu',
      overallGrade: 73,
      submissionRate: 80,
      trend: 'down',
      recentAssignments: [
        { title: 'Assignment 1', grade: 78, status: 'submitted', dueDate: '2024-06-10' },
        { title: 'Assignment 2', grade: 68, status: 'submitted', dueDate: '2024-06-12' },
        { title: 'Assignment 3', status: 'overdue', dueDate: '2024-06-15' }
      ]
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol@school.edu',
      overallGrade: 92,
      submissionRate: 100,
      trend: 'stable',
      recentAssignments: [
        { title: 'Assignment 1', grade: 95, status: 'submitted', dueDate: '2024-06-10' },
        { title: 'Assignment 2', grade: 89, status: 'submitted', dueDate: '2024-06-12' },
        { title: 'Assignment 3', grade: 92, status: 'submitted', dueDate: '2024-06-15' }
      ]
    }
  ];

  const studentsToShow = students.length > 0 ? students : mockStudents;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Student Progress Overview</h3>
      <div className="grid gap-4">
        {studentsToShow.map((student) => (
          <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewStudent(student.id)}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.avatar} />
                  <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{student.name}</h4>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(student.trend)}
                      <span className={`font-bold ${getGradeColor(student.overallGrade)}`}>
                        {student.overallGrade}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Performance</span>
                        <span className={getGradeColor(student.overallGrade)}>
                          {student.overallGrade}%
                        </span>
                      </div>
                      <Progress value={student.overallGrade} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Submission Rate</span>
                        <span>{student.submissionRate}%</span>
                      </div>
                      <Progress value={student.submissionRate} className="h-2" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Recent Assignments</h5>
                    <div className="flex flex-wrap gap-2">
                      {student.recentAssignments.slice(0, 3).map((assignment, index) => (
                        <div key={index} className="flex items-center space-x-1 bg-gray-50 rounded px-2 py-1">
                          {getStatusIcon(assignment.status)}
                          <span className="text-xs">{assignment.title}</span>
                          {assignment.grade && (
                            <Badge variant="outline" className="text-xs">
                              {assignment.grade}%
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StudentProgressTracker;
