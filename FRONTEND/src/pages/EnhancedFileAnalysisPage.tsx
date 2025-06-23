import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Code, BookOpen, CheckCircle, AlertCircle, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

interface FileAnalysisResult {
  grade: string;
  feedback: string;
  analysis: string;
  file_analysis: {
    file_type: string;
    detailed_analysis: any;
    subject_analysis?: any;
  };
  optimized_solutions: Array<{
    type: string;
    issues?: string[];
    solution?: string;
    suggestions?: string;
  }>;
  success: boolean;
}

const EnhancedFileAnalysisPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FileAnalysisResult | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'file' | 'code' | 'notebook'>('file');
  const [codeInput, setCodeInput] = useState('');
  const [language, setLanguage] = useState('python');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Auto-detect analysis mode based on file extension
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'ipynb') {
        setAnalysisMode('notebook');
      } else if (['py', 'cpp', 'js', 'java', 'c'].includes(extension || '')) {
        setAnalysisMode('code');
        setLanguage(extension === 'py' ? 'python' : extension === 'cpp' ? 'cpp' : extension || 'python');
      } else {
        setAnalysisMode('file');
      }
    }
  };

  const analyzeFile = async () => {
    if (!file && analysisMode === 'file') {
      toast({
        title: "Error",
        description: "Please select a file to analyze",
        variant: "destructive",
      });
      return;
    }    if (!question.trim()) {
      toast({
        title: "Error", 
        description: "Please provide an assignment question or description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let progressToast = toast({
      title: "Analysis in Progress",
      description: "This may take a few minutes...",
      duration: Infinity,
    });    try {
      let endpoint = '/analyze-file-public';
      let formData = new FormData();

      if (analysisMode === 'file' && file) {
        formData.append('file', file);
        formData.append('question', question);
        formData.append('student_name', 'Test Student');
      } else if (analysisMode === 'code') {
        endpoint = '/analyze-code-public';
        formData.append('code', codeInput);
        formData.append('language', language);
        formData.append('question', question);
        formData.append('student_name', 'Test Student');
      } else if (analysisMode === 'notebook' && file) {
        endpoint = '/analyze-jupyter-public';
        const notebookContent = await file.text();
        formData.append('notebook_content', notebookContent);
        formData.append('assignment_title', question);
        formData.append('student_name', 'Test Student');
      }      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Analysis Complete",
        description: "Your file has been analyzed successfully!",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      if (error.name === 'AbortError') {
        toast({
          title: "Request Timeout",
          description: "The analysis is taking too long. Please try again with a smaller file or contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: error instanceof Error ? error.message : "There was an error analyzing your file. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      progressToast.dismiss();
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'jupyter_notebook':
        return <BookOpen className="h-4 w-4" />;
      case 'python_code':
      case 'cpp_code':
        return <Code className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFileTypeBadgeColor = (fileType: string) => {
    switch (fileType) {
      case 'jupyter_notebook':
        return 'bg-orange-100 text-orange-800';
      case 'python_code':
        return 'bg-blue-100 text-blue-800';
      case 'cpp_code':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced File Analysis</h1>
        <p className="text-gray-600">Upload and analyze files with AI-powered detailed feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Analysis Setup
              </CardTitle>
              <CardDescription>
                Choose your analysis mode and provide the necessary inputs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={analysisMode} onValueChange={(value) => setAnalysisMode(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="file">File Upload</TabsTrigger>
                  <TabsTrigger value="code">Code Input</TabsTrigger>
                  <TabsTrigger value="notebook">Jupyter Notebook</TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Select File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.txt,.py,.cpp,.js,.java,.c,.ipynb"
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Supported: PDF, TXT, Python, C++, JavaScript, Java, Jupyter Notebooks
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="code" className="space-y-4">
                  <div>
                    <Label htmlFor="language">Programming Language</Label>
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                      <option value="javascript">JavaScript</option>
                      <option value="java">Java</option>
                      <option value="c">C</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="code-input">Code to Analyze</Label>
                    <Textarea
                      id="code-input"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      placeholder="Paste your code here..."
                      className="mt-1 font-mono text-sm"
                      rows={10}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="notebook" className="space-y-4">
                  <div>
                    <Label htmlFor="notebook-upload">Jupyter Notebook File</Label>
                    <Input
                      id="notebook-upload"
                      type="file"
                      onChange={handleFileUpload}
                      accept=".ipynb"
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Upload a .ipynb file for detailed notebook analysis
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label htmlFor="question">Assignment Question/Description</Label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Describe the assignment requirements or paste the question here..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <Button 
                onClick={analyzeFile} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Analyze File
                  </>
                )}
              </Button>

              {file && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result && (
            <>
              {/* Grade and Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Analysis Results</span>
                    <Badge 
                      variant="outline" 
                      className={`${
                        result.success ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'
                      }`}
                    >
                      Grade: {result.grade}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.file_analysis && (
                    <div className="flex items-center gap-2 mb-4">
                      {getFileTypeIcon(result.file_analysis.file_type)}
                      <Badge className={getFileTypeBadgeColor(result.file_analysis.file_type)}>
                        {result.file_analysis.file_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  
                  {result.file_analysis?.detailed_analysis && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {result.file_analysis.detailed_analysis.lines_of_code && (
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-600">
                            {result.file_analysis.detailed_analysis.lines_of_code}
                          </div>
                          <div className="text-sm text-blue-500">Lines of Code</div>
                        </div>
                      )}
                      {result.file_analysis.detailed_analysis.complexity && (
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <div className="text-2xl font-bold text-purple-600">
                            {result.file_analysis.detailed_analysis.complexity}
                          </div>
                          <div className="text-sm text-purple-500">Complexity Score</div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                      {result.feedback}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Optimized Solutions */}
              {result.optimized_solutions && result.optimized_solutions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Optimization Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.optimized_solutions.map((solution, index) => (
                      <div key={index} className="border-l-4 border-yellow-400 pl-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {solution.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        {solution.issues && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-red-600 mb-1">Issues Found:</p>
                            <ul className="text-sm text-red-500">
                              {solution.issues.map((issue, i) => (
                                <li key={i}>• {issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {solution.solution && (
                          <div className="bg-green-50 p-3 rounded text-sm">
                            <p className="font-medium text-green-800 mb-1">Suggested Solution:</p>
                            <pre className="whitespace-pre-wrap text-green-700">
                              {solution.solution}
                            </pre>
                          </div>
                        )}
                        {solution.suggestions && (
                          <div className="bg-blue-50 p-3 rounded text-sm">
                            <p className="font-medium text-blue-800 mb-1">Improvement Suggestions:</p>
                            <div className="text-blue-700 whitespace-pre-wrap">
                              {solution.suggestions}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Technical Analysis */}
              {result.file_analysis?.detailed_analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.file_analysis.detailed_analysis.functions && (
                        <div>
                          <h4 className="font-semibold mb-2">Functions Found:</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.file_analysis.detailed_analysis.functions.map((func: string, i: number) => (
                              <Badge key={i} variant="secondary">{func}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {result.file_analysis.detailed_analysis.classes && (
                        <div>
                          <h4 className="font-semibold mb-2">Classes Found:</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.file_analysis.detailed_analysis.classes.map((cls: string, i: number) => (
                              <Badge key={i} variant="outline">{cls}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.file_analysis.detailed_analysis.imports && (
                        <div>
                          <h4 className="font-semibold mb-2">Imports Used:</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.file_analysis.detailed_analysis.imports.map((imp: string, i: number) => (
                              <Badge key={i} className="bg-gray-100 text-gray-700">{imp}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {loading && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto" />
                  <p className="text-gray-600">Analyzing your file... This may take a few moments.</p>
                  <Progress value={33} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedFileAnalysisPage;
