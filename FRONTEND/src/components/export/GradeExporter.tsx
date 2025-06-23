
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, Calendar, Users } from 'lucide-react';

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  dateRange: 'all' | 'current-semester' | 'last-month' | 'custom';
  includeStudentInfo: boolean;
  includeAssignmentDetails: boolean;
  includeComments: boolean;
  includePlagiarismScores: boolean;
}

interface GradeExporterProps {
  classroomId: string;
  onExport: (options: ExportOptions) => void;
}

const GradeExporter: React.FC<GradeExporterProps> = ({ classroomId, onExport }) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: 'all',
    includeStudentInfo: true,
    includeAssignmentDetails: true,
    includeComments: false,
    includePlagiarismScores: false
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock CSV data
      if (exportOptions.format === 'csv') {
        const csvData = generateMockCSV(exportOptions);
        downloadCSV(csvData, `grades-${classroomId}-${Date.now()}.csv`);
      }
      
      onExport(exportOptions);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateMockCSV = (options: ExportOptions): string => {
    const headers = ['Student Name', 'Student Email'];
    
    if (options.includeAssignmentDetails) {
      headers.push('Assignment 1', 'Assignment 2', 'Assignment 3', 'Final Grade');
    }
    
    if (options.includeComments) {
      headers.push('Comments');
    }
    
    if (options.includePlagiarismScores) {
      headers.push('Plagiarism Score');
    }

    const rows = [
      headers.join(','),
      'Alice Johnson,alice@school.edu,85,90,88,87.7,Great work overall,5%',
      'Bob Smith,bob@school.edu,78,75,82,78.3,Needs improvement in problem solving,12%',
      'Carol Davis,carol@school.edu,95,92,96,94.3,Excellent performance,2%'
    ];

    return rows.join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const updateOption = <K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export Grades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select
            value={exportOptions.format}
            onValueChange={(value: 'csv' | 'excel' | 'pdf') => updateOption('format', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (.csv)</SelectItem>
              <SelectItem value="excel">Excel (.xlsx)</SelectItem>
              <SelectItem value="pdf">PDF (.pdf)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Select
            value={exportOptions.dateRange}
            onValueChange={(value: ExportOptions['dateRange']) => updateOption('dateRange', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="current-semester">Current Semester</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Include Options */}
        <div className="space-y-4">
          <Label>Include in Export</Label>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="student-info"
                checked={exportOptions.includeStudentInfo}
                onCheckedChange={(checked) => updateOption('includeStudentInfo', !!checked)}
              />
              <Label htmlFor="student-info" className="text-sm">
                Student Information (Name, Email)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="assignment-details"
                checked={exportOptions.includeAssignmentDetails}
                onCheckedChange={(checked) => updateOption('includeAssignmentDetails', !!checked)}
              />
              <Label htmlFor="assignment-details" className="text-sm">
                Assignment Details & Grades
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="comments"
                checked={exportOptions.includeComments}
                onCheckedChange={(checked) => updateOption('includeComments', !!checked)}
              />
              <Label htmlFor="comments" className="text-sm">
                Teacher Comments & Feedback
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="plagiarism"
                checked={exportOptions.includePlagiarismScores}
                onCheckedChange={(checked) => updateOption('includePlagiarismScores', !!checked)}
              />
              <Label htmlFor="plagiarism" className="text-sm">
                Plagiarism Detection Scores
              </Label>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Grades
            </>
          )}
        </Button>

        {/* Preview Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Estimated: 30 students, 4 assignments
          </p>
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Date range: {exportOptions.dateRange.replace('-', ' ')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GradeExporter;
