import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadFormData, LeadStatus } from '@/types/lead';
import { toast } from 'sonner';
import { validateLeadFollowUp } from '@/lib/leads';

export function useLeads() {
  const queryClient = useQueryClient();

  // Set up Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('Realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['leads'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(lead => ({
        ...lead,
        status: lead.status as LeadStatus,
        last_follow_up_at: (lead as any).last_follow_up_at || null, // Handle potential undefined from DB
        metadata: (lead as any).metadata || null
      }));
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: LeadFormData) => {
      if (!validateLeadFollowUp(lead.status, lead.next_follow_up_date)) {
        throw new Error('Follow-up date is required for this status');
      }

      const { data, error } = await supabase
        .from('leads')
        .insert({
          name: lead.name,
          phone: lead.phone || null,
          email: lead.email || null,
          source: lead.source || null,
          status: lead.status,
          assigned_to: lead.assigned_to || null,
          next_follow_up_date: lead.next_follow_up_date || null,
          notes: lead.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create lead: ' + error.message);
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...lead }: LeadFormData & { id: string }) => {
      if (!validateLeadFollowUp(lead.status, lead.next_follow_up_date)) {
        throw new Error('Follow-up date is required for this status');
      }

      const { data, error } = await supabase
        .from('leads')
        .update({
          name: lead.name,
          phone: lead.phone || null,
          email: lead.email || null,
          source: lead.source || null,
          status: lead.status,
          assigned_to: lead.assigned_to || null,
          next_follow_up_date: lead.next_follow_up_date || null,
          metadata: {
            ...((lead as any).metadata || {}),
            last_follow_up_at: new Date().toISOString()
          },
          notes: lead.notes || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update lead: ' + error.message);
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete lead: ' + error.message);
    },
  });
}

export function useBulkCreateLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leads: Partial<LeadFormData>[]) => {
      // Validate all leads first
      for (const lead of leads) {
        if (lead.status && !validateLeadFollowUp(lead.status as LeadStatus, lead.next_follow_up_date)) {
          throw new Error(`Lead "${lead.name}" requires a follow-up date for status "${lead.status}"`);
        }
      }

      const leadsToInsert = leads.map(lead => ({
        name: lead.name!,
        phone: lead.phone || null,
        email: lead.email || null,
        source: lead.source || null,
        status: lead.status || 'New',
        assigned_to: lead.assigned_to || null,
        next_follow_up_date: lead.next_follow_up_date || null,
        notes: lead.notes || null,
      }));

      const { data, error } = await supabase
        .from('leads')
        .insert(leadsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`${data.length} leads imported successfully`);
    },
    onError: (error) => {
      toast.error('Failed to import leads: ' + error.message);
    },
  });
}
