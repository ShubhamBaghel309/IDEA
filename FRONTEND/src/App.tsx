import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Import only the pages that actually exist
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CreateClassroomPage from "./pages/CreateClassroomPage";
import JoinClassroomPage from "./pages/JoinClassroomPage";
import CreateAssignmentPage from "./pages/CreateAssignmentPage";
import EnhancedFileAnalysisPage from "./pages/EnhancedFileAnalysisPage";
import AssignmentUploadPage from "./pages/AssignmentUploadPage";

// Simple NotFound component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600">The page you're looking for doesn't exist.</p>
      <a href="/" className="text-blue-600 hover:underline mt-4 inline-block">
        Go back to home
      </a>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Teacher routes */}
            <Route 
              path="/create-classroom" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <CreateClassroomPage 
                    onBack={() => window.history.back()}
                    onCreateClassroom={() => console.log('Create classroom')}
                  />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/classroom/:id/create-assignment" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <CreateAssignmentPage 
                    onBack={() => window.history.back()}
                    onCreateAssignment={() => console.log('Create assignment')}
                  />
                </ProtectedRoute>
              } 
            />
            
            {/* Student routes */}
            <Route 
              path="/join-classroom" 
              element={
                <ProtectedRoute requiredRole="student">
                  <JoinClassroomPage 
                    onBack={() => window.history.back()}
                    onJoinClassroom={() => console.log('Join classroom')}
                  />
                </ProtectedRoute>
              } 
            />
              {/* Enhanced File Analysis - Available to all authenticated users */}
            <Route 
              path="/enhanced-analysis" 
              element={
                <ProtectedRoute>
                  <EnhancedFileAnalysisPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Assignment Upload - Available to all authenticated users */}
            <Route 
              path="/upload-assignment" 
              element={
                <ProtectedRoute>
                  <AssignmentUploadPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
