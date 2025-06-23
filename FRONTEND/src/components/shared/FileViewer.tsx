
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Code, Download, Eye } from 'lucide-react';

interface FileViewerProps {
  fileName: string;
  fileContent?: string;
  fileUrl?: string;
  fileSize?: number;
  onDownload?: () => void;
  onView?: () => void;
  className?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({
  fileName,
  fileContent,
  fileUrl,
  fileSize,
  onDownload,
  onView,
  className
}) => {
  const getFileExtension = (name: string) => {
    return name.split('.').pop()?.toLowerCase() || '';
  };

  const getFileType = (extension: string) => {
    const codeExtensions = ['py', 'js', 'cpp', 'java', 'html', 'css', 'json'];
    if (codeExtensions.includes(extension)) return 'code';
    if (extension === 'pdf') return 'pdf';
    if (extension === 'txt') return 'text';
    if (extension === 'ipynb') return 'notebook';
    return 'unknown';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLanguageFromExtension = (extension: string) => {
    const languageMap: { [key: string]: string } = {
      'py': 'python',
      'js': 'javascript',
      'cpp': 'cpp',
      'java': 'java',
      'html': 'html',
      'css': 'css',
      'json': 'json'
    };
    return languageMap[extension] || 'text';
  };

  const extension = getFileExtension(fileName);
  const fileType = getFileType(extension);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {fileType === 'code' ? (
              <Code className="h-5 w-5 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 text-gray-500" />
            )}
            <CardTitle className="text-lg">{fileName}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{extension.toUpperCase()}</Badge>
            {fileSize && (
              <Badge variant="secondary">{formatFileSize(fileSize)}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {fileContent && fileType === 'code' && (
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
              <code className={`language-${getLanguageFromExtension(extension)}`}>
                {fileContent}
              </code>
            </pre>
          </div>
        )}
        
        {fileContent && fileType === 'text' && (
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {fileContent}
            </pre>
          </div>
        )}

        {fileType === 'pdf' && fileUrl && (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">PDF Preview</p>
            <iframe
              src={fileUrl}
              className="w-full h-96 border rounded"
              title={fileName}
            />
          </div>
        )}

        {!fileContent && !fileUrl && (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">File preview not available</p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {onView && (
            <Button onClick={onView} variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          )}
          {onDownload && (
            <Button onClick={onDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileViewer;
