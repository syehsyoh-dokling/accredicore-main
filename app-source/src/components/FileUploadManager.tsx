import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WordDocumentService } from "@/services/WordDocumentService";
import { 
  Upload, 
  FileText, 
  File, 
  CheckCircle, 
  AlertCircle, 
  X,
  Download,
  Eye
} from 'lucide-react';

interface UploadedFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: {
    content: string;
    title?: string;
    html?: string;
  };
  error?: string;
}

interface ProcessedDocument {
  title: string;
  content: string;
  category: string;
  type: 'policy' | 'template';
  tags: string[];
}

export const FileUploadManager = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { language, dir } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();

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

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles = Array.from(selectedFiles).filter(file => {
      const isValidType = acceptedTypes.some(type => 
        file.type === type || file.name.toLowerCase().endsWith(type.replace('application/', '').replace('text/', ''))
      );
      
      if (!isValidType) {
        toast({
          title: language === 'ar' ? 'نوع ملف غير مدعوم' : 'Unsupported file type',
          description: language === 'ar' ? 
            'يرجى رفع ملفات Word أو PDF أو نصوص فقط' : 
            'Please upload Word, PDF, or text files only',
          variant: 'destructive'
        });
        return false;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: language === 'ar' ? 'الملف كبير جداً' : 'File too large',
          description: language === 'ar' ? 
            'حجم الملف يجب أن يكون أقل من 10 ميجابايت' : 
            'File size must be less than 10MB',
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
    
    // Process files automatically
    newFiles.forEach(fileObj => processFile(fileObj));
  };

  const processFile = async (fileObj: UploadedFile) => {
    const fileIndex = files.findIndex(f => f.file === fileObj.file);
    
    // Update status to processing
    setFiles(prev => prev.map((f, i) => 
      i === fileIndex ? { ...f, status: 'processing', progress: 10 } : f
    ));

    try {
      let result: { content: string; title?: string; html?: string };

      if (fileObj.file.name.toLowerCase().endsWith('.docx') || fileObj.file.name.toLowerCase().endsWith('.doc')) {
        // Process Word document
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? { ...f, progress: 30 } : f
        ));

        const textResult = await WordDocumentService.importFromWord(fileObj.file);
        const htmlResult = await WordDocumentService.importFromWordWithFormatting(fileObj.file);
        
        result = {
          content: textResult.content,
          title: textResult.title || htmlResult.title,
          html: htmlResult.html
        };
      } else if (fileObj.file.name.toLowerCase().endsWith('.txt')) {
        // Process text file
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? { ...f, progress: 50 } : f
        ));

        const content = await fileObj.file.text();
        const lines = content.split('\n').filter(line => line.trim());
        const title = lines.length > 0 ? lines[0].trim() : undefined;
        
        result = {
          content,
          title: title && title.length < 200 ? title : undefined
        };
      } else {
        throw new Error('Unsupported file type for processing');
      }

      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          status: 'completed', 
          progress: 100,
          result 
        } : f
      ));

      toast({
        title: language === 'ar' ? 'تم معالجة الملف' : 'File processed',
        description: language === 'ar' ? 
          'تم استخراج المحتوى بنجاح' : 
          'Content extracted successfully'
      });

    } catch (error) {
      console.error('Error processing file:', error);
      
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : 'Processing failed'
        } : f
      ));

      toast({
        title: language === 'ar' ? 'خطأ في معالجة الملف' : 'File processing error',
        description: language === 'ar' ? 
          'فشل في استخراج المحتوى من الملف' : 
          'Failed to extract content from file',
        variant: 'destructive'
      });
    }
  };

  const handleCreateDocument = (file: UploadedFile) => {
    if (!file.result) return;

    setProcessedDocument({
      title: file.result.title || file.file.name.replace(/\.[^/.]+$/, ''),
      content: file.result.content,
      category: '',
      type: 'policy',
      tags: []
    });
    setIsProcessModalOpen(true);
  };

  const handleSaveDocument = async () => {
    if (!processedDocument || !user) return;

    try {
      const table = processedDocument.type === 'policy' ? 'policies' : 'policy_templates';
      
      const { error } = await supabase
        .from(table)
        .insert({
          title: processedDocument.title,
          description: `Imported from uploaded document`,
          content: processedDocument.content,
          category: processedDocument.category,
          status: 'draft',
          ...(processedDocument.type === 'template' && { 
            tags: processedDocument.tags,
            is_active: true 
          }),
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 
          `تم حفظ ${processedDocument.type === 'policy' ? 'السياسة' : 'القالب'} بنجاح` : 
          `${processedDocument.type === 'policy' ? 'Policy' : 'Template'} saved successfully`
      });

      setIsProcessModalOpen(false);
      setProcessedDocument(null);
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حفظ المستند' : 'Failed to save document',
        variant: 'destructive'
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
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
      {/* Upload Area */}
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
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
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
              {language === 'ar' ? 
                'ملفات Word (.docx, .doc), PDF, أو نصوص (.txt) - حد أقصى 10 ميجابايت' :
                'Word files (.docx, .doc), PDF, or text files (.txt) - Max 10MB'
              }
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'اختيار الملفات' : 'Select Files'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'الملفات المرفوعة' : 'Uploaded Files'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(file.status)}
                      <span className="font-medium">{file.file.name}</span>
                      <span className="text-sm text-gray-500">
                        ({(file.file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    
                    {file.status === 'processing' && (
                      <Progress value={file.progress} className="w-full" />
                    )}
                    
                    {file.status === 'error' && file.error && (
                      <p className="text-sm text-red-600">{file.error}</p>
                    )}
                    
                    {file.status === 'completed' && file.result && (
                      <div className="space-y-2">
                        <p className="text-sm text-green-600">
                          {language === 'ar' ? 'تم استخراج المحتوى بنجاح' : 'Content extracted successfully'}
                        </p>
                        {file.result.title && (
                          <p className="text-sm font-medium">
                            {language === 'ar' ? 'العنوان المستخرج: ' : 'Extracted title: '}
                            {file.result.title}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.status === 'completed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateDocument(file)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          {language === 'ar' ? 'إنشاء مستند' : 'Create Document'}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Document Modal */}
      <Dialog open={isProcessModalOpen} onOpenChange={setIsProcessModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إنشاء مستند جديد' : 'Create New Document'}
            </DialogTitle>
          </DialogHeader>
          
          {processedDocument && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="doc-title">
                  {language === 'ar' ? 'العنوان' : 'Title'} *
                </Label>
                <Input
                  id="doc-title"
                  value={processedDocument.title}
                  onChange={(e) => setProcessedDocument(prev => 
                    prev ? { ...prev, title: e.target.value } : null
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doc-type">
                    {language === 'ar' ? 'النوع' : 'Type'} *
                  </Label>
                  <Select 
                    value={processedDocument.type} 
                    onValueChange={(value: 'policy' | 'template') => 
                      setProcessedDocument(prev => 
                        prev ? { ...prev, type: value } : null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">
                        {language === 'ar' ? 'سياسة' : 'Policy'}
                      </SelectItem>
                      <SelectItem value="template">
                        {language === 'ar' ? 'قالب' : 'Template'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="doc-category">
                    {language === 'ar' ? 'الفئة' : 'Category'} *
                  </Label>
                  <Select 
                    value={processedDocument.category} 
                    onValueChange={(value) => 
                      setProcessedDocument(prev => 
                        prev ? { ...prev, category: value } : null
                      )
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
                  <Label htmlFor="doc-tags">
                    {language === 'ar' ? 'العلامات (مفصولة بفاصلة)' : 'Tags (comma separated)'}
                  </Label>
                  <Input
                    id="doc-tags"
                    value={processedDocument.tags.join(', ')}
                    onChange={(e) => setProcessedDocument(prev => 
                      prev ? { 
                        ...prev, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                      } : null
                    )}
                    placeholder="JCI, safety, infection control"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="doc-content">
                  {language === 'ar' ? 'المحتوى' : 'Content'}
                </Label>
                <Textarea
                  id="doc-content"
                  value={processedDocument.content}
                  onChange={(e) => setProcessedDocument(prev => 
                    prev ? { ...prev, content: e.target.value } : null
                  )}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
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