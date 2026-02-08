
import { useLeads } from "@/hooks/useLeads";
import { Lead } from "@/types/lead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, TrendingUp, Users, CheckCircle2, Phone, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import { DateRangeFilter } from "@/components/leads/DateRangeFilter";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useState } from "react";

interface SalespersonPerformance {
    name: string;
    totalLeads: number;
    contacted: number;
    closed: number;
    revenue: number; // Mocked for now or derived from potential value if added later
}

export default function PerformanceDashboard() {
    const { data: leads = [], isLoading } = useLeads();
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date()
    });

    // Filter leads by date (using updated_at for activity)
    const filteredLeads = (() => {
        if (!dateRange?.from) return leads;

        return leads.filter(lead => {
            const date = new Date(lead.updated_at);
            const start = startOfDay(dateRange.from!);
            const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
            return isWithinInterval(date, { start, end });
        });
    })();

    // Aggregate data by salesperson
    const performanceData = filteredLeads.reduce<Record<string, SalespersonPerformance>>((acc, lead) => {
        const name = lead.assigned_to || "Unassigned";

        if (!acc[name]) {
            acc[name] = { name, totalLeads: 0, contacted: 0, closed: 0, revenue: 0 };
        }

        acc[name].totalLeads += 1;

        if (lead.status !== 'New') {
            acc[name].contacted += 1;
        }

        if (lead.status === 'Closed') {
            acc[name].closed += 1;
            acc[name].closed += 1;

            // Calculate revenue from metadata
            let val = 0;
            if (lead.metadata && typeof lead.metadata === 'object') {
                const rawVal = (lead.metadata as any).expected_value;
                val = rawVal ? parseFloat(String(rawVal)) : 0;
            }
            if (isNaN(val)) val = 0;
            acc[name].revenue += val;
        }

        return acc;
    }, {});

    const sortedPerformance = Object.values(performanceData).sort((a, b) => b.closed - a.closed);

    if (isLoading) {
        return <div className="p-8 text-center">Loading performance data...</div>;
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Performance & Sales Dashboard</h1>
                            <p className="text-muted-foreground">Real-time insights into team performance.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
                        <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">Filter Date:</span>
                        <DateRangeFilter date={dateRange} setDate={setDateRange} className="w-auto bg-background" />
                        <Button variant="secondary" onClick={() => navigate('/performance/calendar')}>
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Calendar
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sortedPerformance.map((person) => (
                        <Card key={person.name} className="overflow-hidden bg-card hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/50">
                                <CardTitle className="text-sm font-medium">
                                    {person.name}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => navigate(`/performance/calendar?salesperson=${encodeURIComponent(person.name)}`)}
                                    title={`View ${person.name}'s Calendar`}
                                >
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Users className="h-3 w-3" /> Assigned
                                        </p>
                                        <p className="text-2xl font-bold">{person.totalLeads}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> Contacted
                                        </p>
                                        <p className="text-2xl font-bold">{person.contacted}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Closed
                                        </p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{person.closed}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" /> Conv. Rate
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {person.totalLeads > 0 ? Math.round((person.closed / person.totalLeads) * 100) : 0}%
                                        </p>
                                    </div>
                                    <div className="space-y-1 col-span-2 border-t pt-2 mt-2">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" /> Total Revenue
                                        </p>
                                        <p className="text-2xl font-bold text-primary">
                                            ${person.revenue.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress bar visual for conversion */}
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{ width: `${Math.min(100, Math.round((person.closed / Math.max(1, person.totalLeads)) * 100))}%` }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => navigate(`/performance/${encodeURIComponent(person.name)}`)}
                                >
                                    View Detailed Report
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
