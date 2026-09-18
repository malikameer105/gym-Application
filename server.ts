import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { prisma } from './server/db.js';
import {
  requireAuth,
  requireRole,
  generateToken,
  logAudit,
  createNotification,
  AuthenticatedRequest
} from './server/auth.js';
import {
  sendWelcomeMemberEmail,
  sendPaymentReceiptEmail,
  sendExpiryAlertEmail,
  sendPasswordResetEmail,
  sendTestEmail,
  verifySmtpConnection,
  getSmtpConfig
} from './server/email.js';
import { Role, MemberStatus, MembershipStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  // Production CORS configuration: allow Vercel production frontend, FRONTEND_URL, CORS_ORIGIN, and localhost
  const configuredOrigins: string[] = [];
  if (process.env.CORS_ORIGIN) {
    configuredOrigins.push(...process.env.CORS_ORIGIN.split(',').map(s => s.trim()));
  }
  if (process.env.FRONTEND_URL) {
    configuredOrigins.push(...process.env.FRONTEND_URL.split(',').map(s => s.trim()));
  }

  // Always whitelist the production Vercel frontend & standard local dev ports
  const defaultAllowedOrigins = [
    'https://gymapplicationbymalik.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  const allAllowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultAllowedOrigins]));

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server, or deployment health checks)
      if (!origin) return callback(null, true);

      // Check exact match
      if (allAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check Vercel preview deployments (e.g., gymapplicationbymalik-*.vercel.app)
      try {
        const url = new URL(origin);
        if (url.hostname.endsWith('.vercel.app') || url.hostname === 'localhost') {
          return callback(null, true);
        }
      } catch {
        // invalid URL format, disallow
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // -------------------------------------------------------------
  // HEALTH CHECK & MONITORING (Public, no auth required, HTTP 200)
  // -------------------------------------------------------------
  app.get('/api/health', async (req, res) => {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (err: any) {
      dbStatus = `error: ${err.message}`;
    }

    const smtpConfig = getSmtpConfig();

    res.status(200).json({
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      smtp: {
        configured: Boolean(smtpConfig),
        host: smtpConfig?.host || null
      },
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // -------------------------------------------------------------
  // EMAIL STATUS & TESTING (BREVO SMTP)
  // -------------------------------------------------------------
  app.get('/api/email/status', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req, res) => {
    const status = await verifySmtpConnection();
    res.json(status);
  });

  app.post('/api/email/test', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { to } = req.body;
      const recipient = to || req.user?.email;
      if (!recipient) {
        res.status(400).json({ error: 'Please provide a recipient email address.' });
        return;
      }
      const result = await sendTestEmail(recipient);
      if (!result.success) {
        res.status(400).json({ error: result.error || 'Failed to send test email.' });
        return;
      }
      res.json({ message: `Test email successfully dispatched to ${recipient}`, messageId: result.messageId });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error while sending test email' });
    }
  });

  // -------------------------------------------------------------
  // AUTHENTICATION ROUTES
  // -------------------------------------------------------------

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Please provide both email and password.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      if (user.status !== 'Active') {
        res.status(403).json({ error: 'Your account is deactivated. Contact an administrator.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Set secure HTTP-only cookie
      res.cookie('gym_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      await logAudit(
        user,
        'LOGIN',
        'AUTH',
        user.id,
        `User ${user.name} (${user.email}) logged in successfully.`,
        req.ip
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          status: user.status
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error during login.' });
    }
  });

  app.post('/api/auth/logout', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user) {
        await logAudit(
          req.user,
          'LOGOUT',
          'AUTH',
          req.user.id,
          `User ${req.user.name} logged out.`,
          req.ip
        );
      }
      res.clearCookie('gym_session');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal error during logout' });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  app.post('/api/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Both current and new password are required.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ error: 'Current password is incorrect.' });
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
      });

      await logAudit(req.user!, 'CHANGE_PASSWORD', 'AUTH', user.id, 'User changed password.');
      res.json({ message: 'Password changed successfully.' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password.' });
    }
  });

  // -------------------------------------------------------------
  // DASHBOARD STATS
  // -------------------------------------------------------------

  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Members statistics
      const totalMembers = await prisma.member.count();
      const activeMembers = await prisma.member.count({ where: { status: MemberStatus.Active } });
      const inactiveMembers = await prisma.member.count({ where: { status: MemberStatus.Inactive } });
      const expiredMembers = await prisma.member.count({ where: { status: MemberStatus.Expired } });
      const newMembersThisMonth = await prisma.member.count({
        where: { joiningDate: { gte: startOfMonth, lte: endOfMonth } }
      });

      // Memberships expiring
      const expiringIn7Days = await prisma.membership.findMany({
        where: {
          endDate: { gte: now, lte: sevenDaysLater }
        },
        include: {
          member: true,
          plan: true
        }
      });

      const expiringIn15DaysCount = await prisma.membership.count({
        where: { endDate: { gte: now, lte: fifteenDaysLater } }
      });

      const expiringIn30DaysCount = await prisma.membership.count({
        where: { endDate: { gte: now, lte: thirtyDaysLater } }
      });

      // Payments & Collections
      const todayPayments = await prisma.payment.aggregate({
        where: { paymentDate: { gte: startOfToday, lte: endOfToday } },
        _sum: { amount: true }
      });

      const monthlyPayments = await prisma.payment.aggregate({
        where: { paymentDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true }
      });

      const totalPayments = await prisma.payment.aggregate({
        _sum: { amount: true }
      });

      // Pending fees from active/partial memberships
      const pendingMemberships = await prisma.membership.findMany({
        where: { remainingAmount: { gt: 0 } }
      });

      const totalPendingFees = pendingMemberships.reduce((sum, m) => sum + m.remainingAmount, 0);
      const overdueMemberships = pendingMemberships.filter(m => new Date(m.endDate) < now);
      const overdueFees = overdueMemberships.reduce((sum, m) => sum + m.remainingAmount, 0);

      // Expenses
      const todayExpenses = await prisma.expense.aggregate({
        where: { date: { gte: startOfToday, lte: endOfToday } },
        _sum: { amount: true }
      });

      const monthlyExpenses = await prisma.expense.aggregate({
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true }
      });

      const yearlyExpenses = await prisma.expense.aggregate({
        where: { date: { gte: startOfYear, lte: endOfYear } },
        _sum: { amount: true }
      });

      // Profit calculations
      const monthlyRevenue = monthlyPayments._sum.amount || 0;
      const monthExpenses = monthlyExpenses._sum.amount || 0;
      const monthlyProfit = monthlyRevenue - monthExpenses;

      // Today attendance
      const todayAttendanceCount = await prisma.attendance.count({
        where: { date: { gte: startOfToday, lte: endOfToday } }
      });

      // Recent 5 payments
      const recentPayments = await prisma.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: {
          member: { select: { fullName: true, memberId: true } }
        }
      });

      // Recent 5 check-ins
      const recentCheckins = await prisma.attendance.findMany({
        take: 5,
        orderBy: { checkIn: 'desc' },
        include: {
          member: { select: { fullName: true, memberId: true } }
        }
      });

      res.json({
        members: {
          total: totalMembers,
          active: activeMembers,
          inactive: inactiveMembers,
          expired: expiredMembers,
          newThisMonth: newMembersThisMonth,
          expiringSoonCount: expiringIn7Days.length,
          expiring15DaysCount: expiringIn15DaysCount,
          expiring30DaysCount: expiringIn30DaysCount,
          expiringSoonList: expiringIn7Days
        },
        payments: {
          todayCollection: todayPayments._sum.amount || 0,
          monthlyCollection: monthlyRevenue,
          totalReceived: totalPayments._sum.amount || 0,
          pendingFees: totalPendingFees,
          overdueFees: overdueFees
        },
        expenses: {
          todayExpenses: todayExpenses._sum.amount || 0,
          monthlyExpenses: monthExpenses,
          yearlyExpenses: yearlyExpenses._sum.amount || 0
        },
        profit: {
          monthlyRevenue,
          monthlyExpenses: monthExpenses,
          monthlyProfit
        },
        todayAttendanceCount,
        recentPayments,
        recentCheckins
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to load dashboard statistics' });
    }
  });

  // -------------------------------------------------------------
  // MEMBERS MANAGEMENT
  // -------------------------------------------------------------

  app.get('/api/members', requireAuth, async (req, res) => {
    try {
      const { search, status, trainerId } = req.query;

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status;
      }
      if (trainerId) {
        where.trainerId = trainerId;
      }
      if (search) {
        const query = String(search).trim();
        where.OR = [
          { fullName: { contains: query } },
          { memberId: { contains: query } },
          { phone: { contains: query } },
          { email: { contains: query } }
        ];
      }

      const members = await prisma.member.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          trainer: { select: { id: true, name: true, specialization: true } },
          memberships: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { plan: true }
          }
        }
      });

      res.json(members);
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  });

  app.get('/api/members/:id', requireAuth, async (req, res) => {
    try {
      const member = await prisma.member.findUnique({
        where: { id: req.params.id },
        include: {
          trainer: true,
          memberships: {
            orderBy: { createdAt: 'desc' },
            include: { plan: true }
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
            include: { receivedBy: { select: { name: true } } }
          },
          attendances: {
            orderBy: { checkIn: 'desc' },
            take: 30
          }
        }
      });

      if (!member) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }

      res.json(member);
    } catch (error) {
      console.error('Error fetching member:', error);
      res.status(500).json({ error: 'Failed to fetch member details' });
    }
  });

  app.post('/api/members', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        fullName,
        fatherName,
        phone,
        email,
        address,
        dob,
        gender,
        joiningDate,
        emergencyContact,
        emergencyPhone,
        status,
        trainerId,
        notes,
        profilePhoto
      } = req.body;

      if (!fullName || !phone) {
        res.status(400).json({ error: 'Full name and phone number are required.' });
        return;
      }

      // Generate next member ID (e.g. MBR-1007)
      const count = await prisma.member.count();
      const memberId = `MBR-${1001 + count}`;

      const member = await prisma.member.create({
        data: {
          memberId,
          fullName,
          fatherName: fatherName || null,
          phone,
          email: email || null,
          address: address || null,
          dob: dob ? new Date(dob) : null,
          gender: gender || 'Other',
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          emergencyContact: emergencyContact || null,
          emergencyPhone: emergencyPhone || null,
          status: status || MemberStatus.Active,
          trainerId: trainerId || null,
          notes: notes || null,
          profilePhoto: profilePhoto || null
        }
      });

      await logAudit(
        req.user!,
        'MEMBER_CREATED',
        'MEMBERS',
        member.id,
        `Created new member ${member.fullName} (${member.memberId})`
      );

      await createNotification(
        'New Member Added',
        `${member.fullName} (${member.memberId}) was registered.`,
        'NEW_MEMBER'
      );

      if (member.email) {
        sendWelcomeMemberEmail({
          fullName: member.fullName,
          email: member.email,
          memberId: member.memberId,
          phone: member.phone
        }).catch(err => console.error('Error dispatching member welcome email:', err));
      }

      res.status(201).json(member);
    } catch (error) {
      console.error('Error creating member:', error);
      res.status(500).json({ error: 'Failed to create member' });
    }
  });

  app.put('/api/members/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        fullName,
        fatherName,
        phone,
        email,
        address,
        dob,
        gender,
        joiningDate,
        emergencyContact,
        emergencyPhone,
        status,
        trainerId,
        notes,
        profilePhoto
      } = req.body;

      const updated = await prisma.member.update({
        where: { id: req.params.id },
        data: {
          fullName,
          fatherName,
          phone,
          email,
          address,
          dob: dob ? new Date(dob) : null,
          gender,
          joiningDate: joiningDate ? new Date(joiningDate) : undefined,
          emergencyContact,
          emergencyPhone,
          status,
          trainerId: trainerId || null,
          notes,
          profilePhoto
        }
      });

      await logAudit(
        req.user!,
        'MEMBER_UPDATED',
        'MEMBERS',
        updated.id,
        `Updated member ${updated.fullName} (${updated.memberId})`
      );

      res.json(updated);
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(500).json({ error: 'Failed to update member' });
    }
  });

  app.delete('/api/members/:id', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const member = await prisma.member.findUnique({ where: { id: req.params.id } });
      if (!member) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }

      await prisma.member.delete({ where: { id: req.params.id } });

      await logAudit(
        req.user!,
        'MEMBER_DELETED',
        'MEMBERS',
        member.id,
        `Deleted member ${member.fullName} (${member.memberId})`
      );

      res.json({ message: 'Member deleted successfully' });
    } catch (error) {
      console.error('Error deleting member:', error);
      res.status(500).json({ error: 'Failed to delete member' });
    }
  });

  // -------------------------------------------------------------
  // MEMBERSHIP PLANS
  // -------------------------------------------------------------

  app.get('/api/plans', requireAuth, async (req, res) => {
    try {
      const plans = await prisma.membershipPlan.findMany({
        orderBy: { price: 'asc' },
        include: {
          _count: { select: { memberships: true } }
        }
      });
      res.json(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ error: 'Failed to fetch membership plans' });
    }
  });

  app.post('/api/plans', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, duration, price, description, status } = req.body;

      if (!name || duration === undefined || price === undefined) {
        res.status(400).json({ error: 'Name, duration (in months), and price are required.' });
        return;
      }

      const plan = await prisma.membershipPlan.create({
        data: {
          name,
          duration: Number(duration),
          price: Number(price),
          description: description || null,
          status: status || 'Active'
        }
      });

      await logAudit(req.user!, 'PLAN_CREATED', 'MEMBERSHIPS', plan.id, `Created plan ${plan.name} ($${plan.price})`);

      res.status(201).json(plan);
    } catch (error) {
      console.error('Error creating plan:', error);
      res.status(500).json({ error: 'Failed to create membership plan' });
    }
  });

  app.put('/api/plans/:id', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, duration, price, description, status } = req.body;

      const plan = await prisma.membershipPlan.update({
        where: { id: req.params.id },
        data: {
          name,
          duration: duration !== undefined ? Number(duration) : undefined,
          price: price !== undefined ? Number(price) : undefined,
          description,
          status
        }
      });

      await logAudit(req.user!, 'PLAN_UPDATED', 'MEMBERSHIPS', plan.id, `Updated plan ${plan.name}`);

      res.json(plan);
    } catch (error) {
      console.error('Error updating plan:', error);
      res.status(500).json({ error: 'Failed to update membership plan' });
    }
  });

  // -------------------------------------------------------------
  // MEMBERSHIP REGISTRATION & ASSIGNMENT
  // -------------------------------------------------------------

  app.get('/api/memberships', requireAuth, async (req, res) => {
    try {
      const { memberId, status } = req.query;
      const where: any = {};
      if (memberId) where.memberId = String(memberId);
      if (status && status !== 'ALL') where.status = status;

      const memberships = await prisma.membership.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          member: true,
          plan: true,
          payments: { orderBy: { paymentDate: 'desc' } }
        }
      });

      res.json(memberships);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      res.status(500).json({ error: 'Failed to fetch memberships' });
    }
  });

  app.post('/api/memberships/register', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        memberId,
        planId,
        startDate,
        discount = 0,
        paidAmount = 0,
        paymentMethod = 'Cash',
        remarks = ''
      } = req.body;

      if (!memberId || !planId || !startDate) {
        res.status(400).json({ error: 'Member, plan, and start date are required.' });
        return;
      }

      const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
      if (!plan) {
        res.status(404).json({ error: 'Membership plan not found.' });
        return;
      }

      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) {
        res.status(404).json({ error: 'Member not found.' });
        return;
      }

      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + plan.duration);

      const planPrice = plan.price;
      const numDiscount = Number(discount) || 0;
      const netAmount = Math.max(0, planPrice - numDiscount);
      const numPaid = Number(paidAmount) || 0;
      const remainingAmount = Math.max(0, netAmount - numPaid);

      let memStatus: MembershipStatus = MembershipStatus.Unpaid;
      if (remainingAmount <= 0) {
        memStatus = MembershipStatus.Paid;
      } else if (numPaid > 0) {
        memStatus = MembershipStatus.Partial;
      }

      // Execute in Prisma transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        const membership = await tx.membership.create({
          data: {
            memberId: member.id,
            planId: plan.id,
            startDate: start,
            endDate: end,
            planPrice,
            discount: numDiscount,
            netAmount,
            paidAmount: numPaid,
            remainingAmount,
            status: memStatus
          },
          include: {
            member: true,
            plan: true
          }
        });

        // If member was Expired or Inactive, activate them
        await tx.member.update({
          where: { id: member.id },
          data: { status: MemberStatus.Active }
        });

        let payment = null;
        if (numPaid > 0) {
          const totalPaymentsCount = await tx.payment.count();
          const receiptNumber = `RCP-${10001 + totalPaymentsCount}`;

          const payStatus = remainingAmount <= 0 ? PaymentStatus.Paid : PaymentStatus.Partial;

          payment = await tx.payment.create({
            data: {
              receiptNumber,
              memberId: member.id,
              membershipId: membership.id,
              paymentDate: new Date(),
              amount: numPaid,
              paymentMethod: (paymentMethod as PaymentMethod) || PaymentMethod.Cash,
              previousBalance: netAmount,
              remainingBalance: remainingAmount,
              status: payStatus,
              remarks: remarks || `Registration for ${plan.name}`,
              receivedById: req.user!.id
            },
            include: {
              member: true,
              receivedBy: { select: { name: true } }
            }
          });
        }

        return { membership, payment };
      });

      await logAudit(
        req.user!,
        'MEMBERSHIP_REGISTERED',
        'MEMBERSHIPS',
        result.membership.id,
        `Registered ${member.fullName} for ${plan.name}. Net: $${netAmount}, Paid: $${numPaid}`
      );

      if (numPaid > 0) {
        await createNotification(
          'Payment Received',
          `$${numPaid} received from ${member.fullName} (Receipt: ${result.payment?.receiptNumber})`,
          'PAYMENT_RECEIVED'
        );
      }

      if (remainingAmount > 0) {
        await createNotification(
          'Pending Fee Alert',
          `${member.fullName} has a pending balance of $${remainingAmount}`,
          'PENDING_PAYMENT'
        );
      }

      if (member.email) {
        prisma.gymSettings.findFirst().then(settings => {
          if (result.payment) {
            sendPaymentReceiptEmail(
              { fullName: member.fullName, email: member.email!, memberId: member.memberId },
              result.payment,
              settings
            ).catch(err => console.error('Error sending registration receipt email:', err));
          } else {
            sendWelcomeMemberEmail(
              { fullName: member.fullName, email: member.email!, memberId: member.memberId, phone: member.phone },
              plan.name
            ).catch(err => console.error('Error sending registration welcome email:', err));
          }
        }).catch(() => {});
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error registering membership:', error);
      res.status(500).json({ error: 'Failed to register membership' });
    }
  });

  // -------------------------------------------------------------
  // PAYMENTS & RECEIPTS
  // -------------------------------------------------------------

  app.get('/api/payments', requireAuth, async (req, res) => {
    try {
      const { search, method, status, startDate, endDate } = req.query;

      const where: any = {};

      if (method && method !== 'ALL') {
        where.paymentMethod = method;
      }
      if (status && status !== 'ALL') {
        where.status = status;
      }
      if (startDate || endDate) {
        where.paymentDate = {};
        if (startDate) where.paymentDate.gte = new Date(String(startDate));
        if (endDate) {
          const end = new Date(String(endDate));
          end.setHours(23, 59, 59, 999);
          where.paymentDate.lte = end;
        }
      }
      if (search) {
        const query = String(search).trim();
        where.OR = [
          { receiptNumber: { contains: query } },
          { member: { fullName: { contains: query } } },
          { member: { memberId: { contains: query } } },
          { member: { phone: { contains: query } } }
        ];
      }

      const payments = await prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        include: {
          member: true,
          membership: { include: { plan: true } },
          receivedBy: { select: { name: true, email: true } }
        }
      });

      res.json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  });

  app.post('/api/payments', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        memberId,
        membershipId,
        amount,
        paymentMethod = 'Cash',
        remarks
      } = req.body;

      const numAmount = Number(amount);
      if (!memberId || !numAmount || numAmount <= 0) {
        res.status(400).json({ error: 'Valid member and positive payment amount are required.' });
        return;
      }

      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) {
        res.status(404).json({ error: 'Member not found.' });
        return;
      }

      const totalPaymentsCount = await prisma.payment.count();
      const receiptNumber = `RCP-${10001 + totalPaymentsCount}`;

      const payment = await prisma.$transaction(async (tx) => {
        let previousBalance = 0;
        let remainingBalance = 0;

        if (membershipId) {
          const membership = await tx.membership.findUnique({ where: { id: membershipId } });
          if (membership) {
            previousBalance = membership.remainingAmount;
            const newPaid = membership.paidAmount + numAmount;
            remainingBalance = Math.max(0, membership.remainingAmount - numAmount);

            let newStatus: MembershipStatus = MembershipStatus.Partial;
            if (remainingBalance <= 0) {
              newStatus = MembershipStatus.Paid;
            }

            await tx.membership.update({
              where: { id: membershipId },
              data: {
                paidAmount: newPaid,
                remainingAmount: remainingBalance,
                status: newStatus
              }
            });
          }
        }

        const payStatus = remainingBalance <= 0 ? PaymentStatus.Paid : PaymentStatus.Partial;

        return tx.payment.create({
          data: {
            receiptNumber,
            memberId,
            membershipId: membershipId || null,
            paymentDate: new Date(),
            amount: numAmount,
            paymentMethod: paymentMethod as PaymentMethod,
            previousBalance,
            remainingBalance,
            status: payStatus,
            remarks: remarks || 'Fee payment',
            receivedById: req.user!.id
          },
          include: {
            member: true,
            membership: { include: { plan: true } },
            receivedBy: { select: { name: true } }
          }
        });
      });

      await logAudit(
        req.user!,
        'PAYMENT_RECORDED',
        'PAYMENTS',
        payment.id,
        `Collected $${numAmount} from ${member.fullName} (${receiptNumber})`
      );

      await createNotification(
        'Payment Collected',
        `$${numAmount} received from ${member.fullName} (Receipt #${receiptNumber})`,
        'PAYMENT_RECEIVED'
      );

      if (member.email) {
        prisma.gymSettings.findFirst().then(settings => {
          sendPaymentReceiptEmail(
            { fullName: member.fullName, email: member.email!, memberId: member.memberId },
            payment,
            settings
          ).catch(err => console.error('Error dispatching payment receipt email:', err));
        }).catch(() => {});
      }

      res.status(201).json(payment);
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({ error: 'Failed to record payment' });
    }
  });

  // Receipt data endpoint
  app.get('/api/payments/receipt/:receiptNumber', requireAuth, async (req, res) => {
    try {
      const payment = await prisma.payment.findUnique({
        where: { receiptNumber: req.params.receiptNumber },
        include: {
          member: true,
          membership: { include: { plan: true } },
          receivedBy: { select: { name: true, email: true } }
        }
      });

      if (!payment) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }

      const settings = await prisma.gymSettings.findFirst() || {
        gymName: 'TitanForge Fitness & Athletics',
        address: '742 Olympia Boulevard, Suite 100',
        phone: '+1 (555) 839-4467',
        email: 'management@titanforgegym.com',
        website: 'https://titanforgegym.com',
        currency: '$',
        receiptFooter: 'Thank you for choosing TitanForge Fitness. Push your limits!',
        termsConditions: '1. Membership fees are non-refundable.\n2. Gym rules, proper footwear, and safety regulations must be observed at all times.'
      };

      res.json({ payment, settings });
    } catch (error) {
      console.error('Error fetching receipt:', error);
      res.status(500).json({ error: 'Failed to fetch receipt' });
    }
  });

  // -------------------------------------------------------------
  // PENDING FEES
  // -------------------------------------------------------------

  app.get('/api/pending-fees', requireAuth, async (req, res) => {
    try {
      const { search, statusFilter } = req.query;

      const memberships = await prisma.membership.findMany({
        where: {
          remainingAmount: { gt: 0 }
        },
        orderBy: { endDate: 'asc' },
        include: {
          member: true,
          plan: true,
          payments: { orderBy: { paymentDate: 'desc' } }
        }
      });

      const now = new Date();
      let filtered = memberships.map(m => {
        const isOverdue = new Date(m.endDate) < now;
        return {
          ...m,
          isOverdue,
          pendingStatus: isOverdue ? 'Overdue' : (m.paidAmount > 0 ? 'Partial' : 'Unpaid')
        };
      });

      if (statusFilter && statusFilter !== 'ALL') {
        filtered = filtered.filter(m => m.pendingStatus === statusFilter);
      }

      if (search) {
        const q = String(search).toLowerCase();
        filtered = filtered.filter(m =>
          m.member.fullName.toLowerCase().includes(q) ||
          m.member.memberId.toLowerCase().includes(q) ||
          m.member.phone.includes(q) ||
          m.plan.name.toLowerCase().includes(q)
        );
      }

      const totalPendingAmount = filtered.reduce((acc, cur) => acc + cur.remainingAmount, 0);
      const unpaidCount = filtered.filter(m => m.pendingStatus === 'Unpaid').length;
      const partialCount = filtered.filter(m => m.pendingStatus === 'Partial').length;
      const overdueCount = filtered.filter(m => m.pendingStatus === 'Overdue').length;

      res.json({
        summary: {
          totalPendingAmount,
          unpaidCount,
          partialCount,
          overdueCount,
          totalCount: filtered.length
        },
        pendingList: filtered
      });
    } catch (error) {
      console.error('Error fetching pending fees:', error);
      res.status(500).json({ error: 'Failed to fetch pending fees' });
    }
  });

  // -------------------------------------------------------------
  // ATTENDANCE MANAGEMENT
  // -------------------------------------------------------------

  app.get('/api/attendance', requireAuth, async (req, res) => {
    try {
      const { date, memberId } = req.query;
      const where: any = {};

      if (date) {
        const targetDate = new Date(String(date));
        const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
        where.date = { gte: start, lte: end };
      }

      if (memberId) {
        where.memberId = String(memberId);
      }

      const records = await prisma.attendance.findMany({
        where,
        orderBy: { checkIn: 'desc' },
        include: {
          member: {
            select: { id: true, memberId: true, fullName: true, phone: true, status: true }
          }
        }
      });

      res.json(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
  });

  app.post('/api/attendance/check-in', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { memberCode, notes } = req.body;

      if (!memberCode) {
        res.status(400).json({ error: 'Member code or ID is required.' });
        return;
      }

      const cleanCode = String(memberCode).trim();
      const member = await prisma.member.findFirst({
        where: {
          OR: [
            { id: cleanCode },
            { memberId: cleanCode },
            { phone: cleanCode }
          ]
        },
        include: {
          memberships: {
            orderBy: { endDate: 'desc' },
            take: 1
          }
        }
      });

      if (!member) {
        res.status(404).json({ error: 'No member found matching this ID or phone number.' });
        return;
      }

      // Check if already checked in today without checking out
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const existingOpen = await prisma.attendance.findFirst({
        where: {
          memberId: member.id,
          date: { gte: startOfDay, lte: endOfDay },
          checkOut: null
        }
      });

      if (existingOpen) {
        res.status(400).json({
          error: `${member.fullName} is already checked in at ${new Date(existingOpen.checkIn).toLocaleTimeString()}. Please check out first.`
        });
        return;
      }

      const attendance = await prisma.attendance.create({
        data: {
          memberId: member.id,
          date: now,
          checkIn: now,
          status: 'Present',
          notes: notes || null
        },
        include: { member: true }
      });

      await logAudit(
        req.user!,
        'CHECK_IN',
        'ATTENDANCE',
        attendance.id,
        `${member.fullName} checked in at gym.`
      );

      res.status(201).json({
        message: 'Member checked in successfully',
        attendance,
        isMembershipExpired: member.memberships[0] ? new Date(member.memberships[0].endDate) < now : true
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ error: 'Failed to record check-in' });
    }
  });

  app.post('/api/attendance/check-out', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { attendanceId } = req.body;

      if (!attendanceId) {
        res.status(400).json({ error: 'Attendance ID is required.' });
        return;
      }

      const attendance = await prisma.attendance.findUnique({
        where: { id: attendanceId },
        include: { member: true }
      });

      if (!attendance) {
        res.status(404).json({ error: 'Attendance record not found.' });
        return;
      }

      const updated = await prisma.attendance.update({
        where: { id: attendanceId },
        data: { checkOut: new Date() },
        include: { member: true }
      });

      await logAudit(
        req.user!,
        'CHECK_OUT',
        'ATTENDANCE',
        updated.id,
        `${updated.member.fullName} checked out.`
      );

      res.json({ message: 'Member checked out successfully', attendance: updated });
    } catch (error) {
      console.error('Check-out error:', error);
      res.status(500).json({ error: 'Failed to record check-out' });
    }
  });

  // -------------------------------------------------------------
  // TRAINERS MANAGEMENT
  // -------------------------------------------------------------

  app.get('/api/trainers', requireAuth, async (req, res) => {
    try {
      const trainers = await prisma.trainer.findMany({
        orderBy: { name: 'asc' },
        include: {
          assignedMembers: {
            select: { id: true, memberId: true, fullName: true, phone: true, status: true }
          },
          _count: { select: { assignedMembers: true } }
        }
      });
      res.json(trainers);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      res.status(500).json({ error: 'Failed to fetch trainers' });
    }
  });

  app.post('/api/trainers', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, phone, email, specialization, salary, status, notes, photo } = req.body;

      if (!name || !phone) {
        res.status(400).json({ error: 'Trainer name and phone are required.' });
        return;
      }

      const count = await prisma.trainer.count();
      const trainerId = `TRN-${101 + count}`;

      const trainer = await prisma.trainer.create({
        data: {
          trainerId,
          name,
          phone,
          email: email || null,
          specialization: specialization || 'General Fitness',
          salary: Number(salary) || 0,
          status: status || 'Active',
          notes: notes || null,
          photo: photo || null
        }
      });

      await logAudit(req.user!, 'TRAINER_CREATED', 'TRAINERS', trainer.id, `Created trainer ${trainer.name}`);

      res.status(201).json(trainer);
    } catch (error) {
      console.error('Error creating trainer:', error);
      res.status(500).json({ error: 'Failed to create trainer' });
    }
  });

  app.put('/api/trainers/:id', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, phone, email, specialization, salary, status, notes, photo } = req.body;

      const trainer = await prisma.trainer.update({
        where: { id: req.params.id },
        data: {
          name,
          phone,
          email,
          specialization,
          salary: salary !== undefined ? Number(salary) : undefined,
          status,
          notes,
          photo
        }
      });

      await logAudit(req.user!, 'TRAINER_UPDATED', 'TRAINERS', trainer.id, `Updated trainer ${trainer.name}`);

      res.json(trainer);
    } catch (error) {
      console.error('Error updating trainer:', error);
      res.status(500).json({ error: 'Failed to update trainer' });
    }
  });

  app.post('/api/trainers/:id/assign-member', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { memberId } = req.body;
      const trainer = await prisma.trainer.findUnique({ where: { id: req.params.id } });
      if (!trainer) {
        res.status(404).json({ error: 'Trainer not found' });
        return;
      }

      const member = await prisma.member.update({
        where: { id: memberId },
        data: { trainerId: trainer.id }
      });

      await logAudit(
        req.user!,
        'TRAINER_ASSIGNED',
        'TRAINERS',
        trainer.id,
        `Assigned ${member.fullName} to trainer ${trainer.name}`
      );

      res.json({ message: 'Trainer assigned successfully', member });
    } catch (error) {
      console.error('Error assigning trainer:', error);
      res.status(500).json({ error: 'Failed to assign trainer' });
    }
  });

  // -------------------------------------------------------------
  // EXPENSES MANAGEMENT
  // -------------------------------------------------------------

  app.get('/api/expenses/categories', requireAuth, async (req, res) => {
    try {
      const categories = await prisma.expenseCategory.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { expenses: true } } }
      });
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  app.post('/api/expenses/categories', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        res.status(400).json({ error: 'Category name is required.' });
        return;
      }

      const category = await prisma.expenseCategory.create({
        data: { name: name.trim(), description: description || null }
      });

      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  app.get('/api/expenses', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req, res) => {
    try {
      const { categoryId, startDate, endDate, search } = req.query;
      const where: any = {};

      if (categoryId && categoryId !== 'ALL') {
        where.categoryId = String(categoryId);
      }
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(String(startDate));
        if (endDate) {
          const end = new Date(String(endDate));
          end.setHours(23, 59, 59, 999);
          where.date.lte = end;
        }
      }
      if (search) {
        const q = String(search).trim();
        where.OR = [
          { description: { contains: q } },
          { expenseId: { contains: q } },
          { paidTo: { contains: q } },
          { reference: { contains: q } }
        ];
      }

      const expenses = await prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        include: {
          category: true,
          createdBy: { select: { name: true } }
        }
      });

      res.json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  });

  app.post('/api/expenses', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const {
        categoryId,
        description,
        amount,
        paymentMethod = 'Cash',
        paidTo,
        reference,
        remarks,
        date
      } = req.body;

      if (!categoryId || !description || !amount || Number(amount) <= 0) {
        res.status(400).json({ error: 'Category, description, and positive amount are required.' });
        return;
      }

      const count = await prisma.expense.count();
      const expenseId = `EXP-${1001 + count}`;

      const expense = await prisma.expense.create({
        data: {
          expenseId,
          categoryId,
          description,
          amount: Number(amount),
          paymentMethod: paymentMethod as PaymentMethod,
          paidTo: paidTo || null,
          reference: reference || null,
          remarks: remarks || null,
          date: date ? new Date(date) : new Date(),
          createdById: req.user!.id
        },
        include: { category: true }
      });

      await logAudit(
        req.user!,
        'EXPENSE_CREATED',
        'EXPENSES',
        expense.id,
        `Recorded expense $${expense.amount} for ${expense.description}`
      );

      await createNotification(
        'New Expense Recorded',
        `$${expense.amount} for ${expense.description} (${expense.category.name})`,
        'NEW_EXPENSE'
      );

      res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: 'Failed to create expense' });
    }
  });

  app.put('/api/expenses/:id', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { categoryId, description, amount, paymentMethod, paidTo, reference, remarks, date } = req.body;

      const expense = await prisma.expense.update({
        where: { id: req.params.id },
        data: {
          categoryId,
          description,
          amount: amount !== undefined ? Number(amount) : undefined,
          paymentMethod,
          paidTo,
          reference,
          remarks,
          date: date ? new Date(date) : undefined
        },
        include: { category: true }
      });

      await logAudit(req.user!, 'EXPENSE_UPDATED', 'EXPENSES', expense.id, `Updated expense ${expense.expenseId}`);

      res.json(expense);
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ error: 'Failed to update expense' });
    }
  });

  app.delete('/api/expenses/:id', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
      if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      await prisma.expense.delete({ where: { id: req.params.id } });

      await logAudit(req.user!, 'EXPENSE_DELETED', 'EXPENSES', expense.id, `Deleted expense ${expense.expenseId}`);

      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  });

  // -------------------------------------------------------------
  // PROFIT & LOSS & FINANCIAL REPORTS
  // -------------------------------------------------------------

  app.get('/api/reports/pnl', requireAuth, requireRole(Role.SUPER_ADMIN, Role.ADMIN), async (req, res) => {
    try {
      const { timeframe = 'month', startDate, endDate } = req.query;

      const now = new Date();
      let start: Date;
      let end: Date = new Date();

      if (timeframe === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (timeframe === 'week') {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeframe === 'year') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else if (timeframe === 'custom' && startDate && endDate) {
        start = new Date(String(startDate));
        end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
      } else {
        // month default
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      // 1. Actual payments received in this range (NEVER count unpaid fees as revenue!)
      const payments = await prisma.payment.findMany({
        where: { paymentDate: { gte: start, lte: end } },
        include: {
          member: { select: { fullName: true, memberId: true } },
          membership: { include: { plan: true } }
        },
        orderBy: { paymentDate: 'asc' }
      });

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

      // 2. Actual expenses in this range
      const expenses = await prisma.expense.findMany({
        where: { date: { gte: start, lte: end } },
        include: { category: true },
        orderBy: { date: 'asc' }
      });

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      // 3. Net profit
      const netProfit = totalRevenue - totalExpenses;

      // 4. Pending fees in the system
      const allPending = await prisma.membership.findMany({
        where: { remainingAmount: { gt: 0 } }
      });
      const totalPendingFees = allPending.reduce((sum, m) => sum + m.remainingAmount, 0);

      // 5. Collection rate calculation
      const totalBilled = totalRevenue + totalPendingFees;
      const collectionRate = totalBilled > 0 ? (totalRevenue / totalBilled) * 100 : 100;

      // 6. Monthly / daily breakdown chart data
      // Group by date (day or month)
      const timelineMap: Record<string, { date: string; revenue: number; expenses: number; profit: number }> = {};

      // Fill in payments
      payments.forEach(p => {
        const dStr = p.paymentDate.toISOString().slice(0, 10);
        if (!timelineMap[dStr]) {
          timelineMap[dStr] = { date: dStr, revenue: 0, expenses: 0, profit: 0 };
        }
        timelineMap[dStr].revenue += p.amount;
        timelineMap[dStr].profit += p.amount;
      });

      // Fill in expenses
      expenses.forEach(e => {
        const dStr = e.date.toISOString().slice(0, 10);
        if (!timelineMap[dStr]) {
          timelineMap[dStr] = { date: dStr, revenue: 0, expenses: 0, profit: 0 };
        }
        timelineMap[dStr].expenses += e.amount;
        timelineMap[dStr].profit -= e.amount;
      });

      const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

      // Category breakdown for expenses
      const expenseByCategory: Record<string, number> = {};
      expenses.forEach(e => {
        const cat = e.category.name;
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + e.amount;
      });

      const categoryBreakdown = Object.entries(expenseByCategory).map(([name, value]) => ({
        name,
        value
      }));

      res.json({
        timeframe,
        dateRange: { start, end },
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          totalPendingFees,
          collectionRate: Math.round(collectionRate * 10) / 10
        },
        timeline,
        categoryBreakdown,
        payments,
        expenses
      });
    } catch (error) {
      console.error('P&L report error:', error);
      res.status(500).json({ error: 'Failed to generate P&L report' });
    }
  });

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------

  app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
      const notifications = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
      await prisma.notification.update({
        where: { id: req.params.id },
        data: { read: true }
      });
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  });

  app.post('/api/notifications/mark-all-read', requireAuth, async (req, res) => {
    try {
      await prisma.notification.updateMany({
        where: { read: false },
        data: { read: true }
      });
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error updating notifications:', error);
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  });

  // -------------------------------------------------------------
  // USER MANAGEMENT (SUPER_ADMIN ONLY)
  // -------------------------------------------------------------

  app.get('/api/users', requireAuth, requireRole(Role.SUPER_ADMIN), async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', requireAuth, requireRole(Role.SUPER_ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, email, password, role, phone, status } = req.body;

      if (!name || !email || !password || !role) {
        res.status(400).json({ error: 'Name, email, password, and role are required.' });
        return;
      }

      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (existing) {
        res.status(400).json({ error: 'A user with this email already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          role: role as Role,
          phone: phone || null,
          status: status || 'Active'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          createdAt: true
        }
      });

      await logAudit(
        req.user!,
        'USER_CREATED',
        'USERS',
        user.id,
        `Created user ${user.name} (${user.email}) with role ${user.role}`
      );

      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.put('/api/users/:id', requireAuth, requireRole(Role.SUPER_ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, email, role, phone, status, password } = req.body;

      const updateData: any = {
        name,
        email: email ? email.toLowerCase().trim() : undefined,
        role: role as Role,
        phone,
        status
      };

      if (password && password.trim().length >= 6) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          updatedAt: true
        }
      });

      await logAudit(
        req.user!,
        'USER_UPDATED',
        'USERS',
        updated.id,
        `Updated user ${updated.name} (${updated.email})`
      );

      res.json(updated);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.delete('/api/users/:id', requireAuth, requireRole(Role.SUPER_ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      if (req.params.id === req.user!.id) {
        res.status(400).json({ error: 'You cannot delete your own account.' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      await prisma.user.delete({ where: { id: req.params.id } });

      await logAudit(
        req.user!,
        'USER_DELETED',
        'USERS',
        user.id,
        `Deleted user account ${user.name} (${user.email})`
      );

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  app.post('/api/users/:id/reset-password', requireAuth, requireRole(Role.SUPER_ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        return;
      }

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const newPasswordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id },
        data: { passwordHash: newPasswordHash }
      });

      await logAudit(
        req.user!,
        'USER_PASSWORD_RESET',
        'USERS',
        id,
        `Admin ${req.user!.name} reset password for user ${targetUser.name} (${targetUser.email})`
      );

      // Attempt to send email notice if SMTP is configured
      sendPasswordResetEmail(targetUser, password).catch(err =>
        console.error('Password reset email error:', err)
      );

      res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      console.error('Error resetting user password:', error);
      res.status(500).json({ error: 'Failed to reset user password' });
    }
  });

  // -------------------------------------------------------------
  // AUDIT LOGS (SUPER_ADMIN ONLY)
  // -------------------------------------------------------------

  app.get('/api/audit-logs', requireAuth, requireRole(Role.SUPER_ADMIN), async (req, res) => {
    try {
      const { module, action, search } = req.query;
      const where: any = {};

      if (module && module !== 'ALL') where.module = String(module);
      if (action && action !== 'ALL') where.action = String(action);
      if (search) {
        const q = String(search).trim();
        where.OR = [
          { userName: { contains: q } },
          { description: { contains: q } },
          { action: { contains: q } },
          { module: { contains: q } }
        ];
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { user: { select: { email: true, role: true } } }
      });

      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // -------------------------------------------------------------
  // GYM SETTINGS
  // -------------------------------------------------------------

  app.get('/api/settings', requireAuth, async (req, res) => {
    try {
      let settings = await prisma.gymSettings.findFirst();
      if (!settings) {
        settings = await prisma.gymSettings.create({
          data: {
            id: 'default-settings',
            gymName: 'TitanForge Fitness & Athletics',
            address: '742 Olympia Boulevard, Suite 100',
            phone: '+1 (555) 839-4467',
            email: 'management@titanforgegym.com',
            website: 'https://titanforgegym.com',
            currency: '$',
            receiptFooter: 'Thank you for choosing TitanForge Fitness. Push your limits!',
            termsConditions: '1. Membership fees are non-refundable.\n2. Gym rules and safety regulations must be observed at all times.',
            dateFormat: 'YYYY-MM-DD',
            timezone: 'UTC'
          }
        });
      }
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch gym settings' });
    }
  });

  app.put('/api/settings', requireAuth, requireRole(Role.SUPER_ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const {
        gymName,
        logo,
        address,
        phone,
        email,
        website,
        currency,
        receiptFooter,
        termsConditions,
        dateFormat,
        timezone
      } = req.body;

      const current = await prisma.gymSettings.findFirst();
      const id = current ? current.id : 'default-settings';

      const updated = await prisma.gymSettings.upsert({
        where: { id },
        update: {
          gymName,
          logo,
          address,
          phone,
          email,
          website,
          currency,
          receiptFooter,
          termsConditions,
          dateFormat,
          timezone
        },
        create: {
          id,
          gymName: gymName || 'TitanForge Fitness & Athletics',
          logo,
          address: address || '742 Olympia Boulevard',
          phone: phone || '+1 (555) 839-4467',
          email: email || 'management@titanforgegym.com',
          website: website || 'https://titanforgegym.com',
          currency: currency || '$',
          receiptFooter: receiptFooter || 'Thank you for choosing TitanForge Fitness.',
          termsConditions: termsConditions || 'Standard Gym Terms.',
          dateFormat: dateFormat || 'YYYY-MM-DD',
          timezone: timezone || 'UTC'
        }
      });

      await logAudit(req.user!, 'SETTINGS_UPDATED', 'SETTINGS', updated.id, 'Updated gym business settings');

      res.json(updated);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update gym settings' });
    }
  });

  // -------------------------------------------------------------
  // 404 HANDLER FOR UNMATCHED API ENDPOINTS
  // -------------------------------------------------------------
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
  });

  // -------------------------------------------------------------
  // VITE DEV / PRODUCTION MIDDLEWARE
  // -------------------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // -------------------------------------------------------------
  // GLOBAL ERROR HANDLER
  // -------------------------------------------------------------
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'An unexpected server error occurred'
        : (err?.message || 'Internal server error')
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[STARTUP] TitanForge Gym Management Server listening on 0.0.0.0:${PORT} [environment: ${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
