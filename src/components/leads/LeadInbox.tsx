import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LeadsTable } from './LeadsTable';
import { LeadForm } from './LeadForm';
import { CSVImport } from './CSVImport';
import { useLeads, useBulkAssignLeads } from '@/hooks/useLeads';
import { useDailyFollowUp } from '@/hooks/useDailyFollowUp';
import { Lead, LeadStatus } from '@/types/lead';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Upload, Inbox, CalendarClock, ListFilter, Settings, LogOut, User as UserIcon, BarChart3, Package, DollarSign } from 'lucide-react';


import { QuickFollowUpDialog } from './QuickFollowUpDialog';
import { LeadDetailsDialog } from './LeadDetailsDialog';
import { useUser } from '@/components/auth/UserContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { TeamSettingsDialog } from '@/components/settings/TeamSettingsDialog';
import { LeadStatusSummary, MetricFilter } from './LeadStatusSummary';
import {
  getActiveLeads,
  getDueTodayLeads,
  getOverdueLeads,
  getStaleLeads,
  getClosedLeads,
  getLostLeads
} from '@/lib/leads';
import { BulkAssignDialog } from './BulkAssignDialog';

import { useNavigate } from 'react-router-dom';

import { DateRangeFilter } from './DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, startOfDay, endOfDay, subDays, addDays } from 'date-fns';
import { AddOnSettingsDialog } from '@/components/settings/AddOnSettingsDialog';
import { ProductCatalogDialog } from '@/components/settings/ProductCatalogDialog';
import { useAddOns } from '@/components/settings/AddOnContext';

import { useProducts } from '@/hooks/useProducts';

