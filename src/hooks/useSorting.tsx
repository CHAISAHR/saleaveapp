import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface SortingResult<T> {
  sortedData: T[];
  sortConfig: SortConfig | null;
  handleSort: (key: string) => void;
  getSortIcon: (key: string) => React.ReactNode;
}

export const useSorting = <T extends Record<string, any>>(
  data: T[],
  defaultSortKey?: string,
  defaultSortDirection: SortDirection = 'desc'
): SortingResult<T> => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(
    defaultSortKey ? { key: defaultSortKey, direction: defaultSortDirection } : null
  );

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      // Handle different data types
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // Convert to string for comparison
        comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (!prevConfig || prevConfig.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prevConfig.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null; // Remove sorting
    });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="opacity-30">↕️</span>;
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
    getSortIcon,
  };
};

// Helper function to get nested object values
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};