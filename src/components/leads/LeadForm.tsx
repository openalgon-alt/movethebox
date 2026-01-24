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

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(['New', 'Contacted', 'Follow-up', 'Closed', 'Lost']),
  assigned_to: z.string().max(100).optional().or(z.literal('')),
  next_follow_up_date: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.status !== 'Closed' && data.status !== 'Lost' && !data.next_follow_up_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Follow-up date is required for active leads",
      path: ["next_follow_up_date"],
    });
  }
});

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

export function LeadForm({ open, onOpenChange, lead }: LeadFormProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const isEditing = !!lead;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: lead?.name || '',
      phone: lead?.phone || '',
      email: lead?.email || '',
      source: lead?.source || '',
      status: lead?.status || 'New',
      assigned_to: lead?.assigned_to || '',
      next_follow_up_date: lead?.next_follow_up_date || '',
      notes: lead?.notes || '',
    },
  });

  const status = watch('status');

  const onSubmit = async (data: LeadFormData) => {
    try {
      if (isEditing && lead) {
        await updateLead.mutateAsync({ ...data, id: lead.id });
      } else {
        await createLead.mutateAsync(data);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditing ? 'Edit Lead' : 'Add New Lead'}
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
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Input
                id="assigned_to"
                placeholder="Assignee name"
                {...register('assigned_to')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as LeadFormData['status'])}
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
              <Label htmlFor="next_follow_up_date">Next Follow-up</Label>
              <Input
                id="next_follow_up_date"
                type="date"
                {...register('next_follow_up_date')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this lead..."
              rows={3}
              {...register('notes')}
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
