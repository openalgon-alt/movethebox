
import { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    isPast,
    isFuture
} from "date-fns";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TeamCalendar() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const salespersonFilter = searchParams.get('salesperson');
    const { data: leads = [], isLoading } = useLeads();
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Helper to get leads for a specific date
    const getLeadsForDay = (date: Date) => {
        return leads.filter(lead => {
            if (!lead.next_follow_up_date) return false;

            // Filter by salesperson if param exists
            if (salespersonFilter && lead.assigned_to?.toLowerCase() !== salespersonFilter.toLowerCase()) {
                return false;
            }

            return isSameDay(new Date(lead.next_follow_up_date), date) && lead.status !== 'Closed' && lead.status !== 'Lost';
        });
    };

    const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    if (isLoading) return <div className="p-8 text-center">Loading calendar...</div>;

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/performance')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {salespersonFilter ? `${salespersonFilter}'s Calendar` : 'Team Calendar'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={previousMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[150px] text-center font-medium">
                            {format(currentDate, 'MMMM yyyy')}
                        </span>
                        <Button variant="outline" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b bg-muted/40">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="p-4 text-center text-sm font-medium text-muted-foreground">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Cells */}
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {/* Empty cells for start of month offset if needed - for simplicity using simplified logic first, 
                            but keeping it simple: just list days of month. 
                            Ideally we pad with empty divs based on start day of week 
                        */}
                        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-[120px] border-b border-r bg-muted/5" />
                        ))}

                        {daysInMonth.map(day => {
                            const dayLeads = getLeadsForDay(day);
                            const isDaysPast = isPast(day) && !isToday(day);
                            const isDayFuture = isFuture(day);

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={cn(
                                        "min-h-[120px] p-2 border-b border-r relative transition-colors hover:bg-muted/5",
                                        isToday(day) && "bg-primary/5"
                                    )}
                                >
                                    <span className={cn(
                                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                        isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                    )}>
                                        {format(day, 'd')}
                                    </span>

                                    <div className="mt-2 space-y-1">
                                        {dayLeads.slice(0, 3).map(lead => (
                                            <TooltipProvider key={lead.id}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={cn(
                                                                "text-xs px-1.5 py-0.5 roundedtruncate cursor-pointer border truncate",
                                                                isDaysPast ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300" :
                                                                    isToday(day) ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300" :
                                                                        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                                                            )}
                                                            onClick={() => navigate(`/performance/${encodeURIComponent(lead.assigned_to || '')}`)}
                                                        >
                                                            {lead.name}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="font-semibold">{lead.name}</p>
                                                        <p className="text-xs">
                                                            Assigned: {lead.assigned_to || 'Unassigned'}<br />
                                                            Status: {lead.status}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                        {dayLeads.length > 3 && (
                                            <div className="text-xs text-muted-foreground pl-1">
                                                +{dayLeads.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Empty cells for end of month */}
                        {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
                            <div key={`empty-end-${i}`} className="min-h-[120px] border-b border-r bg-muted/5" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
