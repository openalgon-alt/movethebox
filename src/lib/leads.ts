import { Lead, LeadStatus } from '@/types/lead';

export function isFollowUpRequired(status: LeadStatus): boolean {
  return status !== 'Closed' && status !== 'Lost';
}

export function validateLeadFollowUp(status: LeadStatus, nextFollowUpDate?: string | null): boolean {
  if (isFollowUpRequired(status)) {
    return !!nextFollowUpDate;
  }
  return true;
}

export function isLeadOverdue(lead: Lead): boolean {
  if (!lead.next_follow_up_date) return false;
  if (!isFollowUpRequired(lead.status)) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const followUpDate = new Date(lead.next_follow_up_date);
  followUpDate.setHours(0, 0, 0, 0);

  return followUpDate <= today;
}

export function getOverdueLeads(leads: Lead[]): Lead[] {
  return leads
    .filter(isLeadOverdue)
    .sort((a, b) => {
      const dateA = new Date(a.next_follow_up_date || '');
      const dateB = new Date(b.next_follow_up_date || '');
      return dateA.getTime() - dateB.getTime();
    });
}
