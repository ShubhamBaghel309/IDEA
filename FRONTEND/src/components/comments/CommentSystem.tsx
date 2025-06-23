
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Reply, Edit, Trash2 } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  authorRole: 'teacher' | 'student';
  content: string;
  timestamp: string;
  parentId?: string;
  isEdited?: boolean;
}

interface CommentSystemProps {
  assignmentId: string;
  submissionId?: string;
  currentUser: { name: string; role: 'teacher' | 'student' };
  onAddComment: (content: string, parentId?: string) => void;
  onEditComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
}

const CommentSystem: React.FC<CommentSystemProps> = ({
  assignmentId,
  submissionId,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Mock comments data
  const comments: Comment[] = [
    {
      id: '1',
      author: 'Dr. Smith',
      authorRole: 'teacher',
      content: 'Great work on this assignment! Your solution is well-structured and efficient.',
      timestamp: '2024-06-10T10:30:00Z'
    },
    {
      id: '2',
      author: 'Alice Johnson',
      authorRole: 'student',
      content: 'Thank you for the feedback! Could you clarify the complexity analysis part?',
      timestamp: '2024-06-10T11:15:00Z',
      parentId: '1'
    }
  ];

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment, replyingTo || undefined);
      setNewComment('');
      setReplyingTo(null);
    }
  };

  const handleEditSubmit = (commentId: string) => {
    if (editContent.trim()) {
      onEditComment(commentId, editContent);
      setEditingComment(null);
      setEditContent('');
    }
  };

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const topLevelComments = comments.filter(c => !c.parentId);
  const getReplies = (commentId: string) => comments.filter(c => c.parentId === commentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new comment */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmitComment} size="sm">
              Post Comment
            </Button>
            {replyingTo && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setReplyingTo(null)}
              >
                Cancel Reply
              </Button>
            )}
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* Main comment */}
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getAuthorInitials(comment.author)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <Badge variant={comment.authorRole === 'teacher' ? 'default' : 'secondary'} className="text-xs">
                      {comment.authorRole}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                    {comment.isEdited && (
                      <span className="text-xs text-muted-foreground">(edited)</span>
                    )}
                  </div>
                  
                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEditSubmit(comment.id)}>
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingComment(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{comment.content}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(comment.id)}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                        {currentUser.name === comment.author && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingComment(comment.id);
                                setEditContent(comment.content);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteComment(comment.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Replies */}
              {getReplies(comment.id).map((reply) => (
                <div key={reply.id} className="ml-8 flex space-x-3">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{getAuthorInitials(reply.author)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{reply.author}</span>
                      <Badge variant={reply.authorRole === 'teacher' ? 'default' : 'secondary'} className="text-xs">
                        {reply.authorRole}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(reply.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentSystem;
