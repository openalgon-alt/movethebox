import pool from '../config/db';
import { Lead, LeadLineItem, LeadStatus, UUID } from '../types/entities';
import { ProductService } from './product.service';

const productService = new ProductService();

export class LeadService {
    // Core: Create/Update Lead and Synchronize Line Items (Incentives)
    async upsertLead(tenantId: UUID, data: Partial<Lead>, userRole: string): Promise<Lead> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Upsert Lead Table
            let leadId = data.id;
            let leadResult;

            if (leadId) {
                // Update
                leadResult = await client.query(
                    `UPDATE leads 
                     SET status = COALESCE($1, status),
                         assigned_to = COALESCE($2, assigned_to),
                         next_follow_up_date = COALESCE($3, next_follow_up_date),
                         metadata = COALESCE($4, metadata),
                         updated_at = NOW()
                     WHERE id = $5 AND tenant_id = $6
                     RETURNING *`,
                    [data.status, data.assigned_to, data.next_follow_up_date, data.metadata, leadId, tenantId]
                );
            } else {
                // Create
                leadResult = await client.query(
                    `INSERT INTO leads (tenant_id, assigned_to, status, contact_name, metadata)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING *`,
                    [tenantId, data.assigned_to, data.status || 'New', data.contact_name, data.metadata || {}]
                );
                leadId = leadResult.rows[0].id;
            }

            const lead = leadResult.rows[0];
            if (!lead) throw new Error('Lead not found or access denied');

            // 2. Handle Incentive / Line Items Normalization
            // If metadata contains product info, re-calculate line items
            if (data.metadata && (data.metadata.product_ids || data.metadata.product_id)) {
                await this.syncLineItems(client, tenantId, lead, data.metadata);
            }

            await client.query('COMMIT');
            return lead;

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    // INTERNAL: Sync JSON metadata -> Relational Line Items
    private async syncLineItems(client: any, tenantId: UUID, lead: Lead, metadata: any) {
        // Clear existing items
        await client.query(`DELETE FROM lead_line_items WHERE lead_id = $1`, [lead.id]);

        const productIds: string[] = metadata.product_ids || (metadata.product_id ? [metadata.product_id] : []);
        if (productIds.length === 0) return;

        // Fetch Products Definitions
        const products = await productService.getProductsByIds(tenantId, productIds);

        const prices = metadata.product_prices || {};
        const incentives = metadata.product_incentives || {};

        for (const product of products) {
            // Determine Price (Sold Price vs Base Price)
            const soldPrice = prices[product.id] ? parseFloat(prices[product.id]) : Number(product.base_price);

            // Determine Commission
            let commissionAmt = 0;
            let commissionPct = Number(product.incentive_pct);
            let isOverride = false;

            if (product.is_customizable && incentives[product.id]) {
                // Custom Amount Override
                commissionAmt = parseFloat(incentives[product.id]);
                commissionPct = 0; // Fixed amount used
                isOverride = true;
            } else {
                // Standard % Calculation
                commissionAmt = (soldPrice * commissionPct) / 100;
            }

            await client.query(
                `INSERT INTO lead_line_items 
                 (tenant_id, lead_id, product_id, sold_price, commission_amt, commission_pct, is_override)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [tenantId, lead.id, product.id, soldPrice, commissionAmt, commissionPct, isOverride]
            );
        }
    }

    async getLeads(tenantId: UUID, filters: any): Promise<Lead[]> {
        // Simple query for now
        const result = await pool.query(
            `SELECT * FROM leads WHERE tenant_id = $1 ORDER BY updated_at DESC`,
            [tenantId]
        );
        return result.rows;
    }

    async getLeadStats(tenantId: UUID): Promise<any> {
        // Example: Aggregation via Line Items
        const result = await pool.query(
            `SELECT 
                l.assigned_to,
                COUNT(l.id) as total_leads,
                SUM(li.commission_amt) as total_incentives
             FROM leads l
             LEFT JOIN lead_line_items li ON l.id = li.lead_id
             WHERE l.tenant_id = $1 AND l.status = 'Closed'
             GROUP BY l.assigned_to`,
            [tenantId]
        );
        return result.rows;
    }
}
