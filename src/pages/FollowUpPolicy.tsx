
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import { FollowUpSettings, getFollowUpSettings, saveFollowUpSettings, DEFAULT_SETTINGS } from '@/lib/settings';

export default function FollowUpPolicy() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<FollowUpSettings>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSettings(getFollowUpSettings());
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate a brief delay for "firmness"/processing feel
        setTimeout(() => {
            saveFollowUpSettings(settings);
            toast.success('Organization policy updated successfully');
            setIsSaving(false);
            navigate(-1); // Go back
        }, 600);
    };

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-4">
                    <Button variant="ghost" className="pl-0 -ml-4 mb-2" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">Follow-up Policy</h1>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1.5 px-3 py-1">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Applies to all users
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-lg">
                        These rules define how leads must be followed up across the organization.
                    </p>
                </div>

                <Separator />

                {/* Section 1: Default Behavior */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground/90">Default Behavior</h2>
                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex flex-col gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="interval" className="text-base font-medium">
                                    Default Follow-up Interval
                                </Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="interval"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={settings.defaultInterval}
                                        onChange={(e) => setSettings({ ...settings, defaultInterval: parseInt(e.target.value) || 1 })}
                                        className="w-24 text-center font-medium text-lg"
                                    />
                                    <span className="text-base text-muted-foreground font-medium">days</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    When a lead is updated without a follow-up date, the system will automatically suggest this interval.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Reminders & Enforcement */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground/90">Reminders & Enforcement</h2>
                    <div className="bg-card border rounded-lg p-6 divide-y">
                        <div className="flex items-center justify-between pb-4">
                            <div className="space-y-1">
                                <Label htmlFor="reminders" className="text-base font-medium">Daily Overdue Reminders</Label>
                                <p className="text-sm text-muted-foreground">
                                    Notify users daily about leads that are overdue for follow-up.
                                </p>
                            </div>
                            <Switch
                                id="reminders"
                                checked={settings.enableDailyReminder}
                                onCheckedChange={(checked) => setSettings({ ...settings, enableDailyReminder: checked })}
                            />
                        </div>
                    </div>
                </section>

                {/* Section 3: Scheduling Rules */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground/90">Scheduling Rules</h2>
                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="weekends" className="text-base font-medium">Exclude Weekends</Label>
                                <p className="text-sm text-muted-foreground">
                                    Follow-ups will be scheduled only on working days.
                                </p>
                            </div>
                            <Switch
                                id="weekends"
                                checked={settings.excludeWeekends}
                                onCheckedChange={(checked) => setSettings({ ...settings, excludeWeekends: checked })}
                            />
                        </div>
                    </div>
                </section>

                {/* Section 4: System Behavior */}
                <div className="bg-muted/50 border border-muted rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                        <Info className="h-5 w-5" />
                        <h3 className="font-semibold text-base">How this policy works</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-5">
                        <li>Leads require a next follow-up date unless marked Closed or Lost</li>
                        <li>Overdue leads automatically appear in Due Today and Overdue views</li>
                        <li>These rules are enforced consistently for all salespersons</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-4 italic">
                        This section is informational only and not editable.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="min-w-[140px]"
                    >
                        {isSaving ? 'Applying...' : 'Apply Policy'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
