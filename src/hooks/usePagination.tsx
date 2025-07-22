import { useState, useMemo } from 'react';

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationResult<T> {
  paginatedData: T[];
  pagination: PaginationConfig;
  goToPage: (page: number) => void;
  goToFirst: () => void;
  goToLast: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export const usePagination = <T,>(
  data: T[],
  initialPageSize: number = 20
): PaginationResult<T> => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(initialPageSize);

  const pagination = useMemo(() => ({
    page: currentPage,
    pageSize,
    total: data.length,
  }), [currentPage, pageSize, data.length]);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, data.length);

  const paginatedData = useMemo(() => {
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, startIndex, pageSize]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const goToFirst = () => setCurrentPage(1);
  const goToLast = () => setCurrentPage(totalPages);
  const goToNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevious = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  const hasNext = currentPage < totalPages;
  const hasPrevious = currentPage > 1;

  return {
    paginatedData,
    pagination,
    goToPage,
    goToFirst,
    goToLast,
    goToNext,
    goToPrevious,
    hasNext,
    hasPrevious,
    totalPages,
    startIndex: startIndex + 1, // 1-indexed for display
    endIndex,
  };
};