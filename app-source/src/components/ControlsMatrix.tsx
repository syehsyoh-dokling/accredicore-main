
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";
import { useControlsMatrix } from "@/hooks/useControlsMatrix";
import { useToast } from "@/hooks/use-toast";
import { ControlsMatrixFilters } from "./ControlsMatrixFilters";
import { ControlsMatrixVisualizations } from "./ControlsMatrixVisualizations";
import { ControlsMatrixExport } from "./ControlsMatrixExport";
import { Search, Filter, CheckCircle, XCircle, Clock, AlertTriangle, Eye, Edit, BarChart3, TrendingUp, RefreshCw, ChevronDown, ChevronRight, Download } from 'lucide-react';

interface ControlUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: number;
  controlId: number;
  controlTitle: string;
  facilityName: string;
  currentStatus: string;
  currentProgress: number;
  onUpdate: (status: string, progress: number, notes?: string) => Promise<any>;
}

function ControlUpdateDialog({ 
  open, 
  onOpenChange, 
  facilityId, 
  controlId, 
  controlTitle, 
  facilityName, 
  currentStatus, 
  currentProgress, 
  onUpdate 
}: ControlUpdateDialogProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState(currentStatus);
  const [progress, setProgress] = useState(currentProgress);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsUpdating(true);
    const result = await onUpdate(status, progress, notes);
    
    if (result.success) {
      toast({
        title: t('success'),
        description: t('controlUpdatedSuccessfully'),
      });
      onOpenChange(false);
    } else {
      toast({
        title: t('error'),
        description: result.error || t('failedToUpdateControl'),
        variant: 'destructive',
      });
    }
    setIsUpdating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('updateControlStatus')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('facility')}</label>
            <p className="text-sm text-muted-foreground">{facilityName}</p>
          </div>
          <div>
            <label className="text-sm font-medium">{t('control')}</label>
            <p className="text-sm text-muted-foreground">{controlTitle}</p>
          </div>
          <div>
            <label className="text-sm font-medium">{t('status')}</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">{t('notStarted')}</SelectItem>
                <SelectItem value="in_progress">{t('inProgress')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
                <SelectItem value="needs_review">{t('needsReview')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">{t('progress')} ({progress}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('notes')}</label>
            <Textarea
              placeholder={t('addNotes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {t('update')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ControlsMatrix() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [selectedControl, setSelectedControl] = useState<any>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('matrix');
  const [departmentExpanded, setDepartmentExpanded] = useState<{ [key: string]: boolean }>({});
  
  const {
    matrixData,
    departments,
    departmentSummaries,
    selectedDepartment,
    setSelectedDepartment,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    domainFilter,
    setDomainFilter,
    loading,
    error,
    updateControlStatus,
    getStatusCounts,
    getUniqueControls,
    getUniqueFacilities,
    getAvailableDomains,
    getAvailableStatuses,
    clearFilters
  } = useControlsMatrix();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'needs_review':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'not_started':
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, progress: number) => {
    const variants = {
      'completed': 'bg-success/10 text-success border-success/20',
      'needs_review': 'bg-destructive/10 text-destructive border-destructive/20', 
      'in_progress': 'bg-warning/10 text-warning border-warning/20',
      'not_started': 'bg-muted text-muted-foreground border-muted'
    };
    
    const labels = {
      'completed': t('completed'),
      'needs_review': t('needsReview'),
      'in_progress': t('inProgress'), 
      'not_started': t('notStarted')
    };

    return (
      <div className="flex flex-col items-center gap-1">
        <Badge className={`${variants[status as keyof typeof variants]} text-xs px-2 py-1 border`}>
          {labels[status as keyof typeof labels]}
        </Badge>
        {status === 'in_progress' && (
          <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-warning transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  const handleControlClick = (item: any) => {
    setSelectedControl(item);
    setUpdateDialogOpen(true);
  };

  const handleUpdateControl = async (status: string, progress: number, notes?: string) => {
    if (!selectedControl) return { success: false };
    
    return await updateControlStatus(
      selectedControl.facility_id,
      selectedControl.control_id,
      status,
      progress,
      notes
    );
  };

  const toggleDepartmentExpansion = (deptName: string) => {
    setDepartmentExpanded(prev => ({
      ...prev,
      [deptName]: !prev[deptName]
    }));
  };

  const statusCounts = getStatusCounts();
  const uniqueControls = getUniqueControls();
  const uniqueFacilities = getUniqueFacilities();
  const availableDomains = getAvailableDomains();
  const availableStatuses = getAvailableStatuses();

  // Group facilities by department for hierarchical display
  const facilitiesByDepartment = uniqueFacilities.reduce((acc, facility) => {
    if (!acc[facility.department]) {
      acc[facility.department] = [];
    }
    acc[facility.department].push(facility);
    return acc;
  }, {} as { [key: string]: typeof uniqueFacilities });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        <XCircle className="h-8 w-8 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h2 className="text-3xl font-bold">{t('controlsMatrixTitle')}</h2>
          <p className="text-muted-foreground mt-1">{t('controlsMatrixDesc')}</p>
        </div>
        <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <ControlsMatrixExport
            matrixData={matrixData}
            departmentSummaries={departmentSummaries}
            selectedDepartment={selectedDepartment}
          />
        </div>
      </div>

      {/* Department Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalControls')}</p>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('completed')}</p>
                <p className="text-2xl font-bold text-success">{statusCounts.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('inProgress')}</p>
                <p className="text-2xl font-bold text-warning">{statusCounts.in_progress}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('notStarted')}</p>
                <p className="text-2xl font-bold text-muted-foreground">{statusCounts.not_started}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Filters */}
      <ControlsMatrixFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        departments={departments}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        domainFilter={domainFilter}
        setDomainFilter={setDomainFilter}
        availableDomains={availableDomains}
        availableStatuses={availableStatuses}
        onClearFilters={clearFilters}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matrix">{t('matrixView')}</TabsTrigger>
          <TabsTrigger value="hierarchy">{t('hierarchyView')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('analytics')}</TabsTrigger>
        </TabsList>

        {/* Matrix View */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t('controlsMatrixTitle')}
                {selectedDepartment !== 'all' && (
                  <Badge variant="secondary">
                    {selectedDepartment}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className={`p-4 font-medium ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {t('facility')}
                      </th>
                      {uniqueControls.map((control) => (
                        <th key={control.id} className="text-center p-2 font-medium min-w-[120px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-mono">{control.control_number}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={control.title}>
                              {control.title}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueFacilities.map((facility) => (
                      <tr key={facility.id} className="border-b hover:bg-muted/50">
                        <td className={`p-4 font-medium ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                          <div className="flex flex-col">
                            <span>{facility.name}</span>
                            <span className="text-xs text-muted-foreground">{facility.department}</span>
                          </div>
                        </td>
                        {uniqueControls.map((control) => {
                          const item = matrixData.find(
                            d => d.facility_id === facility.id && d.control_id === control.id
                          );
                          const status = item?.status || 'not_started';
                          const progress = item?.progress_percentage || 0;
                          
                          return (
                            <td key={control.id} className="text-center p-2">
                              <button
                                onClick={() => item && handleControlClick(item)}
                                className="flex flex-col items-center gap-1 hover:bg-muted/50 p-2 rounded transition-colors w-full"
                                disabled={!item}
                              >
                                {getStatusIcon(status)}
                                {getStatusBadge(status, progress)}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hierarchy View */}
        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5" />
                {t('departmentHierarchy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(facilitiesByDepartment).map(([deptName, facilities]) => (
                  <Collapsible
                    key={deptName}
                    open={departmentExpanded[deptName] ?? true}
                    onOpenChange={() => toggleDepartmentExpansion(deptName)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {departmentExpanded[deptName] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">{deptName}</span>
                          </div>
                          <Badge variant="secondary">{Array.isArray(facilities) ? facilities.length : 0} {t('facilities')}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {departmentSummaries.find(d => d.department_name === deptName)?.compliance_percentage || 0}% {t('complete')}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 ml-6 animate-accordion-down">
                      {Array.isArray(facilities) && facilities.map((facility) => (
                        <Card key={facility.id} className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{facility.name}</h4>
                              <p className="text-sm text-muted-foreground">{facility.department}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {uniqueControls.map((control) => {
                              const item = matrixData.find(
                                d => d.facility_id === facility.id && d.control_id === control.id
                              );
                              const status = item?.status || 'not_started';
                              const progress = item?.progress_percentage || 0;
                              
                              return (
                                <button
                                  key={control.id}
                                  onClick={() => item && handleControlClick(item)}
                                  className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50 transition-colors text-left"
                                  disabled={!item}
                                >
                                  {getStatusIcon(status)}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-mono text-muted-foreground">
                                      {control.control_number}
                                    </div>
                                    <div className="text-sm truncate" title={control.title}>
                                      {control.title}
                                    </div>
                                    {status === 'in_progress' && (
                                      <div className="w-full h-1 bg-muted rounded-full mt-1">
                                        <div 
                                          className="h-full bg-warning rounded-full transition-all duration-300" 
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </Card>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics View */}
        <TabsContent value="analytics">
          <ControlsMatrixVisualizations
            statusCounts={statusCounts}
            departmentSummaries={departmentSummaries}
          />
        </TabsContent>
      </Tabs>

      {/* Department Compliance Summary */}
      {departmentSummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('departmentCompliance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentSummaries.map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{dept.department_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {dept.compliance_percentage}% {t('complete')}
                    </span>
                  </div>
                  <Progress value={dept.compliance_percentage} className="h-2" />
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-success">{dept.completed_controls}</div>
                      <div className="text-muted-foreground">{t('completed')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-warning">{dept.in_progress_controls}</div>
                      <div className="text-muted-foreground">{t('inProgress')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-muted-foreground">{dept.not_started_controls}</div>
                      <div className="text-muted-foreground">{t('notStarted')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{dept.total_controls}</div>
                      <div className="text-muted-foreground">{t('total')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Update Dialog */}
      {selectedControl && (
        <ControlUpdateDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          facilityId={selectedControl.facility_id}
          controlId={selectedControl.control_id}
          controlTitle={selectedControl.control_title}
          facilityName={selectedControl.facility_name}
          currentStatus={selectedControl.status}
          currentProgress={selectedControl.progress_percentage}
          onUpdate={handleUpdateControl}
        />
      )}
    </div>
  );
}
