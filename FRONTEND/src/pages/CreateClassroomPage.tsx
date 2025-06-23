
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

interface CreateClassroomPageProps {
  onBack: () => void;
  onCreateClassroom: (classroom: { name: string; description: string }) => void;
}

const CreateClassroomPage: React.FC<CreateClassroomPageProps> = ({ onBack, onCreateClassroom }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateClassroom({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Create New Classroom</h1>
        </div>

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
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Create Classroom
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

export default CreateClassroomPage;
