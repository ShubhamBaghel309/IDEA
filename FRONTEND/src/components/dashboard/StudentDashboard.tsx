
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  ClipboardList, 
  Calendar, 
  TrendingUp,
  Plus,
  Clock,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { classroomService } from '@/lib/classroom';
import { Classroom } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

interface StudentDashboardProps {
  user: {
    name: string;
  };
  onJoinClassroom: () => void;
  onViewAssignments: () => void;
  onViewSubmissionHistory: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  user, 
  onJoinClassroom, 
  onViewAssignments,
  onViewSubmissionHistory 
}) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      setIsLoading(true);
      const data = await classroomService.getClassrooms();
      setClassrooms(data);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load classrooms';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { title: "Enrolled Classes", value: classrooms.length.toString(), icon: BookOpen, change: "Spring 2024" },    { title: "Pending Assignments", value: "3", icon: ClipboardList, change: "2 due tomorrow" },
    { title: "Overall Grade", value: "A-", icon: TrendingUp, change: "89% average" },
    { title: "Attendance", value: "96%", icon: Calendar, change: "Excellent" },
  ];

  const upcomingAssignments = [
    {
      title: "Python Data Structures",
      className: "Computer Science 101",
      dueDate: "Tomorrow, 11:59 PM",
      isUrgent: true
    },
    {
      title: "Linear Algebra Problem Set",
      className: "Mathematics 201", 
      dueDate: "June 15, 11:59 PM",
      isUrgent: false
    },
    {
      title: "Literature Analysis Essay",
      className: "English Literature",
      dueDate: "June 20, 11:59 PM",
      isUrgent: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-google font-bold text-foreground">
          Welcome back, {user.name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Ready to continue learning? Check your upcoming assignments.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="material-elevation-1 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Classes */}
        <div className="lg:col-span-2">
          <Card className="material-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-google">My Classes</CardTitle>
                <p className="text-sm text-muted-foreground">Your enrolled courses</p>
              </div>
              <Button size="sm" variant="outline" onClick={onJoinClassroom}>
                <Plus className="h-4 w-4 mr-2" />
                Join Class
              </Button>
            </CardHeader>            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg border-2 bg-gray-50 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : classrooms.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No classes yet</h3>
                  <p className="text-gray-500 mb-4">Join your first classroom to get started</p>
                  <Button 
                    onClick={onJoinClassroom}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Join Classroom
                  </Button>
                </div>              ) : (
                classrooms.map((classroom) => (
                  <div 
                    key={classroom.id} 
                    className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200 hover-lift cursor-pointer transition-all hover:bg-blue-100"
                    onClick={() => navigate(`/classroom/${classroom.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-foreground">{classroom.name}</h3>
                        {classroom.description && (
                          <p className="text-sm text-muted-foreground">{classroom.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(classroom.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant="outline" className="bg-white">
                          <Users className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Upcoming */}
        <div className="space-y-6">
          {/* Upcoming Assignments */}
          <Card className="material-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-google">Upcoming Assignments</CardTitle>
              <Button variant="ghost" size="sm" onClick={onViewAssignments}>
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingAssignments.map((assignment, index) => (
                <div key={index} className="p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-medium text-sm">{assignment.title}</h4>
                      <p className="text-xs text-muted-foreground">{assignment.className}</p>
                    </div>
                    {assignment.isUrgent && (
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{assignment.dueDate}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="material-elevation-1">
            <CardHeader>
              <CardTitle className="font-google">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={onViewAssignments}>
                <ClipboardList className="h-4 w-4 mr-2" />
                View All Assignments
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onViewSubmissionHistory}>
                <FileText className="h-4 w-4 mr-2" />
                Submission History
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
