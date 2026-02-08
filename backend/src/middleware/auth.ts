import { Request, Response, NextFunction } from 'express';
import { UUID } from '../types/entities';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            tenantId?: UUID;
            userRole?: string;
        }
    }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // In a real app, this would verify a JWT.
    // For this architecture demo, we trust the Gateway/Header for Tenant Context.

    const tenantId = req.headers['x-tenant-id'] as string;
    const userRole = req.headers['x-user-role'] as string || 'salesperson';

    if (!tenantId) {
        return res.status(401).json({ error: 'Missing X-Tenant-ID header' });
    }

    req.tenantId = tenantId;
    req.userRole = userRole;
    next();
};
