import React from 'react';
import { Payment, GymSettingsData } from '../../types';
import { Printer, X, CheckCircle2, Building2 } from 'lucide-react';

interface ReceiptModalProps {
  payment: Payment | null;
  settings?: GymSettingsData | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, settings, onClose }) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = settings?.currency || '$';
  const gymName = settings?.gymName || 'TitanForge Fitness & Athletics';
  const gymAddress = settings?.address || '742 Olympia Boulevard, Suite 100';
  const gymPhone = settings?.phone || '+1 (555) 839-4467';
  const gymEmail = settings?.email || 'management@titanforgegym.com';
  const receiptFooter = settings?.receiptFooter || 'Thank you for your business! Stay Strong & Healthy.';
  const terms = settings?.termsConditions || '1. Membership fees are non-refundable.\n2. Gym rules and safety regulations must be observed at all times.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 print:border-0 print:shadow-none print:max-w-none print:w-full">
        {/* Action Header - hidden when printing */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-slate-800">Official Payment Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              id="close-receipt-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 text-slate-800 print:p-0">
          {/* Gym Header */}
          <div className="border-b border-slate-200 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-2 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">{gymName}</h2>
            <p className="text-xs text-slate-500 mt-1">{gymAddress}</p>
            <p className="text-xs text-slate-500">Phone: {gymPhone} &bull; Email: {gymEmail}</p>
            <div className="mt-3 inline-block bg-slate-100 text-slate-700 text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full border border-slate-200">
              Receipt No: {payment.receiptNumber}
            </div>
          </div>

          {/* Member & Receipt Meta */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px]">Member Details</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{payment.member?.fullName || 'Valued Member'}</p>
              <p className="text-slate-600 font-mono text-xs">ID: {payment.member?.memberId || 'N/A'}</p>
              <p className="text-slate-500">{payment.member?.phone || ''}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-medium uppercase text-[10px]">Date & Method</span>
              <p className="font-semibold text-slate-800 text-xs mt-0.5">
                {new Date(payment.paymentDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <p className="text-slate-600">Payment: <span className="font-medium text-slate-900">{payment.paymentMethod}</span></p>
              <p className="text-slate-500">Cashier: {payment.receivedBy?.name || 'Staff'}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-4 border-b border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                  <th className="text-left pb-2 font-semibold">Description</th>
                  <th className="text-center pb-2 font-semibold">Status</th>
                  <th className="text-right pb-2 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3">
                    <p className="font-medium text-slate-900">{payment.membership?.plan?.name || 'Gym Membership Subscription'}</p>
                    <p className="text-slate-400 text-[11px]">{payment.remarks || 'Membership subscription payment'}</p>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      payment.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-slate-900">
                    {currency}{payment.amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="py-4 border-b border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Fee Billed:</span>
              <span className="font-mono">{currency}{payment.previousBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
              <span>Amount Paid:</span>
              <span className="font-mono text-emerald-600">{currency}{payment.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Remaining Balance:</span>
              <span className={`font-mono font-semibold ${payment.remainingBalance > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                {currency}{payment.remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer & Terms */}
          <div className="pt-4 text-center">
            <p className="text-xs font-semibold text-slate-700">{receiptFooter}</p>
            <p className="text-[10px] text-slate-400 mt-2 whitespace-pre-line leading-relaxed">{terms}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
