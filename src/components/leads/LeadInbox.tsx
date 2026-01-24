import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LeadsTable } from './LeadsTable';
import { LeadForm } from './LeadForm';
import { CSVImport } from './CSVImport';
import { useLeads } from '@/hooks/useLeads';
import { useDailyFollowUp } from '@/hooks/useDailyFollowUp';
import { Lead } from '@/types/lead';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Upload, Inbox, CalendarClock, ListFilter } from 'lucide-react';
import { getOverdueLeads } from '@/lib/leads';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function LeadInbox() {
  const { data: leads = [], isLoading, error } = useLeads();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'follow-ups'>('all');

  // Daily Check Engine
  useDailyFollowUp(leads);

  // Handle Toast Action
  useEffect(() => {
    const handleSwitch = () => setViewMode('follow-ups');
    document.addEventListener('switch-view-followups', handleSwitch);
    return () => document.removeEventListener('switch-view-followups', handleSwitch);
  }, []);

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingLead(null);
    }
  };

  const filteredLeads = viewMode === 'follow-ups' 
    ? getOverdueLeads(leads)
    : leads;

  if (error) {
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
                  {leads.length} {leads.length === 1 ? 'lead' : 'leads'} total
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportOpen(true)}
                className="hidden sm:flex"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
               <Button
                variant="default" 
                size="sm"
                onClick={async () => {
                   try {
                     const { data, error } = await supabase.functions.invoke('pull-leads');
                     if (error) throw error;
                     toast.success(`Leads pulled successfully: ${JSON.stringify(data.results)}`);
                   } catch (e: any) {
                     toast.error('Failed to pull leads: ' + e.message);
                   }
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Pull Leads
              </Button>
              <Button
                size="sm"
                onClick={() => setIsFormOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
           {/* Mobile Header Equivalent (simplified) */}
           <div className="sm:hidden w-full flex justify-between items-center mb-4">
              <h1 className="text-lg font-semibold">Lead Inbox</h1>
              <Button size="icon" size-sm onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4" />
              </Button>
           </div>
           
           <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <ListFilter className="h-4 w-4" />
                All Leads
              </TabsTrigger>
              <TabsTrigger value="follow-ups" className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Today's Follow-ups
                {viewMode !== 'follow-ups' && (
                   <span className="ml-1 rounded-full bg-destructive text-destructive-foreground px-2 py-0.5 text-xs">
                     {getOverdueLeads(leads).length}
                   </span>
                )}
              </TabsTrigger>
            </TabsList>
           </Tabs>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-1">
          <div className="p-4 border-b">
             <h2 className="font-semibold flex items-center gap-2">
                {viewMode === 'all' ? 'All Leads' : "Today's Follow-up Queue"}
             </h2>
             {viewMode === 'follow-ups' && (
               <p className="text-sm text-muted-foreground">
                 Showing leads that are overdue or due today. prioritize these!
               </p>
             )}
          </div>
          <LeadsTable 
            key={viewMode}
            leads={filteredLeads} 
            isLoading={isLoading} 
            onEdit={handleEdit}
            initialSortField={viewMode === 'follow-ups' ? 'next_follow_up_date' : 'created_at'}
            initialSortDirection={viewMode === 'follow-ups' ? 'asc' : 'desc'}
          />
        </div>
      </main>

      {/* Modals */}
      <LeadForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        lead={editingLead}
      />

      <CSVImport
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
    </div>
  );
}
