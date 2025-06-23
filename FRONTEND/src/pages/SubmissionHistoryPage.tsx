
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  FileText, 
  Download, 
  MessageSquare, 
  Star,
  ArrowLeft,
  Filter
} from 'lucide-react';

interface SubmissionHistoryPageProps {
  onBack: () => void;
}

const SubmissionHistoryPage: React.FC<SubmissionHistoryPageProps> = ({ onBack }) => {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'week' | 'month' | 'semester'>('all');

  // Mock submission history data
  const submissions = [
    {
      id: '1',
      assignmentTitle: 'Database Design Project',
      className: 'Database Systems',
      submittedDate: '2024-06-08T14:30:00',
      grade: 142,
      maxPoints: 150,
      feedback: 'Excellent work on the database schema design. The normalization is well done and the queries are efficient. Minor improvements needed in documentation.',
      files: ['database_schema.sql', 'queries.sql', 'report.pdf'],
      status: 'graded' as const
    },
    {
      id: '2',
      assignmentTitle: 'Linear Algebra Problem Set',
      className: 'Mathematics 201',
      submittedDate: '2024-06-11T23:45:00',
      grade: null,
      maxPoints: 50,
      feedback: null,
      files: ['problem_set_3.pdf'],
      status: 'submitted' as const
    },
    {
      id: '3',
      assignmentTitle: 'React Component Library',
      className: 'Web Development',
      submittedDate: '2024-06-05T16:20:00',
      grade: 88,
      maxPoints: 100,
      feedback: 'Good implementation of reusable components. The styling is consistent and the code is well-structured. Consider adding more comprehensive error handling.',
      files: ['components.zip', 'documentation.md'],
      status: 'graded' as const
    },
    {
      id: '4',
      assignmentTitle: 'Machine Learning Model',
      className: 'Data Science',
      submittedDate: '2024-06-01T19:15:00',
      grade: 95,
      maxPoints: 100,
      feedback: 'Outstanding work! The model shows excellent performance and the analysis is thorough. Great job on feature engineering and model selection.',
      files: ['ml_model.ipynb', 'dataset.csv', 'analysis_report.pdf'],
      status: 'graded' as const
    }
  ];

  const getGradeColor = (grade: number, maxPoints: number) => {
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeStars = (grade: number, maxPoints: number) => {
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 95) return 5;
    if (percentage >= 90) return 4;
    if (percentage >= 80) return 3;
    if (percentage >= 70) return 2;
    return 1;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filterPeriod === 'all') return true;
    
    const submissionDate = new Date(submission.submittedDate);
    const now = new Date();
    
    switch (filterPeriod) {
      case 'week':
        return (now.getTime() - submissionDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return (now.getTime() - submissionDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      case 'semester':
        return (now.getTime() - submissionDate.getTime()) <= 120 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-google font-bold text-foreground">Submission History</h1>
          <p className="text-muted-foreground">View your past submissions and feedback</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Filter className="h-5 w-5 text-muted-foreground self-center" />
        {['all', 'week', 'month', 'semester'].map(period => (
          <Button
            key={period}
            variant={filterPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPeriod(period as any)}
            className="capitalize"
          >
            {period === 'all' ? 'All Time' : `Past ${period}`}
          </Button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.map((submission) => (
          <Card key={submission.id} className="material-elevation-1">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{submission.assignmentTitle}</CardTitle>
                  <p className="text-muted-foreground">{submission.className}</p>
                </div>
                <div className="text-right space-y-1">
                  {submission.status === 'graded' && submission.grade !== null ? (
                    <div className="space-y-1">
                      <div className={`text-2xl font-bold ${getGradeColor(submission.grade, submission.maxPoints)}`}>
                        {submission.grade}/{submission.maxPoints}
                      </div>
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < getGradeStars(submission.grade!, submission.maxPoints)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="secondary">Pending Grade</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Submitted on {formatDate(submission.submittedDate)}
              </div>

              {submission.feedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Teacher Feedback</span>
                  </div>
                  <p className="text-blue-800 text-sm">{submission.feedback}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Submitted Files</h4>
                <div className="flex flex-wrap gap-2">
                  {submission.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubmissions.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No submissions found</h3>
          <p className="text-muted-foreground">
            No submissions found for the selected time period
          </p>
        </div>
      )}
    </div>
  );
};

export default SubmissionHistoryPage;
