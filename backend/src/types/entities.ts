
/**
 * Backend Entity Definitions
 * These types reflect the database schema and are used by the Service Layer.
 */

export type UUID = string;

export enum UserRole {
    ADMIN = 'admin',
    SALESPERSON = 'salesperson'
}

export enum LeadStatus {
    NEW = 'New',
    CONTACTED = 'Contacted',
    FOLLOW_UP = 'Follow-up',
    CLOSED = 'Closed',
    LOST = 'Lost'
}

export enum ActivityType {
    NOTE = 'NOTE',
    STATUS_CHANGE = 'STATUS_CHANGE',
    CALL = 'CALL',
    EMAIL = 'EMAIL'
}

export interface Tenant {
    id: UUID;
    name: string;
    plan_tier: string;
    created_at: Date;
    updated_at: Date;
}

export interface User {
    id: UUID;
    tenant_id: UUID;
    email: string;
    password_hash?: string; // Exclude from API responses
    name: string;
    role: UserRole;
    created_at: Date;
    updated_at: Date;
}

export interface Product {
    id: UUID;
    tenant_id: UUID;
    name: string;
    base_price: number;
    incentive_pct: number;
    is_customizable: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface Lead {
    id: UUID;
    tenant_id: UUID;
    assigned_to: UUID | null;
    status: LeadStatus;
    source: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    next_follow_up_date: string | null; // YYYY-MM-DD
    last_contacted_at: Date | null;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

/**
 * Normalized Line Item for accurate reporting
 */
export interface LeadLineItem {
    id: UUID;
    tenant_id: UUID;
    lead_id: UUID;
    product_id: UUID | null;
    sold_price: number;
    commission_amt: number;
    commission_pct: number;
    is_override: boolean;
    created_at: Date;
}

export interface LeadActivity {
    id: UUID;
    tenant_id: UUID;
    lead_id: UUID;
    user_id: UUID | null;
    type: ActivityType;
    content: string | null;
    created_at: Date;
}

export interface TenantSettings {
    tenant_id: UUID;
    follow_up_config: {
        defaultInterval: number;
        excludeWeekends: boolean;
        enableDailyReminder: boolean;
    };
    modules_config: {
        incentives: boolean;
        products: boolean;
    };
    updated_at: Date;
}
