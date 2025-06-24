
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { classroomService } from '@/lib/classroom';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CreateClassroomPageProps {
  onBack?: () => void;
}

const CreateClassroomPage: React.FC<CreateClassroomPageProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdClassroom, setCreatedClassroom] = useState<{ classroom_id: number; class_code: string } | null>(null);
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
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await classroomService.createClassroom({
        name: name.trim(),
        description: description.trim()
      });
      
      setCreatedClassroom(result);
      toast({
        title: "Classroom Created!",
        description: `Your classroom "${name}" has been created successfully.`,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create classroom';
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

  const copyClassCode = async () => {
    if (createdClassroom?.class_code) {
      try {
        await navigator.clipboard.writeText(createdClassroom.class_code);
        toast({
          title: "Copied!",
          description: "Class code copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to copy class code",
          variant: "destructive",
        });
      }
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };
  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Create New Classroom</h1>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {createdClassroom ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Classroom Created Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-semibold text-lg mb-2">{name}</h3>
                {description && <p className="text-gray-600 mb-4">{description}</p>}
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Class Code</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 p-3 bg-gray-50 rounded-lg border font-mono text-xl text-center tracking-wider">
                        {createdClassroom.class_code}
                      </div>
                      <Button variant="outline" size="sm" onClick={copyClassCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Share this code with your students so they can join your classroom
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={goToDashboard} className="bg-primary hover:bg-primary/90">
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => {
                  setCreatedClassroom(null);
                  setName('');
                  setDescription('');
                  setError(null);
                }}>
                  Create Another Classroom
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Classroom Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Classroom Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter classroom name"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter classroom description"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90"
                    disabled={isLoading || !name.trim()}
                  >
                    {isLoading ? 'Creating...' : 'Create Classroom'}
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

export default CreateClassroomPage;
