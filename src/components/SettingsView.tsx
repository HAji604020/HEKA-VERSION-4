import React, { useState, useEffect } from 'react';
import { Save, Check, Sun, Moon, Laptop, Sparkles, Mail, Phone, Send, ShieldCheck } from 'lucide-react';
import { Company, User, Language, NotificationProviderStatusSummary } from '../types';
import { translations, tr } from '../translations';
import { api } from '../services/api';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface SettingsViewProps {
  company: Company;
  currentUser: User;
  onRefresh: () => void;
  currentLang: Language;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  company,
  currentUser,
  onRefresh,
  currentLang,
}) => {
  const { theme, effectiveTheme, setTheme } = useTheme();
  const t = translations[currentLang] || translations.en;

  const defaultDest = company.settings.notificationDestinations || {
    email: 'khanedriss5951@gmail.com',
    whatsappRaw: '0093728224060',
    whatsappNormalized: '+93728224060',
    telegramPublicLink: 'https://t.me/HEKA_480',
    telegramChatId: '',
    enabledChannels: { email: true, telegram: true, whatsapp: true }
  };

  const [formData, setFormData] = useState({
    name: company.name,
    industry: company.industry,
    contactPhone: company.contactPhone,
    contactEmail: company.contactEmail,
    address: company.address,
    currency: company.currency,
    showRetailPricesPublicly: company.settings.showRetailPricesPublicly,
    allowWholesaleQuoteRequests: company.settings.allowWholesaleQuoteRequests,
    primaryColor: company.brandColors.primary || '#101C35',
    accentColor: company.brandColors.accent || '#C9A96E',
    notifEmail: defaultDest.email,
    notifWhatsappRaw: defaultDest.whatsappRaw,
    notifTelegramLink: defaultDest.telegramPublicLink,
    notifTelegramChatId: defaultDest.telegramChatId || '',
    enableEmail: defaultDest.enabledChannels?.email ?? true,
    enableTelegram: defaultDest.enabledChannels?.telegram ?? true,
    enableWhatsapp: defaultDest.enabledChannels?.whatsapp ?? true
  });

  const [providerStatus, setProviderStatus] = useState<NotificationProviderStatusSummary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getNotificationStatus(company.id)
      .then((res) => setProviderStatus(res))
      .catch(() => {});
  }, [company.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      const updatedNotif = await api.updateNotificationSettings({
        companyId: company.id,
        email: formData.notifEmail,
        whatsappRaw: formData.notifWhatsappRaw,
        telegramPublicLink: formData.notifTelegramLink,
        telegramChatId: formData.notifTelegramChatId,
        enabledChannels: {
          email: formData.enableEmail,
          telegram: formData.enableTelegram,
          whatsapp: formData.enableWhatsapp
        }
      });
      setProviderStatus(updatedNotif);

      await api.updateCompany(company.id, {
        name: formData.name,
        industry: formData.industry,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        address: formData.address,
        currency: formData.currency,
        brandColors: {
          primary: formData.primaryColor,
          accent: formData.accentColor,
          background: company.brandColors.background || '#F5F7FA'
        },
        settings: {
          ...company.settings,
          showRetailPricesPublicly: formData.showRetailPricesPublicly,
          allowWholesaleQuoteRequests: formData.allowWholesaleQuoteRequests,
          notificationDestinations: updatedNotif.destinations
        }
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      onRefresh();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const themeOptions: {
    id: ThemeMode;
    title: string;
    description: string;
    icon: typeof Sun;
    previewBg: string;
    previewBorder: string;
  }[] = [
    {
      id: 'light',
      title: t.themeLight,
      description: tr(
        currentLang,
        'White frosted-glass surfaces, translucent panels with visible subtle blur, and navy typography.',
        'سطوح شیشه‌ای مات سفید، پس‌زمینه تمیز روشن، خطوط مرزی ظریف و متن خوانای سرمه‌ای',
        'سپینې ماتې ښیښه‌ییزې سطحې، روښانه شالید، نازکې پولې او روښانه سرمه‌يي لیکبڼه'
      ),
      icon: Sun,
      previewBg: 'bg-white/80',
      previewBorder: 'border-slate-300'
    },
    {
      id: 'dark',
      title: t.themeDark,
      description: tr(
        currentLang,
        'Dark navy frosted surfaces (#101C35) over #0B1220 background, subtle borders, and gold accents.',
        'سطوح شیشه‌ای مات سرمه‌ای تیره (#101C35) روی پس‌زمینه #0B1220، متن روشن و خطوط طلایی',
        'په #0B1220 شالید باندې تیاره سرمه‌يي ماتې ښیښه‌ییزې سطحې (#101C35) او طلایي کرښې'
      ),
      icon: Moon,
      previewBg: 'bg-[#101C35]/90 text-white',
      previewBorder: 'border-[#C9A96E]/50'
    },
    {
      id: 'system',
      title: t.themeSystem,
      description: tr(
        currentLang,
        'Automatically respects operating system dark/light preferences and listens for real-time changes.',
        'هماهنگی خودکار با تنظیمات سیستم‌عامل کاربر (تاریک یا روشن) همراه با گوش‌به‌زنگ زنده',
        'د کاروونکي د عملیاتي سیسټم (تیاره یا روښانه) تنظیماتو سره اتوماتیک سمون'
      ),
      icon: Laptop,
      previewBg: 'bg-gradient-to-r from-white/70 to-[#101C35]/80',
      previewBorder: 'border-slate-400'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#101C35] dark:text-slate-100 tracking-tight">
              {t.tabSettings}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md glass-badge-gold uppercase tracking-wider">
              {t.glassDesignBadge}
            </span>
          </div>
          <p className="text-xs text-[#5A657D] dark:text-slate-400 mt-1">
            {tr(
              currentLang,
              'Configure corporate identity, frosted glass themes, settlement currencies, and public storefront preferences.',
              'پیکربندی هویت شرکتی، تم ظاهری گلس‌مورفیسم، ارز مبادلاتی و تنظیمات کاتالوگ عمومی',
              'د شرکت هویت، ښیښه‌ییز تم، سوداګریز اسعار او د عامه کاتالوګ تنظیمات عیار کړئ.'
            )}
          </p>
        </div>
      </div>

      {/* 1. Theme & Appearance Section */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="border-b border-slate-200/60 dark:border-white/10 pb-3 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-[#101C35] dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C9A96E]" />
              <span>{t.themeLabel}</span>
            </h2>
            <p className="text-xs text-[#5A657D] dark:text-slate-400 mt-0.5">
              {t.themeDesc}
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#C9A96E] bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-white/10">
            {effectiveTheme === 'dark' ? 'Dark Active (#0B1220 / #101C35)' : 'Light Active (#F5F7FA / White Glass)'}
          </span>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`p-4 rounded-xl border text-start transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-[#C9A96E] ring-2 ring-[#C9A96E]/30 bg-white/90 dark:bg-[#101C35]/90 shadow-md'
                    : 'border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#101C35] dark:bg-[#C9A96E] text-[#C9A96E] dark:text-[#0B1220]' : 'bg-black/5 dark:bg-white/10 text-[#5A657D] dark:text-slate-300'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#C9A96E]" />
                  )}
                </div>

                <div>
                  <strong className="block text-xs font-bold text-[#101C35] dark:text-slate-100">
                    {opt.title}
                  </strong>
                  <p className="text-[11px] text-[#5A657D] dark:text-slate-400 mt-1 leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                {/* Surface texture mini-preview bar */}
                <div className="h-2 rounded-full w-full bg-gradient-to-r from-white/80 via-[#C9A96E]/50 to-[#101C35]/80 border border-black/5 dark:border-white/10" />
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Company Identity */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-extrabold text-[#101C35] dark:text-slate-100 border-b border-slate-200/60 dark:border-white/10 pb-2">
            {tr(
              currentLang,
              'Company Identity & Registered Commerce Details',
              'مشخصات رسمی شرکت و اطلاعات ثبت بازرگانی',
              'د شرکت رسمي هویت او د سوداګرۍ ثبت معلومات'
            )}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1">
                {tr(currentLang, 'Company Legal Name', 'نام رسمی شرکت', 'د شرکت رسمي نوم')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1">
                {tr(currentLang, 'Commercial Industry', 'صنعت و حوزه فعالیت', 'د سوداګرۍ او فعالیت برخه')}
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1">
                {tr(currentLang, 'Official WhatsApp Phone', 'شماره تماس رسمی (واتساپ)', 'د اړیکې رسمي شمېره (واټساپ)')}
              </label>
              <input
                type="text"
                dir="ltr"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input font-mono text-start"
              />
            </div>

            <div>
              <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1">
                {tr(currentLang, 'Official Contact Email', 'ایمیل رسمی تماس', 'د اړیکې رسمي ایمیل')}
              </label>
              <input
                type="email"
                dir="ltr"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-start"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1">
                {tr(currentLang, 'Registered Corporate Address', 'آدرس ثبتی دفتر مرکزی', 'د مرکزي دفتر ثبت شوې پته')}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input"
              />
            </div>
          </div>
        </div>

        {/* Commercial Currency & Public Storefront Visibility */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-extrabold text-[#101C35] dark:text-slate-100 border-b border-slate-200/60 dark:border-white/10 pb-2">
            {tr(currentLang, 'Storefront & Commercial Preferences', 'ارز تسویه و تنظیمات کاتالوگ عمومی', 'د تادیې اسعار او د عامه کاتالوګ تنظیمات')}
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1">
                {tr(currentLang, 'Settlement Currency', 'ارز اصلی تسویه حساب', 'د تصفیې اصلي اسعار')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full sm:w-64 px-3.5 py-2 rounded-xl glass-input font-mono font-bold"
              >
                <option value="USD" className="dark:bg-[#101C35] dark:text-white">USD ($ - United States Dollar)</option>
                <option value="GBP" className="dark:bg-[#101C35] dark:text-white">GBP (£ - British Pound Sterling)</option>
                <option value="EUR" className="dark:bg-[#101C35] dark:text-white">EUR (€ - Euro)</option>
                <option value="AED" className="dark:bg-[#101C35] dark:text-white">AED (د.إ - UAE Dirham)</option>
                <option value="AFN" className="dark:bg-[#101C35] dark:text-white">AFN (؋ - Afghan Afghani)</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showRetailPricesPublicly}
                  onChange={(e) =>
                    setFormData({ ...formData, showRetailPricesPublicly: e.target.checked })
                  }
                  className="rounded text-[#101C35] dark:text-[#C9A96E] focus:ring-[#C9A96E] w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-[#101C35] dark:text-slate-100 block">
                    {tr(currentLang, 'Show Retail Prices Publicly', 'نمایش عمومی قیمت‌های تکی / پرچون', 'په عامه کاتالوګ کې د پرچون بیو ښودل')}
                  </span>
                  <span className="text-[#5A657D] dark:text-slate-400 text-[11px] block">
                    {tr(
                      currentLang,
                      'When disabled, prices are hidden and visitors must request a quotation.',
                      'در صورت غیرفعال بودن، قیمت‌ها مخفی شده و بازدیدکنندگان باید استعلام پیش‌فاکتور ارسال کنند.',
                      'که غیرفعال وي، بیې پټې وي او لیدونکي باید د نرخ غوښتنه واستوي.'
                    )}
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowWholesaleQuoteRequests}
                  onChange={(e) =>
                    setFormData({ ...formData, allowWholesaleQuoteRequests: e.target.checked })
                  }
                  className="rounded text-[#101C35] dark:text-[#C9A96E] focus:ring-[#C9A96E] w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-[#101C35] dark:text-slate-100 block">
                    {tr(currentLang, 'Allow Wholesale Quote Requests', 'امکان ثبت درخواست استعلام عمده در کاتالوگ', 'په کاتالوګ کې د عمده نرخ غوښتنې اجازه')}
                  </span>
                  <span className="text-[#5A657D] dark:text-slate-400 text-[11px] block">
                    {tr(
                      currentLang,
                      'Enables quote request modal on public storefront product pages.',
                      'دکمه درخواست پیش‌فاکتور عمده را در صفحه محصولات کاتالوگ عمومی فعال می‌کند.',
                      'د عامه کاتالوګ د محصولاتو په پاڼه کې د عمده نرخ غوښتنې تڼۍ فعالوي.'
                    )}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Corporate Branding Colors */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-extrabold text-[#101C35] dark:text-slate-100 border-b border-slate-200/60 dark:border-white/10 pb-2">
            {tr(currentLang, 'Corporate Brand Palette', 'پالت رنگ برند شرکتی', 'د شرکتي برانډ د رنګونو پالټ')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1">
                {tr(currentLang, 'Primary Color (Hex)', 'رنگ اصلی (سرمه‌ای تیره)', 'اصلي رنګ (تیاره سرمه‌يي)')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-slate-200/60 dark:border-white/15 cursor-pointer p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl glass-input font-mono text-xs uppercase text-start"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1">
                {tr(currentLang, 'Accent Color (Hex)', 'رنگ تاکیدی (طلایی لوکس)', 'تاکیدي رنګ (طلایي)')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-slate-200/60 dark:border-white/15 cursor-pointer p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl glass-input font-mono text-xs uppercase text-start"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quotation Notification Destinations (Email, WhatsApp, Telegram) */}
        {(currentUser.role === 'company_admin' || currentUser.role === 'platform_owner') && (
          <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
            <div className="border-b border-slate-200/60 dark:border-white/10 pb-2 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-extrabold text-[#101C35] dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9A96E]" />
                <span>
                  {tr(
                    currentLang,
                    'Quotation Request Notification Destinations (Email, WhatsApp, Telegram)',
                    'مقاصد اعلان درخواست‌های پیش‌فاکتور (ایمیل، واتساپ، تلگرام)',
                    'د نرخ غوښتنې د خبرتیاوو مقاصد (ایمیل، واټساپ، ټیلیګرام)'
                  )}
                </span>
              </h2>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                {tr(currentLang, 'Server-Side Secrets Enforced', 'امنیت سمت سرور فعال', 'د سرور اړخ امنیت خوندي دی')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C9A96E]" />
                  <span>{tr(currentLang, 'Notification Destination Email', 'ایمیل مقصد اعلان‌ها', 'د خبرتیاوو منزل ایمیل')}</span>
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={formData.notifEmail}
                  onChange={(e) => setFormData({ ...formData, notifEmail: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl glass-input font-mono text-start"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                  {tr(currentLang, 'Provider Status:', 'وضعیت سرویس:', 'د چمتو کوونکي حالت:')}{' '}
                  {providerStatus?.channels.email.configured
                    ? tr(currentLang, 'Configured', 'فعال', 'فعال')
                    : tr(currentLang, 'Not Configured (Set RESEND_API_KEY or SENDGRID_API_KEY on server)', 'تنظیم‌نشده (نیاز به کلید API سرور)', 'تنظیم شوی نه دی (په سرور کې API کیلي اړینه ده)')}
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{tr(currentLang, 'WhatsApp Destination Number', 'شماره مقصد واتساپ', 'د واټساپ منزل شمېره')}</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={formData.notifWhatsappRaw}
                  onChange={(e) => setFormData({ ...formData, notifWhatsappRaw: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl glass-input font-mono text-start"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                  E.164: <strong dir="ltr">{providerStatus?.destinations.whatsappNormalized || '+93728224060'}</strong> •{' '}
                  {providerStatus?.channels.whatsapp.configured
                    ? tr(currentLang, 'Configured', 'فعال', 'فعال')
                    : tr(currentLang, 'Not Configured (Server env required)', 'تنظیم‌نشده (نیازمند توکن سرور)', 'تنظیم شوی نه دی (د سرور توکن اړین دی)')}
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-sky-500 rtl:-scale-x-100" />
                  <span>{tr(currentLang, 'Telegram Public Profile / Channel Link', 'لینک مرجع عمومی تلگرام', 'د ټیلیګرام عامه لینک')}</span>
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={formData.notifTelegramLink}
                  onChange={(e) => setFormData({ ...formData, notifTelegramLink: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl glass-input font-mono text-start"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                  {tr(
                    currentLang,
                    'Public destination reference only (not used directly as Bot API chat_id).',
                    'صرفاً لینک مرجع عمومی (مستقیماً به عنوان chat_id ربات استفاده نمی‌شود).',
                    'یوازې عامه لینک (مستقیماً د ربات chat_id په توګه نه کارول کېږي).'
                  )}
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#101C35] dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-sky-500 rtl:-scale-x-100" />
                  <span>{tr(currentLang, 'Verified Telegram Bot Chat ID (Optional Override)', 'شناسه عددی چت تلگرام (Chat ID)', 'د ټیلیګرام چټ عددي پېژند (Chat ID)')}</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="e.g. 123456789 or -1001234567890"
                  value={formData.notifTelegramChatId}
                  onChange={(e) => setFormData({ ...formData, notifTelegramChatId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl glass-input font-mono text-start"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                  {tr(
                    currentLang,
                    'Requires server-side TELEGRAM_BOT_TOKEN and recipient /start initialization.',
                    'نیازمند TELEGRAM_BOT_TOKEN در سرور و ارسال دستور /start توسط گیرنده.',
                    'په سرور کې TELEGRAM_BOT_TOKEN او د ترلاسه کوونکي لخوا د /start امر ته اړتیا لري.'
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {saveError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-bold">
            {saveError}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{tr(currentLang, 'Settings updated successfully!', 'تنظیمات با موفقیت ذخیره شد!', 'تنظیمات په بریالیتوب سره خوندي شول!')}</span>
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="py-2.5 px-6 rounded-xl font-bold text-xs bg-[#101C35] dark:bg-[#C9A96E] hover:bg-[#192b52] dark:hover:bg-[#d8be8d] text-white dark:text-[#0B1220] transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4 text-[#C9A96E] dark:text-[#0B1220]" />
            <span>
              {isSaving
                ? tr(currentLang, 'Saving Changes...', 'در حال ذخیره‌سازی...', 'په خوندي کولو کې...')
                : tr(currentLang, 'Save Company Settings', 'ذخیره تنظیمات شرکت', 'د شرکت تنظیمات خوندي کړئ')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
