import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Bell,
  Settings,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Eye,
  X,
  Store,
  ExternalLink,
  LifeBuoy,
  FolderTree,
  CheckCircle2,
  PlusCircle
} from 'lucide-react';
import { Company, User, Language } from '../types';
import { translations } from '../translations';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  currentCompany: Company | null;
  currentUser: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentLang: Language;
  unreadCount?: number;
  ordersCount?: number;
  inquiriesCount?: number;
  supportCount?: number;
  onTogglePublicView: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentCompany,
  currentUser,
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
  currentLang,
  unreadCount = 2,
  ordersCount = 6,
  inquiriesCount = 2,
  supportCount = 0,
  onTogglePublicView,
}) => {
  const t = translations[currentLang] || translations.en;
  const primaryColor = currentCompany?.brandColors.primary || '#101C35';
  const isRtl = currentLang === 'fa' || currentLang === 'ps';
  const isAdmin = currentUser.role === 'company_admin' || currentUser.role === 'platform_owner';

  const navItems: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    badge: string | null;
    badgeColor?: string;
    tag?: string;
  }> = [
    {
      id: 'dashboard',
      label: t.tabDashboard || (isRtl ? (currentLang === 'ps' ? 'ډشبورډ' : 'پیشخوان مدیریت') : 'Dashboard'),
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'products',
      label: t.tabProducts || (isRtl ? (currentLang === 'ps' ? 'محصولات او انبار' : 'محصولات و انبار') : 'Products & Inventory'),
      icon: Package,
      badge: null
    },
    ...(isAdmin
      ? [
          {
            id: 'categories',
            label:
              currentLang === 'fa'
                ? 'دسته‌بندی‌ها و زیردسته‌ها'
                : currentLang === 'ps'
                ? 'کټګورۍ او فرعي کټګورۍ'
                : 'Categories & Hierarchy',
            icon: FolderTree,
            badge: null
          }
        ]
      : []),
    {
      id: 'sales_ai',
      label: t.tabSalesAI || (isRtl ? (currentLang === 'ps' ? 'د پلور ځیرک مرستیال' : 'دستیار هوشمند فروش') : 'AI Sales Assistant'),
      icon: Sparkles,
      badge: null,
      tag: isRtl ? 'تاییدشده' : 'Grounded'
    },
    {
      id: 'inquiries',
      label: t.tabInquiries || (isRtl ? (currentLang === 'ps' ? 'استعلامونه او نرخونه' : 'استعلام قیمت و پیش‌فاکتور') : 'Quotations & Inquiries'),
      icon: MessageSquare,
      badge: inquiriesCount > 0 ? String(inquiriesCount) : null,
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
    },
    {
      id: 'company_profile',
      label: t.tabCompanyProfile || (isRtl ? (currentLang === 'ps' ? 'د شرکت پروفایل او برانډینګ' : 'پروفایل و برندینگ شرکت') : 'Company Profile & Branding'),
      icon: Building2,
      badge: null
    },
    ...(isAdmin
      ? [
          {
            id: 'product_reviews',
            label:
              currentLang === 'fa'
                ? 'بررسی محصولات فروشندگان'
                : currentLang === 'ps'
                ? 'د پلورونکو محصولاتو بیاکتنه'
                : 'Seller Product Reviews',
            icon: CheckCircle2,
            badge: null
          },
          ...(currentUser.role === 'platform_owner' || currentUser.companyId === 'comp_heka_ltd'
            ? [
                {
                  id: 'seller_reviews',
                  label:
                    currentLang === 'fa'
                      ? 'تأیید فروشندگان'
                      : currentLang === 'ps'
                      ? 'د پلورونکو غوښتنلیکونه'
                      : 'Seller Applications',
                  icon: Store,
                  badge: null
                }
              ]
            : [])
        ]
      : []),
    {
      id: 'orders',
      label: t.tabOrders || (isRtl ? (currentLang === 'ps' ? 'فرمایشونه' : 'سفارشات تجارتی') : 'Orders'),
      icon: ShoppingCart,
      badge: ordersCount > 0 ? String(ordersCount) : null,
      badgeColor: 'bg-black/5 dark:bg-white/10 text-[#101C35] dark:text-slate-200 border border-slate-200/60 dark:border-white/10'
    },
    {
      id: 'customers',
      label: t.tabCustomers || (isRtl ? (currentLang === 'ps' ? 'پېرودونکي' : 'مشتریان و همکاران') : 'Customers'),
      icon: Users,
      badge: null
    },
    {
      id: 'analytics',
      label: t.tabAnalytics || (isRtl ? (currentLang === 'ps' ? 'احصایې' : 'آمار و تحلیل') : 'Analytics'),
      icon: BarChart3,
      badge: null
    },
    {
      id: 'notifications',
      label: t.tabNotifications || (isRtl ? (currentLang === 'ps' ? 'خبرتیاوې' : 'اعلان‌ها') : 'Notifications'),
      icon: Bell,
      badge: unreadCount > 0 ? String(unreadCount) : null,
      badgeColor: 'bg-[#C9A96E]/20 text-[#8C6D2E] dark:text-[#E6D2A8] border border-[#C9A96E]/40'
    },
    {
      id: 'support',
      label: t.tabSupport || (isRtl ? (currentLang === 'ps' ? 'مرسته او ملاتړ' : 'پشتیبانی و تیکت‌ها') : 'Support'),
      icon: LifeBuoy,
      badge: supportCount > 0 ? String(supportCount) : null,
      badgeColor: 'bg-[#C9A96E]/20 text-[#8C6D2E] dark:text-[#E6D2A8] border border-[#C9A96E]/40'
    },
    {
      id: 'settings',
      label: t.tabSettings || (isRtl ? (currentLang === 'ps' ? 'تنظیمات' : 'تنظیمات سیستم') : 'Settings'),
      icon: Settings,
      badge: null
    }
  ];

  const secondaryNavItems = [
    ...(currentUser.role === 'platform_owner'
      ? [
          {
            id: 'onboard_company',
            label: t.onboardCompanyBtn || (isRtl ? (currentLang === 'ps' ? 'نوی شرکت ثبتول' : 'ثبت شرکت جدید') : 'Provision New Tenant'),
            icon: PlusCircle,
            tag: isRtl ? 'مالک پلتفرم' : 'Owner Only',
            badge: null
          }
        ]
      : []),
    {
      id: 'security_audit',
      label: t.tabSecurityAudit || (isRtl ? (currentLang === 'ps' ? 'د معلوماتو جلاوالی او امنیت' : 'تفکیک داده‌ها و امنیت') : 'Security & Tenant Audit'),
      icon: ShieldCheck,
      tag: isRtl ? 'ایزوله' : 'Protected',
      badge: null
    }
  ];

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop with blur */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 ${
          isRtl ? 'right-0 border-l' : 'left-0 border-r'
        } z-50 w-72 glass-panel shadow-xl lg:shadow-none flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile
            ? 'translate-x-0'
            : isRtl
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {currentCompany?.logoUrl ? (
              <img
                src={currentCompany.logoUrl}
                alt={currentCompany.name}
                className="w-9 h-9 rounded-xl object-contain bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/15 p-0.5 shadow-2xs shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-2xs border border-[#C9A96E]/30"
                style={{ backgroundColor: primaryColor }}
              >
                <Store className="w-5 h-5 text-[#C9A96E]" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-[#101C35] dark:text-slate-100 truncate tracking-tight">
                {currentCompany?.name || 'HEKA LTD'}
              </h1>
              <p className="text-[11px] text-[#5A657D] dark:text-slate-400 truncate">
                {currentCompany?.industry || 'International Trade'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Main Section */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#5A657D] dark:text-slate-400 text-start">
              {currentLang === 'fa' ? 'منوی اصلی' : currentLang === 'ps' ? 'اصلي مینو' : 'MAIN MENU'}
            </div>
            <nav className="space-y-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer relative ${
                      isActive
                        ? 'bg-[#101C35] text-white shadow-xs dark:bg-[#C9A96E]/20 dark:text-[#C9A96E] dark:border dark:border-[#C9A96E]/40'
                        : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#101C35] dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#C9A96E]'
                            : 'text-[#5A657D] dark:text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.tag && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                            isActive
                              ? 'bg-white/15 text-[#C9A96E]'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {item.tag}
                        </span>
                      )}
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums ${
                            isActive
                              ? 'bg-white/20 text-[#C9A96E]'
                              : item.badgeColor || 'bg-black/5 dark:bg-white/10 text-[#5A657D] dark:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Company & Tenant Management */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#5A657D] dark:text-slate-400 text-start">
              {currentLang === 'fa' ? 'مدیریت شرکت‌ها و امنیت' : currentLang === 'ps' ? 'د شرکت او پلتفرم مدیریت' : 'COMPANY & TENANT MANAGEMENT'}
            </div>
            <nav className="space-y-1" aria-label="Secondary Navigation">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer relative ${
                      isActive
                        ? 'bg-[#101C35] text-white shadow-xs dark:bg-[#C9A96E]/20 dark:text-[#C9A96E] dark:border dark:border-[#C9A96E]/40'
                        : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#101C35] dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#C9A96E]' : 'text-[#5A657D] dark:text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.tag && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                            isActive
                              ? 'bg-white/15 text-[#C9A96E]'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {item.tag}
                        </span>
                      )}

                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums ${
                            isActive
                              ? 'bg-white/20 text-[#C9A96E]'
                              : 'bg-black/5 dark:bg-white/10 text-[#101C35] dark:text-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Storefront & Tenant Card */}
        <div className="p-3.5 border-t border-slate-200/60 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0 space-y-2.5">
          {/* Storefront Link */}
          <button
            type="button"
            onClick={onTogglePublicView}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold glass-card hover:border-[#C9A96E]/50 text-[#101C35] dark:text-slate-200 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>
                {t.viewPublicCatalog ||
                  (currentLang === 'fa' ? 'کاتالوگ رسمی عمومی' : currentLang === 'ps' ? 'عمومي رسمي کاتالوګ' : 'Public Catalog')}
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400 group-hover:text-[#101C35] dark:group-hover:text-white" />
          </button>

          {/* Active Tenant Card */}
          <div className="px-3 py-2 rounded-xl glass-card flex items-center justify-between text-[11px] text-start">
            <div className="min-w-0">
              <span className="text-[#5A657D] dark:text-slate-400 block text-[10px]">
                {currentLang === 'fa' ? 'محیط تجارتی فعال' : currentLang === 'ps' ? 'فعال تجارتي حساب' : 'Tenant Account'}
              </span>
              <strong className="text-[#101C35] dark:text-slate-100 truncate block font-semibold">
                {currentCompany?.name}
              </strong>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#101C35] dark:text-[#C9A96E] font-bold border border-slate-200/60 dark:border-white/10">
              {currentCompany?.plan || 'enterprise'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
