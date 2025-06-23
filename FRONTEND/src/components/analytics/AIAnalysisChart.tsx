import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuestionFeedback {
  question: string;
  studentAnswer: string;
  isCorrect: boolean;
  correctAnswer?: string;
  explanation?: string;
  score: number;
}

interface AssignmentFeedback {
  overallScore: number;
  questions: QuestionFeedback[];
  suggestions?: string[];
  warnings?: {
    plagiarism?: boolean;
    aiGenerated?: boolean;
  };
}

interface AIAnalysisChartProps {
  feedback: AssignmentFeedback;
}

export const AIAnalysisChart: React.FC<AIAnalysisChartProps> = ({ feedback }) => {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Score: {feedback.overallScore}%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Progress value={feedback.overallScore} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Question-by-Question Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Question Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {feedback.questions.map((q, index) => (
              <div key={index} className="space-y-4 border-b pb-6 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">Question {index + 1}</h4>
                    <p className="text-gray-600 mt-1">{q.question}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Score: {q.score}%</span>
                    {q.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                
                <div className="ml-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Your Answer:</p>
                    <p className="text-gray-600 mt-1">{q.studentAnswer}</p>
                  </div>
                  
                  {!q.isCorrect && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                      <p className="text-gray-600 mt-1">{q.correctAnswer}</p>
                      {q.explanation && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Explanation: </span>
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {feedback.suggestions && feedback.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suggestions for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-4 space-y-2">
              {feedback.suggestions.map((suggestion, index) => (
                <li key={index} className="text-gray-600">
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {feedback.warnings && (
        <div className="space-y-4">
          {feedback.warnings.plagiarism && (
            <Alert variant="destructive">
              <AlertDescription>
                Warning: Potential plagiarism detected. Please ensure all work is original.
              </AlertDescription>
            </Alert>
          )}
          {feedback.warnings.aiGenerated && (
            <Alert variant="destructive">
              <AlertDescription>
                Warning: Content appears to be AI-generated. Please submit original work.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};
