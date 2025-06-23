
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, AlertCircle } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';

interface CalendarAssignment {
  id: string;
  title: string;
  dueDate: string;
  className?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'upcoming' | 'due-today' | 'overdue';
}

interface AssignmentCalendarProps {
  assignments: CalendarAssignment[];
  onSelectAssignment: (assignmentId: string) => void;
}

const AssignmentCalendar: React.FC<AssignmentCalendarProps> = ({
  assignments,
  onSelectAssignment
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Mock data for demo
  const mockAssignments: CalendarAssignment[] = [
    {
      id: '1',
      title: 'Calculus Problem Set',
      dueDate: '2024-06-15',
      className: 'Mathematics',
      priority: 'high',
      status: 'upcoming'
    },
    {
      id: '2',
      title: 'Physics Lab Report',
      dueDate: '2024-06-12',
      className: 'Physics',
      priority: 'medium',
      status: 'due-today'
    },
    {
      id: '3',
      title: 'Programming Assignment',
      dueDate: '2024-06-10',
      className: 'Computer Science',
      priority: 'high',
      status: 'overdue'
    },
    {
      id: '4',
      title: 'Essay Writing',
      dueDate: '2024-06-18',
      className: 'English',
      priority: 'low',
      status: 'upcoming'
    }
  ];

  const assignmentsToShow = assignments.length > 0 ? assignments : mockAssignments;

  const getAssignmentsForDate = (date: Date) => {
    return assignmentsToShow.filter(assignment => 
      isSameDay(parseISO(assignment.dueDate), date)
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'due-today':
        return <Badge variant="destructive">Due Today</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'upcoming':
        return <Badge variant="outline">Upcoming</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'due-today':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'upcoming':
        return <CalendarDays className="h-4 w-4 text-blue-500" />;
      default:
        return <CalendarDays className="h-4 w-4 text-gray-500" />;
    }
  };

  const modifiers = {
    hasAssignments: (date: Date) => getAssignmentsForDate(date).length > 0
  };

  const modifiersStyles = {
    hasAssignments: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'white',
      borderRadius: '50%'
    }
  };

  const selectedDateAssignments = selectedDate ? getAssignmentsForDate(selectedDate) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Assignment Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="w-full"
          />
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-sm">Legend:</h4>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>Has assignments</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateAssignments.length > 0 ? (
            <div className="space-y-3">
              {selectedDateAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSelectAssignment(assignment.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment.status)}
                      <h5 className="font-medium">{assignment.title}</h5>
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>
                  
                  {assignment.className && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {assignment.className}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(assignment.priority)}`}></div>
                      <span className="text-xs capitalize">{assignment.priority} priority</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Due: {format(parseISO(assignment.dueDate), 'h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No assignments due on this date</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentCalendar;
