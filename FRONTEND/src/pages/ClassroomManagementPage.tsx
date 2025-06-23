
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Edit, Trash2, Plus } from 'lucide-react';

interface Classroom {
  id: string;
  name: string;
  description: string;
  studentCount: number;
  createdDate: string;
}

interface ClassroomManagementPageProps {
  onCreateClassroom: () => void;
  onEditClassroom: (classroomId: string) => void;
  onDeleteClassroom: (classroomId: string) => void;
  onViewRoster: (classroomId: string) => void;
}

const ClassroomManagementPage: React.FC<ClassroomManagementPageProps> = ({
  onCreateClassroom,
  onEditClassroom,
  onDeleteClassroom,
  onViewRoster
}) => {
  // Mock data - in real app this would come from props or API
  const classrooms: Classroom[] = [
    {
      id: '1',
      name: 'Advanced Mathematics',
      description: 'Calculus and advanced mathematical concepts',
      studentCount: 28,
      createdDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Computer Science 101',
      description: 'Introduction to programming and computer science',
      studentCount: 32,
      createdDate: '2024-01-20'
    },
    {
      id: '3',
      name: 'Physics Lab',
      description: 'Hands-on physics experiments and theory',
      studentCount: 24,
      createdDate: '2024-02-01'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Classroom Management</h1>
          <Button onClick={onCreateClassroom} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Classroom
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Classrooms</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classroom Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classrooms.map((classroom) => (
                  <TableRow key={classroom.id}>
                    <TableCell className="font-medium">{classroom.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {classroom.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {classroom.studentCount}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(classroom.createdDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewRoster(classroom.id)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClassroom(classroom.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteClassroom(classroom.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassroomManagementPage;
