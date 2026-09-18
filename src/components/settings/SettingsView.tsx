import React, { useState, useEffect } from 'react';
import { GymSettingsData } from '../../types';
import { Settings, Save, Building2, Receipt, Phone, Mail, Globe, CheckCircle2, Send, AlertCircle, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  onSettingsUpdated?: (updated: GymSettingsData) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSettingsUpdated }) => {
  const [formData, setFormData] = useState<GymSettingsData>({
    id: '',
    gymName: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    currency: '$',
    receiptFooter: '',
    termsConditions: '',
    dateFormat: 'YYYY-MM-DD',
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // SMTP Testing State
  const [smtpStatus, setSmtpStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [checkingSmtp, setCheckingSmtp] = useState<boolean>(false);
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');
  const [sendingTestEmail, setSendingTestEmail] = useState<boolean>(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setFormData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkSmtp = async () => {
    setCheckingSmtp(true);
    try {
      const res = await fetch('/api/email/status');
      const data = await res.json();
      setSmtpStatus(data);
    } catch (err: any) {
      setSmtpStatus({ success: false, message: err?.message || 'Failed to check SMTP status' });
    } finally {
      setCheckingSmtp(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) return;
    setSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmailAddress })
      });
      const data = await res.json();
      if (res.ok) {
        setTestEmailResult({ success: true, message: data.message || 'Test email successfully sent!' });
      } else {
        setTestEmailResult({ success: false, message: data.error || 'Failed to send test email' });
      }
    } catch (err: any) {
      setTestEmailResult({ success: false, message: err?.message || 'Connection error while sending test email' });
    } finally {
      setSendingTestEmail(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    checkSmtp();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updated = await res.json();
        setFormData(updated);
        setSavedSuccess(true);
        if (onSettingsUpdated) onSettingsUpdated(updated);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>Gym Business Profile &amp; Receipt Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Branding, currency symbol, printed receipt header &amp; footer notes, and terms of service.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Gym settings updated successfully! Printed receipts and invoices now reflect your changes.</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
        {/* Business Identity */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Business Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gym Name *</label>
              <input
                type="text"
                required
                value={formData.gymName}
                onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency Symbol *</label>
              <input
                type="text"
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="e.g. $, €, £, ₹"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Official Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://titanforgegym.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Printed Receipt Configuration */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Printed Receipt Customization</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receipt Footer Slogan / Thank You Message</label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                placeholder="Thank you for your business! Stay Strong & Healthy."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Terms &amp; Conditions / Disclaimers on Receipt</label>
              <textarea
                rows={3}
                value={formData.termsConditions}
                onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
                placeholder="1. Fees once paid are non-refundable and non-transferable..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            id="save-settings-btn"
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Brevo SMTP & Email Configuration Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg border border-sky-100">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Brevo SMTP &amp; Transactional Email</h3>
              <p className="text-xs text-slate-500">
                Delivers automated welcome emails, official payment receipts, and membership expiry alerts to members.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={checkSmtp}
            disabled={checkingSmtp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingSmtp ? 'animate-spin' : ''}`} />
            <span>{checkingSmtp ? 'Testing...' : 'Check Status'}</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-lg border text-xs bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${smtpStatus?.success ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="font-semibold text-slate-700">Brevo Relay Status:</span>
              <span className={smtpStatus?.success ? 'text-emerald-700 font-medium' : 'text-amber-800'}>
                {smtpStatus ? smtpStatus.message : 'Checking connection...'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Host: smtp-relay.brevo.com:587</span>
          </div>

          {/* Test Email Dispatch Form */}
          <form onSubmit={handleSendTestEmail} className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Send Live Test Email</label>
            <p className="text-xs text-slate-500 mb-2">
              Enter your email to verify that Brevo credentials (<code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">SMTP_USER</code>, <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">SMTP_PASSWORD</code>) are delivering successfully.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sendingTestEmail || !testEmailAddress}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
              </button>
            </div>

            {testEmailResult && (
              <div
                className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testEmailResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {testEmailResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testEmailResult.message}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
