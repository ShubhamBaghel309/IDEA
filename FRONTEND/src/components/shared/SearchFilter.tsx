
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters?: {
    status?: FilterOption[];
    subject?: FilterOption[];
    dateRange?: { from?: Date; to?: Date };
  };
  activeFilters?: { [key: string]: string | string[] };
  onFilterChange?: (filterType: string, value: string | string[]) => void;
  onClearFilters?: () => void;
  placeholder?: string;
  className?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  placeholder = "Search...",
  className
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = Object.values(activeFilters).some(filter => 
    Array.isArray(filter) ? filter.length > 0 : filter
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2",
            hasActiveFilters && "border-primary text-primary"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1">
              {Object.values(activeFilters).flat().filter(Boolean).length}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {filters?.status && (
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {filters.status.map((option) => (
                      <Button
                        key={option.value}
                        variant={activeFilters.status === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => onFilterChange?.('status', option.value)}
                      >
                        {option.label}
                        {option.count !== undefined && (
                          <Badge variant="secondary" className="ml-2">
                            {option.count}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {filters?.subject && (
                <div>
                  <h4 className="font-medium mb-2">Subject</h4>
                  <div className="flex flex-wrap gap-2">
                    {filters.subject.map((option) => (
                      <Button
                        key={option.value}
                        variant={
                          Array.isArray(activeFilters.subject) && 
                          activeFilters.subject.includes(option.value) 
                            ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          const currentSubjects = Array.isArray(activeFilters.subject) 
                            ? activeFilters.subject 
                            : [];
                          const newSubjects = currentSubjects.includes(option.value)
                            ? currentSubjects.filter(s => s !== option.value)
                            : [...currentSubjects, option.value];
                          onFilterChange?.('subject', newSubjects);
                        }}
                      >
                        {option.label}
                        {option.count !== undefined && (
                          <Badge variant="secondary" className="ml-2">
                            {option.count}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  disabled={!hasActiveFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;
            const values = Array.isArray(value) ? value : [value];
            return values.map((v, index) => (
              <Badge key={`${key}-${index}`} variant="secondary" className="gap-1">
                {key}: {v}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    if (Array.isArray(value)) {
                      const newValues = value.filter(val => val !== v);
                      onFilterChange?.(key, newValues);
                    } else {
                      onFilterChange?.(key, '');
                    }
                  }}
                />
              </Badge>
            ));
          })}
        </div>
      )}
    </div>
  );
};
