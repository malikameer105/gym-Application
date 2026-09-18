import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from './db.js';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'gym-mgmt-super-secret-key-32-chars-minimum';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'gym-mgmt-super-secret-key-32-chars-minimum') {
  console.warn('⚠️ [SECURITY WARNING]: Running in production with default AUTH_SECRET. Please set a secure AUTH_SECRET in your environment variables.');
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: Role;
    phone?: string | null;
    status: string;
  };
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = req.cookies?.gym_session || (authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null);

  if (!token) {
    res.status(401).json({ error: 'Your session has expired. Please login again.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    res.status(401).json({ error: 'Invalid or expired session. Please login again.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        status: true
      }
    });

    if (!user) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }

    if (user.status !== 'Active') {
      res.status(403).json({ error: 'Your account has been deactivated. Please contact an administrator.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'You are not authorized to perform this action.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'You do not have permission to access this section.' });
      return;
    }

    next();
  };
}

export async function logAudit(
  user: { id?: string; name: string } | null,
  action: string,
  module: string,
  recordId?: string | null,
  description?: string,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.name || 'System',
        action,
        module,
        recordId: recordId || null,
        description: description || `${action} on ${module}`,
        ipAddress: ipAddress || null
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function createNotification(title: string, message: string, type: string) {
  try {
    await prisma.notification.create({
      data: {
        title,
        message,
        type,
        read: false
      }
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
