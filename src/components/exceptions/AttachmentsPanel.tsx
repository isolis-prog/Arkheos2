import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Paperclip, 
  Upload, 
  FileText, 
  Image, 
  File, 
  Trash2, 
  Download,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ExceptionAttachment } from '@/hooks/useExceptionDetails';
import type { UseMutationResult } from '@tanstack/react-query';

interface AttachmentsPanelProps {
  exceptionId: string;
  attachments: ExceptionAttachment[];
  uploadAttachment: UseMutationResult<void, Error, File, unknown>;
  deleteAttachment: UseMutationResult<void, Error, string, unknown>;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  'image/': Image,
  'application/pdf': FileText,
  'text/csv': FileText,
  'application/vnd.ms-excel': FileText,
  'application/vnd.openxmlformats': FileText,
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return Image;
  if (['pdf', 'csv', 'xls', 'xlsx'].includes(ext || '')) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function AttachmentsPanel({ 
  exceptionId, 
  attachments, 
  uploadAttachment,
  deleteAttachment 
}: AttachmentsPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => uploadAttachment.mutate(file));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => uploadAttachment.mutate(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (attachment: ExceptionAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('exception-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(`Failed to download: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Attachments
          <span className="text-muted-foreground font-normal">({attachments.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
            uploadAttachment.isPending && "opacity-50 pointer-events-none"
          )}
        >
          {uploadAttachment.isPending ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop files here, or
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, Images, CSV, Excel up to 10MB
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,.pdf,.csv,.xls,.xlsx"
            onChange={handleFileSelect}
          />
        </div>

        {/* Attachment list */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.file_name);
              
              return (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 group"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteAttachment.mutate(attachment.id)}
                      disabled={deleteAttachment.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {attachments.length === 0 && !uploadAttachment.isPending && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No attachments yet. Upload evidence or supporting documents.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
