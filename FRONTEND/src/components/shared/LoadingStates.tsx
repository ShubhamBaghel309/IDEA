
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <Loader className={cn(
      'animate-spin text-primary',
      sizeClasses[size],
      className
    )} />
  );
};

interface LoadingCardProps {
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
};

interface LoadingTableProps {
  rows?: number;
  columns?: number;
}

export const LoadingTable: React.FC<LoadingTableProps> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-3/4" />
          ))}
        </div>
      ))}
    </div>
  );
};

interface LoadingPageProps {
  title?: string;
  subtitle?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  title = "Loading...", 
  subtitle = "Please wait while we load your content." 
}) => {
  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export const LoadingButton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size="sm" />
      <span>{children}</span>
    </div>
  );
};
