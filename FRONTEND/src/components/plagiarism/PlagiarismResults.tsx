
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface PlagiarismMatch {
  source: string;
  similarity: number;
  matchedText: string;
}

interface PlagiarismResultsProps {
  overallScore: number;
  matches: PlagiarismMatch[];
  fileName: string;
}

const PlagiarismResults: React.FC<PlagiarismResultsProps> = ({
  overallScore,
  matches,
  fileName
}) => {
  const getScoreColor = (score: number) => {
    if (score < 20) return 'text-green-600';
    if (score < 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score < 20) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score < 50) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getScoreBadge = (score: number) => {
    if (score < 20) return <Badge variant="secondary">Low Risk</Badge>;
    if (score < 50) return <Badge variant="outline">Medium Risk</Badge>;
    return <Badge variant="destructive">High Risk</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getScoreIcon(overallScore)}
            Plagiarism Analysis: {fileName}
          </CardTitle>
          {getScoreBadge(overallScore)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Similarity Score</span>
            <span className={getScoreColor(overallScore)}>
              {overallScore}%
            </span>
          </div>
          <Progress 
            value={overallScore} 
            className="h-2"
          />
        </div>

        {matches.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Similar Sources Found:</h4>
            {matches.map((match, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm">{match.source}</span>
                  <Badge variant="outline">{match.similarity}% match</Badge>
                </div>
                <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                  "{match.matchedText}"
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlagiarismResults;
