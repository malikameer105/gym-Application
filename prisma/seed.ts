import { PrismaClient, Role, MemberStatus, MembershipStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Gym Settings
  await prisma.gymSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      gymName: 'TitanForge Fitness & Athletics',
      address: '742 Olympia Boulevard, Suite 100',
      phone: '+1 (555) 839-4467',
      email: 'management@titanforgegym.com',
      website: 'https://titanforgegym.com',
      currency: '$',
      receiptFooter: 'Thank you for choosing TitanForge Fitness. Push your limits!',
      termsConditions: '1. Membership fees are non-refundable.\n2. Gym rules, proper footwear, and safety regulations must be observed at all times.\n3. Locker keys must be returned at checkout.',
      dateFormat: 'YYYY-MM-DD',
      timezone: 'UTC'
    }
  });

  // 2. Users (Super Admin, Admin, Receptionist, Trainer)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Password123!';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedAdminPassword,
      role: Role.SUPER_ADMIN,
      name: 'Super Admin'
    },
    create: {
      name: 'Super Admin',
      email: adminEmail,
      passwordHash: hashedAdminPassword,
      role: Role.SUPER_ADMIN,
      phone: '+1 (555) 019-2831',
      status: 'Active'
    }
  });

  const staffPassword = await bcrypt.hash('Staff@Password123!', 10);

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      name: 'Sarah Jenkins (Manager)',
      email: 'manager@example.com',
      passwordHash: staffPassword,
      role: Role.ADMIN,
      phone: '+1 (555) 019-2832',
      status: 'Active'
    }
  });

  const receptionistUser = await prisma.user.upsert({
    where: { email: 'receptionist@example.com' },
    update: {},
    create: {
      name: 'Michael Davis (Front Desk)',
      email: 'receptionist@example.com',
      passwordHash: staffPassword,
      role: Role.RECEPTIONIST,
      phone: '+1 (555) 019-2833',
      status: 'Active'
    }
  });

  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@example.com' },
    update: {},
    create: {
      name: 'Marcus Vance (Head Trainer)',
      email: 'trainer@example.com',
      passwordHash: staffPassword,
      role: Role.TRAINER,
      phone: '+1 (555) 019-2834',
      status: 'Active'
    }
  });

  // 3. Trainers
  const trainer1 = await prisma.trainer.upsert({
    where: { trainerId: 'TRN-101' },
    update: {},
    create: {
      trainerId: 'TRN-101',
      name: 'Marcus Vance',
      phone: '+1 (555) 019-2834',
      email: 'trainer@example.com',
      specialization: 'Strength, Powerlifting & Hypertrophy',
      joiningDate: new Date('2024-01-15'),
      salary: 3200,
      status: 'Active',
      userId: trainerUser.id,
      notes: 'CSCS certified, 8 years elite coaching experience.'
    }
  });

  const trainer2 = await prisma.trainer.upsert({
    where: { trainerId: 'TRN-102' },
    update: {},
    create: {
      trainerId: 'TRN-102',
      name: 'Elena Rostova',
      phone: '+1 (555) 392-1102',
      email: 'elena@titanforgegym.com',
      specialization: 'Functional Mobility, HIIT & Nutrition',
      joiningDate: new Date('2024-03-01'),
      salary: 2900,
      status: 'Active',
      notes: 'Former Olympic gymnastics coach & certified nutritionist.'
    }
  });

  // 4. Membership Plans
  const plans = [
    { id: 'plan-1m', name: 'Standard Monthly', duration: 1, price: 60, description: 'Unlimited full access to all gym equipment for 1 month.' },
    { id: 'plan-3m', name: 'Quarterly Warrior', duration: 3, price: 160, description: '3 months full access with locker and towel service.' },
    { id: 'plan-6m', name: 'Semi-Annual Pro', duration: 6, price: 290, description: '6 months access including 2 personal trainer evaluations.' },
    { id: 'plan-12m', name: 'Annual Elite VIP', duration: 12, price: 520, description: '12 months VIP all-inclusive access, sauna, classes & guest passes.' },
    { id: 'plan-student', name: 'Student Discount', duration: 1, price: 40, description: 'Affordable monthly membership for verified college students.' },
    { id: 'plan-pt', name: 'Personal Training Pack', duration: 1, price: 180, description: 'Monthly membership + 10 dedicated 1-on-1 coaching sessions.' }
  ];

  for (const p of plans) {
    await prisma.membershipPlan.upsert({
      where: { id: p.id },
      update: { name: p.name, duration: p.duration, price: p.price, description: p.description },
      create: p
    });
  }

  // 5. Expense Categories
  const categories = [
    'Rent', 'Electricity', 'Water', 'Internet', 'Salary',
    'Equipment', 'Maintenance', 'Cleaning', 'Marketing', 'Supplies', 'Other'
  ];

  const categoryMap: Record<string, string> = {};
  for (const catName of categories) {
    const c = await prisma.expenseCategory.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName, description: `${catName} expenses for gym operations.` }
    });
    categoryMap[catName] = c.id;
  }

  // 6. Sample Expenses
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const sampleExpenses = [
    { expenseId: 'EXP-1001', categoryId: categoryMap['Rent'], description: 'Main gym facility monthly lease', amount: 3500, date: new Date(currentYear, currentMonth, 1), paidTo: 'Metropolis Real Estate Corp', paymentMethod: PaymentMethod.BankTransfer, remarks: 'Direct bank debit' },
    { expenseId: 'EXP-1002', categoryId: categoryMap['Electricity'], description: 'Power bill - AC and lighting', amount: 620, date: new Date(currentYear, currentMonth, 4), paidTo: 'City Power & Light', paymentMethod: PaymentMethod.Online, remarks: 'Autopay online' },
    { expenseId: 'EXP-1003', categoryId: categoryMap['Equipment'], description: 'Commercial dumbbell rack & Olympic bumper plates', amount: 1250, date: new Date(currentYear, currentMonth, 6), paidTo: 'Rogue Fitness Supplies', paymentMethod: PaymentMethod.Card, remarks: 'New equipment expansion' },
    { expenseId: 'EXP-1004', categoryId: categoryMap['Cleaning'], description: 'Sanitation supplies, disinfectant spray, towels', amount: 210, date: new Date(currentYear, currentMonth, 8), paidTo: 'Apex Janitorial Supplies', paymentMethod: PaymentMethod.Cash, remarks: 'Bi-weekly supplies' },
    { expenseId: 'EXP-1005', categoryId: categoryMap['Internet'], description: 'Fiber broadband & gym guest Wi-Fi', amount: 95, date: new Date(currentYear, currentMonth, 10), paidTo: 'FastNet Telecom', paymentMethod: PaymentMethod.Card, remarks: 'Monthly invoice' },
    { expenseId: 'EXP-1006', categoryId: categoryMap['Salary'], description: 'Staff payroll advance', amount: 1500, date: new Date(currentYear, currentMonth, 11), paidTo: 'Coaching staff', paymentMethod: PaymentMethod.BankTransfer, remarks: 'Mid-month distribution' }
  ];

  for (const exp of sampleExpenses) {
    await prisma.expense.upsert({
      where: { expenseId: exp.expenseId },
      update: {},
      create: {
        ...exp,
        createdById: superAdmin.id
      }
    });
  }

  // 7. Sample Members
  const sampleMembers = [
    {
      memberId: 'MBR-1001',
      fullName: 'Alexander Hayes',
      fatherName: 'Robert Hayes',
      phone: '+1 (555) 234-7711',
      email: 'alex.hayes@example.com',
      address: '14 Elm Street, Apt 3B',
      dob: new Date('1994-06-12'),
      gender: 'Male',
      joiningDate: new Date(currentYear, currentMonth - 2, 10),
      emergencyContact: 'Robert Hayes (Father)',
      emergencyPhone: '+1 (555) 234-7710',
      status: MemberStatus.Active,
      trainerId: trainer1.id,
      notes: 'Goal: Strength training for marathon prep.',
      planId: 'plan-3m',
      discount: 10,
      paidAmount: 150, // 160 - 10 = 150 net. Fully paid.
      startOffsetMonths: -2
    },
    {
      memberId: 'MBR-1002',
      fullName: 'Sophia Ramirez',
      fatherName: 'Carlos Ramirez',
      phone: '+1 (555) 482-9932',
      email: 'sophia.ramirez@example.com',
      address: '88 Oak Ridge Way',
      dob: new Date('1998-11-23'),
      gender: 'Female',
      joiningDate: new Date(currentYear, currentMonth - 1, 5),
      emergencyContact: 'Maria Ramirez (Mother)',
      emergencyPhone: '+1 (555) 482-9930',
      status: MemberStatus.Active,
      trainerId: trainer2.id,
      notes: 'Interested in HIIT and flexibility classes.',
      planId: 'plan-12m',
      discount: 20,
      paidAmount: 300, // 520 - 20 = 500 net. Partial payment: 300 paid, 200 remaining.
      startOffsetMonths: -1
    },
    {
      memberId: 'MBR-1003',
      fullName: 'David Sterling',
      fatherName: 'Edward Sterling',
      phone: '+1 (555) 773-1284',
      email: 'david.sterling@example.com',
      address: '502 Pinecrest Avenue',
      dob: new Date('1988-03-17'),
      gender: 'Male',
      joiningDate: new Date(currentYear, currentMonth, 2),
      emergencyContact: 'Linda Sterling (Spouse)',
      emergencyPhone: '+1 (555) 773-1280',
      status: MemberStatus.Active,
      trainerId: trainer1.id,
      notes: 'Senior accountant, evening training only.',
      planId: 'plan-1m',
      discount: 0,
      paidAmount: 60, // 60 net. Fully paid.
      startOffsetMonths: 0
    },
    {
      memberId: 'MBR-1004',
      fullName: 'Jessica Chen',
      fatherName: 'Wei Chen',
      phone: '+1 (555) 612-4491',
      email: 'jessica.chen@example.com',
      address: '210 University Blvd',
      dob: new Date('2002-09-04'),
      gender: 'Female',
      joiningDate: new Date(currentYear, currentMonth, 7),
      emergencyContact: 'Wei Chen (Father)',
      emergencyPhone: '+1 (555) 612-4490',
      status: MemberStatus.Active,
      notes: 'College track student.',
      planId: 'plan-student',
      discount: 0,
      paidAmount: 0, // Unpaid fee of 40!
      startOffsetMonths: 0
    },
    {
      memberId: 'MBR-1005',
      fullName: 'Lucas Bennett',
      fatherName: 'Arthur Bennett',
      phone: '+1 (555) 891-2309',
      email: 'lucas.b@example.com',
      address: '43 Highland Park',
      dob: new Date('1991-12-30'),
      gender: 'Male',
      joiningDate: new Date(currentYear, currentMonth - 4, 1),
      emergencyContact: 'Claire Bennett (Sister)',
      emergencyPhone: '+1 (555) 891-2300',
      status: MemberStatus.Expired,
      notes: 'Membership expired last week, follow up for renewal.',
      planId: 'plan-3m',
      discount: 0,
      paidAmount: 160,
      startOffsetMonths: -4 // Expired!
    },
    {
      memberId: 'MBR-1006',
      fullName: 'Emma Watson-Taylor',
      fatherName: 'George Taylor',
      phone: '+1 (555) 345-6789',
      email: 'emma.wt@example.com',
      address: '99 Maple Road',
      dob: new Date('1995-04-18'),
      gender: 'Female',
      joiningDate: new Date(currentYear, currentMonth - 1, 15),
      emergencyContact: 'John Taylor (Husband)',
      emergencyPhone: '+1 (555) 345-6780',
      status: MemberStatus.Active,
      trainerId: trainer2.id,
      notes: 'Expiring in 5 days, sent reminder notification.',
      planId: 'plan-1m',
      discount: 0,
      paidAmount: 60,
      startOffsetMonths: -1 // Expiring very soon!
    }
  ];

  let receiptCounter = 10001;

  for (const m of sampleMembers) {
    const existingMember = await prisma.member.findUnique({ where: { memberId: m.memberId } });
    if (!existingMember) {
      const createdMember = await prisma.member.create({
        data: {
          memberId: m.memberId,
          fullName: m.fullName,
          fatherName: m.fatherName,
          phone: m.phone,
          email: m.email,
          address: m.address,
          dob: m.dob,
          gender: m.gender,
          joiningDate: m.joiningDate,
          emergencyContact: m.emergencyContact,
          emergencyPhone: m.emergencyPhone,
          status: m.status,
          trainerId: m.trainerId,
          notes: m.notes
        }
      });

      // Find plan
      const plan = plans.find(p => p.id === m.planId)!;
      const startDate = new Date(currentYear, currentMonth + m.startOffsetMonths, 10);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + plan.duration);

      const netAmount = plan.price - m.discount;
      const remainingAmount = netAmount - m.paidAmount;
      const memStatus = remainingAmount <= 0 ? MembershipStatus.Paid : (m.paidAmount > 0 ? MembershipStatus.Partial : MembershipStatus.Unpaid);

      const membership = await prisma.membership.create({
        data: {
          memberId: createdMember.id,
          planId: plan.id,
          startDate,
          endDate,
          planPrice: plan.price,
          discount: m.discount,
          netAmount,
          paidAmount: m.paidAmount,
          remainingAmount,
          status: memStatus
        }
      });

      // Create payment transaction if paidAmount > 0
      if (m.paidAmount > 0) {
        receiptCounter++;
        const payStatus = remainingAmount <= 0 ? PaymentStatus.Paid : PaymentStatus.Partial;
        await prisma.payment.create({
          data: {
            receiptNumber: `RCP-${receiptCounter}`,
            memberId: createdMember.id,
            membershipId: membership.id,
            paymentDate: startDate,
            amount: m.paidAmount,
            paymentMethod: PaymentMethod.Card,
            previousBalance: netAmount,
            remainingBalance: remainingAmount,
            status: payStatus,
            remarks: `Initial membership registration fee for ${plan.name}`,
            receivedById: superAdmin.id
          }
        });
      }

      // Add Attendance history for active members
      if (m.status === MemberStatus.Active) {
        // Today's attendance
        await prisma.attendance.create({
          data: {
            memberId: createdMember.id,
            date: new Date(),
            checkIn: new Date(new Date().setHours(8, 30, 0, 0)),
            checkOut: new Date(new Date().setHours(10, 0, 0, 0)),
            status: 'Present',
            notes: 'Morning cardio & weights'
          }
        });

        // Yesterday's attendance
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        await prisma.attendance.create({
          data: {
            memberId: createdMember.id,
            date: yesterday,
            checkIn: new Date(new Date(yesterday).setHours(17, 15, 0, 0)),
            checkOut: new Date(new Date(yesterday).setHours(18, 45, 0, 0)),
            status: 'Present',
            notes: 'Evening session'
          }
        });
      }
    }
  }

  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      { title: 'New Member Registered', message: 'David Sterling joined TitanForge Fitness (Standard Monthly)', type: 'NEW_MEMBER' },
      { title: 'Fee Payment Received', message: 'Alexander Hayes paid $150.00 (Receipt #RCP-10002)', type: 'PAYMENT_RECEIVED' },
      { title: 'Pending Fee Alert', message: 'Jessica Chen has a pending fee balance of $40.00', type: 'PENDING_PAYMENT' },
      { title: 'Membership Expiring Soon', message: 'Emma Watson-Taylor membership expires in 5 days', type: 'EXPIRING_SOON' },
      { title: 'Membership Expired', message: 'Lucas Bennett membership has expired', type: 'EXPIRED' }
    ]
  });

  // 9. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      userName: superAdmin.name,
      action: 'SYSTEM_INITIALIZED',
      module: 'SYSTEM',
      description: 'TitanForge Fitness database initialized and seeded successfully.'
    }
  });

  console.log('Database seeded successfully!');
  console.log(`Admin account: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
