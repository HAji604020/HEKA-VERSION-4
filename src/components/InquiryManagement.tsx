import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  MapPin,
  Package,
  Sparkles,
  CheckCircle2,
  Clock,
  Mail,
  Send,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Info,
  Database,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import {
  CustomerInquiry,
  Language,
  NotificationProviderStatusSummary,
  NotificationDeliveryStatus,
  NotificationChannel,
  ChannelNotificationRecord
} from '../types';
import { translations } from '../translations';
import { api } from '../services/api';

interface InquiryManagementProps {
  inquiries: CustomerInquiry[];
  onSelectForAIReply: (inquiry: CustomerInquiry) => void;
  currentLang: Language;
  companyId?: string;
  onRefreshInquiries?: () => void;
}

export const InquiryManagement: React.FC<InquiryManagementProps> = ({
  inquiries,
  onSelectForAIReply,
  currentLang,
  companyId = 'comp_heka_ltd',
  onRefreshInquiries
}) => {
  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'fa' || currentLang === 'ps';

  const [localInquiries, setLocalInquiries] = useState<CustomerInquiry[]>(inquiries);
  const [providerStatus, setProviderStatus] = useState<NotificationProviderStatusSummary | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryFeedback, setRetryFeedback] = useState<{ id: string; text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    setLocalInquiries(inquiries);
  }, [inquiries]);

  useEffect(() => {
    api
      .getNotificationStatus(companyId)
      .then((res) => setProviderStatus(res))
      .catch(() => {});
  }, [companyId]);

  const handleRetryNotifications = async (inquiryId: string, channels?: NotificationChannel[]) => {
    setRetryingId(inquiryId);
    setRetryFeedback(null);
    try {
      const updated = await api.retryInquiryNotifications(inquiryId, channels);
      setLocalInquiries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (onRefreshInquiries) onRefreshInquiries();

      const statuses = updated.notifications
        ? [
            `Email: ${formatStatusLabel(updated.notifications.email.status)}`,
            `Telegram: ${formatStatusLabel(updated.notifications.telegram.status)}`,
            `WhatsApp: ${formatStatusLabel(updated.notifications.whatsapp.status)}`
          ].join(' • ')
        : 'Checked';

      setRetryFeedback({
        id: inquiryId,
        text: `Notification dispatch evaluated (${statuses}). Persisted request remains safely stored.`
      });
    } catch (err: any) {
      setRetryFeedback({
        id: inquiryId,
        text: err?.message || 'Retry attempt failed',
        isError: true
      });
    } finally {
      setRetryingId(null);
    }
  };

  function formatStatusLabel(status: NotificationDeliveryStatus): string {
    switch (status) {
      case 'sent_accepted':
        return isRtl ? 'تأیید و پذیرش سرویس‌دهنده' : 'Sent / Provider Accepted';
      case 'pending':
        return isRtl ? 'در انتظار ارسال' : 'Pending';
      case 'failed':
        return isRtl ? 'ناموفق (خطا)' : 'Failed';
      case 'not_configured':
      default:
        return isRtl ? 'پیکربندی نشده (Not Configured)' : 'Not Configured';
    }
  }

  function getStatusBadgeClasses(status: NotificationDeliveryStatus): string {
    switch (status) {
      case 'sent_accepted':
        return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
      case 'pending':
        return 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30';
      case 'failed':
        return 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30';
      case 'not_configured':
      default:
        return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30';
    }
  }

  const renderChannelCard = (
    inquiryId: string,
    label: string,
    record?: ChannelNotificationRecord
  ) => {
    const effectiveStatus: NotificationDeliveryStatus = record?.status || 'not_configured';
    const dest = record?.normalizedDestination || record?.destination || '—';
    const note = record?.providerNote || 'Provider not configured on server.';
    const attempts = record?.attempts ?? 0;

    return (
      <div className="p-3 rounded-2xl bg-white/55 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between gap-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-[#101C35] dark:text-white flex items-center gap-1.5">
            {record?.channel === 'email' && <Mail className="w-3.5 h-3.5 text-[#C9A96E]" />}
            {record?.channel === 'telegram' && <Send className="w-3.5 h-3.5 text-sky-500" />}
            {record?.channel === 'whatsapp' && <Phone className="w-3.5 h-3.5 text-emerald-500" />}
            <span>{label}</span>
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClasses(effectiveStatus)}`}
          >
            {formatStatusLabel(effectiveStatus)}
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate" title={dest}>
          Dest: {dest}
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {note}
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-white/5 text-[10px] text-slate-400">
          <span className="font-mono">
            Attempts: {attempts}
            {record?.providerMessageId ? ` • ID: ${record.providerMessageId}` : ''}
          </span>
          {effectiveStatus !== 'sent_accepted' && record?.channel && (
            <button
              type="button"
              disabled={retryingId === inquiryId}
              onClick={() => handleRetryNotifications(inquiryId, [record.channel])}
              className="font-bold text-[#101C35] dark:text-[#C9A96E] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${retryingId === inquiryId ? 'animate-spin' : ''}`} />
              <span>{isRtl ? 'تلاش مجدد' : 'Retry'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const dest = providerStatus?.destinations || {
    email: 'khanedriss5951@gmail.com',
    whatsappRaw: '0093728224060',
    whatsappNormalized: '+93728224060',
    telegramPublicLink: 'https://t.me/HEKA_480'
  };

  return (
    <div className="space-y-5">
      {/* 1. Title Header with Frosted Glass */}
      <div className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-extrabold text-[#101C35] dark:text-white">{t.tabInquiries}</h2>
            <span className="glass-badge-gold text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {localInquiries.length} {isRtl ? 'درخواست ذخیره‌شده' : 'Persisted Requests'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <Database className="w-3 h-3" />
              <span>{isRtl ? 'ذخیره تضمینی پیش از اعلان' : 'Save-Before-Notify Active'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? 'تمامی درخواست‌های پیش‌فاکتور ابتدا در پایگاه داده ذخیره شده و سپس وضعیت ارسال به ایمیل، تلگرام و واتساپ به صورت مجزا ثبت می‌گردد.'
              : 'All quotation requests are validated and persisted to the database first. Channel delivery statuses are tracked independently.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSetupGuide((prev) => !prev)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold glass-card hover:border-[#C9A96E]/50 text-[#101C35] dark:text-white flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Info className="w-3.5 h-3.5 text-[#C9A96E]" />
          <span>{isRtl ? 'راهنمای اتصال کانال‌های اعلان' : 'Provider Setup & Channel Status'}</span>
          {showSetupGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. Administrator Notification Destinations & Provider Readiness Summary */}
      <div className="glass-card p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/70 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C9A96E]" />
            <h3 className="text-xs sm:text-sm font-extrabold text-[#101C35] dark:text-white">
              {isRtl
                ? 'مقاصد اعلان مدیر HEKA LTD و وضعیت سرویس‌دهندگان سرور'
                : 'HEKA LTD Administrator Notification Destinations & Provider Readiness'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {isRtl ? 'کلیدهای امنیتی فقط در متغیرهای محیطی سرور نگهداری می‌شوند' : 'Secrets restricted to server-side environment variables'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Email Destination Card */}
          <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#101C35] dark:text-white flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span>Email Notification</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  providerStatus?.channels.email.configured
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                }`}
              >
                {providerStatus?.channels.email.configured ? 'Provider Configured' : 'Not Configured'}
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 font-semibold">
              {dest.email}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {providerStatus?.channels.email.configured
                ? `Active Provider: ${providerStatus.channels.email.providerName}`
                : 'Awaiting server env: RESEND_API_KEY or SENDGRID_API_KEY'}
            </p>
          </div>

          {/* WhatsApp Destination Card */}
          <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#101C35] dark:text-white flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>WhatsApp Business</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  providerStatus?.channels.whatsapp.configured
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                }`}
              >
                {providerStatus?.channels.whatsapp.configured ? 'Provider Configured' : 'Not Configured'}
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 font-semibold">
              {dest.whatsappNormalized} <span className="text-slate-400 font-normal">(raw: {dest.whatsappRaw})</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {providerStatus?.channels.whatsapp.configured
                ? 'Active Provider: Meta WhatsApp Business Cloud API'
                : 'Awaiting server env: WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID'}
            </p>
          </div>

          {/* Telegram Destination Card */}
          <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#101C35] dark:text-white flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-500" />
                <span>Telegram Bot API</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  providerStatus?.channels.telegram.configured
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                }`}
              >
                {providerStatus?.channels.telegram.configured ? 'Provider Configured' : 'Not Configured'}
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
              <span className="truncate">{dest.telegramPublicLink}</span>
              <a
                href={dest.telegramPublicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center"
                title="Public profile/channel reference"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {providerStatus?.channels.telegram.configured
                ? `Active Chat ID: ${providerStatus.destinations.telegramChatId || 'Configured in env'}`
                : 'Awaiting server env: TELEGRAM_BOT_TOKEN & numeric TELEGRAM_CHAT_ID'}
            </p>
          </div>
        </div>

        {/* Collapsible Setup Instructions for Unconfigured Providers */}
        {showSetupGuide && providerStatus && (
          <div className="p-4 rounded-2xl bg-slate-900/5 dark:bg-black/30 border border-slate-200/80 dark:border-white/10 space-y-3 text-xs">
            <div className="font-extrabold text-[#101C35] dark:text-[#C9A96E] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#C9A96E]" />
              <span>Required Server-Side Provider Setup Steps</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <strong className="block text-[#101C35] dark:text-white">1. Email ({dest.email})</strong>
                <ul className="list-disc ps-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {providerStatus.channels.email.setupInstructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <strong className="block text-[#101C35] dark:text-white">2. Telegram ({dest.telegramPublicLink})</strong>
                <ul className="list-disc ps-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {providerStatus.channels.telegram.setupInstructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <strong className="block text-[#101C35] dark:text-white">3. WhatsApp ({dest.whatsappNormalized})</strong>
                <ul className="list-disc ps-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {providerStatus.channels.whatsapp.setupInstructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Persisted Quotation Requests List */}
      {localInquiries.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-[#C9A96E]" />
          </div>
          <p className="font-bold text-slate-900 dark:text-white text-base">
            {tr(currentLang, 'No customer inquiries yet.', 'هنوز هیچ استعلامی ثبت نشده است.', 'تر اوسه د پېرودونکو کوم استعلام نشته.')}
          </p>
          <p className="text-xs max-w-md mx-auto">
            {tr(
              currentLang,
              'Incoming trade inquiries and wholesale RFQs from your public catalog will appear here in real-time.',
              'استعلام‌های تجاری و درخواست‌های پیش‌فاکتور عمده از کاتالوگ عمومی در اینجا نمایش داده می‌شوند.',
              'د عمومي کاتالوګ څخه راغلي تجارتي استعلامونه او د عمده نرخ غوښتنې به دلته ښکاره شي.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {localInquiries.map((inq) => (
            <div
              key={inq.id}
              className="glass-card rounded-3xl p-6 transition-all duration-200 hover:shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-200/80 dark:border-white/10 pb-3.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-xs ${
                      inq.inquiryType === 'wholesale_quote'
                        ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                        : inq.inquiryType === 'export_inquiry'
                        ? 'bg-blue-500/10 text-blue-900 dark:text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {inq.inquiryType.toUpperCase().replace('_', ' ')}
                  </span>
                  <h3 className="font-bold text-sm text-[#101C35] dark:text-white">{inq.customerName}</h3>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-[#101C35]/10 dark:bg-white/10 text-[#101C35] dark:text-[#C9A96E] font-bold">
                    {inq.requestReference || inq.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{tr(currentLang, 'Saved in DB', 'ذخیره در دیتابیس', 'په ډیټابیس کې ثبت شوی')}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(inq.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Inquiry Details Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xs">
                  <Phone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-900 dark:text-slate-200 truncate" dir="ltr" title={inq.customerContact}>
                    {inq.customerContact}
                    {inq.customerEmail && inq.customerEmail !== inq.customerContact ? ` • ${inq.customerEmail}` : ''}
                  </span>
                </div>

                {inq.customerLocation && (
                  <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xs">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="text-slate-900 dark:text-slate-200">{inq.customerLocation}</span>
                  </div>
                )}

                {inq.productName && (
                  <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xs">
                    <Package className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
                    <span className="truncate text-slate-900 dark:text-slate-200 font-medium">
                      {inq.productName} ({inq.requestedQuantity} {tr(currentLang, 'units', 'واحد', 'واحدونه')})
                      {inq.productId ? ` [${inq.productId}]` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Message text */}
              <div className="bg-white/60 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans shadow-inner backdrop-blur-xs">
                {inq.message}
              </div>

              {/* Channel Notification Delivery Tracking Section */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {tr(
                      currentLang,
                      'Multi-Channel Notification Status (Independent of Request Persistence)',
                      'وضعیت ارسال اعلان به کانال‌ها (مستقل از ذخیره‌سازی درخواست)',
                      'کانالونو ته د خبرتیا استولو حالت (په ډیټابیس کې له ثبت څخه خپلواک)'
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={retryingId === inq.id}
                    onClick={() => handleRetryNotifications(inq.id)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-[#101C35] dark:text-[#C9A96E] border border-slate-200/80 dark:border-white/10 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${retryingId === inq.id ? 'animate-spin' : ''}`} />
                    <span>
                      {retryingId === inq.id
                        ? tr(currentLang, 'Retrying Unsent Channels...', 'در حال بررسی و ارسال مجدد...', 'په بیا استولو کې...')
                        : tr(currentLang, 'Retry Unsent Notifications', 'بررسی / تلاش مجدد ارسال اعلان‌ها', 'نااستول شوې خبرتیاوې بیا استول')}
                    </span>
                  </button>
                </div>

                {retryFeedback && retryFeedback.id === inq.id && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium border ${
                      retryFeedback.isError
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200'
                    }`}
                  >
                    {retryFeedback.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {renderChannelCard(inq.id, tr(currentLang, 'Email Channel', 'کانال ایمیل', 'د برېښنالیک کانال'), inq.notifications?.email)}
                  {renderChannelCard(inq.id, tr(currentLang, 'Telegram Channel', 'کانال تلگرام', 'د ټیلیګرام کانال'), inq.notifications?.telegram)}
                  {renderChannelCard(inq.id, tr(currentLang, 'WhatsApp Channel', 'کانال واتساپ', 'د واټساپ کانال'), inq.notifications?.whatsapp)}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onSelectForAIReply(inq)}
                  className="px-4.5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#101C35] to-[#1c2e56] hover:from-[#192b52] hover:to-[#223a6c] dark:from-[#C9A96E] dark:to-[#d4b984] text-white dark:text-[#101C35] transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95 border border-[#C9A96E]/30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A96E] dark:text-[#101C35]" />
                  <span>{tr(currentLang, 'Draft Reply with AI Sales Assistant', 'پاسخ هوشمند با هوش مصنوعی', 'د پلور ځیرک مرستیال سره ځواب چمتو کړئ')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
