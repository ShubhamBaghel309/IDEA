import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, FileText, Search, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'submitted' | 'overdue' | 'pending';
  grade?: number;
  className: string;
  submittedDate?: string;
}

interface StudentAssignmentsPageProps {
  onSubmitAssignment: (assignmentId: string) => void;
  onViewAssignment: (assignmentId: string) => void;
}

const StudentAssignmentsPage: React.FC<StudentAssignmentsPageProps> = ({
  onSubmitAssignment,
  onViewAssignment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all');

  // Mock data - in real app this would come from props or API
  const assignments: Assignment[] = [
    {
      id: '1',
      title: 'Python Data Structures',
      description: 'Implement basic data structures in Python',
      dueDate: '2024-03-15',
      points: 100,
      status: 'pending',
      className: 'Computer Science 101'
    },
    {
      id: '2',
      title: 'Calculus Problem Set 3',
      description: 'Solve integration problems',
      dueDate: '2024-03-12',
      points: 50,
      status: 'submitted',
      grade: 45,
      className: 'Advanced Mathematics',
      submittedDate: '2024-03-10'
    },
    {
      id: '3',
      title: 'Physics Lab Report',
      description: 'Write lab report on pendulum experiment',
      dueDate: '2024-03-08',
      points: 75,
      status: 'overdue',
      className: 'Physics Lab'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'overdue':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'submitted':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'default';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || assignment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const submittedAssignments = assignments.filter(a => a.status === 'submitted');
  const overdueAssignments = assignments.filter(a => a.status === 'overdue');

  const AssignmentCard = ({ assignment }: { assignment: Assignment }) => (
    <Card className="hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{assignment.className}</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(assignment.status)}
            <Badge variant={getStatusBadgeVariant(assignment.status)}>
              {assignment.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{assignment.description}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{assignment.points} points</span>
            </div>
          </div>
        </div>

        {assignment.grade !== undefined && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              Grade: {assignment.grade}/{assignment.points} points
            </p>
            {assignment.submittedDate && (
              <p className="text-xs text-green-600">
                Submitted: {new Date(assignment.submittedDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => onViewAssignment(assignment.id)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            View Details
          </Button>
          {assignment.status !== 'submitted' && (
            <Button
              onClick={() => onSubmitAssignment(assignment.id)}
              size="sm"
              className="flex-1"
            >
              {assignment.status === 'overdue' ? 'Submit Late' : 'Submit'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Assignments</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({assignments.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingAssignments.length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({submittedAssignments.length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overdueAssignments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingAssignments.filter(assignment => 
                assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assignment.className.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="submitted" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {submittedAssignments.filter(assignment => 
                assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assignment.className.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {overdueAssignments.filter(assignment => 
                assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assignment.className.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No assignments available at the moment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignmentsPage;
