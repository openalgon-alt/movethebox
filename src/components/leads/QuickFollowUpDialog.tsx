
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
    assigned_to: z.string().optional(),
    product_ids: z.array(z.string()).optional(),
    expected_value: z.string().optional(),
    product_incentives: z.record(z.string()).optional(),
    product_prices: z.record(z.string()).optional(),
});

type QuickFollowUpFormData = z.infer<typeof quickFollowUpSchema>;

interface QuickFollowUpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead?: Lead | null;
}

import { useUser } from '@/components/auth/UserContext';
import { useProducts } from '@/hooks/useProducts';
import { useAddOns } from '@/components/settings/AddOnContext';

export function QuickFollowUpDialog({ open, onOpenChange, lead }: QuickFollowUpDialogProps) {
    const updateLead = useUpdateLead();
    const { user, members } = useUser();
    const { activeProducts } = useProducts();
    const { isProductsEnabled, isIncentivesEnabled } = useAddOns();

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
            assigned_to: '',
            product_ids: [],
            expected_value: '',
            product_incentives: {},
            product_prices: {},
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
                assigned_to: lead.assigned_to || '',
                product_ids: lead.metadata?.product_ids || (lead.metadata?.product_id ? [lead.metadata.product_id] : []),
                expected_value: lead.metadata?.expected_value ? String(lead.metadata.expected_value) : '',
                product_incentives: lead.metadata?.product_incentives || {},
                product_prices: lead.metadata?.product_prices || {},
            });
        }
    }, [open, lead, reset]);

    const status = watch('status');

    const onSubmit = async (data: QuickFollowUpFormData) => {
        if (!lead) return;

        // Validation Rules
        if (user?.role !== 'admin') {
            const hasProducts = data.product_ids && data.product_ids.length > 0;
            if (!data.new_note?.trim() && !hasProducts) {
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
                assigned_to: data.assigned_to || lead.assigned_to || '',
                metadata: {
                    ...(lead.metadata || {}),
                    product_ids: data.product_ids || [],
                    expected_value: data.expected_value ? parseFloat(data.expected_value) : 0,
                    product_incentives: data.product_incentives || {},
                    product_prices: data.product_prices || {}
                } as any,
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
                    <DialogTitle>Quick Action</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="flex justify-end gap-3 pb-2 border-b mb-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>

                    {user?.role === 'admin' && (
                        <div className="space-y-2">
                            <Label>Assignee</Label>
                            <Select
                                value={watch('assigned_to')}
                                onValueChange={(value) => setValue('assigned_to', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.name}>
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

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

                    {isProductsEnabled && (
                        <div className="space-y-3 bg-muted/20 p-3 rounded-md border">
                            <Label>Products</Label>
                            <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-background">
                                {activeProducts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No active products found.</p>
                                ) : (
                                    activeProducts.map((p) => {
                                        const currentIds = watch('product_ids') || [];
                                        const isSelected = currentIds.includes(p.id);

                                        return (
                                            <div key={p.id}>
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`qf-prod-${p.id}`}
                                                        className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            let newIds = checked
                                                                ? [...currentIds, p.id]
                                                                : currentIds.filter(id => id !== p.id);

                                                            setValue('product_ids', newIds);

                                                            // Set default price if checked
                                                            if (checked) {
                                                                setValue(`product_prices.${p.id}`, String(p.price));
                                                            }

                                                            // Auto-calc value
                                                            const currentPrices = watch('product_prices') || {};
                                                            // We must use "getValues" or "watch" correctly to get latest, but dealing with async state in rhf can be tricky in loop.
                                                            // Easier to just re-read prices from form state after a tick or assume default.
                                                            // Correction: Since we just set the default price, we can calculate.

                                                            // However, let's defer calculation to an effect or just simple summation of selected products * their current form price.
                                                            // Since we cant easily trigger a re-render of this specific calc block without watching everything, 
                                                            // let's grab latest prices:
                                                            const prices = { ...currentPrices };
                                                            if (checked) prices[p.id] = String(p.price); // update local ref

                                                            const total = activeProducts
                                                                .filter(prod => newIds.includes(prod.id))
                                                                .reduce((sum, prod) => {
                                                                    const price = parseFloat(prices[prod.id] || String(prod.price));
                                                                    return sum + (isNaN(price) ? 0 : price);
                                                                }, 0);

                                                            setValue('expected_value', String(total));
                                                        }}
                                                    />
                                                    <Label htmlFor={`qf-prod-${p.id}`} className="text-sm font-normal">
                                                        {p.name}
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            (Catalog: ${p.price.toLocaleString()})
                                                        </span>
                                                    </Label>
                                                </div>
                                                {isSelected && (
                                                    <div className="ml-6 mt-1 mb-2 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground w-20">Sold Price:</span>
                                                            <Input
                                                                className="h-7 text-xs w-32"
                                                                type="number"
                                                                step="0.01"
                                                                defaultValue={p.price}
                                                                {...register(`product_prices.${p.id}`, {
                                                                    onChange: () => {
                                                                        // Recalculate total on price change
                                                                        const ids = watch('product_ids') || [];
                                                                        // Short timeout to let RHF update internal state (optional, but sometimes needed if using watch immediately)
                                                                        setTimeout(() => {
                                                                            const prices = watch('product_prices') || {};
                                                                            const total = activeProducts
                                                                                .filter(prod => ids.includes(prod.id))
                                                                                .reduce((sum, prod) => {
                                                                                    const price = parseFloat(prices[prod.id] || String(prod.price));
                                                                                    return sum + (isNaN(price) ? 0 : price);
                                                                                }, 0);
                                                                            setValue('expected_value', String(total));
                                                                        }, 0);
                                                                    }
                                                                })}
                                                            />
                                                        </div>
                                                        {p.is_incentive_customizable && isIncentivesEnabled && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground w-20">Incentive:</span>
                                                                <Input
                                                                    placeholder="Fixed Value ($)"
                                                                    className="h-7 text-xs w-32"
                                                                    type="number"
                                                                    step="0.01"
                                                                    {...register(`product_incentives.${p.id}`)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 bg-muted/30 p-3 rounded-md border border-dashed border-primary/50">
                        <Label htmlFor="new_note" className="text-primary font-medium">
                            Interaction Note {user?.role !== 'admin' && <span className="text-destructive">*</span>}
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



                </form >
            </DialogContent >
        </Dialog >
    );
}
