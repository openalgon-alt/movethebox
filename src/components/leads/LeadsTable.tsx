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
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isLeadOverdue } from '@/lib/leads';
import { format, parseISO } from 'date-fns';
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

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onEdit: (lead: Lead) => void;
  initialSortField?: SortField;
  initialSortDirection?: SortDirection;
}

type SortField = 'next_follow_up_date' | 'created_at' | 'name';
type SortDirection = 'asc' | 'desc';

export function LeadsTable({ 
  leads, 
  isLoading, 
  onEdit, 
  initialSortField = 'created_at', 
  initialSortDirection = 'desc' 
}: LeadsTableProps) {
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
                <TableHead>Assigned To</TableHead>
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
                  Created <SortIcon field="created_at" />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedLeads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="animate-fade-in hover:bg-table-hover transition-colors"
                >
                  <TableCell className="font-medium">{lead.name}</TableCell>
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
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.assigned_to || '—'}
                  </TableCell>
                  <TableCell className={cn("text-muted-foreground", isLeadOverdue(lead) && "text-destructive font-medium")}>
                    <div className="flex items-center gap-2">
                       {isLeadOverdue(lead) && <AlertCircle className="h-4 w-4" />}
                       {formatDate(lead.next_follow_up_date)}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(lead.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
