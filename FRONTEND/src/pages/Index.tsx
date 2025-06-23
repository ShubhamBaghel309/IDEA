
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Upload, 
  Brain, 
  CheckCircle, 
  Users, 
  FileText, 
  Code,
  Zap,
  Shield,
  BarChart
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Classroom Assistant</h1>
                <p className="text-sm text-gray-600">Intelligent Assignment Grading & Analysis</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            Powered by Google Gemini AI
          </Badge>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Revolutionize Assignment Grading with AI
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload assignments in multiple formats and get instant, comprehensive feedback with AI-powered grading, 
            plagiarism detection, and code optimization suggestions.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/upload-assignment')} className="gap-2">
              <Upload className="w-5 h-5" />
              Try Assignment Upload
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/auth')} className="gap-2">
              <Users className="w-5 h-5" />
              Create Account
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Multi-Format Support</CardTitle>
              <CardDescription>
                Support for text, PDF, Jupyter notebooks, Python, C++, and more file formats
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                Advanced natural language processing and code analysis using Google Gemini AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Plagiarism Detection</CardTitle>
              <CardDescription>
                Detect both traditional plagiarism and AI-generated content with confidence scores
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <Code className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Code Optimization</CardTitle>
              <CardDescription>
                Get specific suggestions for improving code quality, structure, and performance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Instant Feedback</CardTitle>
              <CardDescription>
                Receive detailed grading and feedback within seconds of submission
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                <BarChart className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Detailed Analytics</CardTitle>
              <CardDescription>
                Comprehensive analysis including complexity metrics, technical assessment, and learning recommendations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Demo Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              See It In Action
            </h3>
            <p className="text-gray-600 mb-6">
              Try our AI assignment checker right now - no registration required for demo
            </p>
            <Button size="lg" onClick={() => navigate('/upload-assignment')} className="gap-2">
              <Upload className="w-5 h-5" />
              Upload Assignment Now
            </Button>
          </div>

          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Upload File</h4>
              <p className="text-sm text-gray-600">Choose your assignment format</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-600">Our AI analyzes the content</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Get Results</h4>
              <p className="text-sm text-gray-600">Receive detailed feedback</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Improve</h4>
              <p className="text-sm text-gray-600">Apply optimization suggestions</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Grading Process?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of educators using AI to provide better feedback faster
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
              <BookOpen className="w-5 h-5" />
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/enhanced-analysis')} className="gap-2">
              <Code className="w-5 h-5" />
              Try Enhanced Analysis
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">AI Classroom Assistant</span>
            </div>
            <p className="text-gray-400 mb-6">
              Empowering education through artificial intelligence
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-400">
              <span>© 2025 AI Classroom Assistant</span>
              <span>•</span>
              <span>Powered by Google Gemini</span>
              <span>•</span>
              <span>Built for GDSC Solution Challenge</span>
            </div>
          </div>
        </div>
      </footer>
    </div>  );
};

export default Index;
