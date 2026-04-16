import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MatrixData {
  facility_id: number;
  facility_name: string;
  department_name: string;
  control_id: number;
  control_number: string;
  control_title: string;
  domain: string;
  category: string;
  status: string;
  progress_percentage: number;
  due_date: string | null;
  completed_at: string | null;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
}

export interface DepartmentSummary {
  department_name: string;
  total_controls: number;
  completed_controls: number;
  in_progress_controls: number;
  not_started_controls: number;
  compliance_percentage: number;
}

export function useControlsMatrix() {
  const [matrixData, setMatrixData] = useState<MatrixData[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [controls, setControls] = useState<any[]>([]);
  const [departmentSummaries, setDepartmentSummaries] = useState<DepartmentSummary[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [domainFilter, setDomainFilter] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch basic data
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch departments
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (deptError) throw deptError;

        // Fetch controls
        const { data: controlsData, error: controlsError } = await supabase
          .from('controls')
          .select('*')
          .order('control_number');

        if (controlsError) throw controlsError;

        setDepartments(deptData || []);
        setControls(controlsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Fetch matrix data based on filters
  useEffect(() => {
    if (!user || departments.length === 0 || controls.length === 0) return;

    const fetchMatrixData = async () => {
      try {
        // Fetch facilities with departments
        const { data: facilitiesData, error: facilitiesError } = await supabase
          .from('facilities')
          .select(`
            id,
            name,
            department_id,
            departments(name)
          `)
          .eq('is_active', true);

        if (facilitiesError) throw facilitiesError;

        // Fetch all audit progress
        const { data: progressData, error: progressError } = await supabase
          .from('audit_progress')
          .select('*');

        if (progressError) throw progressError;

        // Transform the data to match MatrixData interface
        const transformedData: MatrixData[] = [];
        
        if (facilitiesData) {
          facilitiesData.forEach(facility => {
            // For each facility, create matrix entries for all controls
            controls.forEach(control => {
              // Find progress for this facility-control combination
              const progress = progressData?.find(
                (ap: any) => ap.facility_id === facility.id && ap.control_id === control.id
              );

              transformedData.push({
                facility_id: facility.id,
                facility_name: facility.name,
                department_name: facility.departments?.name || 'Unknown',
                control_id: control.id,
                control_number: control.control_number,
                control_title: control.title,
                domain: control.domain,
                category: control.category,
                status: progress?.status || 'not_started',
                progress_percentage: progress?.progress_percentage || 0,
                due_date: progress?.due_date || null,
                completed_at: progress?.completed_at || null,
                assigned_user_id: progress?.user_id || null,
                assigned_user_name: null // Would need another join for user names
              });
            });
          });
        }

        // Apply filters to transformed data
        let filteredData = transformedData;

        if (selectedDepartment !== 'all') {
          filteredData = filteredData.filter(item =>
            item.department_name === selectedDepartment
          );
        }

        if (searchTerm) {
          filteredData = filteredData.filter(item =>
            item.facility_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.control_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.department_name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        if (statusFilter.length > 0) {
          filteredData = filteredData.filter(item =>
            statusFilter.includes(item.status)
          );
        }

        if (domainFilter.length > 0) {
          filteredData = filteredData.filter(item =>
            domainFilter.includes(item.domain)
          );
        }

        setMatrixData(filteredData);
      } catch (err) {
        console.error('Error fetching matrix data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load matrix data');
      }
    };

    fetchMatrixData();
  }, [user, selectedDepartment, searchTerm, statusFilter, domainFilter, departments, controls]);

  // Fetch department summaries
  useEffect(() => {
    if (!user) return;

    const fetchDepartmentSummaries = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_department_compliance_summary', 
            selectedDepartment !== 'all' ? { 
              dept_id: departments.find(d => d.name === selectedDepartment)?.id 
            } : {});

        if (error) throw error;
        setDepartmentSummaries(data || []);
      } catch (err) {
        console.error('Error fetching department summaries:', err);
      }
    };

    fetchDepartmentSummaries();
  }, [user, selectedDepartment, departments, matrixData]);

  const updateControlStatus = async (
    facilityId: number, 
    controlId: number, 
    status: string, 
    progressPercentage: number,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase
        .rpc('update_audit_progress', {
          p_facility_id: facilityId,
          p_user_id: user?.id,
          p_control_id: controlId,
          p_status: status,
          p_progress_percentage: progressPercentage,
          p_notes: notes
        });

      if (error) throw error;

      // Refresh matrix data
      const updatedMatrix = matrixData.map(item => {
        if (item.facility_id === facilityId && item.control_id === controlId) {
          return {
            ...item,
            status,
            progress_percentage: progressPercentage
          };
        }
        return item;
      });
      
      setMatrixData(updatedMatrix);
      return { success: true };
    } catch (err) {
      console.error('Error updating control status:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update status' 
      };
    }
  };

  const getStatusCounts = () => {
    const counts = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
      needs_review: 0,
      total: matrixData.length
    };

    matrixData.forEach(item => {
      counts[item.status as keyof typeof counts]++;
    });

    return counts;
  };

  const getUniqueControls = () => {
    const controlsMap = new Map();
    matrixData.forEach(item => {
      if (!controlsMap.has(item.control_id)) {
        controlsMap.set(item.control_id, {
          id: item.control_id,
          control_number: item.control_number,
          title: item.control_title,
          domain: item.domain,
          category: item.category
        });
      }
    });
    return Array.from(controlsMap.values());
  };

  const getUniqueFacilities = () => {
    const facilitiesMap = new Map();
    matrixData.forEach(item => {
      if (!facilitiesMap.has(item.facility_id)) {
        facilitiesMap.set(item.facility_id, {
          id: item.facility_id,
          name: item.facility_name,
          department: item.department_name
        });
      }
    });
    return Array.from(facilitiesMap.values());
  };

  const getAvailableDomains = () => {
    const domains = new Set<string>();
    matrixData.forEach(item => {
      if (item.domain) domains.add(item.domain);
    });
    return Array.from(domains).sort();
  };

  const getAvailableStatuses = () => {
    return ['not_started', 'in_progress', 'completed', 'needs_review'];
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setDomainFilter([]);
    setSelectedDepartment('all');
    setSearchTerm('');
  };

  return {
    matrixData,
    departments,
    controls,
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
  };
}