import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  MessageSquare,
  BarChart3,
  User,
  Filter,
  Search,
  FileText
} from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeTasks, Task } from "@/hooks/useRealtimeTasks";
import { CreateTaskModal } from "./CreateTaskModal";
import { PolicyManagementTasks } from "./PolicyManagementTasks";
import { format } from "date-fns";

export function TaskManagement() {
  const { t, language, dir } = useLanguage();
  const { userRole } = useAuth();
  const { 
    tasks, 
    comments, 
    progress,
    loading, 
    createTask, 
    updateTaskStatus, 
    addTaskComment,
    updateTaskProgress,
    fetchTaskComments,
    fetchTaskProgress,
    getTaskStats 
  } = useRealtimeTasks();

  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [progressNotes, setProgressNotes] = useState('');
  const canManageTasks = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  const stats = getTaskStats();

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = search === '' || 
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800'
    };
    
    const labels = {
      pending: t('pending'),
      in_progress: t('inProgress'),
      completed: t('completed')
    };
    
    return (
      <Badge className={`${variants[status]} text-xs`}>
        {labels[status]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    const variants = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      low: t('low'),
      medium: t('medium'),
      high: t('high')
    };
    
    return (
      <Badge className={`${variants[priority]} text-xs`}>
        {labels[priority]}
      </Badge>
    );
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const handleAddComment = async (taskId: string) => {
    if (!commentText.trim()) return;
    
    await addTaskComment(taskId, commentText);
    setCommentText('');
    fetchTaskComments(taskId);
  };

  const handleUpdateProgress = async (taskId: string) => {
    await updateTaskProgress(taskId, progressValue, progressNotes);
    setProgressValue(0);
    setProgressNotes('');
    fetchTaskProgress(taskId);
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    fetchTaskComments(task.id);
    fetchTaskProgress(task.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">{t('loading')}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            {language === 'ar' ? 'المهام' : 'Tasks'}
          </TabsTrigger>
          <TabsTrigger value="policy-management" className="gap-2">
            <FileText className="h-4 w-4" />
            {language === 'ar' ? 'إدارة السياسات' : 'Policy Management'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h2 className="text-3xl font-bold text-foreground">{t('taskManagement')}</h2>
          <p className="text-muted-foreground mt-1">{t('manageAssignedTasks')}</p>
        </div>
        {canManageTasks && <CreateTaskModal onTaskCreate={createTask} />}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            <div className="text-sm text-blue-600">{t('totalTasks')}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-gray-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-sm text-gray-600">{t('pending')}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-900">{stats.inProgress}</div>
            <div className="text-sm text-yellow-600">{t('inProgress')}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
            <div className="text-sm text-green-600">{t('completed')}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-900">{stats.overdue}</div>
            <div className="text-sm text-red-600">{t('overdue')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <CardTitle>{t('tasks')}</CardTitle>
            <div className={`flex gap-4 items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('searchTasks')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTasks')}</SelectItem>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="in_progress">{t('inProgress')}</SelectItem>
                  <SelectItem value="completed">{t('completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className={`p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-start justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1">
                    <div className={`flex items-center gap-3 mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(task.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                      {task.due_date && (
                        <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                          <Clock className="h-4 w-4" />
                          <span>{t('due')}: {format(new Date(task.due_date), 'MMM dd')}</span>
                        </div>
                      )}
                      {task.assigned_to && (
                        <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                          <User className="h-4 w-4" />
                          <span>{t('assignedTo')}: {task.assigned_to}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={`flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Button size="sm" variant="outline" onClick={() => openTaskDetails(task)}>
                      {t('viewDetails')}
                    </Button>
                    <Select value={task.status} onValueChange={(status: Task['status']) => handleStatusChange(task.id, status)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t('pending')}</SelectItem>
                        <SelectItem value="in_progress">{t('inProgress')}</SelectItem>
                        <SelectItem value="completed">{t('completed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {search || filter !== 'all' ? t('noTasksFound') : t('noTasksYet')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Details Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={dir}>
            <DialogHeader>
              <DialogTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
                {selectedTask.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Task Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">{t('taskDetails')}</h4>
                  <div className="space-y-2 text-sm">
                    <div>{t('status')}: {getStatusBadge(selectedTask.status)}</div>
                    <div>{t('priority')}: {getPriorityBadge(selectedTask.priority)}</div>
                    {selectedTask.due_date && (
                      <div>{t('dueDate')}: {format(new Date(selectedTask.due_date), 'PPP')}</div>
                    )}
                  </div>
                </div>
                
                {/* Progress Update */}
                <div>
                  <h4 className="font-medium mb-2">{t('updateProgress')}</h4>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={progressValue}
                      onChange={(e) => setProgressValue(parseInt(e.target.value) || 0)}
                      placeholder={t('progressPercentage')}
                    />
                    <Textarea
                      value={progressNotes}
                      onChange={(e) => setProgressNotes(e.target.value)}
                      placeholder={t('progressNotes')}
                      rows={2}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateProgress(selectedTask.id)}
                      className="w-full"
                    >
                      {t('updateProgress')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <h4 className="font-medium mb-4">{t('comments')}</h4>
                <div className="space-y-4">
                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={t('addComment')}
                      rows={2}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => handleAddComment(selectedTask.id)}
                      disabled={!commentText.trim()}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Comments List */}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {comments[selectedTask.id]?.map((comment) => (
                      <div key={comment.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium">{comment.user_id}</div>
                        <div>{comment.comment}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress History */}
              {progress[selectedTask.id] && progress[selectedTask.id].length > 0 && (
                <div>
                  <h4 className="font-medium mb-4">{t('progressHistory')}</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {progress[selectedTask.id]?.map((prog) => (
                      <div key={prog.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex justify-between">
                          <span>{prog.progress_percentage}% - {prog.user_id}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(prog.created_at), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        {prog.notes && <div className="text-gray-600 mt-1">{prog.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
        </TabsContent>

        <TabsContent value="policy-management">
          <PolicyManagementTasks />
        </TabsContent>
      </Tabs>
    </div>
  );
}
