import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSortKey?: string;
  currentSortDirection?: 'asc' | 'desc';
  onSort: (key: string) => void;
  className?: string;
}

export const SortableTableHead = ({
  children,
  sortKey,
  currentSortKey,
  currentSortDirection,
  onSort,
  className,
}: SortableTableHeadProps) => {
  const isActive = currentSortKey === sortKey;
  
  const getSortIcon = () => {
    if (!isActive) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return currentSortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium hover:bg-transparent"
        onClick={() => onSort(sortKey)}
      >
        {children}
        {getSortIcon()}
      </Button>
    </TableHead>
  );
};