import React, { useState } from 'react';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  Info,
  Building,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Search,
  MessageSquare,
  Layers
} from 'lucide-react';
import { Company, Product, Order, Customer, ActivityItem, Language } from '../types';
import { translations, tr } from '../translations';

interface DashboardViewProps {
  company: Company;
  products: Product[];
  orders: Order[];
  customers: Customer[];
  activities: ActivityItem[];
  salesTrend: { month: string; revenue: number; orders: number; target: number }[];
  currentLang: Language;
  onNavigateTab: (tabId: string) => void;
  onOpenAddProduct: () => void;
  onTogglePublicView: () => void;
  onSelectOrderDetails: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  company,
  products,
  orders,
  customers,
  activities,
  salesTrend,
  currentLang,
  onNavigateTab,
  onOpenAddProduct,
  onTogglePublicView,
  onSelectOrderDetails,
}) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'fa' || currentLang === 'ps';
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [chartRange, setChartRange] = useState<'6m' | '30d' | '7d'>('6m');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');

  const currencySymbol = company.currency === 'USD' ? '$' : company.currency;

  // Real calculations
  const totalProductsCount = products.length;
  const inStockProductsCount = products.filter((p) => p.stock > 0).length;
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const totalCustomersCount = customers.length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0);

  // Filter orders for table
  const filteredOrders = orders.filter((order) => {
    if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchComp = order.clientCompany?.toLowerCase().includes(q) || false;
      if (!matchNum && !matchName && !matchComp) return false;
    }
    return true;
  });

  // Chart max calculation
  const maxVal = Math.max(
    ...salesTrend.map((d) => (chartMetric === 'revenue' ? Math.max(d.revenue, d.target) : d.orders)),
    100
  );

  const ArrowForward = isRtl ? ArrowLeft : ArrowRight;
  const ChevronForward = isRtl ? ChevronLeft : ChevronRight;

  const statusLabels: Record<string, string> = {
    all: tr(currentLang, 'All', 'همه', 'ټول'),
    shipped: tr(currentLang, 'Shipped', 'ارسال‌شده', 'استول شوی'),
    processing: tr(currentLang, 'Processing', 'در حال پردازش', 'تر پروسس لاندې'),
    delivered: tr(currentLang, 'Delivered', 'تحویل‌شده', 'سپارل شوی'),
    pending: tr(currentLang, 'Pending', 'در انتظار', 'په تمه'),
    cancelled: tr(currentLang, 'Cancelled', 'لغوشده', 'لغوه شوی')
  };

  return (
    <div className="space-y-6">
      {/* Frosted Welcome Banner: Deep Navy (#101C35) with Muted Gold (#C9A96E) Refraction */}
      <div
        className="rounded-2xl p-6 sm:p-7 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden bg-[#101C35]/90 dark:bg-[#101C35]/75 backdrop-blur-xl border border-white/20 dark:border-[#C9A96E]/30 shadow-lg"
      >
        <div className="relative z-10 flex items-start sm:items-center gap-4">
          <img
            src={company.logoUrl}
            alt={company.name}
            className="w-14 h-14 rounded-xl object-contain bg-white dark:bg-slate-900 p-1 border border-white/30 dark:border-[#C9A96E]/40 shadow-xs shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-[#C9A96E] tracking-wider uppercase border border-[#C9A96E]/40 backdrop-blur-xs">
                {company.industry}
              </span>
              <span className="text-xs text-white/70 font-mono">
                {company.id === 'comp_heka_ltd'
                  ? tr(currentLang, 'London Headquarters', 'دفتر مرکزی لندن', 'د لندن مرکزي دفتر')
                  : company.country}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1.5 text-white">
              {company.name} {tr(currentLang, '– Corporate Operations Hub', '– مرکز عملیات و پیشخوان تجارتی', '– د سوداګریزو عملیاتو مرکز')}
            </h1>
            <p className="text-xs text-white/80 mt-1 line-clamp-1 max-w-2xl">
              {isRtl && company.settings.customGreetingFa
                ? company.settings.customGreetingFa
                : company.settings.customGreetingEn || company.address}
            </p>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onTogglePublicView}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/90 hover:bg-white text-[#101C35] transition shadow-xs flex items-center gap-2 cursor-pointer border border-white/60 backdrop-blur-sm"
          >
            <Eye className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>{t.viewPublicCatalog}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('sales_ai')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#192b52] hover:bg-[#203665] text-white border border-[#C9A96E]/40 transition flex items-center gap-2 cursor-pointer backdrop-blur-sm shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>{t.tabSalesAI}</span>
          </button>
        </div>

        {/* Ambient luminous glow */}
        <div
          className="absolute -end-20 -bottom-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none bg-[#C9A96E]"
        />
      </div>

      {/* Demo Notice Banner with Frosted Glass */}
      <div className="px-4 py-2.5 rounded-xl glass-card text-[#5A657D] dark:text-slate-300 text-xs flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <Info className="w-4 h-4 text-[#C9A96E] shrink-0" />
          <span className="text-[11px] leading-relaxed truncate sm:text-clip">
            <strong className="text-[#101C35] dark:text-white font-bold">
              {tr(currentLang, 'Demonstration Data:', 'محیط آزمایشی:', 'آزمېښتي چاپېریال:')}
            </strong>{' '}
            {t.demoNotice}
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded glass-badge-gold shrink-0">
          {tr(currentLang, 'DEMO STAGING', 'داده‌های نمونه', 'بیلګه ارقام')}
        </span>
      </div>

      {/* 4 Summary Frosted KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Total Products */}
        <div
          onClick={() => onNavigateTab('products')}
          className="glass-card p-5 rounded-2xl hover:border-[#C9A96E]/70 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#5A657D] dark:text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t.totalProductsCard}
            </span>
            <div className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 text-[#101C35] dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform border border-slate-200/60 dark:border-white/10">
              <Package className="w-4 h-4 text-[#C9A96E]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#101C35] dark:text-slate-100 font-mono tabular-nums tracking-tight">
              {totalProductsCount}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{inStockProductsCount} {tr(currentLang, 'In Stock', 'موجود در انبار', 'په زیرمه کې شته')}</span>
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] text-[#5A657D] dark:text-slate-400">
            <span>{tr(currentLang, 'Verified in catalog', 'تاییدشده در کاتالوگ', 'په کاتالوګ کې تایید شوي')}</span>
            <span className="text-[#101C35] dark:text-[#C9A96E] font-bold group-hover:text-[#C9A96E] transition-colors flex items-center gap-0.5">
              <span>{tr(currentLang, 'Manage', 'مدیریت', 'مدیریت')}</span>
              <ChevronForward className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 2. Total Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="glass-card p-5 rounded-2xl hover:border-[#C9A96E]/70 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#5A657D] dark:text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t.totalOrdersCard}
            </span>
            <div className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 text-[#101C35] dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform border border-slate-200/60 dark:border-white/10">
              <ShoppingCart className="w-4 h-4 text-[#C9A96E]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#101C35] dark:text-slate-100 font-mono tabular-nums tracking-tight">
              {totalOrdersCount}
            </span>
            <span className="text-xs font-semibold text-[#101C35] dark:text-slate-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>{pendingOrdersCount} {tr(currentLang, 'Active', 'فعال', 'فعال')}</span>
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] text-[#5A657D] dark:text-slate-400">
            <span>{tr(currentLang, '+14.2% monthly growth', '۱۴.۲٪ رشد ماهانه', '۱۴.۲٪ میاشتنۍ وده')}</span>
            <span className="text-[#101C35] dark:text-[#C9A96E] font-bold group-hover:text-[#C9A96E] transition-colors flex items-center gap-0.5">
              <span>{tr(currentLang, 'View', 'مشاهده', 'کتل')}</span>
              <ChevronForward className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 3. Total Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="glass-card p-5 rounded-2xl hover:border-[#C9A96E]/70 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#5A657D] dark:text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t.totalCustomersCard}
            </span>
            <div className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 text-[#101C35] dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform border border-slate-200/60 dark:border-white/10">
              <Users className="w-4 h-4 text-[#C9A96E]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#101C35] dark:text-slate-100 font-mono tabular-nums tracking-tight">
              {totalCustomersCount}
            </span>
            <span className="text-xs font-semibold text-[#101C35] dark:text-slate-200 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400" />
              <span>{tr(currentLang, 'B2B & Retail', 'عمده و پرچون', 'عمده او پرچون')}</span>
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] text-[#5A657D] dark:text-slate-400">
            <span>{tr(currentLang, 'Global distributors', 'توزیع‌کنندگان جهانی', 'نړیوال توزیع کوونکي')}</span>
            <span className="text-[#101C35] dark:text-[#C9A96E] font-bold group-hover:text-[#C9A96E] transition-colors flex items-center gap-0.5">
              <span>{tr(currentLang, 'Directory', 'فهرست', 'لړلیک')}</span>
              <ChevronForward className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 4. Total Revenue */}
        <div
          onClick={() => onNavigateTab('analytics')}
          className="glass-card p-5 rounded-2xl hover:border-[#C9A96E]/70 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#5A657D] dark:text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t.totalRevenueCard}
            </span>
            <div className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 text-[#101C35] dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform border border-slate-200/60 dark:border-white/10">
              <DollarSign className="w-4 h-4 text-[#C9A96E]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#101C35] dark:text-slate-100 font-mono tabular-nums tracking-tight">
              {currencySymbol}{totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>+18.4%</span>
            </span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] text-[#5A657D] dark:text-slate-400">
            <span>{tr(currentLang, 'Annualised trade volume', 'تراز بازرگانی سالانه', 'کلنی سوداګریز حجم')}</span>
            <span className="text-[#101C35] dark:text-[#C9A96E] font-bold group-hover:text-[#C9A96E] transition-colors flex items-center gap-0.5">
              <span>{tr(currentLang, 'Analytics', 'آمار', 'احصایې')}</span>
              <ChevronForward className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Frosted Strip */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#101C35] dark:text-slate-100 uppercase tracking-wider">
            {t.quickActionsTitle}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#101C35] dark:bg-[#C9A96E] hover:bg-[#192b52] dark:hover:bg-[#d8be8d] text-white dark:text-[#0B1220] transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-[#C9A96E] dark:text-[#0B1220]" />
            <span>{t.actionAddProduct}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('products')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#101C35] dark:text-slate-200 border border-slate-200/60 dark:border-white/10 transition cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>{t.tabProducts}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('categories')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#101C35] dark:text-slate-200 border border-slate-200/60 dark:border-white/10 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>{tr(currentLang, 'Categories', 'دسته‌بندی‌های کالا', 'کټګورۍ او فرعي کټګورۍ')}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('sales_ai')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#C9A96E]/15 hover:bg-[#C9A96E]/25 text-[#101C35] dark:text-[#E6D2A8] border border-[#C9A96E]/40 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>{t.tabSalesAI}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('inquiries')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#101C35] dark:text-slate-200 border border-slate-200/60 dark:border-white/10 transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.tabInquiries}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('company_profile')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#101C35] dark:text-slate-200 border border-slate-200/60 dark:border-white/10 transition cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400" />
            <span>{t.tabCompanyProfile}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#101C35] dark:text-slate-200 border border-slate-200/60 dark:border-white/10 transition cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400" />
            <span>{t.actionViewOrders}</span>
          </button>
        </div>
      </div>

      {/* Sales Overview Chart with Frosted Glass Panel */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-[#101C35] dark:text-slate-100 tracking-tight">
              {t.salesOverviewTitle}
            </h2>
            <p className="text-xs text-[#5A657D] dark:text-slate-400 mt-0.5">
              {tr(
                currentLang,
                'Monthly trade distribution across international wholesale accounts and retail partners',
                'روند ماهانه توزیع بازرگانی در کانال‌های عمده‌فروشی بین‌المللی و نمایندگی‌ها',
                'په نړیوالو عمده او پرچون چینلونو کې د سوداګریز ویش میاشتنی بهیر'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Metric Toggle */}
            <div className="flex items-center bg-black/5 dark:bg-black/30 p-0.5 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  chartMetric === 'revenue'
                    ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs font-bold'
                    : 'text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
                }`}
              >
                {tr(currentLang, `Revenue (${currencySymbol})`, `درآمد (${currencySymbol})`, `عواید (${currencySymbol})`)}
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  chartMetric === 'orders'
                    ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs font-bold'
                    : 'text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
                }`}
              >
                {tr(currentLang, 'Orders', 'تعداد سفارشات', 'د سفارشونو شمېر')}
              </button>
            </div>

            {/* Range Selector */}
            <div className="hidden sm:flex items-center bg-black/5 dark:bg-black/30 p-0.5 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartRange('6m')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartRange === '6m'
                    ? 'bg-white dark:bg-white/15 text-[#101C35] dark:text-white shadow-xs font-bold'
                    : 'text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
                }`}
              >
                6M
              </button>
              <button
                type="button"
                onClick={() => setChartRange('30d')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartRange === '30d'
                    ? 'bg-white dark:bg-white/15 text-[#101C35] dark:text-white shadow-xs font-bold'
                    : 'text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
                }`}
              >
                30D
              </button>
            </div>
          </div>
        </div>

        {/* SVG Interactive Chart Canvas */}
        <div className="relative pt-2">
          <div className="h-64 sm:h-72 w-full flex items-end gap-2 sm:gap-4 px-2 sm:px-4 pb-6 pt-4">
            {salesTrend.map((item, idx) => {
              const currentVal = chartMetric === 'revenue' ? item.revenue : item.orders;
              const heightPercent = Math.max((currentVal / maxVal) * 100, 6);
              const targetHeightPercent = (item.target / maxVal) * 100;
              const isHovered = hoveredPoint === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer"
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 glass-modal text-[#101C35] dark:text-white text-[11px] py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap font-mono tabular-nums border border-[#C9A96E]/50">
                      <strong className="block text-[#C9A96E] font-sans font-bold">{item.month}</strong>
                      <span>
                        {chartMetric === 'revenue'
                          ? `${currencySymbol}${item.revenue.toLocaleString()}`
                          : `${item.orders} ${tr(currentLang, 'Orders', 'سفارش', 'سفارشونه')}`}
                      </span>
                      {chartMetric === 'revenue' && (
                        <span className="text-[#5A657D] dark:text-slate-400 block text-[10px]">
                          {tr(currentLang, 'Target:', 'هدف:', 'هدف:')} {currencySymbol}{item.target.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Target line indicator if revenue */}
                  {chartMetric === 'revenue' && (
                    <div
                      className="absolute w-full border-t border-dashed border-[#C9A96E]/60 pointer-events-none"
                      style={{ bottom: `${targetHeightPercent}%` }}
                      title={`Target: ${currencySymbol}${item.target}`}
                    />
                  )}

                  {/* Main Frosted Bar */}
                  <div
                    className={`w-full max-w-[48px] rounded-t-xl transition-all duration-200 ${
                      isHovered
                        ? 'bg-[#C9A96E] shadow-sm'
                        : idx === salesTrend.length - 1
                        ? 'bg-[#101C35] dark:bg-[#C9A96E]'
                        : 'bg-[#101C35]/70 dark:bg-white/20 hover:bg-[#101C35] dark:hover:bg-[#C9A96E]/80'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />

                  {/* X-axis Label */}
                  <span className="absolute -bottom-5 text-[10px] sm:text-xs text-[#5A657D] dark:text-slate-400 font-medium truncate max-w-full">
                    {item.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-5 pt-3 border-t border-slate-200/60 dark:border-white/10 text-xs text-[#5A657D] dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#101C35] dark:bg-[#C9A96E]" />
              <span>
                {chartMetric === 'revenue'
                  ? tr(currentLang, 'Actual Revenue', 'درآمد قطعی', 'حقیقي عواید')
                  : tr(currentLang, 'Order Volume', 'حجم سفارشات', 'د سفارشونو حجم')}
              </span>
            </div>
            {chartMetric === 'revenue' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 border-t-2 border-dashed border-[#C9A96E]" />
                <span>{tr(currentLang, 'Growth Target', 'تارگت رشد', 'د ودې هدف')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Orders (Left) + Recent Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Recent Orders Table */}
        <div className="lg:col-span-8 glass-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[#101C35] dark:text-slate-100 tracking-tight">
                {t.recentOrdersTitle}
              </h2>
              <p className="text-xs text-[#5A657D] dark:text-slate-400 mt-0.5">
                {tr(
                  currentLang,
                  'Commercial consignments, international freight, and wholesale invoices',
                  'معاملات بازرگانی، ارسال‌های بین‌المللی و فاکتورهای عمده',
                  'سوداګریزې معاملې، نړیوال لېږد او عمده فاکتورونه'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#101C35] dark:text-[#C9A96E] hover:text-[#C9A96E] dark:hover:text-white flex items-center gap-1 cursor-pointer self-start sm:self-auto transition-colors"
            >
              <span>{t.viewAll}</span>
              <ArrowForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Order Filters & Search */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-black/30 p-0.5 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs font-semibold overflow-x-auto">
              {['all', 'shipped', 'processing', 'delivered', 'pending'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition cursor-pointer text-[11px] whitespace-nowrap ${
                    orderStatusFilter === st
                      ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs font-bold'
                      : 'text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
                  }`}
                >
                  {statusLabels[st] || st}
                </button>
              ))}
            </div>

            {/* In-table search */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400 absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={tr(currentLang, 'Filter orders...', 'فیلتر سفارش...', 'د سفارش فلټر...')}
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full text-xs py-1.5 rounded-xl glass-input ps-8 pe-2.5"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200/60 dark:border-white/10 rounded-xl">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="glass-table-head text-[11px] font-bold text-[#5A657D] dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-start">{tr(currentLang, 'Order Number', 'شماره سفارش', 'د سفارش شمېره')}</th>
                  <th className="py-2.5 px-3 text-start">{tr(currentLang, 'Client / Company', 'مشتری / شرکت', 'پېرودونکی / شرکت')}</th>
                  <th className="py-2.5 px-3 text-start">{tr(currentLang, 'Amount', 'مبلغ', 'مبلغ')}</th>
                  <th className="py-2.5 px-3 text-start">{tr(currentLang, 'Status', 'وضعیت', 'حالت')}</th>
                  <th className="py-2.5 px-3 text-end">{tr(currentLang, 'Action', 'عملیات', 'عملیات')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                {filteredOrders.length > 0 ? (
                  filteredOrders.slice(0, 5).map((order) => {
                    const statusColors: Record<string, string> = {
                      shipped: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
                      delivered: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20',
                      processing: 'bg-[#C9A96E]/15 text-[#8C6D2E] dark:text-[#E6D2A8] border-[#C9A96E]/30',
                      pending: 'bg-black/5 dark:bg-white/10 text-[#5A657D] dark:text-slate-300 border-slate-200/60 dark:border-white/10',
                      cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                    };

                    return (
                      <tr
                        key={order.id}
                        className="glass-table-row cursor-pointer"
                        onClick={() => onSelectOrderDetails(order)}
                      >
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-[#101C35] dark:text-slate-100 block tabular-nums">
                            {order.orderNumber}
                          </span>
                          <span className="text-[10px] text-[#5A657D] dark:text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <strong className="text-[#101C35] dark:text-slate-100 block truncate max-w-[180px]">
                            {order.customerName}
                          </strong>
                          <span className="text-[11px] text-[#5A657D] dark:text-slate-400 block truncate max-w-[180px]">
                            {order.clientCompany || order.customerLocation}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-[#101C35] dark:text-slate-100 block tabular-nums">
                            {order.currency}{order.totalAmount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 capitalize font-medium">
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                              statusColors[order.status] || 'bg-black/5 text-[#5A657D]'
                            }`}
                          >
                            {statusLabels[order.status] || order.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOrderDetails(order);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-[#101C35] dark:text-slate-200 border border-slate-200/60 dark:border-white/10 transition cursor-pointer"
                          >
                            {tr(currentLang, 'Invoice', 'پیش‌فاکتور', 'مخکینی فاکتور')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#5A657D] dark:text-slate-400">
                      {tr(currentLang, 'No orders match the current filter.', 'هیچ سفارشی با این مشخصات یافت نشد.', 'د دې فلټر سره هیڅ سفارش ونه موندل شو.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (4 cols): Recent Activity Frosted Panel */}
        <div className="lg:col-span-4 glass-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <h2 className="text-base font-extrabold text-[#101C35] dark:text-slate-100 tracking-tight">
              {t.recentActivityTitle}
            </h2>
            <span className="text-[10px] font-mono font-bold text-[#5A657D] dark:text-slate-400 uppercase">
              {tr(currentLang, 'Audit Log', 'ثبت لاگ زنده', 'ژوندی ثبت')}
            </span>
          </div>

          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((act) => {
                const typeIcon = {
                  order: ShoppingCart,
                  product: Package,
                  inquiry: MessageSquare,
                  security: ShieldCheck,
                  system: Clock
                }[act.type] || Clock;

                const Icon = typeIcon;
                const iconColor = {
                  order: 'bg-[#101C35]/10 dark:bg-white/10 text-[#101C35] dark:text-slate-200',
                  product: 'bg-[#C9A96E]/15 text-[#8C6D2E] dark:text-[#E6D2A8]',
                  inquiry: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                  security: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
                  system: 'bg-black/5 dark:bg-white/10 text-[#5A657D] dark:text-slate-400'
                }[act.type] || 'bg-black/5 text-[#5A657D]';

                return (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-white/10 ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[#101C35] dark:text-slate-200 leading-snug">
                        <strong className="font-bold">{act.user}</strong>{' '}
                        <span className="text-[#5A657D] dark:text-slate-400">{act.action}</span>{' '}
                        <span className="font-semibold">{act.target}</span>
                      </p>
                      <span className="text-[10px] text-[#5A657D] dark:text-slate-400 mt-0.5 block font-mono">
                        {act.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-[#5A657D] dark:text-slate-400">
                {tr(currentLang, 'No recent activity recorded.', 'هیچ فعالیتی ثبت نشده است.', 'هیڅ وروستی فعالیت نه دی ثبت شوی.')}
              </div>
            )}
          </div>

          {/* Quick link to security audit */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => onNavigateTab('security_audit')}
              className="w-full py-2 px-3 rounded-xl glass-card hover:border-[#C9A96E]/50 text-[#101C35] dark:text-slate-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{tr(currentLang, 'Verify Tenant Security State', 'تست و ارزیابی تفکیک اطلاعات', 'د معلوماتو د جلاوالي امنیتي ارزونه')}</span>
              </div>
              <ChevronForward className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
