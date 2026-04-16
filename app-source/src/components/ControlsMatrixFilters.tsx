import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface ControlsMatrixFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  departments: any[];
  statusFilter: string[];
  setStatusFilter: (statuses: string[]) => void;
  domainFilter: string[];
  setDomainFilter: (domains: string[]) => void;
  availableDomains: string[];
  availableStatuses: string[];
  onClearFilters: () => void;
}

export function ControlsMatrixFilters({
  searchTerm,
  setSearchTerm,
  selectedDepartment,
  setSelectedDepartment,
  departments,
  statusFilter,
  setStatusFilter,
  domainFilter,
  setDomainFilter,
  availableDomains,
  availableStatuses,
  onClearFilters
}: ControlsMatrixFiltersProps) {
  const { t, language } = useLanguage();
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const statusLabels: { [key: string]: string } = {
    'not_started': t('notStarted'),
    'in_progress': t('inProgress'),
    'completed': t('completed'),
    'needs_review': t('needsReview')
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(
      statusFilter.includes(status)
        ? statusFilter.filter(s => s !== status)
        : [...statusFilter, status]
    );
  };

  const toggleDomainFilter = (domain: string) => {
    setDomainFilter(
      domainFilter.includes(domain)
        ? domainFilter.filter(d => d !== domain)
        : [...domainFilter, domain]
    );
  };

  const hasActiveFilters = statusFilter.length > 0 || domainFilter.length > 0 || selectedDepartment !== 'all' || searchTerm.length > 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Primary Search and Department Filter */}
        <div className={`flex gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
            <Input 
              placeholder={t('searchControls')} 
              className={language === 'ar' ? 'pr-10' : 'pl-10'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('allDepartments')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allDepartments')}</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {t('filters')}
            {filtersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {statusFilter.length + domainFilter.length + (selectedDepartment !== 'all' ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>

        {/* Expanded Filters */}
        {filtersExpanded && (
          <div className="space-y-4 animate-accordion-down">
            <Separator />
            
            {/* Status Filters */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('status')}</label>
              <div className="flex flex-wrap gap-2">
                {availableStatuses.map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter.includes(status) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStatusFilter(status)}
                    className="text-xs"
                  >
                    {statusLabels[status] || status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Domain Filters */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('domain')}</label>
              <div className="flex flex-wrap gap-2">
                {availableDomains.map((domain) => (
                  <Button
                    key={domain}
                    variant={domainFilter.includes(domain) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDomainFilter(domain)}
                    className="text-xs"
                  >
                    {domain}
                  </Button>
                ))}
              </div>
            </div>

            {/* Active Filters and Clear */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {statusFilter.map((status) => (
                    <Badge key={`status-${status}`} variant="secondary" className="gap-1">
                      {statusLabels[status]}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleStatusFilter(status)}
                      />
                    </Badge>
                  ))}
                  {domainFilter.map((domain) => (
                    <Badge key={`domain-${domain}`} variant="secondary" className="gap-1">
                      {domain}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleDomainFilter(domain)}
                      />
                    </Badge>
                  ))}
                  {selectedDepartment !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {selectedDepartment}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setSelectedDepartment('all')}
                      />
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                  {t('clearFilters')}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}