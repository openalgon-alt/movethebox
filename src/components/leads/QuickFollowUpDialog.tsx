
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Lead, LEAD_STATUSES } from '@/types/lead';
import { useUpdateLead } from '@/hooks/useLeads';
import { calculateNextFollowUpDate } from '@/lib/settings';
import { toast } from 'sonner';

const quickFollowUpSchema = z.object({
    status: z.enum(['New', 'Contacted', 'Follow-up', 'Closed', 'Lost']),
    next_follow_up_date: z.string().optional().or(z.literal('')),
    new_note: z.string().optional().or(z.literal('')),
});

type QuickFollowUpFormData = z.infer<typeof quickFollowUpSchema>;

interface QuickFollowUpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead?: Lead | null;
}

import { useUser } from '@/components/auth/UserContext';

export function QuickFollowUpDialog({ open, onOpenChange, lead }: QuickFollowUpDialogProps) {
    const updateLead = useUpdateLead();
    const { user } = useUser();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<QuickFollowUpFormData>({
        resolver: zodResolver(quickFollowUpSchema),
        defaultValues: {
            status: 'Follow-up',
            next_follow_up_date: '',
            new_note: '',
        },
    });

    useEffect(() => {
        if (open && lead) {
            // Default Date logic:
            // If already Closed/Lost, default date is empty.
            // If active, default to existing date OR calculated next date.
            const isClosedOrLost = lead.status === 'Closed' || lead.status === 'Lost';
            reset({
                status: isClosedOrLost ? 'Follow-up' : lead.status, // Reset status to default actionable state if needed
                next_follow_up_date: lead.next_follow_up_date || calculateNextFollowUpDate(),
                new_note: '',
            });
        }
    }, [open, lead, reset]);

    const status = watch('status');

    const onSubmit = async (data: QuickFollowUpFormData) => {
        if (!lead) return;

        // Validation Rules
        if (!data.new_note?.trim()) {
            toast.error("You must add a note describing the interaction.");
            return;
        }

        const isClosedOrLost = data.status === 'Closed' || data.status === 'Lost';

        if (!isClosedOrLost && !data.next_follow_up_date) {
            toast.error("Next follow-up date is required for active leads.");
            return;
        }

        if (data.status === 'Closed' && !data.new_note.trim()) {
            toast.error("Closing a lead requires a note.");
            return;
        }

        if (data.status === 'Lost' && !data.new_note.trim()) {
            toast.error("Marking a lead as Lost requires a reason in notes.");
            return;
        }

        try {
            let updatedNotes = lead.notes || '';
            if (data.new_note) {
                const timestamp = new Date().toLocaleString();
                const noteEntry = `\n[${timestamp}] ${data.new_note}`;
                updatedNotes = updatedNotes ? updatedNotes + noteEntry : noteEntry.trim();
            }

            await updateLead.mutateAsync({
                id: lead.id,
                status: data.status,
                next_follow_up_date: data.next_follow_up_date || '',
                notes: updatedNotes,
                // Preserve other fields
                name: lead.name,
                phone: lead.phone || '',
                email: lead.email || '',
                source: lead.source || '',
                assigned_to: lead.assigned_to || '',
            });

            onOpenChange(false);
            reset();
        } catch (error) {
            console.error("Failed to update follow-up", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Quick Follow-up</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Current Status</Label>
                        <Select
                            value={watch('status')}
                            onValueChange={(value) => setValue('status', value as any)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {LEAD_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="next_date">
                            Next Follow-up Date
                            {(status !== 'Closed' && status !== 'Lost') && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Input
                            id="next_date"
                            type="date"
                            {...register('next_follow_up_date')}
                        />
                    </div>

                    {lead?.notes && (
                        <div className="space-y-2">
                            <Label>Previous Notes</Label>
                            <div className="bg-muted p-3 rounded-md text-sm max-h-[100px] overflow-y-auto whitespace-pre-wrap">
                                {lead.notes}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 bg-muted/30 p-3 rounded-md border border-dashed border-primary/50">
                        <Label htmlFor="new_note" className="text-primary font-medium">
                            Interaction Note <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="new_note"
                            placeholder="Describe the interaction (Required)"
                            rows={3}
                            {...register('new_note')}
                            className="bg-background"
                        />
                        <p className="text-xs text-muted-foreground">
                            This will be appended to existing notes.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Follow-up'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
