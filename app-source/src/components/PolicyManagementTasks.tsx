import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Plus, Save, Download, Edit, CheckCircle, Clock, 
  AlertTriangle, Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Type, Heading1, Heading2,
  X, Eye, History, MessageSquare, Search, Upload, FileDown
} from 'lucide-react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WordDocumentService } from "@/services/WordDocumentService";
import { format } from "date-fns";

interface PolicyManualTask {
  id: string;
  policy_id: string;
  policy_title: string;
  policy_content: string;
  section: string;
  assigned_to: string | null;
  assigned_by: string;
  status: string;
  priority: string;
  change_notes: string | null;
  task_description: string | null;
  due_date: string | null;
  completed_at: string | null;
  file_path: string | null;
  file_size: number | null;
  original_filename: string | null;
  created_at: string;
  updated_at: string;
}

export function PolicyManagementTasks() {
  const { t, language, dir } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<PolicyManualTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PolicyManualTask | null>(null);
  const [viewingHistory, setViewingHistory] = useState<PolicyManualTask | null>(null);
  
  // Stored documents search
  const [storedDocs, setStoredDocs] = useState<Array<{ id: string; title: string; content: string; category: string; source: string }>>([]);
  const [docSearchOpen, setDocSearchOpen] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Create form state
  const [newTask, setNewTask] = useState({
    policy_title: '',
    policy_content: '',
    section: 'Policy Manuals',
    task_description: '',
    priority: 'medium',
    due_date: '',
  });

  // Editor state
  const [editorContent, setEditorContent] = useState('');
  const [changeNotes, setChangeNotes] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('policy_manual_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching policy manual tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const fetchStoredDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const docs: Array<{ id: string; title: string; content: string; category: string; source: string }> = [];

      // Fetch from policy_templates
      const { data: templates } = await supabase
        .from('policy_templates')
        .select('id, title, content, category')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (templates) {
        templates.forEach(t => docs.push({ id: t.id, title: t.title, content: t.content, category: t.category, source: 'template' }));
      }

      // Fetch from policies
      const { data: policies } = await supabase
        .from('policies')
        .select('id, title, content, category')
        .order('updated_at', { ascending: false });

      if (policies) {
        policies.forEach(p => docs.push({ id: p.id, title: p.title, content: p.content, category: p.category, source: 'policy' }));
      }

      // Fetch from documents (docx files)
      const { data: documents } = await supabase
        .from('documents')
        .select('id, title, description, file_path, storage_bucket, mime_type')
        .eq('is_active', true)
        .in('mime_type', ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'])
        .order('updated_at', { ascending: false });

      if (documents) {
        documents.forEach(d => docs.push({ id: d.id, title: d.title, content: '', category: 'document', source: 'storage' }));
      }

      setStoredDocs(docs);
    } catch (error) {
      console.error('Error fetching stored documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  const handleImportStoredDoc = async (doc: typeof storedDocs[0]) => {
    if (doc.source === 'storage') {
      // For storage docs, download and extract content via mammoth
      try {
        const docRecord = await supabase
          .from('documents')
          .select('file_path, storage_bucket')
          .eq('id', doc.id)
          .single();

        if (docRecord.data) {
          const { data: fileData } = await supabase.storage
            .from(docRecord.data.storage_bucket)
            .download(docRecord.data.file_path);

          if (fileData) {
            const file = new File([fileData], 'document.docx');
            const result = await WordDocumentService.importFromWordWithFormatting(file);
            setNewTask(p => ({
              ...p,
              policy_title: doc.title,
              policy_content: result.html || '',
            }));
          }
        }
      } catch (error) {
        console.error('Error importing storage doc:', error);
        toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل في استيراد المستند' : 'Failed to import document', variant: 'destructive' });
      }
    } else {
      setNewTask(p => ({
        ...p,
        policy_title: doc.title,
        policy_content: doc.content,
      }));
    }
    setDocSearchOpen(false);
    toast({ title: language === 'ar' ? 'تم الاستيراد' : 'Imported', description: language === 'ar' ? `تم استيراد "${doc.title}"` : `Imported "${doc.title}"` });
  };

  const handleImportToEditor = async (doc: typeof storedDocs[0]) => {
    if (doc.source === 'storage') {
      try {
        const docRecord = await supabase
          .from('documents')
          .select('file_path, storage_bucket')
          .eq('id', doc.id)
          .single();

        if (docRecord.data) {
          const { data: fileData } = await supabase.storage
            .from(docRecord.data.storage_bucket)
            .download(docRecord.data.file_path);

          if (fileData) {
            const file = new File([fileData], 'document.docx');
            const result = await WordDocumentService.importFromWordWithFormatting(file);
            setEditorContent(result.html || '');
          }
        }
      } catch (error) {
        toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل في استيراد المستند' : 'Failed to import document', variant: 'destructive' });
      }
    } else {
      setEditorContent(doc.content);
    }
    setDocSearchOpen(false);
  };

  const handleUploadDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await WordDocumentService.importFromWordWithFormatting(file);
      if (editingTask) {
        setEditorContent(result.html || '');
      } else {
        setNewTask(p => ({
          ...p,
          policy_title: result.title || file.name.replace('.docx', ''),
          policy_content: result.html || '',
        }));
      }
      toast({ title: language === 'ar' ? 'تم الاستيراد' : 'Imported', description: language === 'ar' ? 'تم استيراد الملف بنجاح' : 'File imported successfully' });
    } catch (error) {
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل في قراءة الملف' : 'Failed to read file', variant: 'destructive' });
    }
    e.target.value = '';
  };

  const handleExportPdf = async (task: PolicyManualTask) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`
        <html><head><title>${task.policy_title}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; padding: 40px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          td { border: 1px solid #999; padding: 8px; }
          .header-label { font-weight: bold; background: #f0f0f0; width: 120px; }
        </style></head><body>
        <table>
          <tr><td class="header-label">SUBJECT:</td><td colspan="2">${task.policy_title}</td><td class="header-label">REFERENCE:</td><td>${task.policy_id}</td></tr>
          <tr><td class="header-label">DEPARTMENT:</td><td colspan="2">${task.section}</td><td class="header-label">STATUS:</td><td>${task.status}</td></tr>
        </table>
        <div>${task.policy_content}</div>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); }, 500);
      toast({ title: language === 'ar' ? 'تم' : 'Done', description: language === 'ar' ? 'استخدم حفظ كـ PDF من نافذة الطباعة' : 'Use "Save as PDF" from print dialog' });
    } catch (error) {
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل في التصدير' : 'Failed to export', variant: 'destructive' });
    }
  };

  const handleCreateTask = async () => {
    if (!user || !newTask.policy_title.trim()) return;

    try {
      const { error } = await supabase
        .from('policy_manual_tasks')
        .insert({
          policy_id: `POL-${Date.now()}`,
          policy_title: newTask.policy_title,
          policy_content: newTask.policy_content || '',
          section: newTask.section,
          task_description: newTask.task_description,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
          assigned_by: user.id,
        });

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الإنشاء' : 'Created',
        description: language === 'ar' ? 'تم إنشاء مهمة السياسة بنجاح' : 'Policy task created successfully',
      });

      setIsCreateOpen(false);
      setNewTask({ policy_title: '', policy_content: '', section: 'Policy Manuals', task_description: '', priority: 'medium', due_date: '' });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إنشاء المهمة' : 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const openEditor = (task: PolicyManualTask) => {
    setEditingTask(task);
    setEditorContent(task.policy_content);
    setChangeNotes('');
  };

  const handleSaveDocument = async () => {
    if (!editingTask || !user) return;

    try {
      const { error } = await supabase
        .from('policy_manual_tasks')
        .update({
          policy_content: editorContent,
          change_notes: editingTask.change_notes 
            ? `${editingTask.change_notes}\n---\n[${new Date().toISOString()}] ${changeNotes}`
            : `[${new Date().toISOString()}] ${changeNotes}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTask.id);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم حفظ المستند بنجاح' : 'Document saved successfully',
      });

      setChangeNotes('');
      fetchTasks();
      // Update the editing task in memory
      setEditingTask(prev => prev ? { ...prev, policy_content: editorContent } : null);
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حفظ المستند' : 'Failed to save document',
        variant: 'destructive',
      });
    }
  };

  const handleExportDocx = async (task: PolicyManualTask) => {
    try {
      await WordDocumentService.exportToWord({
        id: task.policy_id,
        title: task.policy_title,
        description: task.task_description || '',
        content: task.policy_content,
        category: task.section,
        status: task.status,
        created_at: task.created_at,
        updated_at: task.updated_at,
      });

      toast({
        title: language === 'ar' ? 'تم التصدير' : 'Exported',
        description: language === 'ar' ? 'تم تصدير المستند بتنسيق Word' : 'Document exported as .docx',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في التصدير' : 'Failed to export',
        variant: 'destructive',
      });
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('policy_manual_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الإكمال' : 'Completed',
        description: language === 'ar' ? 'تم وضع علامة على المهمة كمكتملة' : 'Task marked as completed',
      });

      if (editingTask?.id === taskId) {
        setEditingTask(null);
      }
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('policy_manual_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-gray-100 text-gray-800', label: language === 'ar' ? 'معلق' : 'Pending' },
      in_progress: { className: 'bg-yellow-100 text-yellow-800', label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress' },
      completed: { className: 'bg-green-100 text-green-800', label: language === 'ar' ? 'مكتمل' : 'Completed' },
    };
    const c = config[status] || config.pending;
    return <Badge className={`${c.className} text-xs`}>{c.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { className: string; label: string }> = {
      low: { className: 'bg-green-100 text-green-800', label: language === 'ar' ? 'منخفض' : 'Low' },
      medium: { className: 'bg-yellow-100 text-yellow-800', label: language === 'ar' ? 'متوسط' : 'Medium' },
      high: { className: 'bg-red-100 text-red-800', label: language === 'ar' ? 'عالي' : 'High' },
    };
    const c = config[priority] || config.medium;
    return <Badge className={`${c.className} text-xs`}>{c.label}</Badge>;
  };

  // If we're editing a task, show the full-screen editor
  if (editingTask) {
    return (
      <div className="space-y-0 h-full" dir={dir}>
        {/* Header Bar - similar to screenshot */}
        <div className="bg-primary text-primary-foreground p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            <div>
              <h3 className="font-bold text-sm">{editingTask.policy_title}</h3>
              <p className="text-xs opacity-80">
                {language === 'ar' ? 'القسم:' : 'Section:'} {editingTask.section} | {language === 'ar' ? 'المعرف:' : 'ID:'} {editingTask.policy_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(editingTask.status)}
            {getPriorityBadge(editingTask.priority)}
          </div>
        </div>

        {/* Toolbar Tabs */}
        <div className="bg-muted border border-border rounded-none flex items-center justify-between px-2 py-1 flex-wrap gap-1">
          <div className="flex items-center gap-1">
            {/* Search stored documents */}
            <Popover open={docSearchOpen} onOpenChange={(open) => { setDocSearchOpen(open); if (open) fetchStoredDocuments(); }}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                  <Search className="h-3 w-3" />
                  {language === 'ar' ? 'استيراد مستند' : 'Import Document'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput placeholder={language === 'ar' ? 'ابحث في المستندات...' : 'Search stored documents...'} />
                  <CommandList>
                    <CommandEmpty>{loadingDocs ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') : (language === 'ar' ? 'لا توجد نتائج' : 'No documents found')}</CommandEmpty>
                    <CommandGroup heading={language === 'ar' ? 'المستندات المتاحة' : 'Available Documents'}>
                      {storedDocs.map((doc) => (
                        <CommandItem key={`${doc.source}-${doc.id}`} onSelect={() => handleImportToEditor(doc)} className="cursor-pointer">
                          <FileText className="h-4 w-4 mr-2 text-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{doc.title}</div>
                            <div className="text-xs text-muted-foreground">{doc.source === 'template' ? 'Template' : doc.source === 'policy' ? 'Policy' : 'Stored File'} • {doc.category}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Upload local docx */}
            <label>
              <input type="file" accept=".docx" className="hidden" onChange={handleUploadDocx} />
              <Button variant="outline" size="sm" className="text-xs h-7 gap-1" asChild>
                <span>
                  <Upload className="h-3 w-3" />
                  {language === 'ar' ? 'رفع .docx' : 'Upload .docx'}
                </span>
              </Button>
            </label>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={handleSaveDocument}>
              <Save className="h-3 w-3" />
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => handleExportDocx(editingTask)}>
              <Download className="h-3 w-3" />
              .docx
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => handleExportPdf(editingTask)}>
              <FileDown className="h-3 w-3" />
              .pdf
            </Button>
            {editingTask.status !== 'completed' && (
              <Button variant="default" size="sm" className="text-xs h-7 gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleMarkComplete(editingTask.id)}>
                <CheckCircle className="h-3 w-3" />
                {language === 'ar' ? 'إكمال المهمة' : 'Complete Task'}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditingTask(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="bg-card border-x border-border flex items-center gap-0.5 px-2 py-1 flex-wrap">
          <Select defaultValue="normal">
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="heading1">Heading 1</SelectItem>
              <SelectItem value="heading2">Heading 2</SelectItem>
              <SelectItem value="heading3">Heading 3</SelectItem>
            </SelectContent>
          </Select>
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => execCommand('bold')}>
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => execCommand('italic')}>
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => execCommand('underline')}>
            <Underline className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => execCommand('justifyLeft')}>
            <AlignLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => execCommand('justifyCenter')}>
            <AlignCenter className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => execCommand('justifyRight')}>
            <AlignRight className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => execCommand('insertUnorderedList')}>
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => execCommand('insertOrderedList')}>
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Editor + Notes Panel */}
        <div className="flex border border-border rounded-b-lg" style={{ minHeight: '500px' }}>
          {/* Document Editor */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 overflow-auto">
            <div className="max-w-[816px] mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-sm" style={{ minHeight: '1056px', padding: '72px' }}>
              {/* Document header table - similar to the screenshot */}
              <table className="w-full border-collapse border border-gray-400 mb-6 text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 font-bold bg-gray-50 dark:bg-gray-700 w-28">SUBJECT:</td>
                    <td className="border border-gray-400 p-2" colSpan={2}>{editingTask.policy_title}</td>
                    <td className="border border-gray-400 p-2 font-bold bg-gray-50 dark:bg-gray-700 w-28">REFERENCE:</td>
                    <td className="border border-gray-400 p-2">{editingTask.policy_id}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-bold bg-gray-50 dark:bg-gray-700">DEPARTMENT:</td>
                    <td className="border border-gray-400 p-2" colSpan={2}>{editingTask.section}</td>
                    <td className="border border-gray-400 p-2 font-bold bg-gray-50 dark:bg-gray-700">PAGE:</td>
                    <td className="border border-gray-400 p-2">1</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-bold bg-gray-50 dark:bg-gray-700">STATUS:</td>
                    <td className="border border-gray-400 p-2">{editingTask.status}</td>
                    <td className="border border-gray-400 p-2 font-bold bg-gray-50 dark:bg-gray-700">EFFECTIVE:</td>
                    <td className="border border-gray-400 p-2" colSpan={2}>{format(new Date(editingTask.created_at), 'MM/dd/yyyy')}</td>
                  </tr>
                </tbody>
              </table>

              {/* Content editable area */}
              <div
                className="min-h-[600px] outline-none prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-gray-100"
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: editorContent || '<p>Start writing your policy content here...</p>' }}
                style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt', lineHeight: '1.6' }}
              />
            </div>
          </div>

          {/* Notes & History Sidebar */}
          <div className="w-80 border-l border-border bg-card flex flex-col">
            <Tabs defaultValue="notes" className="flex-1 flex flex-col">
              <TabsList className="mx-2 mt-2 grid grid-cols-2">
                <TabsTrigger value="notes" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  <History className="h-3 w-3 mr-1" />
                  {language === 'ar' ? 'السجل' : 'History'}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="notes" className="flex-1 p-3 space-y-3">
                <div>
                  <Label className="text-xs font-medium">
                    {language === 'ar' ? 'ملاحظات التغيير' : 'Change Notes'}
                  </Label>
                  <Textarea
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    placeholder={language === 'ar' ? 'اكتب ملاحظات التغييرات...' : 'Describe the changes made...'}
                    rows={4}
                    className="mt-1 text-xs"
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-medium">
                    {language === 'ar' ? 'وصف المهمة' : 'Task Description'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {editingTask.task_description || (language === 'ar' ? 'لا يوجد وصف' : 'No description')}
                  </p>
                </div>

                {editingTask.due_date && (
                  <div>
                    <Label className="text-xs font-medium">
                      {language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(editingTask.due_date), 'PPP')}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="flex-1 p-3 overflow-auto">
                <div className="space-y-2">
                  {editingTask.change_notes ? (
                    editingTask.change_notes.split('\n---\n').map((note, i) => (
                      <div key={i} className="p-2 bg-muted rounded text-xs">
                        {note}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'لا يوجد سجل تغييرات بعد' : 'No change history yet'}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer info */}
            <div className="border-t border-border p-3 text-xs text-muted-foreground space-y-1">
              <div>{language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {format(new Date(editingTask.updated_at), 'MMM dd, yyyy HH:mm')}</div>
              <div>{language === 'ar' ? 'تم الإنشاء:' : 'Created:'} {format(new Date(editingTask.created_at), 'MMM dd, yyyy')}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Task list view
  return (
    <div className="space-y-6" dir={dir}>
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'إدارة السياسات - أدلة السياسات' : 'Policy Management - Policy Manuals'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'ar' ? 'تحرير وإدارة مستندات السياسات' : 'Edit and manage policy documents'}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {language === 'ar' ? 'مهمة جديدة' : 'New Task'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{tasks.length}</div>
            <div className="text-sm text-blue-600 dark:text-blue-300">{language === 'ar' ? 'إجمالي المهام' : 'Total Tasks'}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{tasks.filter(t => t.status === 'in_progress').length}</div>
            <div className="text-sm text-yellow-600 dark:text-yellow-300">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{tasks.filter(t => t.status === 'completed').length}</div>
            <div className="text-sm text-green-600 dark:text-green-300">{language === 'ar' ? 'مكتملة' : 'Completed'}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tasks.filter(t => t.status === 'pending').length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{language === 'ar' ? 'معلقة' : 'Pending'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-8 text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{language === 'ar' ? 'لا توجد مهام سياسات' : 'No Policy Tasks'}</h3>
            <p className="text-muted-foreground">{language === 'ar' ? 'أنشئ مهمة جديدة لبدء تحرير سياسة' : 'Create a new task to start editing a policy'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1">
                    <div className={`flex items-center gap-3 mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <FileText className="h-5 w-5 text-primary" />
                      <h4 className="font-medium text-foreground">{task.policy_title}</h4>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    <div className={`flex items-center gap-4 text-sm text-muted-foreground ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <span>{language === 'ar' ? 'القسم:' : 'Section:'} {task.section}</span>
                      <span>{language === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'} {format(new Date(task.created_at), 'MMM dd, yyyy')}</span>
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {language === 'ar' ? 'الاستحقاق:' : 'Due:'} {format(new Date(task.due_date), 'MMM dd')}
                        </span>
                      )}
                    </div>
                    {task.task_description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.task_description}</p>
                    )}
                  </div>
                  <div className={`flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Button size="sm" variant="default" className="gap-1" onClick={() => openEditor(task)}>
                      <Edit className="h-3 w-3" />
                      {language === 'ar' ? 'تحرير' : 'Edit'}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleExportDocx(task)}>
                      <Download className="h-3 w-3" />
                      .docx
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleExportPdf(task)}>
                      <FileDown className="h-3 w-3" />
                      .pdf
                    </Button>
                    <Select value={task.status} onValueChange={(status) => handleUpdateStatus(task.id, status)}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{language === 'ar' ? 'معلق' : 'Pending'}</SelectItem>
                        <SelectItem value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</SelectItem>
                        <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إنشاء مهمة سياسة جديدة' : 'Create New Policy Task'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Import from stored documents */}
            <div>
              <Label>{language === 'ar' ? 'استيراد من مستند موجود' : 'Import from Stored Document'}</Label>
              <div className="flex gap-2 mt-1">
                <Popover open={docSearchOpen && !editingTask} onOpenChange={(open) => { setDocSearchOpen(open); if (open) fetchStoredDocuments(); }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 flex-1">
                      <Search className="h-3 w-3" />
                      {language === 'ar' ? 'بحث في المستندات...' : 'Search documents...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command>
                      <CommandInput placeholder={language === 'ar' ? 'ابحث...' : 'Search...'} />
                      <CommandList>
                        <CommandEmpty>{loadingDocs ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') : (language === 'ar' ? 'لا توجد نتائج' : 'No results')}</CommandEmpty>
                        <CommandGroup>
                          {storedDocs.map((doc) => (
                            <CommandItem key={`create-${doc.source}-${doc.id}`} onSelect={() => handleImportStoredDoc(doc)} className="cursor-pointer">
                              <FileText className="h-4 w-4 mr-2 text-primary" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{doc.title}</div>
                                <div className="text-xs text-muted-foreground">{doc.source} • {doc.category}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <label>
                  <input type="file" accept=".docx" className="hidden" onChange={handleUploadDocx} />
                  <Button variant="outline" size="sm" className="gap-1" asChild>
                    <span><Upload className="h-3 w-3" /> {language === 'ar' ? 'رفع' : 'Upload'}</span>
                  </Button>
                </label>
              </div>
            </div>
            <div>
              <Label>{language === 'ar' ? 'عنوان السياسة' : 'Policy Title'}</Label>
              <Input
                value={newTask.policy_title}
                onChange={(e) => setNewTask(p => ({ ...p, policy_title: e.target.value }))}
                placeholder={language === 'ar' ? 'أدخل عنوان السياسة' : 'Enter policy title'}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'القسم' : 'Section'}</Label>
              <Select value={newTask.section} onValueChange={(v) => setNewTask(p => ({ ...p, section: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Policy Manuals">{language === 'ar' ? 'أدلة السياسات' : 'Policy Manuals'}</SelectItem>
                  <SelectItem value="Procedures">{language === 'ar' ? 'الإجراءات' : 'Procedures'}</SelectItem>
                  <SelectItem value="Guidelines">{language === 'ar' ? 'الإرشادات' : 'Guidelines'}</SelectItem>
                  <SelectItem value="Standards">{language === 'ar' ? 'المعايير' : 'Standards'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'ar' ? 'وصف المهمة' : 'Task Description'}</Label>
              <Textarea
                value={newTask.task_description}
                onChange={(e) => setNewTask(p => ({ ...p, task_description: e.target.value }))}
                placeholder={language === 'ar' ? 'صف المهمة المطلوبة...' : 'Describe the task...'}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'الأولوية' : 'Priority'}</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask(p => ({ ...p, priority: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{language === 'ar' ? 'منخفض' : 'Low'}</SelectItem>
                    <SelectItem value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                    <SelectItem value="high">{language === 'ar' ? 'عالي' : 'High'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(p => ({ ...p, due_date: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTask.policy_title.trim()}>
              {language === 'ar' ? 'إنشاء' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
