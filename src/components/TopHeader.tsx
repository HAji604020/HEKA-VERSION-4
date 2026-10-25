import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Building,
  ShieldCheck,
  Check,
  Store,
  ExternalLink,
  PlusCircle,
  X,
  Layers,
  ShoppingCart,
  Users,
  Globe
} from 'lucide-react';
import { Company, User, Language, Product, Order, Customer, AppNotification } from '../types';
import { translations, tr } from '../translations';
import { ThemeToggle } from './ThemeToggle';

interface TopHeaderProps {
  currentCompany: Company | null;
  currentUser: User;
  allCompanies: Company[];
  onSelectCompany: (companyId: string) => void;
  onSwitchUserRole: (email: string) => void;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onToggleMobileSidebar: () => void;
  isPublicView: boolean;
  onTogglePublicView: () => void;
  onOpenOnboarding: () => void;
  onOpenSecurityAudit: () => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  products: Product[];
  orders: Order[];
  customers: Customer[];
  onNavigateTab: (tabId: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentCompany,
  currentUser,
  allCompanies,
  onSelectCompany,
  onSwitchUserRole,
  currentLang,
  onLanguageChange,
  onToggleMobileSidebar,
  isPublicView,
  onTogglePublicView,
  onOpenOnboarding,
  onOpenSecurityAudit,
  notifications,
  onOpenNotifications,
  products,
  orders,
  customers,
  onNavigateTab,
}) => {
  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'fa' || currentLang === 'ps';
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items based on search query
  const query = searchQuery.trim().toLowerCase();
  const matchedProducts = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.nameFa && p.nameFa.toLowerCase().includes(query)) ||
          (p.namePs && p.namePs.toLowerCase().includes(query)) ||
          p.category.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchedOrders = query
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(query) ||
          o.customerName.toLowerCase().includes(query) ||
          (o.clientCompany && o.clientCompany.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const matchedCustomers = query
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          (c.clientCompany && c.clientCompany.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const hasSearchResults =
    matchedProducts.length > 0 || matchedOrders.length > 0 || matchedCustomers.length > 0;

  return (
    <header className="h-16 glass-panel sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 transition-colors duration-200">
      {/* Left (or Right in RTL): Mobile Menu Button & Brand/Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-[#5A657D] dark:text-slate-300 hover:text-[#101C35] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition cursor-pointer"
          aria-label={tr(currentLang, 'Open navigation sidebar', 'باز کردن منوی ناوبری', 'د لارښوونې مینو پرانیستل')}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* HEKA LTD Brand Logo in Header with frosted container */}
        <div className="flex items-center gap-2.5">
          {currentCompany?.logoUrl ? (
            <img
              src={currentCompany.logoUrl}
              alt={currentCompany.name}
              className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/15 p-0.5 shadow-2xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#101C35] dark:bg-[#192b52] border border-[#C9A96E]/30 flex items-center justify-center text-white">
              <Store className="w-4 h-4 text-[#C9A96E]" />
            </div>
          )}

          <div className="hidden sm:block text-start">
            <span className="text-sm font-extrabold text-[#101C35] dark:text-slate-100 tracking-tight leading-none block">
              {currentCompany?.name || 'HEKA LTD'}
            </span>
            <span className="text-[10px] text-[#5A657D] dark:text-slate-400 font-medium">
              {currentCompany?.id === 'comp_heka_ltd'
                ? tr(currentLang, 'London HQ · International Commerce', 'دفتر مرکزی لندن • تجارت بین‌الملل', 'د لندن مرکزي دفتر • نړیواله سوداګري')
                : tr(currentLang, 'Corporate Suite', 'سوئیت تجارتی', 'تجارتي سویټ')}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Frosted Glass Search Field */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search
            className={`w-4 h-4 text-[#5A657D] dark:text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
              isRtl ? 'right-3' : 'left-3'
            }`}
          />
          <input
            type="text"
            placeholder={
              t.searchDashboard ||
              tr(
                currentLang,
                'Search products, orders, customers...',
                'جستجو در محصولات، سفارشات و مشتریان...',
                'محصولات، فرمایشونه او پېرودونکي ولټوئ...'
              )
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className={`w-full text-xs py-2 rounded-xl glass-input transition ${
              isRtl ? 'pr-9 pl-8' : 'pl-9 pr-8'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={`absolute top-1/2 -translate-y-1/2 text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white cursor-pointer ${
                isRtl ? 'left-2.5' : 'right-2.5'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Results Frosted Dropdown */}
        {isSearchOpen && searchQuery && (
          <div className="absolute top-full mt-1.5 left-0 right-0 glass-modal rounded-xl p-2 z-50 max-h-96 overflow-y-auto shadow-xl">
            {hasSearchResults ? (
              <div className="space-y-3">
                {matchedProducts.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#5A657D] dark:text-slate-400 px-2 py-1 block text-start">
                      {tr(currentLang, 'Products', 'محصولات', 'محصولات')}
                    </span>
                    {matchedProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onNavigateTab('products');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between text-xs cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Layers className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
                          <span className="font-semibold text-[#101C35] dark:text-slate-100 truncate">
                            {currentLang === 'fa' ? p.nameFa || p.name : currentLang === 'ps' ? p.namePs || p.nameFa || p.name : p.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#C9A96E] shrink-0 tabular-nums font-bold">
                          {p.currency}{p.retailPrice}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {matchedOrders.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#5A657D] dark:text-slate-400 px-2 py-1 block text-start">
                      {tr(currentLang, 'Orders', 'سفارشات', 'فرمایشونه')}
                    </span>
                    {matchedOrders.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          onNavigateTab('orders');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between text-xs cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <ShoppingCart className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400 shrink-0" />
                          <span className="font-semibold text-[#101C35] dark:text-slate-100 truncate">
                            {o.orderNumber} - {o.customerName}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#101C35] dark:text-slate-100 font-bold shrink-0 tabular-nums">
                          {o.currency}{o.totalAmount.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {matchedCustomers.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#5A657D] dark:text-slate-400 px-2 py-1 block text-start">
                      {tr(currentLang, 'Customers', 'مشتریان', 'پېرودونکي')}
                    </span>
                    {matchedCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onNavigateTab('customers');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between text-xs cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Users className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400 shrink-0" />
                          <span className="font-semibold text-[#101C35] dark:text-slate-100 truncate">
                            {c.name} {c.clientCompany ? `(${c.clientCompany})` : ''}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#5A657D] dark:text-slate-400 shrink-0 truncate max-w-[120px]">
                          {c.location}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#5A657D] dark:text-slate-400">
                {tr(
                  currentLang,
                  `No matching results for "${searchQuery}"`,
                  `موردی برای «${searchQuery}» یافت نشد`,
                  `د «${searchQuery}» لپاره کومه پایله ونه موندل شوه`
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right (or Left in RTL) Controls: Theme Toggle, Language Switcher, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Working Theme Selector (Light, Dark, System) */}
        <ThemeToggle currentLang={currentLang} variant="compact" />

        {/* Visible 3-Way Interface Language Switcher (Specification Requirement #2) */}
        <div
          className="flex items-center bg-white/60 dark:bg-black/30 backdrop-blur-md p-0.5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-2xs"
          role="group"
          aria-label="Interface language selection"
        >
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentLang === 'en'
                ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                : 'text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
            }`}
            title="Switch to English (LTR)"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('fa')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentLang === 'fa'
                ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                : 'text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
            }`}
            title="تغییر به زبان دری (RTL)"
          >
            دری
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('ps')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentLang === 'ps'
                ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                : 'text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
            }`}
            title="پښتو ژبې ته بدلون (RTL)"
          >
            پښتو
          </button>
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-[#5A657D] dark:text-slate-300 hover:text-[#101C35] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 border border-transparent hover:border-slate-200/60 dark:hover:border-white/10 transition cursor-pointer"
          title={tr(currentLang, 'Notifications', 'مشاهده اعلان‌ها', 'خبرتیاوې کتل')}
          aria-label={tr(currentLang, 'Notifications', 'مشاهده اعلان‌ها', 'خبرتیاوې کتل')}
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-[#C9A96E] ring-2 ring-white dark:ring-[#0B1220]" />
          )}
        </button>

        {/* User Profile & Account Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 ps-2 pe-1.5 py-1 rounded-xl hover:bg-white/60 dark:hover:bg-white/10 border border-transparent hover:border-slate-200/60 dark:hover:border-white/10 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#101C35] dark:bg-[#192b52] border border-[#C9A96E]/30 text-[#C9A96E] font-bold flex items-center justify-center text-xs shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-start text-xs leading-tight">
              <span className="font-bold text-[#101C35] dark:text-slate-100 block truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-[#5A657D] dark:text-slate-400 font-medium block truncate max-w-[120px]">
                {currentUser.role === 'platform_owner'
                  ? tr(currentLang, 'Platform Owner', 'مدیر ارشد پلتفرم', 'د پلتفرم څښتن')
                  : currentCompany?.name || tr(currentLang, 'Director', 'مدیر شرکت', 'د شرکت مدیر')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400" />
          </button>

          {/* Profile Menu Frosted Popover */}
          {isProfileMenuOpen && (
            <div
              className={`absolute top-full mt-2 w-72 glass-modal rounded-2xl p-3 z-50 space-y-3 text-start ${
                isRtl ? 'left-0' : 'right-0'
              }`}
            >
              {/* User Bio & Verified Role Context */}
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <span className="font-bold text-xs text-[#101C35] dark:text-white block">{currentUser.name}</span>
                <span className="text-[11px] text-[#5A657D] dark:text-slate-400 block truncate" dir="ltr">
                  {currentUser.email}
                </span>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#101C35] dark:bg-[#C9A96E] text-[#C9A96E] dark:text-[#0B1220] font-bold">
                    {currentUser.role === 'company_admin'
                      ? tr(currentLang, 'Company Administrator', 'مدیر رسمی شرکت', 'د شرکت رسمي مدیر')
                      : currentUser.role === 'platform_owner'
                      ? tr(currentLang, 'Platform Owner', 'مالک پلتفرم', 'د پلتفرم څښتن')
                      : currentUser.role}
                  </span>
                  <span className="text-[10px] text-[#5A657D] dark:text-slate-400 font-mono">
                    {currentCompany?.name || currentUser.companyId || 'Global'}
                  </span>
                </div>
              </div>

              {/* Authorized Company Context (Locked for company_admin; Switchable only for platform_owner) */}
              {currentUser.role === 'platform_owner' && allCompanies.length > 1 ? (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5A657D] dark:text-slate-400 px-1 block mb-1">
                    {tr(
                      currentLang,
                      'Switch Active Tenant (Platform Owner)',
                      'تغییر شرکت فعال (مالک پلتفرم)',
                      'فعال شرکت بدلول (د پلتفرم څښتن)'
                    )}
                  </span>
                  <div className="space-y-1">
                    {allCompanies.map((c) => {
                      const isSelected = currentCompany?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onSelectCompany(c.id);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] font-bold'
                              : 'text-[#101C35] dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img
                              src={c.logoUrl}
                              alt=""
                              className="w-4 h-4 rounded object-contain bg-white dark:bg-slate-900 border shrink-0"
                            />
                            <span className="truncate">{c.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#C9A96E] dark:text-[#0B1220] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="px-2.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate font-semibold">
                      {tr(currentLang, 'Authorized Scope:', 'حوزه مجاز:', 'مجاز ساحه:')} {currentCompany?.name || 'HEKA LTD'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] opacity-80 shrink-0">
                    {currentCompany?.id || currentUser.companyId}
                  </span>
                </div>
              )}

              {/* Action Links */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenSecurityAudit();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t.securityAuditBtn || tr(currentLang, 'Security Audit', 'تست تفکیک داده‌ها', 'د امنیت پلټنه')}</span>
                </button>
                {currentUser.role === 'platform_owner' && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenOnboarding();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-[#101C35] dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>{t.onboardCompanyBtn || tr(currentLang, 'Provision New Tenant', 'ثبت شرکت جدید', 'نوی شرکت ثبتول')}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
