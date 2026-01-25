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

  return followUpDate < today;
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

export function getActiveLeads(leads: Lead[]): Lead[] {
  return leads.filter(l => l.status !== 'Closed' && l.status !== 'Lost');
}

export function getDueTodayLeads(leads: Lead[]): Lead[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return leads.filter(l => {
    if (!isFollowUpRequired(l.status)) return false;
    if (!l.next_follow_up_date) return false;

    const d = new Date(l.next_follow_up_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
}

export function getClosedLeads(leads: Lead[]): Lead[] {
  return leads.filter(l => l.status === 'Closed');
}

export function getLostLeads(leads: Lead[]): Lead[] {
  return leads.filter(l => l.status === 'Lost');
}

export function isLeadStale(lead: Lead): boolean {
  if (lead.status === 'Closed' || lead.status === 'Lost') return false;
  if (!lead.updated_at) return false;

  const today = new Date();
  const updated = new Date(lead.updated_at);
  const diffTime = Math.abs(today.getTime() - updated.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 3;
}

export function getStaleLeads(leads: Lead[]): Lead[] {
  return leads
    .filter(isLeadStale)
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || '');
      const dateB = new Date(b.updated_at || '');
      return dateA.getTime() - dateB.getTime();
    });
}
