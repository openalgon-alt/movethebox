import pool from '../config/db';
import { Product, UUID } from '../types/entities';

export class ProductService {
    async getProductsByTenant(tenantId: UUID): Promise<Product[]> {
        const result = await pool.query(
            `SELECT * FROM products WHERE tenant_id = $1 AND is_active = true ORDER BY name ASC`,
            [tenantId]
        );
        return result.rows;
    }

    async getProductById(tenantId: UUID, productId: UUID): Promise<Product | null> {
        const result = await pool.query(
            `SELECT * FROM products WHERE id = $1 AND tenant_id = $2`,
            [productId, tenantId]
        );
        return result.rows[0] || null;
    }

    async getProductsByIds(tenantId: UUID, productIds: UUID[]): Promise<Product[]> {
        if (productIds.length === 0) return [];

        const result = await pool.query(
            `SELECT * FROM products WHERE id = ANY($1) AND tenant_id = $2`,
            [productIds, tenantId]
        );
        return result.rows;
    }

    async createProduct(tenantId: UUID, data: Partial<Product>): Promise<Product> {
        const result = await pool.query(
            `INSERT INTO products (tenant_id, name, base_price, incentive_pct, is_customizable)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [tenantId, data.name, data.base_price, data.incentive_pct, data.is_customizable]
        );
        return result.rows[0];
    }
}
