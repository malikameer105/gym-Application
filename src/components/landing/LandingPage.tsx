import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dumbbell,
  Users,
  CalendarCheck,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Activity,
  Receipt,
  UserCheck,
  DollarSign,
  PieChart,
  Mail,
  Zap,
  Clock,
  Sparkles,
  ExternalLink,
  Laptop,
  Check,
  HelpCircle,
  PhoneCall,
  Lock,
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'members' | 'financials'>('dashboard');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [systemHealth, setSystemHealth] = useState<'online' | 'checking' | 'offline'>('checking');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.status === 'healthy' || data.status === 'degraded')) {
          setSystemHealth('online');
        } else {
          setSystemHealth('offline');
        }
      })
      .catch(() => setSystemHealth('offline'));
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Member Lifecycle Management',
      badge: 'Core Engine',
      description:
        'Complete member registration with auto-generated unique Member IDs, status tracking (Active, Inactive, Expired, Suspended), emergency contacts, and medical profiles.'
    },
    {
      icon: CalendarCheck,
      title: 'Fast-Track Kiosk Check-In',
      badge: '<50ms Response',
      description:
        'Dedicated front-desk and kiosk mode allowing members to check in via Member ID or phone number. Tracks checkout timestamps and daily peak gym traffic.'
    },
    {
      icon: Dumbbell,
      title: 'Certified Trainer Management',
      badge: 'Load Balancing',
      description:
        'Manage fitness trainers, specializations, compensation models, and direct member assignments with visual client quotas and progress supervision.'
    },
    {
      icon: CreditCard,
      title: 'Multi-Tier Memberships',
      badge: 'Configurable',
      description:
        'Easily build flexible plan tiers (Monthly, Quarterly, Annual, VIP) with custom facility permissions, registration fees, and renewal automation.'
    },
    {
      icon: Receipt,
      title: 'Payment Receipts & Overdue Recovery',
      badge: 'Zero Slippage',
      description:
        'Record transactions across Cash, Card, Bank Transfer, and Online methods. Generate sequential invoice receipts with real-time balance tracking.'
    },
    {
      icon: PieChart,
      title: 'P&L Financial & Expense Audits',
      badge: 'Accounting Ready',
      description:
        'Track gym overhead across customized expense categories (rent, utilities, equipment, repairs). View net profit margins and monthly breakdown reports.'
    },
    {
      icon: Mail,
      title: 'Automated Brevo SMTP Email Relay',
      badge: 'Deliverability',
      description:
        'Automated dispatch of HTML payment receipts, new member welcome guides, and urgent membership expiration alerts powered by enterprise Brevo SMTP.'
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Multi-Role Security',
      badge: 'RBAC & Audit',
      description:
        'Fine-grained permissions for Super Admin, Admin/Manager, Receptionist, and Trainer with immutable system audit logging for compliance.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Configure Plans & Staff Roles',
      description:
        'Define membership packages, admission fees, and staff accounts with granular role-based permissions in under 5 minutes.'
    },
    {
      number: '02',
      title: 'Register Members & Assign Coaches',
      description:
        'Onboard members, assign custom membership plans, attach personal trainers, and automatically email welcome packs.'
    },
    {
      number: '03',
      title: 'Run Daily Kiosk Attendance & Payments',
      description:
        'Front-desk staff record check-ins with one keystroke, accept partial or full payments, and automatically dispatch branded receipts.'
    },
    {
      number: '04',
      title: 'Track P&L & Recover Pending Dues',
      description:
        'Audit daily gym operations, reconcile operational expenses, recover delinquent dues, and export detailed financial statements.'
    }
  ];

  const metrics = [
    { value: '<50ms', label: 'Front-Desk Kiosk Latency', caption: 'Instant barcode or ID validation' },
    { value: '100%', label: 'PostgreSQL ACID Reliability', caption: 'Strict relational data integrity' },
    { value: '0%', label: 'Manual Accounting Slippage', caption: 'Automated pending fee tracking' },
    { value: '24/7', label: 'Continuous Facility Access', caption: 'Automated Brevo receipt relay' }
  ];

  const testimonials = [
    {
      quote:
        'Before TitanForge, our front desk struggled with paper registers and lost track of overdue memberships. In the first month of switching, we recovered over $3,400 in delinquent fees.',
      author: 'Marcus Vance',
      role: 'Head of Operations, IronVault Athletic Club',
      rating: 5,
      members: '850+ Active Members'
    },
    {
      quote:
        'The kiosk check-in is lightning-fast during morning rush hour. Our trainers can see exactly who checked in and manage their client roster effortlessly from their own portal.',
      author: 'Elena Rostova',
      role: 'General Manager, Pulse High-Performance Gym',
      rating: 5,
      members: '1,200+ Active Members'
    },
    {
      quote:
        'The expense categorization and real-time P&L reports gave our board total clarity on equipment ROI and facility maintenance costs. Essential software for any serious gym.',
      author: 'David Chen',
      role: 'Managing Partner, Apex Strength & Conditioning',
      rating: 5,
      members: '540+ Active Members'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter Facility',
      tagline: 'Ideal for independent studios, boutique CrossFit boxes, and martial arts dojos.',
      monthlyPrice: 39,
      annualPrice: 29,
      features: [
        'Up to 250 Active Members',
        'Front-Desk Rapid Kiosk Check-In',
        'Multi-Tier Membership Plans',
        'Payment Receipts & Dues Tracker',
        'Brevo SMTP Welcome & Receipt Emails',
        '2 Staff / Trainer Accounts',
        'Standard Email Support'
      ],
      cta: 'Get Started with Starter',
      popular: false
    },
    {
      name: 'Commercial Club',
      tagline: 'Built for high-volume gyms, multi-discipline athletic centers, and fitness clubs.',
      monthlyPrice: 79,
      annualPrice: 59,
      features: [
        'Unlimited Active Members',
        'Kiosk Mode with Member ID & Phone Lookup',
        'Personal Trainer Client Quotas & Allocations',
        'Automated Expiry & Delinquency Alerts',
        'Full Expense Bookkeeping & P&L Analytics',
        'Automated Brevo SMTP Relay Integration',
        'Unlimited Staff & Multi-Role Access',
        'Priority Technical Support'
      ],
      cta: 'Deploy Commercial Club',
      popular: true
    },
    {
      name: 'Multi-Location Enterprise',
      tagline: 'Tailored for gym franchises, commercial chains, and university athletic complexes.',
      monthlyPrice: 149,
      annualPrice: 119,
      features: [
        'Multi-Branch Consolidated Dashboard',
        'Custom Dedicated PostgreSQL Database Pool',
        'Custom SMTP Relay Domain & Branded Templates',
        'Granular Audit Trail & Compliance Exports',
        'Automated Nightly Cloud Backups',
        'Dedicated Technical Account Manager',
        '99.9% Uptime Service Level Agreement'
      ],
      cta: 'Contact Enterprise Sales',
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'How does the member check-in kiosk operate during peak hours?',
      answer:
        'Front desk staff or members can enter their unique Member ID (e.g. TF-1001) or registered phone number. The system verifies active membership status in under 50 milliseconds, displays the member photo and valid plan, and records the check-in timestamp while preventing duplicate scans.'
    },
    {
      question: 'How does TitanForge recover pending and overdue membership dues?',
      answer:
        'The system continuously flags members whose subscription validity has elapsed or who carry an unpaid balance from installment billing. You can filter pending fees by plan, review balance histories, and trigger one-click email reminders via Brevo or record immediate counter settlements.'
    },
    {
      question: 'Is the backend fully compatible with PostgreSQL on Railway and Render?',
      answer:
        'Yes. The backend utilizes Prisma ORM with strict PostgreSQL connection pooling, auto-detects cloud-injected dynamic PORT variables (like those on Railway and Render), binds cleanly to 0.0.0.0, and exposes an unauthenticated /api/health endpoint for deployment uptime monitors.'
    },
    {
      question: 'How does transactional email work with Brevo SMTP?',
      answer:
        'TitanForge includes native Brevo (formerly Sendinblue) SMTP integration. Simply supply your BREVO_SMTP_USER and BREVO_SMTP_PASSWORD in your deployment dashboard to automatically dispatch branded HTML welcome emails, digital payment receipts, and expiration notices.'
    },
    {
      question: 'What access levels are available for my gym staff?',
      answer:
        'The platform supports 4 distinct user roles: Super Admin (full system access and configuration), Admin/Manager (daily operations, trainer management, financial reports), Receptionist (member enrollment, check-ins, fee collection), and Trainer (client assignments and attendance logs).'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION BAR */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white uppercase block leading-none">
                TitanForge
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mt-0.5">
                Gym Intelligence
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#showcase" className="hover:text-white transition-colors">
              Product Showcase
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="hover:text-white transition-colors">
              Benefits
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            {/* System Health Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  systemHealth === 'online'
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse'
                    : systemHealth === 'checking'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="capitalize">{systemHealth} API</span>
            </div>

            <button
              id="landing-signin-btn"
              onClick={onLaunchApp}
              className="px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all cursor-pointer"
            >
              Sign In
            </button>

            <button
              id="landing-launch-btn-nav"
              onClick={onLaunchApp}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            <Activity className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white"
            >
              Features
            </a>
            <a
              href="#showcase"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white"
            >
              Product Showcase
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white"
            >
              FAQ
            </a>
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchApp();
                }}
                className="w-full py-2.5 text-center text-xs font-bold text-white bg-indigo-600 rounded-xl"
              >
                Launch App
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Release Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Commercial Release v1.0 &bull; PostgreSQL &amp; Brevo SMTP Ready</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto uppercase leading-tight md:leading-[1.1]">
            Next-Generation <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300">
              Gym Management
            </span>{' '}
            &amp; Facility Intelligence
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Eliminate operational friction. Streamline member enrollments, rapid kiosk check-ins, multi-tier
            membership plans, trainer scheduling, automated receipt dispatch, and real-time P&amp;L reporting in one
            central command center.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              id="hero-primary-cta"
              onClick={onLaunchApp}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer group"
            >
              <span>Launch Staff Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#showcase"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-850 border border-slate-800 transition-all"
            >
              <Laptop className="w-4 h-4 text-slate-400" />
              <span>Explore Interactive Live UI</span>
            </a>
          </div>

          {/* Credibility badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Role-Based Access Control
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Live Brevo SMTP Relay
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Real PostgreSQL Persistence
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Zero Mock Interfaces
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. PRODUCT SHOWCASE / MOCK DASHBOARD INTERACTIVE PREVIEW */}
      {/* ------------------------------------------------------------- */}
      <section id="showcase" className="py-20 bg-slate-900/60 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Live Workspace Showcase</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
              Designed for Daily Front-Desk &amp; Executive Precision
            </p>
            <p className="mt-3 text-slate-400 text-sm">
              Inspect the exact workflows your staff and managers will operate every single day.
            </p>
          </div>

          {/* Showcase Tabs */}
          <div className="flex justify-center mb-8 overflow-x-auto pb-2">
            <div className="inline-flex p-1.5 bg-slate-950 border border-slate-800 rounded-2xl gap-1">
              {[
                { id: 'dashboard', label: 'Executive Stats', icon: TrendingUp },
                { id: 'attendance', label: 'Kiosk Check-In', icon: CalendarCheck },
                { id: 'members', label: 'Member Directory', icon: Users },
                { id: 'financials', label: 'P&L & Accounting', icon: PieChart }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulated App Frame */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Window title bar */}
            <div className="h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/70" />
                <span className="w-3 h-3 rounded-full bg-amber-500/70" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
                <span className="ml-3 text-[11px] font-mono text-slate-500">
                  titanforge-gym-production &bull; {activeTab}.view
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Active Production Feed</span>
              </div>
            </div>

            {/* Showcase View Contents */}
            <div className="p-6 sm:p-8">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-slate-400">Total Active Members</span>
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-black text-white">418</p>
                      <span className="text-[11px] text-emerald-400 font-semibold">&uarr; +14% this month</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-slate-400">Today&apos;s Check-Ins</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                          <CalendarCheck className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-black text-white">124</p>
                      <span className="text-[11px] text-slate-400 font-medium">Peak: 6:00 PM &ndash; 8:30 PM</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-slate-400">Monthly Revenue</span>
                        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-black text-white">$28,450</p>
                      <span className="text-[11px] text-emerald-400 font-semibold">92% Collection rate</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-slate-400">Pending Dues</span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                          <Receipt className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-black text-amber-400">$1,620</p>
                      <span className="text-[11px] text-slate-400 font-medium">11 accounts flagged</span>
                    </div>
                  </div>

                  {/* Operational Summary Mockup */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Rapid Actions Bar</h4>
                      <p className="text-xs text-slate-400">
                        Immediate access to check-in scanner, membership billing, and trainer assignment.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={onLaunchApp}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                      >
                        Open Live Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        ID
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Front-Desk Fast Lookup</p>
                        <p className="text-xs text-slate-400">Scans Member IDs &amp; Phone numbers instantly</p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400">
                      Sample Scan: TF-1042 &bull; Validated
                    </div>
                  </div>

                  {/* Attendance Log Table Mockup */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-3">Member</th>
                          <th className="p-3">Plan</th>
                          <th className="p-3">Check-In Time</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        <tr>
                          <td className="p-3 font-semibold text-white">Alexander Cross (TF-1088)</td>
                          <td className="p-3 text-slate-300">Gold Annual Membership</td>
                          <td className="p-3 font-mono text-slate-400">Today, 06:15 PM</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                              Verified
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">Sophia Martinez (TF-1042)</td>
                          <td className="p-3 text-slate-300">Personal Training VIP</td>
                          <td className="p-3 font-mono text-slate-400">Today, 06:22 PM</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                              Verified
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">James Sterling (TF-1102)</td>
                          <td className="p-3 text-slate-300">Quarterly Strength Pass</td>
                          <td className="p-3 font-mono text-slate-400">Today, 06:48 PM</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">
                              Due Alert
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <p className="text-sm font-bold text-white">Enrolled Athlete Directory</p>
                    <span className="text-xs font-medium text-slate-400">
                      Filtering: Active &bull; Trainer Assigned
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        name: 'Marcus Brody',
                        id: 'TF-1014',
                        plan: 'Diamond Annual',
                        trainer: 'Coach Liam Vance',
                        status: 'Active'
                      },
                      {
                        name: 'Claire Kensington',
                        id: 'TF-1035',
                        plan: 'Monthly Unlimited',
                        trainer: 'Coach Sarah Miller',
                        status: 'Active'
                      },
                      {
                        name: 'Damian Cole',
                        id: 'TF-1077',
                        plan: 'Athlete Pro VIP',
                        trainer: 'Coach Liam Vance',
                        status: 'Active'
                      }
                    ].map((m) => (
                      <div key={m.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-bold text-indigo-400">{m.id}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">
                            {m.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{m.name}</h4>
                        <p className="text-xs text-slate-400">{m.plan}</p>
                        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{m.trainer}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'financials' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <span className="text-xs font-semibold text-slate-400">Gross Monthly Inflow</span>
                      <p className="mt-2 text-xl font-black text-emerald-400">$34,800.00</p>
                      <span className="text-[10px] text-slate-500">Subscriptions &amp; Personal Training</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <span className="text-xs font-semibold text-slate-400">Total Operating Expenses</span>
                      <p className="mt-2 text-xl font-black text-rose-400">$12,450.00</p>
                      <span className="text-[10px] text-slate-500">Rent, utilities &amp; equipment repair</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <span className="text-xs font-semibold text-slate-400">Net Operational Margin</span>
                      <p className="mt-2 text-xl font-black text-sky-400">+$22,350.00</p>
                      <span className="text-[10px] text-emerald-400 font-bold">64.2% Net Margin</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    Audited continuously with sequential receipt generation and double-entry style ledger records.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. FEATURES SECTION */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Engineered For Commercial Gyms</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
            Complete Operations Suite. Zero Bloat.
          </p>
          <p className="mt-3 text-slate-400 text-sm">
            Every feature is natively supported in TitanForge and actively backed by production APIs and PostgreSQL.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. HOW IT WORKS (ONBOARDING WORKFLOW) */}
      {/* ------------------------------------------------------------- */}
      <section id="workflow" className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Execution Workflow</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
              From First Login to Full Automation
            </p>
            <p className="mt-3 text-slate-400 text-sm">
              Standardized operational cadence that empowers your front desk and accounting team.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="relative p-6 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-3xl font-black text-indigo-500/30 block mb-2 font-mono">{step.number}</span>
                <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. BENEFITS SECTION */}
      {/* ------------------------------------------------------------- */}
      <section id="benefits" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Measurable Value</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Why Facility Owners &amp; General Managers Choose TitanForge
            </h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Traditional spreadsheets and legacy desktop software result in unaccounted cash payments, uncollected
              renewal dues, and chaotic front desk lines. TitanForge creates institutional order.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  title: 'Zero Revenue Leakage',
                  desc: 'Every fee, cash transaction, and partial installment is logged with immutable digital receipts.'
                },
                {
                  title: 'Instant Front-Desk Check-Ins',
                  desc: 'Sub-50ms member verification stops queue bottlenecks during peak morning and evening hours.'
                },
                {
                  title: 'Automated Brevo Communication',
                  desc: 'Send professional PDF-style receipts and expiration reminders without manual email drafting.'
                },
                {
                  title: 'Role-Based Delegation',
                  desc: 'Restrict financial reports and audit logs to Super Admins while giving receptionists pure check-in speed.'
                }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-emerald-500/10 text-emerald-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Production Architecture Assurance</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span>Database Engine</span>
                <span className="font-mono text-indigo-400 font-bold">PostgreSQL (Prisma ORM)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span>Backend Port Resolution</span>
                <span className="font-mono text-emerald-400 font-bold">Dynamic process.env.PORT</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span>Health Monitoring</span>
                <span className="font-mono text-sky-400 font-bold">GET /api/health (200 OK)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span>Email Provider</span>
                <span className="font-mono text-amber-400 font-bold">Brevo Transactional SMTP</span>
              </div>
            </div>
            <button
              onClick={onLaunchApp}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Sign In to Verify Architecture
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. STATISTICS / METRICS SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 bg-indigo-950/40 border-y border-indigo-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {metrics.map((m, idx) => (
              <div key={idx}>
                <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-mono">{m.value}</p>
                <p className="mt-2 text-xs sm:text-sm font-bold text-indigo-300">{m.label}</p>
                <p className="mt-1 text-[11px] text-slate-400">{m.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. TESTIMONIALS */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Athletic Director Feedback</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
            Trusted by Commercial Fitness Leaders
          </p>
          <p className="mt-3 text-slate-400 text-sm">
            Read how facility owners use TitanForge to run high-volume athletic centers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i}>&#9733;</span>
                  ))}
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm font-bold text-white">{t.author}</p>
                <p className="text-xs text-slate-400">{t.role}</p>
                <span className="inline-block mt-2 text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  {t.members}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. PRICING SECTION */}
      {/* ------------------------------------------------------------- */}
      <section id="pricing" className="py-24 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Transparent Pricing</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
              Predictable Investment for Growing Clubs
            </p>
            <p className="mt-3 text-slate-400 text-sm">
              All plans include complete member database access, kiosk check-in, and PostgreSQL persistence.
            </p>

            {/* Monthly / Annual Switcher */}
            <div className="mt-6 inline-flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                  Save 25%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {pricingPlans.map((plan, idx) => {
              const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
              return (
                <div
                  key={idx}
                  className={`p-8 rounded-3xl border flex flex-col justify-between relative transition-all ${
                    plan.popular
                      ? 'bg-slate-900 border-indigo-500 shadow-2xl shadow-indigo-600/20'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                      Most Popular For Commercial Gyms
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="mt-1 text-xs text-slate-400 min-h-[36px]">{plan.tagline}</p>

                    <div className="my-6">
                      <span className="text-4xl font-black text-white font-mono">${price}</span>
                      <span className="text-xs text-slate-400"> / month</span>
                      {billingCycle === 'annual' && (
                        <p className="text-[10px] text-emerald-400 font-semibold mt-1">Billed annually (${price * 12}/yr)</p>
                      )}
                    </div>

                    <div className="space-y-3 pt-6 border-t border-slate-800">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={onLaunchApp}
                    className={`mt-8 w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      plan.popular
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. FAQ SECTION */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Technical &amp; Operational FAQ</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </p>
          <p className="mt-3 text-slate-400 text-sm">
            Everything you need to know about deploying and operating TitanForge.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-400' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. FINAL CALL TO ACTION */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/30 to-slate-950 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-6">
            <Dumbbell className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Ready to Upgrade Your Gym&apos;s Operations?
          </h2>
          <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
            Experience the difference that automated check-ins, instantaneous receipt emails, and complete financial
            clarity bring to your fitness enterprise.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="final-cta-launch-btn"
              onClick={onLaunchApp}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Access Production System</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. PROFESSIONAL FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-black text-sm mb-3">
              <Dumbbell className="w-4 h-4 text-indigo-500" />
              <span>TITANFORGE GYM SOFTWARE</span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4">
              Production-grade facility management platform for athletic clubs, strength conditioning facilities, and
              commercial gyms.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Uptime Target: 99.9%</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-3">Core Modules</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Member Roster &amp; Profiles</li>
              <li>Attendance Kiosk Engine</li>
              <li>Trainer Load Allocation</li>
              <li>Multi-Tier Memberships</li>
              <li>P&amp;L Financial Ledger</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-3">Deployment Target</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Backend: Railway / Render</li>
              <li>Frontend: Vercel CDN</li>
              <li>Database: PostgreSQL (Neon / Supabase)</li>
              <li>Email: Brevo SMTP Relay</li>
              <li>Healthcheck: /api/health</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-3">Quick Access</h4>
            <div className="space-y-2">
              <button
                onClick={onLaunchApp}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-200 font-semibold text-center block cursor-pointer transition-colors"
              >
                Sign In to Staff Dashboard
              </button>
              <a
                href="/api/health"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 font-mono text-[11px] text-center block"
              >
                Inspect Live /api/health JSON
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
          <p>&copy; {new Date().getFullYear()} TitanForge Gym Management Systems. All rights reserved.</p>
          <p className="font-mono text-slate-600">
            Engineered with React 19 &bull; Vite &bull; Node.js &bull; Express &bull; Prisma &bull; Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
};
