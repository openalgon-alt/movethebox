
import { Lead } from '@/types/lead';
import { Card, CardContent } from '@/components/ui/card';
import {
    getActiveLeads,
    getDueTodayLeads,
    getOverdueLeads,
    getStaleLeads,
    getClosedLeads,
    getLostLeads
} from '@/lib/leads';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, AlertCircle, Activity, AlertOctagon, DollarSign } from 'lucide-react';
import { useAddOns } from '@/components/settings/AddOnContext';
import { useProducts } from '@/hooks/useProducts';

export type MetricFilter = 'all' | 'active' | 'due_today' | 'overdue' | 'stale' | 'closed' | 'lost';

interface LeadStatusSummaryProps {
    leads: Lead[];
    activeFilter: MetricFilter;
    onFilterChange: (filter: MetricFilter) => void;
    dateFilter?: React.ReactNode;
}



export function LeadStatusSummary({ leads, activeFilter, onFilterChange, dateFilter }: LeadStatusSummaryProps) {
    const activeCount = getActiveLeads(leads).length;
    const dueTodayCount = getDueTodayLeads(leads).length;
    const overdueCount = getOverdueLeads(leads).length;
    const staleCount = getStaleLeads(leads).length;

    const closedCount = getClosedLeads(leads).length;
    const lostCount = getLostLeads(leads).length;
    const { isIncentivesEnabled } = useAddOns();
    const { products } = useProducts();

    const closedLeads = getClosedLeads(leads);

    const totalIncentives = closedLeads.reduce((sum, lead) => {
        if (!lead.metadata || !lead.metadata.product_ids) return sum;

        const ids = lead.metadata.product_ids as string[];
        const prices = (lead.metadata.product_prices as Record<string, string>) || {};
        const customIncentives = (lead.metadata.product_incentives as Record<string, string>) || {};

        let leadIncentive = 0;

        ids.forEach((id) => {
            const product = products.find(p => p.id === id);
            if (!product) return;

            // Use sold price if available, else list price
            const soldPrice = prices[id] ? parseFloat(prices[id]) : product.price;

            if (customIncentives[id]) {
                // Custom incentive amount overrides percentage
                leadIncentive += parseFloat(customIncentives[id]) || 0;
            } else {
                // Standard percentage commission
                const pct = product.incentive_percentage || 0;
                leadIncentive += (soldPrice * pct) / 100;
            }
        });

        return sum + leadIncentive;
    }, 0);

    const cards = [
        {
            id: 'active',
            label: 'Active Leads',
            count: activeCount,
            icon: Activity,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
            borderColor: 'border-blue-200 dark:border-blue-800'
        },
        {
            id: 'due_today',
            label: 'Due Today',
            count: dueTodayCount,
            icon: Clock,
            color: 'text-orange-500',
            bgColor: 'bg-orange-50 dark:bg-orange-950/20',
            borderColor: 'border-orange-200 dark:border-orange-800'
        },
        {
            id: 'overdue',
            label: 'Overdue',
            count: overdueCount,
            icon: AlertCircle,
            color: 'text-red-500',
            bgColor: 'bg-red-50 dark:bg-red-950/20',
            borderColor: 'border-red-200 dark:border-red-800'
        },
        {
            id: 'stale',
            label: 'Stale Leads',
            count: staleCount,
            icon: AlertOctagon,
            color: 'text-amber-500',
            bgColor: 'bg-amber-50 dark:bg-amber-950/20',
            borderColor: 'border-amber-200 dark:border-amber-800'
        },
        {
            id: 'closed',
            label: 'Closed',
            count: closedCount,
            icon: CheckCircle2,
            color: 'text-green-500',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
            borderColor: 'border-green-200 dark:border-green-800'
        },
        {
            id: 'lost',
            label: 'Lost',
            count: lostCount,
            icon: XCircle,
            color: 'text-gray-500',
            bgColor: 'bg-gray-50 dark:bg-gray-950/20',
            borderColor: 'border-gray-200 dark:border-gray-800'
        }
    ] as const;

    const incentivesCard = {
        id: 'revenue', // Keeping ID 'revenue' for now as it maps to 'closed' filter in existing logic
        label: 'Total Incentives',
        count: `$${totalIncentives.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800'
    };

    const displayCards = isIncentivesEnabled ? [incentivesCard, ...cards] : cards;

    return (
        <div className="space-y-4 mb-6">

            <div className={cn(
                "grid grid-cols-2 gap-4",
                isIncentivesEnabled ? "lg:grid-cols-7" : "lg:grid-cols-6"
            )}>
                {displayCards.map((card) => {
                    // If it's the revenue card, we might want to map it to 'closed' filter or Keep it purely informational? 
                    // The user said "works same like active leads", implying clicking it likely filters.
                    // Converting 'revenue' id to 'closed' for the active check/filter action if strictly treating it as closed view.
                    // But let's support 'revenue' as a visual alias for 'closed' or just a highlight.

                    // Hack: If id is revenue, highlight if filter is closed? Or add 'revenue' to MetricFilter?
                    // For now, let's treat clicking 'Total Revenue' as selecting 'closed' leads.

                    const cardId = card.id === 'revenue' ? 'closed' : card.id;
                    const isActive = activeFilter === cardId;
                    const Icon = card.icon;

                    return (
                        <Card
                            key={card.id}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-md border",
                                isActive ? `ring-2 ring-primary ${card.borderColor}` : "hover:border-primary/50",
                                card.bgColor
                            )}
                            onClick={() => onFilterChange(isActive ? 'all' : (cardId as MetricFilter))}
                        >
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                                    <p className={cn("font-bold mt-1", card.id === 'revenue' ? "text-xl sm:text-2xl" : "text-2xl")}>
                                        {card.count}
                                    </p>
                                </div>
                                <Icon className={cn("h-8 w-8 opacity-80", card.color)} />
                            </CardContent>
                        </Card>
                    );
                })}

            </div>
        </div>
    );
}
