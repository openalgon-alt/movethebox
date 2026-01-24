import { useEffect } from 'react';
import { Lead } from '@/types/lead';
import { getOverdueLeads } from '@/lib/leads';
import { toast } from 'sonner';
import { getFollowUpSettings } from '@/lib/settings';

export function useDailyFollowUp(leads: Lead[]) {
  useEffect(() => {
    if (!leads.length) return;

    const checkDailyFollowups = () => {
      const today = new Date().toDateString();
      const lastChecked = localStorage.getItem('last_followup_check');

      if (lastChecked === today) {
        return; // Already checked today
      }

      if (!getFollowUpSettings().enableDailyReminder) {
        return;
      }

      const overdueLeads = getOverdueLeads(leads);

      if (overdueLeads.length > 0) {
        toast.message('Daily Follow-up Reminder', {
          description: `You have ${overdueLeads.length} leads pending follow-up today.`,
          action: {
            label: 'View',
            onClick: () => {
              // This relies on the parent component handling the view switch
              // For now, we just inform the user
              document.dispatchEvent(new CustomEvent('switch-view-followups'));
            }
          },
          duration: 10000,
        });
      }

      localStorage.setItem('last_followup_check', today);
    };

    checkDailyFollowups();
  }, [leads]);
}
