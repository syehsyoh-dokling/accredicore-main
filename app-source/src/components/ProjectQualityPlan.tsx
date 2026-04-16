import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Target, FileCheck, Users, BarChart3, Plus, Trash2, Save, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QualityPlanItem {
  id: string;
  category: 'objectives' | 'processes' | 'roles' | 'metrics';
  title: string;
  description: string;
  details?: any;
  order_index: number;
}

export function ProjectQualityPlan() {
  const { t } = useLanguage();
  const { userRole } = useAuth();
  const { toast } = useToast();
  
  const [items, setItems] = useState<QualityPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ title: '', description: '' });
  
  // Check if user has edit permissions
  const canEdit = userRole === 'system_admin' || userRole === 'admin' || userRole === 'super_user';

  useEffect(() => {
    fetchQualityPlanItems();
  }, []);

  const fetchQualityPlanItems = async () => {
    try {
      const { data, error } = await supabase
        .from('project_quality_plan')
        .select('*')
        .order('category, order_index');

      if (error) throw error;
      setItems((data || []) as QualityPlanItem[]);
    } catch (error) {
      console.error('Error fetching quality plan items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quality plan items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (category: QualityPlanItem['category']) => {
    if (!newItem.title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('project_quality_plan')
        .insert([{
          category,
          title: newItem.title,
          description: newItem.description,
          order_index: items.filter(i => i.category === category).length,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setItems([...items, data as QualityPlanItem]);
      setNewItem({ title: '', description: '' });
      toast({
        title: 'Success',
        description: 'Item added successfully',
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<QualityPlanItem>) => {
    try {
      const { error } = await supabase
        .from('project_quality_plan')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
      setEditingId(null);
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      });
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('project_quality_plan')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const renderItemsTable = (category: QualityPlanItem['category']) => {
    const categoryItems = items.filter(item => item.category === category);

    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Title</TableHead>
              <TableHead>Description</TableHead>
              {canEdit && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {editingId === item.id && canEdit ? (
                    <Input
                      value={item.title}
                      onChange={(e) => setItems(items.map(i => 
                        i.id === item.id ? { ...i, title: e.target.value } : i
                      ))}
                    />
                  ) : (
                    <span className="font-medium">{item.title}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === item.id && canEdit ? (
                    <Textarea
                      value={item.description}
                      onChange={(e) => setItems(items.map(i => 
                        i.id === item.id ? { ...i, description: e.target.value } : i
                      ))}
                      rows={3}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">{item.description}</span>
                  )}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-2">
                      {editingId === item.id ? (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateItem(item.id, {
                            title: item.title,
                            description: item.description,
                          })}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(item.id)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {canEdit && (
          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="flex-1"
            />
            <Input
              placeholder="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="flex-1"
            />
            <Button onClick={() => handleAddItem(category)}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('projectQualityPlan')}</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive quality planning and management framework
        </p>
      </div>

      <Tabs defaultValue="objectives" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="objectives" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">{t('qualityObjectives')}</span>
          </TabsTrigger>
          <TabsTrigger value="processes" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{t('processesAndStandards')}</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('rolesAndResponsibilities')}</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('metricsAndTools')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objectives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                {t('qualityObjectives')}
              </CardTitle>
              <CardDescription>{t('qualityObjectivesDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium mb-4">
                  <ChevronDown className="h-4 w-4" />
                  View Guidelines
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="prose dark:prose-invert max-w-none mb-6 p-4 bg-muted/50 rounded-lg">
                    <h3>Key Quality Objectives</h3>
                    <ul>
                      <li>Achieve 100% compliance with national healthcare standards</li>
                      <li>Maintain patient satisfaction rate above 95%</li>
                      <li>Reduce incident reports by 20% year-over-year</li>
                      <li>Ensure all staff complete quality training within 30 days of hire</li>
                    </ul>
                    
                    <h3>Measurement Criteria</h3>
                    <p>Quality will be measured through:</p>
                    <ul>
                      <li>Monthly compliance audits and assessments</li>
                      <li>Patient satisfaction surveys</li>
                      <li>Incident tracking and analysis</li>
                      <li>Staff competency evaluations</li>
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {loading ? (
                <div>Loading...</div>
              ) : (
                renderItemsTable('objectives')
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-600" />
                {t('processesAndStandards')}
              </CardTitle>
              <CardDescription>{t('processesAndStandardsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium mb-4">
                  <ChevronDown className="h-4 w-4" />
                  View Guidelines
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="prose dark:prose-invert max-w-none mb-6 p-4 bg-muted/50 rounded-lg">
                    <h3>Quality Management Processes</h3>
                    <ul>
                      <li><strong>Document Control:</strong> All policies and procedures follow version control and approval workflows</li>
                      <li><strong>Audit Process:</strong> Regular internal audits conducted quarterly, external audits annually</li>
                      <li><strong>Incident Management:</strong> Standardized reporting, investigation, and corrective action procedures</li>
                      <li><strong>Continuous Improvement:</strong> PDCA (Plan-Do-Check-Act) cycle for ongoing optimization</li>
                    </ul>
                    
                    <h3>Standards Compliance</h3>
                    <ul>
                      <li>Saudi Central Board for Accreditation of Healthcare Institutions (CBAHI) Standards</li>
                      <li>ISO 9001:2015 Quality Management Systems</li>
                      <li>JCI (Joint Commission International) Standards</li>
                      <li>Ministry of Health Regulations</li>
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {loading ? (
                <div>Loading...</div>
              ) : (
                renderItemsTable('processes')
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                {t('rolesAndResponsibilities')}
              </CardTitle>
              <CardDescription>{t('rolesAndResponsibilitiesDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium mb-4">
                  <ChevronDown className="h-4 w-4" />
                  View Guidelines
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="prose dark:prose-invert max-w-none mb-6 p-4 bg-muted/50 rounded-lg">
                    <h3>Quality Management Team Structure</h3>
                    
                    <h4>Quality Director</h4>
                    <ul>
                      <li>Overall accountability for quality management system</li>
                      <li>Strategic planning and resource allocation</li>
                      <li>Executive reporting and stakeholder communication</li>
                    </ul>

                    <h4>Compliance Manager</h4>
                    <ul>
                      <li>Monitoring regulatory compliance</li>
                      <li>Coordinating external audits</li>
                      <li>Managing policy library and documentation</li>
                    </ul>

                    <h4>Quality Assurance Officers</h4>
                    <ul>
                      <li>Conducting internal audits</li>
                      <li>Incident investigation and analysis</li>
                      <li>Staff training and awareness programs</li>
                    </ul>

                    <h4>Department Quality Champions</h4>
                    <ul>
                      <li>Departmental quality initiatives</li>
                      <li>Local compliance monitoring</li>
                      <li>Frontline staff engagement</li>
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {loading ? (
                <div>Loading...</div>
              ) : (
                renderItemsTable('roles')
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                {t('metricsAndTools')}
              </CardTitle>
              <CardDescription>{t('metricsAndToolsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium mb-4">
                  <ChevronDown className="h-4 w-4" />
                  View Guidelines
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="prose dark:prose-invert max-w-none mb-6 p-4 bg-muted/50 rounded-lg">
                    <h3>Key Performance Indicators (KPIs)</h3>
                    <ul>
                      <li><strong>Compliance Rate:</strong> Percentage of controls meeting standards (Target: ≥95%)</li>
                      <li><strong>Incident Frequency:</strong> Number of incidents per 1,000 patient days (Target: &lt;5)</li>
                      <li><strong>Audit Findings:</strong> Number of non-conformities identified (Target: Year-over-year reduction)</li>
                      <li><strong>Training Completion:</strong> Percentage of staff completing required training (Target: 100%)</li>
                      <li><strong>Corrective Action Closure:</strong> Percentage of actions closed on time (Target: ≥90%)</li>
                    </ul>
                    
                    <h3>Quality Assessment Tools</h3>
                    <ul>
                      <li><strong>Controls Matrix:</strong> Real-time tracking of compliance status across all facilities</li>
                      <li><strong>Audit Management System:</strong> Scheduling, execution, and follow-up tracking</li>
                      <li><strong>Incident Reporting System:</strong> Centralized incident capture and investigation</li>
                      <li><strong>Dashboard Analytics:</strong> Executive-level performance visualization</li>
                      <li><strong>Document Management:</strong> Version-controlled policy and procedure repository</li>
                    </ul>

                    <h3>Verification Methods</h3>
                    <ul>
                      <li>Internal audits conducted by trained auditors</li>
                      <li>Management reviews held quarterly</li>
                      <li>External certification audits</li>
                      <li>Patient feedback surveys and complaints analysis</li>
                      <li>Clinical outcome monitoring</li>
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {loading ? (
                <div>Loading...</div>
              ) : (
                renderItemsTable('metrics')
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
