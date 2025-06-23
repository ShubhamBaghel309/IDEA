import React, { useEffect, useState } from 'react';
import { apiClient, ClassroomAnalytics, StudentProgress } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../ui/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface GradeAnalyticsDashboardProps {
  classroomId: number;
  studentId?: number;
}

export const GradeAnalyticsDashboard: React.FC<GradeAnalyticsDashboardProps> = ({
  classroomId,
  studentId
}) => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<ClassroomAnalytics | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [analyticsData, progressData] = await Promise.all([
          apiClient.getClassroomAnalytics(classroomId),
          studentId ? apiClient.getStudentProgress(classroomId, studentId) : null
        ]);

        setAnalytics(analyticsData);
        setStudentProgress(progressData);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load analytics data');
        toast({
          title: "Error",
          description: err.response?.data?.detail || 'Please try again later.',
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classroomId, studentId]);

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Classroom Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_students}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_assignments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.average_grade.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Submission Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics?.submission_rate * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(analytics?.grade_distribution || {}).map(([grade, count]) => ({
                grade,
                count
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics?.assignment_completion || {}).map(([title, rate]) => (
              <div key={title} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{title}</span>
                  <span>{(rate * 100).toFixed(1)}%</span>
                </div>
                <Progress value={rate * 100} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.top_performers.map((student, index) => (
              <div key={student.student_id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span>{student.name}</span>
                </div>
                <span className="text-primary font-medium">
                  {student.average_grade.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Progress (if viewing individual student) */}
      {studentProgress && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Student Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Completed Assignments</p>
                    <p className="text-2xl font-bold">
                      {studentProgress.completed_assignments}/{studentProgress.total_assignments}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average Grade</p>
                    <p className="text-2xl font-bold">{studentProgress.average_grade.toFixed(1)}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Grade Trend</p>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={studentProgress.grade_trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="assignment_title" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="grade"
                          stroke="#8884d8"
                          name="Grade"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Recent Submissions</p>
                  <div className="space-y-2">
                    {studentProgress.recent_submissions.map((submission, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">{submission.assignment_title}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm">{submission.grade}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
