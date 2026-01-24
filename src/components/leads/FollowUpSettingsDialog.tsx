
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

import { FollowUpSettings, getFollowUpSettings, saveFollowUpSettings, DEFAULT_SETTINGS } from '@/lib/settings';

interface FollowUpSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FollowUpSettingsDialog({ open, onOpenChange }: FollowUpSettingsDialogProps) {
    const [settings, setSettings] = useState<FollowUpSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        if (open) {
            setSettings(getFollowUpSettings());
        }
    }, [open]);

    const handleSave = () => {
        saveFollowUpSettings(settings);
        toast.success('Follow-up settings saved');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Follow-up Settings</DialogTitle>
                    <DialogDescription>
                        Configure how you want to manage lead follow-ups.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="interval" className="text-right">
                            Default Interval
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="interval"
                                type="number"
                                min="1"
                                value={settings.defaultInterval}
                                onChange={(e) => setSettings({ ...settings, defaultInterval: parseInt(e.target.value) || 1 })}
                                className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">days</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="reminder" className="flex flex-col space-y-1">
                            <span>Daily Reminders</span>
                            <span className="font-normal text-xs text-muted-foreground">Show a notification for overdue leads</span>
                        </Label>
                        <Switch
                            id="reminder"
                            checked={settings.enableDailyReminder}
                            onCheckedChange={(checked) => setSettings({ ...settings, enableDailyReminder: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="weekends" className="flex flex-col space-y-1">
                            <span>Exclude Weekends</span>
                            <span className="font-normal text-xs text-muted-foreground">Don't schedule follow-ups on weekends</span>
                        </Label>
                        <Switch
                            id="weekends"
                            checked={settings.excludeWeekends}
                            onCheckedChange={(checked) => setSettings({ ...settings, excludeWeekends: checked })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
