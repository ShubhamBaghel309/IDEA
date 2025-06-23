
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateAssignmentPageProps {
  onBack: () => void;
  onCreateAssignment: (assignment: {
    title: string;
    description: string;
    dueDate: Date | undefined;
    fileTypesAllowed: string;
    maxPoints: number;
  }) => void;
}

const CreateAssignmentPage: React.FC<CreateAssignmentPageProps> = ({ onBack, onCreateAssignment }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [fileTypesAllowed, setFileTypesAllowed] = useState('');
  const [maxPoints, setMaxPoints] = useState<number>(100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateAssignment({
        title: title.trim(),
        description: description.trim(),
        dueDate,
        fileTypesAllowed: fileTypesAllowed.trim(),
        maxPoints
      });
      setTitle('');
      setDescription('');
      setDueDate(undefined);
      setFileTypesAllowed('');
      setMaxPoints(100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Create New Assignment</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter assignment title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter assignment description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileTypes">File Types Allowed</Label>
                <Input
                  id="fileTypes"
                  value={fileTypesAllowed}
                  onChange={(e) => setFileTypesAllowed(e.target.value)}
                  placeholder="e.g., .pdf, .doc, .docx, .txt"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPoints">Maximum Points</Label>
                <Input
                  id="maxPoints"
                  type="number"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(Number(e.target.value))}
                  min="1"
                  max="1000"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Create Assignment
                </Button>
                <Button type="button" variant="outline" onClick={onBack}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateAssignmentPage;
