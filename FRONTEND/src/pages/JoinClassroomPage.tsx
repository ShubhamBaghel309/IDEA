
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { classroomService } from '@/lib/classroom';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface JoinClassroomPageProps {
  onBack?: () => void;
}

const JoinClassroomPage: React.FC<JoinClassroomPageProps> = ({ onBack }) => {
  const [classCode, setClassCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await classroomService.joinClassroom(classCode.trim().toUpperCase());
      setIsJoined(true);
      toast({
        title: "Joined Successfully!",
        description: "You have successfully joined the classroom.",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to join classroom';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };
  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Join Classroom</h1>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isJoined ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Successfully Joined!</CardTitle>
              <p className="text-sm text-green-600">
                You have successfully joined the classroom. You can now access assignments and course materials.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button onClick={goToDashboard} className="flex-1 bg-primary hover:bg-primary/90">
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsJoined(false);
                  setClassCode('');
                  setError(null);
                }}>
                  Join Another
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Class codes are usually 6 characters long
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isLoading || !classCode.trim()}
                  >
                    {isLoading ? 'Joining...' : 'Join Class'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JoinClassroomPage;
