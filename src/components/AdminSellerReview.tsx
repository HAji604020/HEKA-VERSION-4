import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  AlertTriangle,
  FileText,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { SellerApplication, SellerStatus, Language } from '../types';
import { api } from '../services/api';
import { tr } from '../translations';

interface AdminSellerReviewProps {
  currentLang: Language;
}

export const AdminSellerReview: React.FC<AdminSellerReviewProps> = ({ currentLang }) => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  // Rejection modal
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isRtl = currentLang === 'fa' || currentLang === 'ps';

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminSellerApplications();
      setApplications(data);
    } catch (err) {
      console.error('Failed to load seller applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await api.reviewSellerApplication(id, 'approved', 'Approved by HEKA LTD Compliance');
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setFeedback(
        tr(
          currentLang,
          'Seller application approved.',
          'درخواست فروشندگی تایید شد.',
          'د پلورونکي غوښتنلیک تایید شو.'
        )
      );
    } catch (err: any) {
      setFeedback(err.message || 'Failed to approve seller');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingAppId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await api.reviewSellerApplication(
        rejectingAppId,
        'rejected',
        adminNotes || 'Trade credentials did not meet compliance criteria',
        rejectionReason || 'Incomplete documentation or unverified business registration'
      );
      setApplications((prev) => prev.map((a) => (a.id === rejectingAppId ? updated : a)));
      setRejectingAppId(null);
      setRejectionReason('');
      setAdminNotes('');
      setFeedback(
        tr(
          currentLang,
          'Seller application rejected.',
          'درخواست فروشندگی رد شد.',
          'د پلورونکي غوښتنلیک رد شو.'
        )
      );
    } catch (err: any) {
      setFeedback(err.message || 'Failed to reject seller');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await api.reviewSellerApplication(id, 'suspended', 'Suspended by Administrator');
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setFeedback(
        tr(
          currentLang,
          'Seller privileges suspended.',
          'دسترسی فروشنده تعلیق شد.',
          'د پلورونکي لاسرسی وځنډول شو.'
        )
      );
    } catch (err: any) {
      setFeedback(err.message || 'Failed to suspend seller');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (filter !== 'all' && app.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        app.businessName.toLowerCase().includes(q) ||
        app.applicantName.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        app.country.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filterLabels: Record<'all' | 'pending' | 'approved' | 'rejected', string> = {
    all: tr(currentLang, 'All', 'همه', 'ټول'),
    pending: tr(currentLang, 'Pending', 'در انتظار بررسی', 'تر بیاکتنې لاندې'),
    approved: tr(currentLang, 'Approved', 'تاییدشده', 'تایید شوي'),
    rejected: tr(currentLang, 'Rejected', 'ردشده', 'رد شوي')
  };

  return (
    <div className="space-y-6 text-[#172033] dark:text-[#E2E8F0]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#C9A96E]" />
            <h2 className="text-xl font-extrabold text-[#101C35] dark:text-white">
              {tr(
                currentLang,
                'Seller Applications & Compliance Review',
                'بررسی و تایید درخواست‌های فروشندگان',
                'د پلورونکو غوښتنلیکونه او قانوني بیاکتنه'
              )}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {tr(
              currentLang,
              'Authorize or reject merchant applications. Strictly governed: business accounts alone do NOT grant seller rights.',
              'درخواست‌های همکاری تجاری را بررسی کنید. ثبت‌نام حساب حقوقی به تنهایی مجوز فروشندگی ایجاد نمی‌کند.',
              'د سوداګرو غوښتنلیکونه تایید یا رد کړئ. یوازې د سوداګریز حساب ثبتول د پلورونکي حق نه ورکوي.'
            )}
          </p>
        </div>

        <button
          onClick={loadApplications}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{tr(currentLang, 'Refresh', 'بروزرسانی', 'تازه کول')}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/30 text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-1.5 p-1 rounded-xl bg-white/60 dark:bg-[#101C35]/60 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                filter === status
                  ? 'bg-[#101C35] text-white dark:bg-[#C9A96E] dark:text-[#101C35]'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {filterLabels[status]}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr(
              currentLang,
              'Search business, applicant, country...',
              'جستجوی شرکت، متقاضی یا کشور...',
              'د شرکت، غوښتونکي یا هېواد پلټنه...'
            )}
            className="w-full pe-3 py-2 ps-9 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
          />
          <Search className="absolute start-3 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-[#101C35]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 text-xs text-gray-500">
          {tr(
            currentLang,
            'No seller applications found matching the selected filter.',
            'هیچ درخواست فروشندگی مطابق فیلتر انتخابی یافت نشد.',
            'د ټاکل شوي فلټر سره هیڅ غوښتنلیک ونه موندل شو.'
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="p-6 rounded-3xl bg-white/80 dark:bg-[#101C35]/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[#101C35] dark:text-white">
                      {app.businessName}
                    </h3>
                    {app.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {tr(currentLang, 'Pending Review', 'در انتظار بررسی', 'تر بیاکتنې لاندې')}
                      </span>
                    )}
                    {app.status === 'approved' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {tr(currentLang, 'Approved', 'تاییدشده', 'تایید شوی')}
                      </span>
                    )}
                    {app.status === 'rejected' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {tr(currentLang, 'Rejected', 'ردشده', 'رد شوی')}
                      </span>
                    )}
                    {app.status === 'suspended' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-500/15 text-gray-600 dark:text-gray-400 border border-gray-500/30">
                        {tr(currentLang, 'Suspended', 'تعلیق‌شده', 'ځنډول شوی')}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {app.applicantName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1" dir="ltr">
                      <Mail className="w-3.5 h-3.5" />
                      {app.email}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {app.city}, {app.country}
                    </span>
                  </p>
                </div>

                {/* Review Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {app.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{tr(currentLang, 'Approve Seller', 'تایید فروشنده', 'پلورونکی تایید کړئ')}</span>
                    </button>
                  )}

                  {app.status !== 'rejected' && (
                    <button
                      onClick={() => {
                        setRejectingAppId(app.id);
                        setRejectionReason('Insufficient documentation or verification mismatch');
                      }}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{tr(currentLang, 'Reject Application', 'رد درخواست', 'غوښتنلیک رد کړئ')}</span>
                    </button>
                  )}

                  {app.status === 'approved' && (
                    <button
                      onClick={() => handleSuspend(app.id)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      {tr(currentLang, 'Suspend', 'تعلیق', 'ځنډول')}
                    </button>
                  )}
                </div>
              </div>

              {/* Application Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-black/5 dark:bg-white/5 p-4 rounded-2xl mb-3">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">
                    {tr(currentLang, 'Business Sector', 'بخش تجاری', 'سوداګریزه برخه')}
                  </span>
                  <span className="font-semibold">{app.businessType}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">
                    {tr(currentLang, 'Product Categories', 'دسته‌بندی کالاها', 'د محصولاتو کټګورۍ')}
                  </span>
                  <span className="font-semibold">{app.productCategories?.join(', ')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">
                    {tr(currentLang, 'Registration Number', 'شماره ثبت شرکت', 'د ثبت شمېره')}
                  </span>
                  <span className="font-semibold">{app.registrationNumber || tr(currentLang, 'Not provided', 'ثبت نشده', 'نه دی ورکړل شوی')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">
                    {tr(currentLang, 'Submission Date', 'تاریخ ثبت', 'د سپارلو نېټه')}
                  </span>
                  <span className="font-semibold">{new Date(app.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="text-xs text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-400 block mb-0.5">
                  {tr(currentLang, 'Applicant Statement & Capacity:', 'شرح فعالیت و ظرفیت تامین:', 'د غوښتونکي شرحه او د تامین ظرفیت:')}
                </span>
                <p className="italic">"{app.description}"</p>
              </div>

              {app.rejectionReason && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 text-xs text-red-600 dark:text-red-400">
                  <span className="font-bold">{tr(currentLang, 'Rejection Reason:', 'دلیل رد:', 'د رد لامل:')}</span> {app.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl p-6 bg-white dark:bg-[#101C35] border border-white/20 shadow-2xl">
            <h3 className="text-base font-bold text-[#101C35] dark:text-white mb-2">
              {tr(currentLang, 'Reject Seller Application', 'رد درخواست فروشندگی', 'د پلورونکي غوښتنلیک ردول')}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {tr(
                currentLang,
                'Specify the reason for rejection. This will be visible to the applicant to allow them to rectify and re-apply.',
                'دلیل رد درخواست را بنویسید. این پیام برای متقاضی قابل مشاهده خواهد بود تا نواقص را برطرف کند.',
                'د رد لامل ولیکئ. دا به غوښتونکي ته ښکاره شي ترڅو نیمګړتیاوې حل کړي.'
              )}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">
                  {tr(currentLang, 'Reason for Rejection *', 'دلیل رد درخواست *', 'د رد لامل *')}
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete export license or unverifiable company registry"
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">
                  {tr(currentLang, 'Internal Admin Notes (Optional)', 'یادداشت داخلی مدیریت (اختیاری)', 'د مدیریت داخلي یادښت (اختیاري)')}
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal reference notes"
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setRejectingAppId(null)}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-semibold cursor-pointer"
              >
                {tr(currentLang, 'Cancel', 'انصراف', 'لغوه')}
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                {actionLoading
                  ? tr(currentLang, 'Processing...', 'در حال ثبت...', 'په پروسس کې...')
                  : tr(currentLang, 'Confirm Rejection', 'تایید رد درخواست', 'ردول تایید کړئ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
