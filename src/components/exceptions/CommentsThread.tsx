import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import type { ExceptionComment } from '@/hooks/useExceptionDetails';
import type { UseMutationResult } from '@tanstack/react-query';

interface CommentsThreadProps {
  comments: ExceptionComment[];
  addComment: UseMutationResult<void, Error, string, unknown>;
}

export function CommentsThread({ comments, addComment }: CommentsThreadProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addComment.mutate(newComment, {
      onSuccess: () => setNewComment(''),
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments
          <span className="text-muted-foreground font-normal">({comments.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment list */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to add a note to this investigation</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.user?.full_name, comment.user?.email || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.user?.full_name || comment.user?.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{comment.comment}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add comment form */}
        <div className="border-t pt-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Add a comment or investigation note..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Press ⌘+Enter to submit
              </p>
              <Button 
                onClick={handleSubmit}
                disabled={!newComment.trim() || addComment.isPending}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {addComment.isPending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
