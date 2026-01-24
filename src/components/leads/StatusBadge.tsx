import { LeadStatus } from '@/types/lead';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: LeadStatus;
}

const statusStyles: Record<LeadStatus, string> = {
  'New': 'status-new',
  'Contacted': 'status-contacted',
  'Follow-up': 'status-follow-up',
  'Closed': 'status-closed',
  'Lost': 'status-lost',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn('status-badge', statusStyles[status])}>
      {status}
    </span>
  );
}
