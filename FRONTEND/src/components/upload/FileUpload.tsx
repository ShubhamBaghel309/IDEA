import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../ui/use-toast';
import { FileIcon, UploadIcon, Cross2Icon } from '@radix-ui/react-icons';

interface FileUploadProps {
  assignmentId: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  onUploadComplete?: (response: any) => void;
}

interface FileWithPreview extends File {
  preview?: string;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  assignmentId,
  allowedFileTypes = ['pdf', 'txt', 'py', 'ipynb', 'java', 'cpp', 'js'],
  maxFileSize = 10, // in MB
  onUploadComplete
}) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validatedFiles = acceptedFiles.map(file => {
      const fileWithPreview = Object.assign(file, {
        preview: URL.createObjectURL(file)
      });

      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!allowedFileTypes.includes(fileExtension || '')) {
        fileWithPreview.error = `File type .${fileExtension} is not allowed`;
      }

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        fileWithPreview.error = `File size exceeds ${maxFileSize}MB limit`;
      }

      return fileWithPreview;
    });

    setFiles(prev => [...prev, ...validatedFiles]);
  }, [allowedFileTypes, maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedFileTypes.reduce((acc, type) => ({ ...acc, [`.${type}`]: [] }), {}),
    maxSize: maxFileSize * 1024 * 1024
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    const filesWithErrors = files.filter(file => file.error);
    if (filesWithErrors.length > 0) {
      setError('Please fix the errors in your files before uploading');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Prepare files for submission
      const submissionFiles = await Promise.all(files.map(async (file) => {
        const content = await file.text();
        return {
          file_name: file.name,
          file_type: file.name.split('.').pop()?.toLowerCase() || '',
          content,
          size: file.size
        };
      }));

      // Submit files
      const response = await apiClient.submitAssignment(assignmentId, {
        files: submissionFiles
      });

      toast({
        title: "Upload successful",
        description: "Your files have been uploaded successfully.",
      });

      if (onUploadComplete) {
        onUploadComplete(response);
      }

      // Clear files after successful upload
      setFiles([]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload files. Please try again.');
      toast({
        title: "Upload failed",
        description: err.response?.data?.detail || 'Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
      >
        <input {...getInputProps()} />
        <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag and drop files here, or click to select files'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: {allowedFileTypes.join(', ')} (max {maxFileSize}MB each)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-2">
                <FileIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{file.name}</span>
                {file.error && (
                  <span className="text-xs text-red-500">{file.error}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {uploadProgress[file.name] !== undefined && (
                  <Progress value={uploadProgress[file.name]} className="w-24" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                >
                  <Cross2Icon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleUpload}
        disabled={isUploading || files.length === 0}
        className="w-full"
      >
        {isUploading ? 'Uploading...' : 'Upload Files'}
      </Button>
    </div>
  );
};
