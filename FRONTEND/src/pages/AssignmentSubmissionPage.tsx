
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, FileText, Upload } from 'lucide-react';
import FileUpload from '@/components/upload/FileUpload';

interface AssignmentSubmissionPageProps {
  onBack: () => void;
  onSubmit: (submission: { textResponse: string; files: File[] }) => void;
}

const AssignmentSubmissionPage: React.FC<AssignmentSubmissionPageProps> = ({ onBack, onSubmit }) => {
  const [textResponse, setTextResponse] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // Mock assignment data
  const assignment = {
    title: "Python Data Structures Assignment",
    description: "Implement a binary search tree with insert, delete, and search operations. Include unit tests and documentation.",
    dueDate: "2024-06-15T23:59:00",
    maxPoints: 100,
    allowedFileTypes: [".py", ".pdf", ".txt"],
    className: "Computer Science 101"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ textResponse, files });
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  const isDueSoon = () => {
    const date = new Date(assignment.dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 1;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">{assignment.title}</h1>
            <p className="text-muted-foreground">{assignment.className}</p>
          </div>
          <Badge variant={isDueSoon() ? "destructive" : "outline"}>
            <Clock className="h-3 w-3 mr-1" />
            {formatDueDate(assignment.dueDate)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignment Details */}
          <div className="lg:col-span-1">
            <Card className="material-elevation-1 sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Assignment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Points</Label>
                  <p className="text-sm text-muted-foreground mt-1">{assignment.maxPoints} points</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Allowed File Types</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {assignment.allowedFileTypes.map(type => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submission Form */}
          <div className="lg:col-span-2">
            <Card className="material-elevation-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Your Submission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="textResponse">Written Response</Label>
                    <Textarea
                      id="textResponse"
                      value={textResponse}
                      onChange={(e) => setTextResponse(e.target.value)}
                      placeholder="Enter your written response, code explanation, or additional notes here..."
                      rows={8}
                      className="min-h-[200px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Provide explanations, document your approach, or include any additional information.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>File Attachments</Label>
                    <FileUpload onFilesChange={setFiles} maxFiles={5} />
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                      Submit Assignment
                    </Button>
                    <Button type="button" variant="outline">
                      Save Draft
                    </Button>
                    <Button type="button" variant="ghost" onClick={onBack}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmissionPage;
