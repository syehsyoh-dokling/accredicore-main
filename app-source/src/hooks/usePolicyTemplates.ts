
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface PolicyTemplate {
  id: string;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  content: string;
  content_ar?: string;
  category: string;
  tags?: string[];
  is_active: boolean;
  created_at: string;
}

export function usePolicyTemplates() {
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('policy_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching policy templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch policy templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: {
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    content: string;
    contentAr: string;
    category: string;
    tags: string[];
  }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('policy_templates')
        .insert({
          title: templateData.title,
          title_ar: templateData.titleAr,
          description: templateData.description,
          description_ar: templateData.descriptionAr,
          content: templateData.content,
          content_ar: templateData.contentAr,
          category: templateData.category,
          tags: templateData.tags,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Policy template created successfully'
      });

      fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error creating policy template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create policy template',
        variant: 'destructive'
      });
      return false;
    }
  };

  const useTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || !user) return false;

    try {
      // Create a new policy based on the template
      const { error } = await supabase
        .from('policies')
        .insert({
          title: `${template.title} - ${new Date().toLocaleDateString()}`,
          description: template.description,
          content: template.content,
          category: template.category,
          status: 'draft',
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Policy created from template successfully'
      });

      return true;
    } catch (error) {
      console.error('Error using policy template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create policy from template',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    createTemplate,
    useTemplate,
    refetch: fetchTemplates
  };
}
