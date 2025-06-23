
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Users } from 'lucide-react';

interface JoinClassroomPageProps {
  onBack: () => void;
  onJoinClassroom: (classCode: string) => void;
}

const JoinClassroomPage: React.FC<JoinClassroomPageProps> = ({ onBack, onJoinClassroom }) => {
  const [classCode, setClassCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (classCode.trim()) {
      onJoinClassroom(classCode.trim().toUpperCase());
      setClassCode('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Join Classroom</h1>
        </div>

        <Card className="material-elevation-1">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Enter Class Code</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ask your teacher for the class code, then enter it here.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="classCode">Class Code</Label>
                <Input
                  id="classCode"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="Enter class code (e.g., ABC123)"
                  className="text-center text-lg font-mono tracking-wider"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Class codes are usually 6 characters long
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  Join Class
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

export default JoinClassroomPage;
