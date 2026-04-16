import React from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { MatrixData, DepartmentSummary } from "@/hooks/useControlsMatrix";
import { Download, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';

interface ControlsMatrixExportProps {
  matrixData: MatrixData[];
  departmentSummaries: DepartmentSummary[];
  selectedDepartment: string;
}

export function ControlsMatrixExport({ matrixData, departmentSummaries, selectedDepartment }: ControlsMatrixExportProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    try {
      const csv = Papa.unparse({
        fields: headers,
        data: data
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: t('success'),
        description: t('dataExported'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('exportFailed'),
        variant: 'destructive',
      });
    }
  };

  const exportMatrixData = () => {
    const headers = [
      t('facility'),
      t('department'),
      t('controlNumber'),
      t('controlTitle'),
      t('domain'),
      t('category'),
      t('status'),
      t('progress'),
      t('dueDate'),
      t('completedAt'),
      t('assignedUser')
    ];

    const exportData = matrixData.map(item => [
      item.facility_name,
      item.department_name,
      item.control_number,
      item.control_title,
      item.domain,
      item.category,
      item.status,
      `${item.progress_percentage}%`,
      item.due_date || '',
      item.completed_at || '',
      item.assigned_user_name || ''
    ]);

    const filename = selectedDepartment !== 'all' 
      ? `controls_matrix_${selectedDepartment.replace(/\s+/g, '_')}`
      : 'controls_matrix_all_departments';

    exportToCSV(exportData, filename, headers);
  };

  const exportDepartmentSummary = () => {
    const headers = [
      t('department'),
      t('totalControls'),
      t('completedControls'),
      t('inProgressControls'),
      t('notStartedControls'),
      t('compliancePercentage')
    ];

    const exportData = departmentSummaries.map(dept => [
      dept.department_name,
      dept.total_controls,
      dept.completed_controls,
      dept.in_progress_controls,
      dept.not_started_controls,
      `${dept.compliance_percentage}%`
    ]);

    exportToCSV(exportData, 'department_compliance_summary', headers);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportMatrixData} className="gap-2">
        <Download className="h-4 w-4" />
        {t('exportMatrix')}
      </Button>
      <Button variant="outline" size="sm" onClick={exportDepartmentSummary} className="gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        {t('exportSummary')}
      </Button>
    </div>
  );
}