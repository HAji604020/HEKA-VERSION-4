import React from 'react';
import {
  Store,
  ShieldAlert,
  PlusCircle,
  ExternalLink,
  Languages,
  Layers,
  Sparkles,
  MessageSquare,
  Building,
  CheckCircle2,
  Lock,
  Eye
} from 'lucide-react';
import { Company, User, Language } from '../types';
import { translations } from '../translations';

interface NavigationProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  currentUser: User;
  currentCompany: Company | null;
  allCompanies: Company[];
  onSelectCompany: (companyId: string) => void;
  onSwitchUserRole: (email: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isPublicView: boolean;
  onTogglePublicView: (enable: boolean) => void;
  onOpenOnboarding: () => void;
  onOpenSecurityAudit: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentLang,
  onLanguageChange,
  currentUser,
  currentCompany,
  allCompanies,
  onSelectCompany,
  onSwitchUserRole,
  activeTab,
  onTabChange,
  isPublicView,
  onTogglePublicView,
  onOpenOnboarding,
  onOpenSecurityAudit,
}) => {
  const t = translations[currentLang];

  const primaryColor = currentCompany?.brandColors.primary || '#1e3a8a';

  return (
    <header className="border-b border-slate-200/90 bg-white sticky top-0 z-40 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {currentCompany?.logoUrl ? (
            <img
              src={currentCompany.logoUrl}
              alt={currentCompany.name}
              className="w-10 h-10 rounded-xl object-contain bg-white shadow-md ring-2 ring-slate-200 border border-slate-100 p-0.5"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-800 flex items-center justify-center text-white shadow-md ring-2 ring-slate-200">
              <Store className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {currentCompany ? currentCompany.name : t.appTitle}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {currentCompany?.id === 'comp_heka_ltd' ? 'Official Brand' : 'Multi-Tenant SaaS'}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              {currentLang === 'fa' && currentCompany?.settings.customGreetingFa
                ? currentCompany.settings.customGreetingFa
                : currentCompany?.settings.customGreetingEn || t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Tenant Switcher & Account Bar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Tenant Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-500 hidden sm:inline">{t.switchCompany}</span>
            <select
              value={currentCompany?.id || ''}
              onChange={(e) => onSelectCompany(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {allCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.industry})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Role Simulation Button */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => onSwitchUserRole('admin@hekaltd.com')}
              className={`px-2 py-0.5 rounded transition cursor-pointer text-[11px] font-medium ${
                currentUser.email === 'admin@hekaltd.com' || currentUser.email === 'admin@mehrsaffron.com'
                  ? 'bg-slate-900 text-amber-300 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Login as HEKA LTD Admin"
            >
              HEKA Admin
            </button>
            <button
              type="button"
              onClick={() => onSwitchUserRole('admin@zibafashion.com')}
              className={`px-2 py-0.5 rounded transition cursor-pointer text-[11px] font-medium ${
                currentUser.email === 'admin@zibafashion.com'
                  ? 'bg-teal-700 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Login as Ziba Fashion Admin"
            >
              Ziba Admin
            </button>
            <button
              type="button"
              onClick={() => onSwitchUserRole('owner@dukanai.com')}
              className={`px-2 py-0.5 rounded transition cursor-pointer text-[11px] font-medium ${
                currentUser.role === 'platform_owner'
                  ? 'bg-indigo-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Login as Platform Super Admin"
            >
              Platform Owner
            </button>
          </div>

          {/* Public Storefront Toggle */}
          <button
            type="button"
            onClick={() => onTogglePublicView(!isPublicView)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs ${
              isPublicView
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            {isPublicView ? (
              <>
                <Building className="w-3.5 h-3.5" />
                <span>{currentLang === 'fa' ? 'بازگشت به پنل مدیریت' : 'Back to Admin Portal'}</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.viewPublicCatalog}</span>
              </>
            )}
          </button>

          {/* Security Audit Button */}
          <button
            type="button"
            onClick={onOpenSecurityAudit}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition cursor-pointer"
            title="Run Multi-Tenant Cross-Company Isolation Tests"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden md:inline">{t.securityAuditBtn}</span>
            <span className="md:hidden">تست امنیت</span>
          </button>

          {/* Register New Business */}
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">{t.onboardCompanyBtn}</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onLanguageChange('fa')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                currentLang === 'fa' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              دری
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                currentLang === 'en' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Admin Tabs Bar (when in Admin Mode) */}
      {!isPublicView && (
        <div className="bg-slate-50/80 border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto gap-4 py-1.5">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => onTabChange('products')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.tabProducts}</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('sales_ai')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'sales_ai'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.tabSalesAI}</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('inquiries')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'inquiries'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.tabInquiries}</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('company_profile')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'company_profile'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-purple-600" />
                <span>{t.tabCompanyProfile}</span>
              </button>
            </div>

            {/* Active Company Status Tag */}
            {currentCompany && (
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {currentLang === 'fa' ? 'حساب فعال:' : 'Active Tenant:'}{' '}
                  <strong className="text-slate-900">{currentCompany.name}</strong>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({currentCompany.id})</span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
