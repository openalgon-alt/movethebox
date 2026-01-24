export type LeadStatus = "New" | "Contacted" | "Follow-up" | "Closed" | "Lost";

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  next_follow_up_date: string | null;
  last_follow_up_at: string | null;
  notes: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Connector {
  id: string;
  platform_name: string;
  auth_details: Record<string, any>;
  last_fetched_at: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface LeadFormData {
  name: string;
  phone: string;
  email: string;
  source: string;
  status: LeadStatus;
  assigned_to: string;
  next_follow_up_date: string;
  notes: string;
  metadata?: string; // JSON string for form input
}

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Follow-up",
  "Closed",
  "Lost",
];
