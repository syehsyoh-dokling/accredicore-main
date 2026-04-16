import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIncidents } from "@/hooks/useIncidents";
import { ViewIncidentDialog } from "@/components/ViewIncidentDialog";
import { InvestigateIncidentDialog } from "@/components/InvestigateIncidentDialog";
import { 
  AlertTriangle, 
  Plus,
  FileText,
  Clock,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  Eye,
  Edit,
  Search,
  MessageSquare,
  Trash2,
  Archive
} from 'lucide-react';
import { format } from 'date-fns';

export function IncidentReporting() {
  const { t, language, dir } = useLanguage();
  const { toast } = useToast();
  const { incidents, isLoading, createIncident, updateIncident, deleteIncident } = useIncidents();
  
  const [showReportForm, setShowReportForm] = useState(false);
  const [viewIncident, setViewIncident] = useState<number | null>(null);
  const [editIncident, setEditIncident] = useState<number | null>(null);
  const [investigateIncident, setInvestigateIncident] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'open',
  });

  const priorityLevels = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIncident(formData as any);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'open',
    });
    setShowReportForm(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editIncident) {
      updateIncident({ id: editIncident, ...formData } as any);
      setEditIncident(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'open',
      });
    }
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteIncident(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleArchive = () => {
    if (archiveConfirmId) {
      updateIncident({ id: archiveConfirmId, status: 'archived' } as any);
      setArchiveConfirmId(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return <Badge className={variants[priority] || 'bg-gray-100 text-gray-800'}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const selectedIncident = viewIncident ? incidents.find(i => i.id === viewIncident) : null;
  const selectedEditIncident = editIncident ? incidents.find(i => i.id === editIncident) : null;

  return (
    <div className="space-y-6" dir={dir}>
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('incidentReportingTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('incidentReportingDesc')}</p>
        </div>
        <Button 
          onClick={() => setShowReportForm(true)} 
          className={`gap-2 bg-red-600 hover:bg-red-700 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
        >
          <Plus className="h-4 w-4" />
          {t('reportNewIncident')}
        </Button>
      </div>

      {/* New Incident Form Dialog */}
      <Dialog open={showReportForm} onOpenChange={setShowReportForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report New Incident</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Incident title"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the incident"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority *</label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status *</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit">Report Incident</Button>
              <Button type="button" variant="outline" onClick={() => setShowReportForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Incident Dialog */}
      <Dialog open={!!editIncident} onOpenChange={(open) => !open && setEditIncident(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Incident</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority *</label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status *</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit">Update Incident</Button>
              <Button type="button" variant="outline" onClick={() => setEditIncident(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Incident Dialog */}
      <ViewIncidentDialog 
        incident={selectedIncident}
        open={!!viewIncident}
        onClose={() => setViewIncident(null)}
      />

      {/* Investigate Incident Dialog */}
      <InvestigateIncidentDialog 
        incidentId={investigateIncident}
        open={!!investigateIncident}
        onClose={() => setInvestigateIncident(null)}
      />

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading incidents...</div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No incidents reported yet
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident: any) => (
                <div key={incident.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{incident.title}</h3>
                        <Badge variant="outline">#{incident.id}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{incident.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(incident.created_at), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(incident.priority)}
                          {getStatusBadge(incident.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setViewIncident(incident.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditIncident(incident.id);
                        setFormData({
                          title: incident.title,
                          description: incident.description || '',
                          priority: incident.priority,
                          status: incident.status,
                        });
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setInvestigateIncident(incident.id)}
                    >
                      <Search className="h-3 w-3 mr-1" />
                      Investigate
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setArchiveConfirmId(incident.id)}
                    >
                      <Archive className="h-3 w-3 mr-1" />
                      Archive
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => setDeleteConfirmId(incident.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this incident? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!archiveConfirmId} onOpenChange={(open) => !open && setArchiveConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Incident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this incident? You can still view archived incidents later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