export function LeadInbox() {
  const { data: leads = [], isLoading, error } = useLeads();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);
  const [isQuickFollowUpOpen, setIsQuickFollowUpOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isAddOnsOpen, setIsAddOnsOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const { isProductsEnabled, isIncentivesEnabled } = useAddOns();
  const { products } = useProducts();

  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [quickFollowUpLead, setQuickFollowUpLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });

  useEffect(() => {
    if (dateRange) {
      localStorage.setItem('leadInboxDateRange', JSON.stringify(dateRange));
    } else {
      localStorage.removeItem('leadInboxDateRange');
    }
  }, [dateRange]);

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const bulkAssignLeads = useBulkAssignLeads();


  // Daily Check Engine
  useDailyFollowUp(leads);



  // ... (useEffect handleSwitch)

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };

  const handleViewDetails = (lead: Lead) => {
    setViewingLead(lead);
    setIsDetailsOpen(true);
  };

  const handleQuickFollowUp = (lead: Lead) => {
    setQuickFollowUpLead(lead);
    setIsQuickFollowUpOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingLead(null);
    }
  };



  // 1. Base Leads (Admin vs User)
  const baseLeads = user?.role === 'admin'
    ? leads
    : leads.filter(l => l.assigned_to?.toLowerCase() === user?.name.toLowerCase());

  // 2. Apply Date Range (for Metrics + Table)
  const dateFilteredLeads = (() => {
    // If no date is selected, show NO LEADS (as per user request)
    if (!dateRange?.from) return [];

    return baseLeads.filter(lead => {
      if (!lead.next_follow_up_date) return false;
      const followUpDate = new Date(lead.next_follow_up_date);
      const start = startOfDay(dateRange.from!);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
      return isWithinInterval(followUpDate, { start, end });
    });
  })();

  // 3. Apply Metric Filter (for Table) + Sorting
  const filteredLeads = (() => {
    let currentLeads = dateFilteredLeads;

    switch (metricFilter) {
      case 'active': currentLeads = getActiveLeads(currentLeads); break;
      case 'due_today': currentLeads = getDueTodayLeads(currentLeads); break;
      case 'overdue': currentLeads = getOverdueLeads(currentLeads); break;
      case 'stale': currentLeads = getStaleLeads(currentLeads); break;
      case 'closed': currentLeads = getClosedLeads(currentLeads); break;
      case 'lost': currentLeads = getLostLeads(currentLeads); break;
    }

    // Special sort for Stale leads (Oldest updated first)
    if (metricFilter === 'stale') {
      return currentLeads; // getStaleLeads already sorts by updated_at ascending
    }

    return currentLeads.sort((a, b) => {
      if (!a.next_follow_up_date) return 1;
      if (!b.next_follow_up_date) return -1;
      return new Date(a.next_follow_up_date).getTime() - new Date(b.next_follow_up_date).getTime();
    });
  })();

  const totalIncentives = dateFilteredLeads.filter(l => l.status === 'Closed').reduce((sum, lead) => {
    if (!lead.metadata || !lead.metadata.product_ids) return sum;

    const ids = lead.metadata.product_ids;
    const prices = lead.metadata.product_prices || {};
    const customIncentives = lead.metadata.product_incentives || {};

    let leadIncentive = 0;

    ids.forEach((id: string) => {
      const product = products.find(p => p.id === id);
      if (!product) return;

      const soldPrice = prices[id] ? parseFloat(prices[id]) : product.price;

      if (customIncentives[id]) {
        leadIncentive += parseFloat(customIncentives[id]) || 0;
      } else {
        const pct = product.incentive_percentage || 0;
        leadIncentive += (soldPrice * pct) / 100;
      }
    });

    return sum + leadIncentive;
  }, 0);

  // Clear selection when view changes potentially
  useEffect(() => {
    setSelectedLeadIds([]);
  }, [metricFilter, dateRange]);

  if (error) {
    // ... (error state)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load leads</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Inbox className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Lead Inbox</h1>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{user?.name} {user?.role === 'admin' ? '(Admin)' : ''}</span> • {dateFilteredLeads.length} leads
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <>
                  <DateRangeFilter date={dateRange} setDate={setDateRange} className="w-auto" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/performance')}
                    className="hidden sm:flex"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Performance
                  </Button>




                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportOpen(true)}
                    className="hidden sm:flex"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      // Placeholder for existing pull logic
                      toast.info("Pulling leads...");
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pull
                  </Button>
                </>

              )}

              {isIncentivesEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/incentives')}
                  className="hidden sm:flex"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Incentives
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setIsFormOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>

              <DropdownMenu>
                {/* ... (Dropdown Menu items) */}
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDateRange({ from: new Date(2000, 0, 1), to: new Date(2100, 0, 1) })}>
                    <ListFilter className="h-4 w-4 mr-2" />
                    All Leads
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings/follow-up-policy')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Follow-up Policy
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => setIsTeamSettingsOpen(true)}>
                      <UserIcon className="h-4 w-4 mr-2" />
                      Team Members
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => setIsAddOnsOpen(true)}>
                      <Package className="h-4 w-4 mr-2" />
                      Add-ons
                    </DropdownMenuItem>
                  )}
                  {isProductsEnabled && user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => setIsProductsOpen(true)}>
                      <ListFilter className="h-4 w-4 mr-2" />
                      Product Catalog
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header >

      {/* Main Content */}
      < main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" >
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Mobile Header Equivalent */}
          <div className="sm:hidden w-full flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Inbox</h1>
              {user && <span className="text-xs text-muted-foreground">({user.name})</span>}
            </div>
            <div className="flex gap-1">
              {user?.role === 'admin' && selectedLeadIds.length > 0 && (
                <Button size="sm" variant="secondary" onClick={() => setIsBulkAssignOpen(true)}>
                  Assign ({selectedLeadIds.length})
                </Button>
              )}
              <Button size="icon" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                {/* ... Mobile Dropdown ... */}
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDateRange({ from: new Date(2000, 0, 1), to: new Date(2100, 0, 1) })}>
                    <ListFilter className="h-4 w-4 mr-2" />
                    All Leads
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings/follow-up-policy')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Follow-up Policy
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/performance')}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Performance
                      </DropdownMenuItem>
                      {isIncentivesEnabled && (
                        <DropdownMenuItem onClick={() => navigate('/incentives')}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Incentives
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setIsTeamSettingsOpen(true)}>
                        <UserIcon className="h-4 w-4 mr-2" />
                        Team Members
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Metrics Summary */}
          {/* ... (LeadStatusSummary) */}
          {/* Metrics Summary */}
          <LeadStatusSummary
            leads={dateFilteredLeads}
            activeFilter={metricFilter}
            onFilterChange={setMetricFilter}
          />
        </div>


        <div className="bg-card rounded-lg border shadow-sm p-1">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="font-semibold flex items-center gap-2">
                {user?.role === 'admin' ? 'All Leads' : 'My Leads'}
              </h2>
            </div>
            {user?.role === 'admin' && selectedLeadIds.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsBulkAssignOpen(true)}
                className="animate-in fade-in"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Assign ({selectedLeadIds.length})
              </Button>
            )}
          </div>
          <LeadsTable
            leads={filteredLeads}
            isLoading={isLoading}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            onQuickFollowUp={handleQuickFollowUp}
            initialSortField="created_at"
            initialSortDirection="desc"
            selectedIds={selectedLeadIds}
            onSelectionChange={user?.role === 'admin' ? setSelectedLeadIds : undefined}
          />
        </div>
      </main >

      {/* Modals */}
      < LeadForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        lead={editingLead}
      />

      <CSVImport
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />

      <TeamSettingsDialog
        open={isTeamSettingsOpen}
        onOpenChange={setIsTeamSettingsOpen}
      />


      <QuickFollowUpDialog
        open={isQuickFollowUpOpen}
        onOpenChange={(open) => {
          setIsQuickFollowUpOpen(open);
          if (!open) setQuickFollowUpLead(null);
        }}
        lead={quickFollowUpLead}
      />

      <LeadDetailsDialog
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) setViewingLead(null);
        }}
        lead={viewingLead}
      />

      <BulkAssignDialog
        open={isBulkAssignOpen}
        onOpenChange={setIsBulkAssignOpen}
        selectedCount={selectedLeadIds.length}
        onAssign={async (memberId) => {
          await bulkAssignLeads.mutateAsync({
            leadIds: selectedLeadIds,
            assignedTo: memberId
          });
          setSelectedLeadIds([]);
        }}
      />

      <AddOnSettingsDialog
        open={isAddOnsOpen}
        onOpenChange={setIsAddOnsOpen}
      />

      <ProductCatalogDialog
        open={isProductsOpen}
        onOpenChange={setIsProductsOpen}
      />
    </div >
  );
}
