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
import { Plus, Upload, Inbox, CalendarClock, ListFilter, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { getOverdueLeads } from '@/lib/leads';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FollowUpSettingsDialog } from './FollowUpSettingsDialog';
import { QuickFollowUpDialog } from './QuickFollowUpDialog';
import { LeadDetailsDialog } from './LeadDetailsDialog';
import { LoginDialog } from '@/components/auth/LoginDialog';
import { useUser } from '@/components/auth/UserContext';

import { TeamSettingsDialog } from '@/components/settings/TeamSettingsDialog';

export function LeadInbox() {
  const { data: leads = [], isLoading, error } = useLeads();
  const { user, logout } = useUser();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);
  const [isQuickFollowUpOpen, setIsQuickFollowUpOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [quickFollowUpLead, setQuickFollowUpLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'follow-ups' | 'my-leads'>('my-leads');

  // Initialize view based on role
  useEffect(() => {
    if (user?.role === 'admin') {
      setViewMode('all');
    } else {
      setViewMode('my-leads');
    }
  }, [user]);

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

  const filteredLeads = (() => {
    if (viewMode === 'follow-ups') {
      if (user?.role === 'salesperson') {
        return getOverdueLeads(leads).filter(l => l.assigned_to?.toLowerCase() === user?.name.toLowerCase());
      }
      return getOverdueLeads(leads);
    }
    if (viewMode === 'my-leads') {
      return leads.filter(l => l.assigned_to?.toLowerCase() === user?.name.toLowerCase())
        .sort((a, b) => {
          if (!a.next_follow_up_date) return 1;
          if (!b.next_follow_up_date) return -1;
          return new Date(a.next_follow_up_date).getTime() - new Date(b.next_follow_up_date).getTime();
        });
    }
    // 'all' view - Admin only (or fallback)
    return leads;
  })();

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
                  <span className="font-medium text-foreground">{user?.name} ({user?.role})</span> • {leads.length} total
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="hidden sm:flex text-muted-foreground hover:text-destructive"
                title="Logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              {user?.role === 'admin' && (
                <>
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
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTeamSettingsOpen(true)}
                    className="hidden sm:flex"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Team
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      // ... (existing pull logic)
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pull
                  </Button>
                </>
              )}
              <Button
                size="sm"
                onClick={() => setIsFormOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
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
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Inbox</h1>
              {user && <span className="text-xs text-muted-foreground">({user.name})</span>}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full sm:w-auto">
            <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-3 sm:w-[500px]' : 'grid-cols-2 sm:w-[350px]'}`}>
              <TabsTrigger value="my-leads" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                My Leads
              </TabsTrigger>
              {user?.role === 'admin' && (
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  All Leads
                </TabsTrigger>
              )}
              <TabsTrigger value="follow-ups" className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Follow-ups
                {viewMode !== 'follow-ups' && (
                  <span className="ml-1 rounded-full bg-destructive text-destructive-foreground px-2 py-0.5 text-xs">
                    {filteredLeads.filter(l => new Date(l.next_follow_up_date || '') <= new Date()).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-1">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              {viewMode === 'all' ? 'All Leads' : viewMode === 'my-leads' ? 'My Leads' : "Current Follow-ups"}
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
            onViewDetails={handleViewDetails}
            onQuickFollowUp={handleQuickFollowUp}
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

      <FollowUpSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />

      <LoginDialog />

      <QuickFollowUpDialog
        open={isQuickFollowUpOpen}
        onOpenChange={(open) => {
          setIsQuickFollowUpOpen(open);
          if (!open) setQuickFollowUpLead(null);
        }}
        lead={quickFollowUpLead}
      />

      <TeamSettingsDialog
        open={isTeamSettingsOpen}
        onOpenChange={setIsTeamSettingsOpen}
      />

      <LeadDetailsDialog
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) setViewingLead(null);
        }}
        lead={viewingLead}
      />
    </div>
  );
}
