import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WordDocumentService } from "@/services/WordDocumentService";
import { PdfDocumentService } from "@/services/PdfDocumentService";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  File,
  FileText,
  Upload,
  X,
} from 'lucide-react';

interface UploadedFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: {
    content: string;
    title?: string;
    html?: string;
    extractionMode?: 'full' | 'metadata-only';
  };
  error?: string;
}

interface ProcessedDocument {
  title: string;
  content: string;
  category: string;
  type: 'policy' | 'template';
  tags: string[];
  sourceFile: File;
  extractionMode: 'full' | 'metadata-only';
}

interface StoredDocument {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  storage_bucket: string;
  original_filename: string;
  mime_type: string;
  category: string;
  tags: string[] | null;
  file_size: number | null;
  created_at: string;
}

export const FileUploadManager = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [storedDocuments, setStoredDocuments] = useState<StoredDocument[]>([]);
  const [loadingStoredDocuments, setLoadingStoredDocuments] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { language, dir } = useLanguage();
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  const canManageDocuments = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  const acceptedTypes = [
    '.doc',
    '.docx',
    '.pdf',
    '.txt',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'text/plain'
  ];

  const categories = [
    'Patient Safety',
    'Quality Management',
    'Infection Control',
    'Emergency Management',
    'Pharmacy Services',
    'Laboratory Services',
    'Radiology Services',
    'Operating Room',
    'Critical Care',
    'Human Resources',
    'Information Management',
    'Facilities Management',
    'Governance',
    'Medical Equipment',
    'Documentation'
  ];

  const fetchStoredDocuments = async () => {
    setLoadingStoredDocuments(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          description,
          file_path,
          storage_bucket,
          original_filename,
          mime_type,
          category,
          tags,
          file_size,
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStoredDocuments((data as StoredDocument[]) || []);
    } catch (error) {
      console.error('Error fetching stored documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stored documents',
        variant: 'destructive'
      });
    } finally {
      setLoadingStoredDocuments(false);
    }
  };

  useEffect(() => {
    fetchStoredDocuments();
  }, []);

  const updateFileState = (targetFile: File, updater: (file: UploadedFile) => UploadedFile) => {
    setFiles(prev =>
      prev.map(fileEntry =>
        fileEntry.file === targetFile ? updater(fileEntry) : fileEntry
      )
    );
  };

  const openBlobInNewTab = (blob: Blob, fileName: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const openedWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');

    if (!openedWindow) {
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }

    window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  };

  const processFile = async (fileObj: UploadedFile) => {
    updateFileState(fileObj.file, (fileEntry) => ({
      ...fileEntry,
      status: 'processing',
      progress: 10,
      error: undefined
    }));

    try {
      let result: UploadedFile['result'];

      if (fileObj.file.name.toLowerCase().endsWith('.docx') || fileObj.file.name.toLowerCase().endsWith('.doc')) {
        updateFileState(fileObj.file, (fileEntry) => ({
          ...fileEntry,
          progress: 30
        }));

        const textResult = await WordDocumentService.importFromWord(fileObj.file);
        const htmlResult = await WordDocumentService.importFromWordWithFormatting(fileObj.file);

        result = {
          content: textResult.content,
          title: textResult.title || htmlResult.title,
          html: htmlResult.html,
          extractionMode: 'full'
        };
      } else if (fileObj.file.name.toLowerCase().endsWith('.pdf')) {
        updateFileState(fileObj.file, (fileEntry) => ({
          ...fileEntry,
          progress: 40
        }));

        const pdfResult = await PdfDocumentService.extractText(fileObj.file);

        result = {
          content: pdfResult.content || `PDF imported from file: ${fileObj.file.name}`,
          title: pdfResult.title,
          extractionMode: pdfResult.content ? 'full' : 'metadata-only'
        };
      } else if (fileObj.file.name.toLowerCase().endsWith('.txt')) {
        updateFileState(fileObj.file, (fileEntry) => ({
          ...fileEntry,
          progress: 50
        }));

        const content = await fileObj.file.text();
        const lines = content.split('\n').filter(line => line.trim());
        const title = lines.length > 0 ? lines[0].trim() : undefined;

        result = {
          content,
          title: title && title.length < 200 ? title : undefined,
          extractionMode: 'full'
        };
      } else {
        throw new Error('Unsupported file type for processing');
      }

      updateFileState(fileObj.file, (fileEntry) => ({
        ...fileEntry,
        status: 'completed',
        progress: 100,
        result
      }));

      toast({
        title: 'File processed',
        description:
          result?.extractionMode === 'metadata-only'
            ? 'PDF imported with metadata fallback.'
            : 'Content extracted successfully'
      });
    } catch (error) {
      console.error('Error processing file:', error);

      updateFileState(fileObj.file, (fileEntry) => ({
        ...fileEntry,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Processing failed'
      }));

      toast({
        title: 'File processing error',
        description: error instanceof Error ? error.message : 'Failed to extract content from file',
        variant: 'destructive'
      });
    }
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles = Array.from(selectedFiles).filter(file => {
      const lowerName = file.name.toLowerCase();
      const isValidType = acceptedTypes.some(type =>
        file.type === type || lowerName.endsWith(type)
      );

      if (!isValidType) {
        toast({
          title: 'Unsupported file type',
          description: 'Please upload Word, PDF, or text files only',
          variant: 'destructive'
        });
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'File size must be less than 10MB',
          variant: 'destructive'
        });
        return false;
      }

      return true;
    });

    const newFiles = validFiles.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(fileObj => processFile(fileObj));
  };

  const handleCreateDocument = (file: UploadedFile) => {
    if (!file.result) return;

    setProcessedDocument({
      title: file.result.title || file.file.name.replace(/\.[^/.]+$/, ''),
      content: file.result.content,
      category: '',
      type: 'policy',
      tags: [],
      sourceFile: file.file,
      extractionMode: file.result.extractionMode || 'full'
    });
    setIsProcessModalOpen(true);
  };

  const uploadToStorage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        upsert: false
      });

    if (error) throw error;
    return filePath;
  };

  const handleSaveDocument = async () => {
    if (!processedDocument || !user) return;

    try {
      if (!canManageDocuments) {
        throw new Error('Only elevated roles can save uploaded files to shared storage');
      }

      const filePath = await uploadToStorage(processedDocument.sourceFile);

      const { error: documentError } = await supabase
        .from('documents')
        .insert({
          title: processedDocument.title,
          description: `Imported from uploaded document (${processedDocument.type})`,
          file_path: filePath,
          storage_bucket: 'documents',
          original_filename: processedDocument.sourceFile.name,
          mime_type: processedDocument.sourceFile.type || 'application/octet-stream',
          category: processedDocument.category,
          tags: processedDocument.tags,
          file_size: processedDocument.sourceFile.size,
          created_by: user.id
        });

      if (documentError) throw documentError;

      const table = processedDocument.type === 'policy' ? 'policies' : 'policy_templates';
      const basePayload = {
        title: processedDocument.title,
        description: `Imported from uploaded document`,
        content: processedDocument.content,
        category: processedDocument.category,
        file_path: filePath,
        original_filename: processedDocument.sourceFile.name,
        file_size: processedDocument.sourceFile.size,
        mime_type: processedDocument.sourceFile.type || 'application/octet-stream',
        created_by: user.id
      };

      const payload =
        processedDocument.type === 'policy'
          ? {
              ...basePayload,
              status: 'draft'
            }
          : {
              ...basePayload,
              tags: processedDocument.tags,
              is_active: true
            };

      const { error: contentError } = await supabase
        .from(table)
        .insert(payload as never);

      if (contentError) throw contentError;

      toast({
        title: 'Saved',
        description: 'Document saved to shared storage and is readable by other authenticated roles'
      });

      setIsProcessModalOpen(false);
      setProcessedDocument(null);
      await fetchStoredDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save document',
        variant: 'destructive'
      });
    }
  };

  const handleViewUploadedFile = (file: UploadedFile) => {
    openBlobInNewTab(file.file, file.file.name);
  };

  const handleViewStoredDocument = async (document: StoredDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from(document.storage_bucket)
        .download(document.file_path);

      if (error) throw error;
      openBlobInNewTab(data, document.original_filename);
    } catch (error) {
      console.error('Error opening stored document:', error);
      toast({
        title: 'Error',
        description: 'Failed to open stored document',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadStoredDocument = async (document: StoredDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from(document.storage_bucket)
        .download(document.file_path);

      if (error) throw error;
      downloadBlob(data, document.original_filename);
    } catch (error) {
      console.error('Error downloading stored document:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive'
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {language === 'ar' ? 'رفع الملفات' : 'File Upload'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              {language === 'ar' ? 'اسحب الملفات هنا أو انقر للاختيار' : 'Drag files here or click to select'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {language === 'ar'
                ? 'ملفات Word و PDF والنصوص - حد أقصى 10 ميجابايت'
                : 'Word files, PDF, or text files - Max 10MB'}
            </p>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'اختيار الملفات' : 'Select Files'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={(event) => handleFileSelect(event.target.files)}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'الملفات المرفوعة' : 'Uploaded Files'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file, index) => (
                <div key={`${file.file.name}-${index}`} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(file.status)}
                      <span className="font-medium">{file.file.name}</span>
                      <span className="text-sm text-gray-500">
                        ({(file.file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>

                    {file.status === 'processing' && <Progress value={file.progress} className="w-full" />}

                    {file.status === 'error' && file.error && (
                      <p className="text-sm text-red-600">{file.error}</p>
                    )}

                    {file.status === 'completed' && file.result && (
                      <div className="space-y-2">
                        <p className="text-sm text-green-600">
                          {file.result.extractionMode === 'metadata-only'
                            ? 'PDF imported with metadata-only fallback'
                            : 'Content extracted successfully'}
                        </p>
                        {file.result.title && (
                          <p className="text-sm font-medium">
                            {language === 'ar' ? 'العنوان المستخرج: ' : 'Extracted title: '}
                            {file.result.title}
                          </p>
                        )}
                        {file.result.extractionMode === 'metadata-only' && (
                          <p className="text-sm text-amber-700">
                            Full PDF text extraction is limited for this file, but the original PDF can still be saved and read by other roles.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === 'completed' && (
                      <>
                        {canManageDocuments && (
                          <Button size="sm" variant="outline" onClick={() => handleCreateDocument(file)}>
                            <FileText className="h-3 w-3 mr-1" />
                            {language === 'ar' ? 'إنشاء مستند' : 'Create Document'}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleViewUploadedFile(file)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </>
                    )}

                    <Button size="sm" variant="ghost" onClick={() => removeFile(index)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'المستندات المشتركة' : 'Shared Documents'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStoredDocuments ? (
            <div className="text-sm text-muted-foreground">Loading documents...</div>
          ) : storedDocuments.length ? (
            <div className="space-y-4">
              {storedDocuments.map((document) => (
                <div key={document.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{document.title}</span>
                      <Badge variant="outline">{document.category}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {document.original_filename} • {document.mime_type}
                      {document.file_size ? ` • ${(document.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                    </div>
                    {document.description && (
                      <div className="text-sm text-muted-foreground">{document.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewStoredDocument(document)}>
                      <Eye className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'عرض' : 'View'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadStoredDocument(document)}>
                      <Download className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'تنزيل' : 'Download'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {language === 'ar' ? 'لا توجد مستندات محفوظة بعد' : 'No shared documents saved yet'}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isProcessModalOpen} onOpenChange={setIsProcessModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إنشاء مستند جديد' : 'Create New Document'}</DialogTitle>
          </DialogHeader>

          {processedDocument && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="doc-title">{language === 'ar' ? 'العنوان' : 'Title'} *</Label>
                <Input
                  id="doc-title"
                  value={processedDocument.title}
                  onChange={(event) =>
                    setProcessedDocument(prev => (prev ? { ...prev, title: event.target.value } : null))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doc-type">{language === 'ar' ? 'النوع' : 'Type'} *</Label>
                  <Select
                    value={processedDocument.type}
                    onValueChange={(value: 'policy' | 'template') =>
                      setProcessedDocument(prev => (prev ? { ...prev, type: value } : null))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">{language === 'ar' ? 'سياسة' : 'Policy'}</SelectItem>
                      <SelectItem value="template">{language === 'ar' ? 'قالب' : 'Template'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="doc-category">{language === 'ar' ? 'الفئة' : 'Category'} *</Label>
                  <Select
                    value={processedDocument.category}
                    onValueChange={(value) =>
                      setProcessedDocument(prev => (prev ? { ...prev, category: value } : null))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {processedDocument.type === 'template' && (
                <div>
                  <Label htmlFor="doc-tags">{language === 'ar' ? 'العلامات' : 'Tags'}</Label>
                  <Input
                    id="doc-tags"
                    value={processedDocument.tags.join(', ')}
                    onChange={(event) =>
                      setProcessedDocument(prev =>
                        prev
                          ? {
                              ...prev,
                              tags: event.target.value
                                .split(',')
                                .map(tag => tag.trim())
                                .filter(Boolean)
                            }
                          : null
                      )
                    }
                    placeholder="policy, accreditation, quality"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="doc-content">{language === 'ar' ? 'المحتوى' : 'Content'}</Label>
                <Textarea
                  id="doc-content"
                  value={processedDocument.content}
                  onChange={(event) =>
                    setProcessedDocument(prev => (prev ? { ...prev, content: event.target.value } : null))
                  }
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {processedDocument.extractionMode === 'metadata-only' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  This PDF will still be saved to shared storage and can be opened by other authenticated roles, but the extracted text content is limited.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessModalOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSaveDocument}
              disabled={!processedDocument?.title || !processedDocument?.category}
            >
              {language === 'ar' ? 'حفظ المستند' : 'Save Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
