
import { useParams, useNavigate } from "react-router-dom";
import { useLeads } from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadStatusSummary } from "@/components/leads/LeadStatusSummary";
import { useState } from "react";
import { MetricFilter } from "@/components/leads/LeadStatusSummary";
import { Lead } from "@/types/lead";
import {
    getActiveLeads,
    getDueTodayLeads,
    getOverdueLeads,
    getClosedLeads,
    getLostLeads
} from '@/lib/leads';
import { LeadForm } from "@/components/leads/LeadForm";
import { QuickFollowUpDialog } from "@/components/leads/QuickFollowUpDialog";
import { LeadDetailsDialog } from "@/components/leads/LeadDetailsDialog";

import { DateRangeFilter } from "@/components/leads/DateRangeFilter";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

export default function SalespersonDetails() {
    const { name } = useParams();
    const navigate = useNavigate();
    const { data: allLeads = [], isLoading } = useLeads();
    const [metricFilter, setMetricFilter] = useState<MetricFilter>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date()
    });

    // Dialog States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isQuickFollowUpOpen, setIsQuickFollowUpOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Selected Lead States
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [quickFollowUpLead, setQuickFollowUpLead] = useState<Lead | null>(null);
    const [viewingLead, setViewingLead] = useState<Lead | null>(null);

    const decodedName = decodeURIComponent(name || "");

    // Filter leads for this salesperson
    const salespersonLeads = allLeads.filter(
        (lead) => lead.assigned_to?.toLowerCase() === decodedName.toLowerCase()
    );

    // Apply metric filter for the table view
    // 1. Apply Date Range
    const dateFilteredLeads = (() => {
        if (!dateRange?.from) return salespersonLeads;

        return salespersonLeads.filter(lead => {
            if (!lead.next_follow_up_date) return false;
            const followUpDate = new Date(lead.next_follow_up_date);
            const start = startOfDay(dateRange.from!);
            const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
            return isWithinInterval(followUpDate, { start, end });
        });
    })();

    // 2. Apply Metric Filter (for Table)
    const filteredLeads = (() => {
        let leads = dateFilteredLeads;
        switch (metricFilter) {
            case 'active': leads = getActiveLeads(leads); break;
            case 'due_today': leads = getDueTodayLeads(leads); break;
            case 'overdue': leads = getOverdueLeads(leads); break;
            case 'closed': leads = getClosedLeads(leads); break;
            case 'lost': leads = getLostLeads(leads); break;
        }
        return leads;
    })();

    const stats = {
        total: dateFilteredLeads.length,
        contacted: dateFilteredLeads.filter(l => l.status !== 'New').length,
        closed: dateFilteredLeads.filter(l => l.status === 'Closed').length,
    };

    // Handlers
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

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{decodedName || 'Salesperson'}</h1>
                            <p className="text-muted-foreground">Performance Overview</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
                        <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">Filter Date:</span>
                        <DateRangeFilter date={dateRange} setDate={setDateRange} className="w-auto bg-background" />
                    </div>
                </div>

                {/* Metrics Cards */}
                <LeadStatusSummary
                    leads={dateFilteredLeads}
                    activeFilter={metricFilter}
                    onFilterChange={setMetricFilter}
                />

                {/* Detailed Table */}
                <div className="bg-card rounded-lg border shadow-sm">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold">Assigned Leads ({filteredLeads.length})</h2>
                    </div>
                    <LeadsTable
                        leads={filteredLeads}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onViewDetails={handleViewDetails}
                        onQuickFollowUp={handleQuickFollowUp}
                        initialSortField="created_at"
                        initialSortDirection="desc"
                    />
                </div>
            </div>

            {/* Dialogs */}
            <LeadForm
                open={isFormOpen}
                onOpenChange={handleFormClose}
                lead={editingLead}
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
        </div>
    );
}

function MetricBadge({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="bg-secondary px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium text-foreground">{value}</span>
        </div>
    )
}
