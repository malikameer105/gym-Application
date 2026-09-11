import React, { useState, useEffect } from 'react';
import { GymSettingsData } from '../../types';
import {
  FileBarChart2,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ReportsViewProps {
  settings?: GymSettingsData | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ settings }) => {
  const [reportType, setReportType] = useState<'pnl' | 'members' | 'fees' | 'expenses'>('pnl');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const [pnlData, setPnlData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/pnl?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        setPnlData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const currency = settings?.currency || '$';

  const totalRevenue = pnlData?.summary?.totalRevenue || 0;
  const totalExpenses = pnlData?.summary?.totalExpenses || 0;
  const netProfit = pnlData?.summary?.netProfit || 0;
  const isProfitable = netProfit >= 0;

  // Chart data
  const comparisonData = [
    {
      name: 'Financial Summary',
      Revenue: totalRevenue,
      Expenses: totalExpenses,
      NetProfit: netProfit
    }
  ];

  const categoryExpenses = (pnlData?.categoryExpenses || []).map((cat: any) => ({
    name: cat.categoryName,
    value: cat.total
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

  const exportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];

    if (reportType === 'pnl') {
      headers = ['Category / Item', 'Type', 'Amount'];
      rows = [
        ['Total Received Revenue', 'Income', totalRevenue],
        ['Total Operating Expenses', 'Expense', totalExpenses],
        ['Net Profit (Revenue - Expenses)', isProfitable ? 'Profit' : 'Loss', netProfit],
        ...categoryExpenses.map((c: any) => [`Expense Category: ${c.name}`, 'Expense', c.value])
      ];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-indigo-600" />
            <span>Reports &amp; Profit / Loss Financials</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Realized cashflow audit, operating profit margin, and expense category distributions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Range Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Period:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date();
              const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
              const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
              setStartDate(start);
              setEndDate(end);
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-700 cursor-pointer"
          >
            This Month
          </button>
          <button
            onClick={() => {
              const d = new Date();
              const start = new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10);
              const end = new Date().toISOString().slice(0, 10);
              setStartDate(start);
              setEndDate(end);
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-700 cursor-pointer"
          >
            Year to Date
          </button>
        </div>
      </div>

      {/* P&L Financial Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Actual Revenue Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Realized Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold font-mono text-emerald-700">
              {currency}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Actual cash collected in selected period
            </p>
          </div>
        </div>

        {/* Total Realized Expenses Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Operating Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold font-mono text-rose-700">
              {currency}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Facility, equipment, and staff overhead
            </p>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Net Profit / (Loss)
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isProfitable ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className={`text-2xl font-bold font-mono ${isProfitable ? 'text-emerald-700' : 'text-rose-700'}`}>
              {currency}{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Profit = Revenue &minus; Expenses
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            <span>Revenue vs. Expenses Breakdown</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${currency}${val}`} />
                <Tooltip
                  formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="NetProfit" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category Breakdown Pie */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-indigo-600" />
            <span>Expense Distribution by Category</span>
          </h3>

          {categoryExpenses.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No expenses recorded for this period.
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryExpenses}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryExpenses.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${currency}${Number(val).toFixed(2)}`, 'Spent']}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
