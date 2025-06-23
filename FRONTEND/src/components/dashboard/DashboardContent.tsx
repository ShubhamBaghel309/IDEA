import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  ClipboardList, 
  TrendingUp,
  Plus,
  Calendar,
  Clock
} from 'lucide-react';
import StudentDashboard from './StudentDashboard';

interface DashboardContentProps {
  user: {
    name: string;
    role: 'teacher' | 'student';
  };
}

const DashboardContent: React.FC<DashboardContentProps> = ({ user }) => {
  const isTeacher = user.role === 'teacher';

  // Mock handlers for student dashboard
  const handleJoinClassroom = () => {
    console.log('Navigate to join classroom page');
  };

  const handleViewAssignments = () => {
    console.log('Navigate to assignments page');
  };

  const handleViewSubmissionHistory = () => {
    console.log('Navigate to submission history page');
  };

  if (!isTeacher) {
    return (
      <div className="p-6">
        <StudentDashboard 
          user={user}
          onJoinClassroom={handleJoinClassroom}
          onViewAssignments={handleViewAssignments}
          onViewSubmissionHistory={handleViewSubmissionHistory}
        />
      </div>
    );
  }

  const teacherStats = [
    { title: "Active Classes", value: "6", icon: BookOpen, change: "+2 this month" },
    { title: "Total Students", value: "124", icon: Users, change: "+12 this week" },
    { title: "Pending Assignments", value: "8", icon: ClipboardList, change: "3 due today" },
    { title: "Avg. Performance", value: "87%", icon: TrendingUp, change: "+5% this month" },
  ];

  const recentClasses = [
    {
      name: "Mathematics 101",
      description: "Algebra and Geometry Fundamentals",
      students: 28,
      nextClass: "Today, 2:00 PM",
      color: "bg-blue-50 border-blue-200",
    },
    {
      name: "Physics Lab",
      description: "Experimental Physics and Lab Work",
      students: 22,
      nextClass: "Tomorrow, 10:00 AM",
      color: "bg-green-50 border-green-200",
    },
    {
      name: "Literature Analysis",
      description: "Modern Literature and Critical Thinking",
      students: 31,
      nextClass: "Wed, 1:00 PM",
      color: "bg-purple-50 border-purple-200",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-google font-bold text-foreground">
          Welcome back, {user.name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your classes today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teacherStats.map((stat, index) => (
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
        {/* Recent Classes */}
        <div className="lg:col-span-2">
          <Card className="material-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-google">Your Classes</CardTitle>
                <CardDescription>Manage your active classes</CardDescription>
              </div>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Class
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentClasses.map((classItem, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${classItem.color} hover-lift cursor-pointer`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">{classItem.name}</h3>
                      <p className="text-sm text-muted-foreground">{classItem.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{classItem.students} students</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      <Clock className="h-3 w-3 mr-1" />
                      {classItem.nextClass}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Upcoming */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="material-elevation-1">
            <CardHeader>
              <CardTitle className="font-google">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                View All Students
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="h-4 w-4 mr-2" />
                Grade Submissions
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="material-elevation-1">
            <CardHeader>
              <CardTitle className="font-google">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">New assignment posted</span>
                  <span className="text-xs text-muted-foreground">2h ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Grade published</span>
                  <span className="text-xs text-muted-foreground">1d ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Class announcement</span>
                  <span className="text-xs text-muted-foreground">2d ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
