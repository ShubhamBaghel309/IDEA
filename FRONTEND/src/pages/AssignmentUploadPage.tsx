import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Code, BookOpen, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { apiClient, AssignmentResult } from '@/lib/api';

const AssignmentUploadPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AssignmentResult | null>(null);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('text');

  // Text assignment form
  const [textForm, setTextForm] = useState({
    student_name: '',
    question: '',
    answer: '',
    reference_material: ''
  });

  // PDF assignment form
  const [pdfForm, setPdfForm] = useState({
    student_name: '',
    assignment_prompt: '',
    reference_material: '',
    pdf_file: null as File | null
  });

  // File analysis form
  const [fileForm, setFileForm] = useState({
    student_name: '',
    question: '',
    file: null as File | null
  });

  // Code analysis form
  const [codeForm, setCodeForm] = useState({
    code: '',
    language: 'python',
    question: ''
  });

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiClient.checkTextAssignment(textForm);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to check assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfForm.pdf_file) {
      setError('Please select a PDF file');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiClient.checkPdfAssignment(pdfForm);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to check PDF assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileForm.file) {
      setError('Please select a file');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiClient.analyzeFile(fileForm);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeForm.code.trim()) {
      setError('Please enter some code to analyze');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiClient.analyzeCode(codeForm);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze code');
    } finally {
      setIsLoading(false);
    }
  };

  const renderResults = () => {
    if (!result) return null;

    const getGradeColor = (grade: string) => {
      const gradeNum = parseInt(grade);
      if (gradeNum >= 90) return 'text-green-600';
      if (gradeNum >= 80) return 'text-blue-600';
      if (gradeNum >= 70) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getGradeIcon = (grade: string) => {
      const gradeNum = parseInt(grade);
      if (gradeNum >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
      if (gradeNum >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      return <XCircle className="w-5 h-5 text-red-600" />;
    };

    return (
      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Assignment Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grade Section */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getGradeIcon(result.grade)}
                <div>
                  <h3 className="font-semibold">Grade</h3>
                  <p className="text-sm text-gray-600">Student: {result.student_name}</p>
                </div>
              </div>
              <div className={`text-2xl font-bold ${getGradeColor(result.grade)}`}>
                {result.grade}
              </div>
            </div>

            {/* Plagiarism Results */}
            {result.plagiarism && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Plagiarism Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Similarity Score</Label>
                    <div className="flex items-center gap-2">
                      <Progress value={result.plagiarism.score} className="flex-1" />
                      <span className="text-sm font-medium">{result.plagiarism.score.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <Label>AI Generated</Label>
                    <Badge variant={result.plagiarism.ai_generated ? "destructive" : "default"}>
                      {result.plagiarism.ai_generated ? "Detected" : "Not Detected"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* File Analysis */}
            {result.file_analysis && Object.keys(result.file_analysis).length > 0 && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  File Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>File Type</Label>
                    <p className="capitalize">{result.file_analysis.file_type?.replace('_', ' ')}</p>
                  </div>
                  {result.file_analysis.detailed_analysis && (
                    <div>
                      <Label>Technical Details</Label>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(result.file_analysis.detailed_analysis, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feedback Section */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Detailed Feedback</h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm">{result.feedback}</pre>
              </div>
            </div>

            {/* Analysis Section */}
            {result.analysis && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Detailed Analysis</h3>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{result.analysis}</pre>
                </div>
              </div>
            )}

            {/* Optimized Solutions */}
            {result.optimized_solutions && result.optimized_solutions.length > 0 && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Optimization Suggestions ({result.optimized_solutions.length})
                </h3>
                <div className="space-y-3">
                  {result.optimized_solutions.map((solution, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <h4 className="font-medium text-sm capitalize">
                        {solution.type?.replace('_', ' ')}
                      </h4>
                      <pre className="text-xs mt-1 overflow-auto max-h-32">
                        {solution.solution || solution.suggestions || JSON.stringify(solution, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Assignment Checker</h1>
        <p className="text-gray-600">
          Upload your assignments for intelligent AI-powered grading and feedback
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="text">Text Assignment</TabsTrigger>
          <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
          <TabsTrigger value="file">File Analysis</TabsTrigger>
          <TabsTrigger value="code">Code Analysis</TabsTrigger>
        </TabsList>

        {/* Text Assignment Tab */}
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Text Assignment Checker
              </CardTitle>
              <CardDescription>
                Submit text-based assignments for AI grading and feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTextSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="student_name">Student Name</Label>
                  <Input
                    id="student_name"
                    value={textForm.student_name}
                    onChange={(e) => setTextForm({...textForm, student_name: e.target.value})}
                    placeholder="Enter student name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="question">Assignment Question</Label>
                  <Textarea
                    id="question"
                    value={textForm.question}
                    onChange={(e) => setTextForm({...textForm, question: e.target.value})}
                    placeholder="Enter the assignment question or prompt"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="answer">Student Answer</Label>
                  <Textarea
                    id="answer"
                    value={textForm.answer}
                    onChange={(e) => setTextForm({...textForm, answer: e.target.value})}
                    placeholder="Enter or paste the student's answer"
                    rows={6}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reference">Reference Material (Optional)</Label>
                  <Textarea
                    id="reference"
                    value={textForm.reference_material}
                    onChange={(e) => setTextForm({...textForm, reference_material: e.target.value})}
                    placeholder="Enter reference material to compare against"
                    rows={3}
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Checking Assignment...' : 'Check Assignment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDF Upload Tab */}
        <TabsContent value="pdf">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                PDF Assignment Upload
              </CardTitle>
              <CardDescription>
                Upload PDF assignments for automated analysis and grading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePdfSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="pdf_student_name">Student Name</Label>
                  <Input
                    id="pdf_student_name"
                    value={pdfForm.student_name}
                    onChange={(e) => setPdfForm({...pdfForm, student_name: e.target.value})}
                    placeholder="Enter student name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="assignment_prompt">Assignment Instructions</Label>
                  <Textarea
                    id="assignment_prompt"
                    value={pdfForm.assignment_prompt}
                    onChange={(e) => setPdfForm({...pdfForm, assignment_prompt: e.target.value})}
                    placeholder="Enter the assignment instructions or prompt"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pdf_file">PDF File</Label>
                  <Input
                    id="pdf_file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfForm({...pdfForm, pdf_file: e.target.files?.[0] || null})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pdf_reference">Reference Material (Optional)</Label>
                  <Textarea
                    id="pdf_reference"
                    value={pdfForm.reference_material}
                    onChange={(e) => setPdfForm({...pdfForm, reference_material: e.target.value})}
                    placeholder="Enter reference material to compare against"
                    rows={3}
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Processing PDF...' : 'Upload and Check PDF'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Analysis Tab */}
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Enhanced File Analysis
              </CardTitle>
              <CardDescription>
                Upload various file types (.ipynb, .py, .cpp, etc.) for detailed analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="file_student_name">Student Name (Optional)</Label>
                  <Input
                    id="file_student_name"
                    value={fileForm.student_name}
                    onChange={(e) => setFileForm({...fileForm, student_name: e.target.value})}
                    placeholder="Enter student name"
                  />
                </div>
                <div>
                  <Label htmlFor="file_question">Assignment Context</Label>
                  <Textarea
                    id="file_question"
                    value={fileForm.question}
                    onChange={(e) => setFileForm({...fileForm, question: e.target.value})}
                    placeholder="Describe what this file should accomplish"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="analysis_file">File Upload</Label>
                  <Input
                    id="analysis_file"
                    type="file"
                    accept=".py,.cpp,.ipynb,.js,.ts,.java,.c,.h,.hpp"
                    onChange={(e) => setFileForm({...fileForm, file: e.target.files?.[0] || null})}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports: Python (.py), C++ (.cpp), Jupyter (.ipynb), JavaScript (.js), TypeScript (.ts), Java (.java)
                  </p>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Analyzing File...' : 'Analyze File'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Analysis Tab */}
        <TabsContent value="code">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Direct Code Analysis
              </CardTitle>
              <CardDescription>
                Paste code directly for analysis and optimization suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code_language">Programming Language</Label>
                  <select
                    id="code_language"
                    value={codeForm.language}
                    onChange={(e) => setCodeForm({...codeForm, language: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="c">C</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="code_question">Assignment Context (Optional)</Label>
                  <Textarea
                    id="code_question"
                    value={codeForm.question}
                    onChange={(e) => setCodeForm({...codeForm, question: e.target.value})}
                    placeholder="Describe what this code should accomplish"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="code_input">Code</Label>
                  <Textarea
                    id="code_input"
                    value={codeForm.code}
                    onChange={(e) => setCodeForm({...codeForm, code: e.target.value})}
                    placeholder="Paste your code here..."
                    rows={10}
                    className="font-mono text-sm"
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Analyzing Code...' : 'Analyze Code'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Alert className="mt-4 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-700">Processing your assignment...</span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {renderResults()}
    </div>
  );
};

export default AssignmentUploadPage;
