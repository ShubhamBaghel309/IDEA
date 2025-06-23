
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'submitted' | 'overdue' | 'pending' | 'graded';
  grade?: number;
  className?: string;
  submittedDate?: string;
}

interface AssignmentCardProps {
  assignment: Assignment;
  onViewDetails?: (id: string) => void;
  onSubmit?: (id: string) => void;
  onGrade?: (id: string) => void;
  showActions?: boolean;
  variant?: 'student' | 'teacher';
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onViewDetails,
  onSubmit,
  onGrade,
  showActions = true,
  variant = 'student'
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'graded':
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
      case 'graded':
        return 'default';
      case 'overdue':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status === 'pending';

  return (
    <Card className="hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            {assignment.className && (
              <p className="text-sm text-muted-foreground">{assignment.className}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(isOverdue ? 'overdue' : assignment.status)}
            <Badge variant={getStatusBadgeVariant(isOverdue ? 'overdue' : assignment.status)}>
              {isOverdue ? 'overdue' : assignment.status}
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
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
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

        {showActions && (
          <div className="flex gap-2">
            {onViewDetails && (
              <Button
                onClick={() => onViewDetails(assignment.id)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                View Details
              </Button>
            )}
            {variant === 'student' && onSubmit && assignment.status !== 'submitted' && assignment.status !== 'graded' && (
              <Button
                onClick={() => onSubmit(assignment.id)}
                size="sm"
                className="flex-1"
              >
                {isOverdue ? 'Submit Late' : 'Submit'}
              </Button>
            )}
            {variant === 'teacher' && onGrade && assignment.status === 'submitted' && (
              <Button
                onClick={() => onGrade(assignment.id)}
                size="sm"
                className="flex-1"
              >
                Grade
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentCard;
