import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from './StatusBadge';
import { Lead, LeadStatus, LEAD_STATUSES } from '@/types/lead';
import { useDeleteLead } from '@/hooks/useLeads';
import {
  Search,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  AlertCircle,
  CalendarClock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isLeadOverdue, isLeadStale } from '@/lib/leads';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Checkbox } from '@/components/ui/checkbox';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onEdit: (lead: Lead) => void;
  onViewDetails: (lead: Lead) => void;
  onQuickFollowUp: (lead: Lead) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  initialSortField?: SortField;
  initialSortDirection?: SortDirection;
}

type SortField = 'next_follow_up_date' | 'created_at' | 'name';
type SortDirection = 'asc' | 'desc';

import { useUser } from '@/components/auth/UserContext';
import { useAddOns } from '@/components/settings/AddOnContext';
import { useProducts } from '@/hooks/useProducts';

// ...

export function LeadsTable({
  leads,
  isLoading,
  onEdit,
  onViewDetails,
  onQuickFollowUp,
  selectedIds = [],
  onSelectionChange,
  initialSortField = 'created_at',
  initialSortDirection = 'desc'
}: LeadsTableProps) {
  const { user } = useUser();
  const { isProductsEnabled } = useAddOns();
  const { products } = useProducts();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>(initialSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteLead = useDeleteLead();

  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchLower) ||
        (lead.phone && lead.phone.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null values
      if (aVal === null) aVal = '';
      if (bVal === null) bVal = '';

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [leads, search, statusFilter, sortField, sortDirection]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(filteredAndSortedLeads.map(l => l.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedIds, id]);
    } else {
      onSelectionChange?.(selectedIds.filter(sid => sid !== id));
    }
  };

  // ... (rest of sorting/handling logic same)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <ChevronUp className="h-4 w-4 inline ml-1" /> :
      <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteLead.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="table-container">
        <div className="p-8 text-center text-muted-foreground">
          Loading leads...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as LeadStatus | 'all')}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="table-container">
        {filteredAndSortedLeads.length === 0 ? (
          <div className="empty-state">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No leads found</p>
            <p className="text-sm">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first lead to get started'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header hover:bg-table-header">
                {onSelectionChange && (
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={filteredAndSortedLeads.length > 0 && selectedIds.length === filteredAndSortedLeads.length}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('name')}
                >
                  Name <SortIcon field="name" />
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                {user?.role === 'admin' && (
                  <TableHead>Assigned To</TableHead>
                )}
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('next_follow_up_date')}
                >
                  Follow-up <SortIcon field="next_follow_up_date" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('created_at')}
                >
                  {isProductsEnabled ? 'Products' : <span>Created <SortIcon field="created_at" /></span>}
                </TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className={cn(
                    "animate-fade-in hover:bg-table-hover transition-colors",
                    isLeadStale(lead) && "bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
                  )}
                  onClick={() => onSelectionChange && handleSelectOne(lead.id, !selectedIds.includes(lead.id))}
                >
                  {onSelectionChange && (
                    <TableCell className="w-[40px] px-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectOne(lead.id, checked as boolean)}
                        aria-label={`Select ${lead.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-between gap-2 max-w-[200px]">
                      <span
                        className="truncate cursor-pointer hover:underline hover:text-primary transition-colors"
                        title="View Profile"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(lead);
                        }}
                      >
                        {lead.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickFollowUp(lead);
                        }}
                        title="Quick Action"
                      >
                        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.phone || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.email || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.source || '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} />
                    {isLeadStale(lead) && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 ml-2">
                        Stale
                      </span>
                    )}
                  </TableCell>
                  {user?.role === 'admin' && (
                    <TableCell className="text-muted-foreground">
                      {lead.assigned_to || '—'}
                    </TableCell>
                  )}
                  <TableCell className={cn("text-muted-foreground", isLeadOverdue(lead) && "text-destructive font-medium")}>
                    <div className="flex items-center gap-2">
                      {isLeadOverdue(lead) && <AlertCircle className="h-4 w-4" />}
                      {formatDate(lead.next_follow_up_date)}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {isProductsEnabled ? (
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const pIds = (lead.metadata as any)?.product_ids as string[] | undefined;
                          const singleId = (lead.metadata as any)?.product_id as string | undefined; // Fallback
                          const ids = pIds || (singleId ? [singleId] : []);

                          if (ids.length === 0) return '—';

                          const names = ids.map(id => products.find(p => p.id === id)?.name).filter(Boolean);
                          return names.length > 0 ? names.join(', ') : '—';
                        })()}
                      </div>
                    ) : (
                      formatDate(lead.created_at)
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatRelativeTime(lead.updated_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onQuickFollowUp(lead)}>
                          <CalendarClock className="h-4 w-4 mr-2" />
                          Quick Action
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(lead)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(lead.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
