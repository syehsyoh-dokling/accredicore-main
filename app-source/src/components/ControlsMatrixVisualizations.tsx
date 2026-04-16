import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";
import { DepartmentSummary } from "@/hooks/useControlsMatrix";

interface ControlsMatrixVisualizationsProps {
  statusCounts: {
    not_started: number;
    in_progress: number;
    completed: number;
    needs_review: number;
    total: number;
  };
  departmentSummaries: DepartmentSummary[];
}

export function ControlsMatrixVisualizations({ statusCounts, departmentSummaries }: ControlsMatrixVisualizationsProps) {
  const { t } = useLanguage();

  const statusData = [
    { name: t('completed'), value: statusCounts.completed, color: 'hsl(var(--success))' },
    { name: t('inProgress'), value: statusCounts.in_progress, color: 'hsl(var(--warning))' },
    { name: t('needsReview'), value: statusCounts.needs_review, color: 'hsl(var(--destructive))' },
    { name: t('notStarted'), value: statusCounts.not_started, color: 'hsl(var(--muted-foreground))' },
  ];

  const departmentData = departmentSummaries.map(dept => ({
    name: dept.department_name,
    compliance: dept.compliance_percentage,
    completed: dept.completed_controls,
    inProgress: dept.in_progress_controls,
    notStarted: dept.not_started_controls,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('statusDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Compliance Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('departmentCompliance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="compliance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Controls Breakdown */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('controlsBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" stackId="a" fill="hsl(var(--success))" />
              <Bar dataKey="inProgress" stackId="a" fill="hsl(var(--warning))" />
              <Bar dataKey="notStarted" stackId="a" fill="hsl(var(--muted-foreground))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}