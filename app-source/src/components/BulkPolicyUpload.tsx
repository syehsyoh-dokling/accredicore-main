import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WordDocumentService } from "@/services/WordDocumentService";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  FolderOpen,
  Files
} from 'lucide-react';

interface BulkUploadFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: {
    content: string;
    title?: string;
  };
  error?: string;
  policyId?: string;
}

interface BulkPolicyUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkPolicyUpload: React.FC<BulkPolicyUploadProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [files, setFiles] = useState<BulkUploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    'Documentation',
    'Administrative',
    'Clinical Guidelines',
    'Research',
    'Training'
  ];

  const chapters = [
    'Chapter 1: Foundation',
    'Chapter 2: Patient Care',
    'Chapter 3: Safety',
    'Chapter 4: Quality',
    'Chapter 5: Operations',
    'Chapter 6: Compliance',
    'Chapter 7: Emergency',
    'Chapter 8: Support Services'
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
            `الملف ${file.name} غير مدعوم` : 
            `File ${file.name} is not supported`,
          variant: 'destructive'
        });
        return false;
      }

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: language === 'ar' ? 'الملف كبير جداً' : 'File too large',
          description: language === 'ar' ? 
            `الملف ${file.name} يجب أن يكون أقل من 50 ميجابايت` : 
            `File ${file.name} must be less than 50MB`,
          variant: 'destructive'
        });
        return false;
      }

      return true;
    });

    const newFiles: BulkUploadFile[] = validFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
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
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const processFile = async (file: File): Promise<{ content: string; title?: string }> => {
    if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      return await WordDocumentService.importFromWord(file);
    } else if (file.type === 'text/plain') {
      const content = await file.text();
      return {
        content,
        title: file.name.replace('.txt', '')
      };
    } else if (file.type === 'application/pdf') {
      // For PDF files, we'll store them as-is for now
      return {
        content: `PDF file: ${file.name}`,
        title: file.name.replace('.pdf', '')
      };
    }
    
    throw new Error('Unsupported file type');
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `policies/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    return filePath;
  };

  const createPolicy = async (file: BulkUploadFile, content: string, title: string, filePath?: string) => {
    const { data, error } = await supabase
      .from('policies')
      .insert({
        title: title || file.file.name.replace(/\.[^/.]+$/, ''),
        description: description || `Bulk uploaded policy from ${file.file.name}`,
        content,
        category: selectedCategory,
        status: 'draft',
        created_by: user?.id,
        file_path: filePath,
        original_filename: file.file.name,
        file_size: file.file.size,
        mime_type: file.file.type
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  const handleBulkUpload = async () => {
    if (!selectedCategory) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار فئة' : 'Please select a category',
        variant: 'destructive'
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار ملفات للرفع' : 'Please select files to upload',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    let completedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Update file status to processing
        setFiles(prev => prev.map((f, index) => 
          index === i ? { ...f, status: 'processing', progress: 0 } : f
        ));

        // Process the file content
        setFiles(prev => prev.map((f, index) => 
          index === i ? { ...f, progress: 25 } : f
        ));

        const result = await processFile(file.file);

        setFiles(prev => prev.map((f, index) => 
          index === i ? { ...f, progress: 50, result } : f
        ));

        // Upload file to storage
        let filePath: string | undefined;
        try {
          filePath = await uploadToStorage(file.file);
          setFiles(prev => prev.map((f, index) => 
            index === i ? { ...f, progress: 75 } : f
          ));
        } catch (storageError) {
          console.warn('Storage upload failed, continuing without file storage:', storageError);
        }

        // Create policy in database
        const policyId = await createPolicy(file, result.content, result.title || file.file.name, filePath);

        setFiles(prev => prev.map((f, index) => 
          index === i ? { 
            ...f, 
            status: 'completed', 
            progress: 100,
            policyId
          } : f
        ));

        completedCount++;
        setUploadProgress(Math.round((completedCount / files.length) * 100));

      } catch (error) {
        console.error('Error processing file:', error);
        setFiles(prev => prev.map((f, index) => 
          index === i ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error'
          } : f
        ));
      }
    }

    setIsUploading(false);
    
    const successCount = files.filter(f => f.status === 'completed').length;
    const errorCount = files.filter(f => f.status === 'error').length;

    toast({
      title: language === 'ar' ? 'اكتمل الرفع المجمع' : 'Bulk Upload Complete',
      description: language === 'ar' ? 
        `تم إنشاء ${successCount} سياسة بنجاح، ${errorCount} فشلت` :
        `${successCount} policies created successfully, ${errorCount} failed`,
      variant: successCount > 0 ? 'default' : 'destructive'
    });

    if (successCount > 0 && onSuccess) {
      onSuccess();
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const resetUpload = () => {
    setFiles([]);
    setSelectedCategory('');
    setSelectedChapter('');
    setDescription('');
    setUploadProgress(0);
    setIsUploading(false);
  };

  const getStatusIcon = (status: BulkUploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Files className="h-5 w-5" />
            {language === 'ar' ? 'رفع مجمع للسياسات' : 'Bulk Policy Upload'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category and Chapter Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                {language === 'ar' ? 'الفئة' : 'Category'} *
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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

            <div className="space-y-2">
              <Label htmlFor="chapter">
                {language === 'ar' ? 'الفصل (اختياري)' : 'Chapter (Optional)'}
              </Label>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر الفصل' : 'Select chapter'} />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter} value={chapter}>
                      {chapter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {language === 'ar' ? 'وصف عام (اختياري)' : 'General Description (Optional)'}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'ar' ? 'وصف عام لجميع السياسات المرفوعة' : 'General description for all uploaded policies'}
              rows={3}
            />
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              {language === 'ar' ? 'اسحب وأفلت الملفات هنا' : 'Drag and drop files here'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {language === 'ar' ? 'أو انقر لاختيار الملفات' : 'or click to select files'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'اختر الملفات' : 'Choose Files'}
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

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{language === 'ar' ? 'التقدم الإجمالي' : 'Overall Progress'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'ar' ? 'الملفات المحددة' : 'Selected Files'} ({files.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(file.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {file.status === 'processing' && (
                            <Progress value={file.progress} className="w-full mt-1" />
                          )}
                          {file.error && (
                            <p className="text-xs text-red-500 mt-1">{file.error}</p>
                          )}
                        </div>
                      </div>
                      {!isUploading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={resetUpload}
            disabled={isUploading}
          >
            {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isUploading}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleBulkUpload}
            disabled={isUploading || files.length === 0 || !selectedCategory}
          >
            {isUploading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {language === 'ar' ? `رفع ${files.length} ملف` : `Upload ${files.length} Files`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};