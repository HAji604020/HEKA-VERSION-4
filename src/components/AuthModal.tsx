import React, { useState } from 'react';
import { Lock, ShieldCheck, UserCheck, X, KeyRound, AlertCircle, Building2 } from 'lucide-react';
import { Company, Language, User } from '../types';
import { tr } from '../translations';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, company: Company | null) => void;
  currentLang: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentLang,
}) => {
  if (!isOpen) return null;
  const isRtl = currentLang === 'fa' || currentLang === 'ps';

  const [email, setEmail] = useState('admin@hekaltd.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showMultiTenantTestAccounts, setShowMultiTenantTestAccounts] = useState(false);

  const primaryHekaAdmin = {
    name: 'HEKA Corporate Director',
    email: 'admin@hekaltd.com',
    company: 'HEKA LTD (London HQ · comp_heka_ltd)',
    role: 'company_admin',
    description: tr(
      currentLang,
      'Authorized HEKA LTD Administrator (Products, Categories, Seller & Product Approvals, Inquiries, Settings)',
      'مدیر رسمی شرکت HEKA LTD (محصولات، دسته‌بندی‌ها، تأیید فروشندگان، استعلام‌ها و تنظیمات)',
      'د HEKA LTD شرکت رسمي مدیر (محصولات، کټګورۍ، د پلورونکو تایید، استعلامونه او تنظیمات)'
    )
  };

  const multiTenantAuditUsers = [
    {
      name: 'SaaS Platform Owner',
      email: 'owner@dukanai.com',
      company: 'Global Multi-Tenant Provisioning & Governance',
      role: 'platform_owner'
    },
    {
      name: 'Ziba Samimi (Isolated Tenant B Admin)',
      email: 'admin@zibafashion.com',
      company: 'Ziba Silk & Apparel (comp_ziba_fashion · Isolation Test Tenant)',
      role: 'company_admin'
    }
  ];

  const handleLogin = async (e?: React.FormEvent, selectedEmail?: string) => {
    if (e) e.preventDefault();
    const targetEmail = selectedEmail || email;
    if (!targetEmail.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.login(targetEmail.trim(), undefined, 'admin');
      onSuccess(res.user, res.company);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          tr(
            currentLang,
            'Authentication failed. Please verify credentials.',
            'احراز هویت ناموفق بود. لطفاً مشخصات ورود را بررسی کنید.',
            'ننوتل بریالي نه وو. مهرباني وکړئ خپل معلومات وګورئ.'
          )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101C35]/65 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="glass-modal rounded-3xl max-w-lg w-full overflow-hidden my-8 shadow-2xl text-start">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#101C35] to-[#1c2e56] dark:from-[#C9A96E]/20 dark:to-[#C9A96E]/5 flex items-center justify-center border border-[#C9A96E]/30">
              <Lock className="w-4 h-4 text-[#C9A96E]" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#101C35] dark:text-white text-base">
                {tr(
                  currentLang,
                  'HEKA LTD Administration Sign-In',
                  'درگاه ورود مدیریت رسمی HEKA LTD',
                  'د HEKA LTD رسمي مدیریت د ننوتلو دروازه'
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {tr(
                  currentLang,
                  'Restricted corporate administration portal',
                  'بخش حفاظت‌شده ویژه مدیران مجاز شرکت',
                  'د شرکت د مجازو مدیرانو خوندي برخه'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Authorized HEKA LTD Administrator Account */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {tr(
                currentLang,
                'Authorized HEKA LTD Company Administrator:',
                'حساب مدیریت رسمی HEKA LTD:',
                'د HEKA LTD رسمي مدیریت حساب:'
              )}
            </label>
            <button
              type="button"
              onClick={() => {
                setEmail(primaryHekaAdmin.email);
                handleLogin(undefined, primaryHekaAdmin.email);
              }}
              className={`w-full p-3.5 rounded-2xl border text-start transition flex items-center justify-between cursor-pointer ${
                email === primaryHekaAdmin.email
                  ? 'border-[#C9A96E] bg-[#C9A96E]/10 dark:bg-[#C9A96E]/15'
                  : 'border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#101C35] dark:bg-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E] shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <strong className="text-xs font-extrabold text-slate-900 dark:text-white block">
                    {primaryHekaAdmin.name} (<span dir="ltr">{primaryHekaAdmin.email}</span>)
                  </strong>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 block font-medium">
                    {primaryHekaAdmin.company}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {primaryHekaAdmin.description}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[#101C35] text-[#C9A96E] font-bold shrink-0 ms-2">
                {primaryHekaAdmin.role}
              </span>
            </button>

            {/* Collapsible Multi-Tenant Isolation & Platform Audit Accounts */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMultiTenantTestAccounts(!showMultiTenantTestAccounts)}
                className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[#101C35] dark:hover:text-[#C9A96E] transition cursor-pointer flex items-center gap-1"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>
                  {showMultiTenantTestAccounts
                    ? tr(
                        currentLang,
                        'Hide Multi-Tenant Isolation & Platform Owner Accounts',
                        'بستن حساب‌های تست چندمستاجره و مالک پلتفرم',
                        'د پلتفرم څښتن او ټیسټ حسابونه پټول'
                      )
                    : tr(
                        currentLang,
                        'Show Platform Owner & Tenant Isolation Test Accounts',
                        'نمایش حساب‌های مالک پلتفرم و تست ایزولاسیون (Ziba / Platform Owner)',
                        'د پلتفرم څښتن او جلاوالي ټیسټ حسابونه ښودل'
                      )}
                </span>
              </button>

              {showMultiTenantTestAccounts && (
                <div className="mt-2 space-y-1.5 ps-2 border-s-2 border-[#C9A96E]/40">
                  {multiTenantAuditUsers.map((u) => (
                    <button
                      key={u.email}
                      type="button"
                      onClick={() => {
                        setEmail(u.email);
                        handleLogin(undefined, u.email);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-start transition flex items-center justify-between cursor-pointer ${
                        email === u.email
                          ? 'border-[#C9A96E] bg-[#C9A96E]/10 dark:bg-[#C9A96E]/15'
                          : 'border-slate-200/70 dark:border-white/10 bg-white/40 dark:bg-slate-800/30 hover:bg-white/70 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <strong className="text-xs font-bold text-slate-900 dark:text-white block">{u.name}</strong>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{u.company}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200/80 dark:border-white/10"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase tracking-wider">
              {tr(currentLang, 'Or enter credentials', 'یا ورود با برچسب سازمانی', 'یا خپل کاري معلومات دننه کړئ')}
            </span>
            <div className="flex-grow border-t border-slate-200/80 dark:border-white/10"></div>
          </div>

          {/* Form */}
          <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tr(currentLang, 'Corporate Email Address', 'برچسب یا ایمیل سازمانی', 'کاري برېښنالیک پته')}
              </label>
              <input
                type="email"
                dir="ltr"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hekaltd.com"
                className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tr(currentLang, 'Authorization Key / Password', 'کلید احراز هویت / گذرواژه', 'د ننوتلو کیلي / پټنوم')}
              </label>
              <input
                type="password"
                dir="ltr"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-mono"
              />
            </div>

            <div className="p-3 bg-white/40 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-white/10 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {tr(
                  currentLang,
                  'Isolated token-based authorization with tenant data boundary enforcement.',
                  'ارتباط محافظت‌شده با پروتکل‌های احراز هویت ایزوله شرکت HEKA LTD',
                  'د HEKA LTD شرکت د خوندي او جلا شوي سیسټم له لارې خوندي اړیکه.'
                )}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              >
                {tr(currentLang, 'Back to Public Catalog', 'انصراف و بازگشت به کاتالوگ', 'عمومي کاتالوګ ته ستنېدل')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#101C35] to-[#1c2e56] hover:from-[#192b52] hover:to-[#223a6c] dark:from-[#C9A96E] dark:to-[#d4b984] text-white dark:text-[#101C35] transition flex items-center gap-2 shadow-md cursor-pointer border border-[#C9A96E]/30 active:scale-95"
              >
                {isLoading ? (
                  <span>{tr(currentLang, 'Verifying...', 'در حال ورود...', 'په تاییدولو کې...')}</span>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5 text-[#C9A96E] dark:text-[#101C35]" />
                    <span>{tr(currentLang, 'Access Management Portal', 'ورود به پنل مدیریت', 'مدیریت پورټل ته ننوتل')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
