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
import { Lead, LeadFormData, LEAD_STATUSES } from '@/types/lead';
import { useCreateLead, useUpdateLead } from '@/hooks/useLeads';
import { calculateNextFollowUpDate } from '@/lib/settings';
import { useUser } from '@/components/auth/UserContext';
import { toast } from 'sonner';
import { useAddOns } from '@/components/settings/AddOnContext';
import { useProducts } from '@/hooks/useProducts';

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(['New', 'Contacted', 'Follow-up', 'Closed', 'Lost']),
  assigned_to: z.string().max(100).optional().or(z.literal('')),
  next_follow_up_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  new_note: z.string().optional(),
  product_ids: z.array(z.string()).optional(),
  expected_value: z.string().optional(),
});

type ExtendedLeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

export function LeadForm({ open, onOpenChange, lead }: LeadFormProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const { user, members } = useUser();
  const { isPricingIncentivesEnabled } = useAddOns();
  const { activeProducts } = useProducts();
  const isEditing = !!lead;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExtendedLeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      source: '',
      status: 'New',
      assigned_to: '',
      next_follow_up_date: '',
      notes: '',
      new_note: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (lead) {
        reset({
          name: lead.name,
          phone: lead.phone || '',
          email: lead.email || '',
          source: lead.source || '',
          status: lead.status,
          assigned_to: lead.assigned_to || '',
          next_follow_up_date: lead.next_follow_up_date || '',
          notes: lead.notes || '',
          new_note: '',
          product_ids: lead.metadata?.product_ids || (lead.metadata?.product_id ? [lead.metadata.product_id] : []),
          expected_value: lead.metadata?.expected_value ? String(lead.metadata.expected_value) : '',
        });
      } else {
        reset({
          name: '',
          phone: '',
          email: '',
          source: '',
          status: 'New',
          assigned_to: user ? user.name : '',
          next_follow_up_date: calculateNextFollowUpDate(),
          notes: '',
          new_note: '',
          product_ids: [],
          expected_value: '',
        });
      }
    }
  }, [open, lead, reset, user]);

  const status = watch('status');

  const onSubmit = async (data: ExtendedLeadFormData) => {
    // Validation Rules
    // Validation Rules
    // ADMIN EXEMPTION: Admins can update without notes.
    if (isEditing && user?.role !== 'admin') {
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
    }

    try {
      let finalNotes = data.notes || '';
      if (data.new_note?.trim()) {
        const timestamp = new Date().toLocaleString();
        const noteEntry = `\n[${timestamp}] ${data.new_note}`;
        finalNotes = finalNotes ? finalNotes + noteEntry : noteEntry.trim();
      }

      const submissionData = {
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        source: data.source || '',
        status: data.status,
        assigned_to: data.assigned_to || '',
        next_follow_up_date: data.next_follow_up_date || '',
        notes: finalNotes,
        metadata: {
          ...(lead?.metadata || {}),
          product_ids: data.product_ids || [],
          expected_value: data.expected_value ? parseFloat(data.expected_value) : 0
        } as any
      };

      if (isEditing && lead) {
        await updateLead.mutateAsync({
          ...submissionData,
          id: lead.id
        });
      } else {
        await createLead.mutateAsync(submissionData);
      }
      reset();
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditing ? 'Update Lead' : 'Add New Lead'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter lead name"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="Phone number"
                {...register('phone')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="Lead source"
                {...register('source')}
              />
            </div>
            {user?.role === 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select
                  value={watch('assigned_to') || 'unassigned'}
                  onValueChange={(value) => setValue('assigned_to', value === 'unassigned' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members?.map((member) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          </div>

          {isPricingIncentivesEnabled && (
            <div className="bg-muted/20 p-4 rounded-lg border space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                Product & Value (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 col-span-2">
                  <Label>Products</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {activeProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No active products found.</p>
                    ) : (
                      activeProducts.map((p) => {
                        const currentIds = watch('product_ids') || [];
                        const isSelected = currentIds.includes(p.id);

                        return (
                          <div key={p.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`prod-${p.id}`}
                              className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                              checked={isSelected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                let newIds = checked
                                  ? [...currentIds, p.id]
                                  : currentIds.filter(id => id !== p.id);

                                setValue('product_ids', newIds);

                                // Auto-calc value
                                const total = activeProducts
                                  .filter(prod => newIds.includes(prod.id))
                                  .reduce((sum, prod) => sum + prod.price, 0);

                                setValue('expected_value', String(total));
                              }}
                            />
                            <label htmlFor={`prod-${p.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                              {p.name} <span className="text-muted-foreground ml-1">(${p.price})</span>
                              {p.incentive_percentage ? <span className="text-xs text-green-600 ml-1">({p.incentive_percentage}% Comm.)</span> : null}
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_value">Expected Value ($)</Label>
                  <Input
                    id="expected_value"
                    type="number"
                    placeholder="0.00"
                    {...register('expected_value')}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
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
              <Label htmlFor="next_follow_up_date">
                Next Follow-up
                {(status !== 'Closed' && status !== 'Lost') && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id="next_follow_up_date"
                type="date"
                {...register('next_follow_up_date')}
              />
            </div>
          </div>

          {/* New Note Field - CRITICAL for Phase 3 */}
          <div className="space-y-2 bg-muted/30 p-3 rounded-md border border-dashed border-primary/50">
            <Label htmlFor="new_note" className="text-primary font-medium">
              Interaction Note {isEditing && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="new_note"
              placeholder={isEditing ? "Describe the interaction (Required to save)" : "Initial notes..."}
              rows={3}
              {...register('new_note')}
              className="bg-background"
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                You must add a note to update the lead.
              </p>
            )}
          </div>

          {/* Legacy/History Notes (Read Only in Edit Mode?) - keeping editable for now but pushed down */}
          <div className="space-y-2 opacity-80">
            <Label htmlFor="notes">History / Previous Notes</Label>
            <Textarea
              id="notes"
              placeholder="Previous notes code..."
              rows={3}
              {...register('notes')}
              className="bg-muted"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Lead' : 'Add Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
