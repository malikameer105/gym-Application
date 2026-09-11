export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'RECEPTIONIST' | 'TRAINER';

export type MemberStatus = 'Active' | 'Inactive' | 'Suspended' | 'Expired';
export type MembershipStatus = 'Paid' | 'Partial' | 'Unpaid';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
export type PaymentMethod = 'Cash' | 'BankTransfer' | 'Card' | 'Online' | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Member {
  id: string;
  memberId: string;
  fullName: string;
  fatherName?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  dob?: string | null;
  gender?: string | null;
  joiningDate: string;
  profilePhoto?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  status: MemberStatus;
  notes?: string | null;
  trainerId?: string | null;
  createdAt: string;
  updatedAt: string;
  trainer?: {
    id: string;
    name: string;
    specialization?: string | null;
  } | null;
  memberships?: Membership[];
  payments?: Payment[];
  attendances?: Attendance[];
}

export interface MembershipPlan {
  id: string;
  name: string;
  duration: number; // in months
  price: number;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    memberships: number;
  };
}

export interface Membership {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  planPrice: number;
  discount: number;
  netAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
  member?: Member;
  plan?: MembershipPlan;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  receiptNumber: string;
  memberId: string;
  membershipId?: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  previousBalance: number;
  remainingBalance: number;
  status: PaymentStatus;
  remarks?: string | null;
  receivedById?: string | null;
  createdAt: string;
  updatedAt: string;
  member?: Member;
  membership?: Membership;
  receivedBy?: {
    name: string;
    email?: string;
  } | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    expenses: number;
  };
}

export interface Expense {
  id: string;
  expenseId: string;
  date: string;
  categoryId: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidTo?: string | null;
  reference?: string | null;
  remarks?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  category: ExpenseCategory;
  createdBy?: {
    name: string;
  } | null;
}

export interface Attendance {
  id: string;
  memberId: string;
  date: string;
  checkIn: string;
  checkOut?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  member?: {
    id: string;
    memberId: string;
    fullName: string;
    phone: string;
    status: MemberStatus;
  };
}

export interface Trainer {
  id: string;
  trainerId: string;
  name: string;
  phone: string;
  email?: string | null;
  specialization?: string | null;
  joiningDate: string;
  salary: number;
  status: string;
  notes?: string | null;
  photo?: string | null;
  userId?: string | null;
  createdAt: string;
  assignedMembers?: Member[];
  _count?: {
    assignedMembers: number;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  userName: string;
  action: string;
  module: string;
  recordId?: string | null;
  description: string;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    email: string;
    role: Role;
  } | null;
}

export interface GymSettingsData {
  id: string;
  gymName: string;
  logo?: string | null;
  address: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  receiptFooter: string;
  termsConditions: string;
  dateFormat: string;
  timezone: string;
}

export interface DashboardStats {
  members: {
    total: number;
    active: number;
    inactive: number;
    expired: number;
    newThisMonth: number;
    expiringSoonCount: number;
    expiring15DaysCount: number;
    expiring30DaysCount: number;
    expiringSoonList: Membership[];
  };
  payments: {
    todayCollection: number;
    monthlyCollection: number;
    totalReceived: number;
    pendingFees: number;
    overdueFees: number;
  };
  expenses: {
    todayExpenses: number;
    monthlyExpenses: number;
    yearlyExpenses: number;
  };
  profit: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyProfit: number;
  };
  todayAttendanceCount: number;
  recentPayments: Payment[];
  recentCheckins: Attendance[];
}
