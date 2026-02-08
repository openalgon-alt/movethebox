import { useNavigate } from 'react-router-dom';
import { useLeads } from '@/hooks/useLeads';
import { useAddOns } from '@/components/settings/AddOnContext';
import { useUser } from '@/components/auth/UserContext';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, TrendingUp, Trophy } from 'lucide-react';

const COMMISSION_RATE = 0.10; // 10% commission on Expected Value

export default function IncentivesDashboard() {
    const { isIncentivesEnabled } = useAddOns();
    const { data: leads = [], isLoading } = useLeads();
    const { products } = useProducts();
    const { user } = useUser();
    const navigate = useNavigate();

    if (!isIncentivesEnabled) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h1 className="text-2xl font-bold">Incentives Module Not Enabled</h1>
                <Button onClick={() => navigate('/')}>Return to Inbox</Button>
            </div>
        );
    }

    // Filter closed leads
    const closedLeads = leads.filter(l => l.status === 'Closed');

    // Group by salesperson
    const statsByPerson = closedLeads.reduce((acc, lead) => {
        const person = lead.assigned_to || 'Unassigned';
        if (!acc[person]) {
            acc[person] = {
                name: person,
                closedCount: 0,
                totalExpectedValue: 0,
                incentiveAmount: 0
            };
        }

        acc[person].closedCount += 1;

        // Parse expected value from metadata
        let value = 0;
        if (lead.metadata && typeof lead.metadata === 'object') {
            // Handle both string and number cases safely
            const val = (lead.metadata as any).expected_value;
            value = val ? parseFloat(String(val)) : 0;
        }

        if (isNaN(value)) value = 0;

        // Calculate incentive
        // Calculate incentive
        let incentive = 0;
        const productId = (lead.metadata as any)?.product_id;
        const productIds = (lead.metadata as any)?.product_ids as string[] | undefined;

        // Handle multi-product logic
        if (productIds && Array.isArray(productIds) && productIds.length > 0) {
            productIds.forEach(pid => {
                const product = products.find(p => p.id === pid);
                if (product) {
                    // If multiple products, we assume value is sum of prices.
                    // Incentive is (Price * Rate). If value was overridden, this calculation
                    // ignores the override and bases commission on standard price * rate.
                    // This is safer for preventing commission manipulation via value overrides.
                    const rate = product.incentive_percentage || 0;
                    if (rate > 0) {
                        incentive += product.price * (rate / 100);
                    }
                }
            });
        }
        // Fallback for legacy single product
        else if (productId) {
            const product = products.find(p => p.id === productId);
            if (product && product.incentive_percentage) {
                incentive = value * (product.incentive_percentage / 100);
            }
        }

        acc[person].totalExpectedValue += value;
        acc[person].incentiveAmount += incentive;

        return acc;
    }, {} as Record<string, { name: string, closedCount: number, totalExpectedValue: number, incentiveAmount: number }>);

    // Filter for view (Admin sees all, User sees own)
    const displayStats = user?.role === 'admin'
        ? Object.values(statsByPerson)
        : Object.values(statsByPerson).filter(s => s.name === user?.name);

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Incentives & Commissions</h1>
                        <p className="text-muted-foreground">
                            Track performance-based earnings based on product-specific rates.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Closed Deals</CardTitle>
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {displayStats.reduce((sum, s) => sum + s.closedCount, 0)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Value Generated</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${displayStats.reduce((sum, s) => sum + s.totalExpectedValue, 0).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Incentives</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                ${displayStats.reduce((sum, s) => sum + s.incentiveAmount, 0).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Breakdown</CardTitle>
                        <CardDescription>Incentives calculated based on closed deals and expected value.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Salesperson</TableHead>
                                    <TableHead className="text-right">Closed Deals</TableHead>
                                    <TableHead className="text-right">Total Value</TableHead>
                                    <TableHead className="text-right">Estimated Incentive</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayStats.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">No closed deals found.</TableCell>
                                    </TableRow>
                                ) : (
                                    displayStats.map((stat) => (
                                        <TableRow key={stat.name}>
                                            <TableCell className="font-medium">{stat.name}</TableCell>
                                            <TableCell className="text-right">{stat.closedCount}</TableCell>
                                            <TableCell className="text-right">${stat.totalExpectedValue.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                ${stat.incentiveAmount.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
