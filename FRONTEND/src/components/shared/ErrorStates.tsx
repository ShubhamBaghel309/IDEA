
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, FileX } from 'lucide-react';

interface ErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showGoHome?: boolean;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again.",
  onRetry,
  onGoHome,
  showRetry = true,
  showGoHome = true
}) => {
  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          <div className="flex gap-3 justify-center">
            {showRetry && onRetry && (
              <Button onClick={onRetry} className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </Button>
            )}
            {showGoHome && onGoHome && (
              <Button onClick={onGoHome} variant="outline" className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title = "Error",
  message = "Something went wrong",
  onRetry,
  className
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

interface NotFoundProps {
  title?: string;
  message?: string;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({
  title = "Page Not Found",
  message = "The page you're looking for doesn't exist or has been moved.",
  onGoBack,
  onGoHome
}) => {
  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6">
      <div className="text-center">
        <FileX className="h-24 w-24 text-gray-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">{title}</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">{message}</p>
        <div className="flex gap-4 justify-center">
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline">
              Go Back
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}> = ({ icon, title, message, action }) => {
  return (
    <div className="text-center py-12">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{message}</p>
      {action}
    </div>
  );
};
