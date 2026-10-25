import React, { useState } from 'react';
import {
  ShoppingCart,
  Search,
  Download,
  Info,
  Calendar,
  Building,
  CheckCircle2
} from 'lucide-react';
import { Order, Company, Language } from '../types';
import { translations, tr } from '../translations';

interface OrdersViewProps {
  company: Company;
  orders: Order[];
  currentLang: Language;
  onSelectOrder: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  company,
  orders,
  currentLang,
  onSelectOrder,
}) => {
  const t = translations[currentLang];
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchComp = order.clientCompany?.toLowerCase().includes(q) || false;
      const matchDest = order.customerLocation.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchComp && !matchDest) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'Client Company', 'Destination', 'Total', 'Status', 'Payment'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      `"${o.customerName}"`,
      `"${o.clientCompany || ''}"`,
      `"${o.customerLocation}"`,
      o.totalAmount,
      o.status,
      o.paymentStatus
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${company.slug}-orders-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusColors: Record<string, string> = {
    shipped: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    delivered: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20',
    processing: 'bg-[#C9A96E]/15 text-[#8C6D2E] dark:text-[#E6D2A8] border-[#C9A96E]/30',
    pending: 'bg-black/5 dark:bg-white/10 text-[#5A657D] dark:text-slate-300 border-slate-200/60 dark:border-white/10',
    cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
  };

  const statusLabels: Record<string, string> = {
    all: tr(currentLang, 'All', 'همه', 'ټول'),
    processing: tr(currentLang, 'Processing', 'در حال پردازش', 'تر پروسس لاندې'),
    shipped: tr(currentLang, 'Shipped', 'ارسال شده', 'استول شوی'),
    delivered: tr(currentLang, 'Delivered', 'تحویل شده', 'سپارل شوی'),
    pending: tr(currentLang, 'Pending', 'در انتظار', 'په تمه'),
    cancelled: tr(currentLang, 'Cancelled', 'لغوشده', 'لغوه شوی')
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#101C35] dark:text-slate-100 tracking-tight">
              {t.tabOrders}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-black/5 dark:bg-white/10 text-[#101C35] dark:text-slate-200 border border-slate-200/60 dark:border-white/10 tabular-nums">
              {filteredOrders.length} {tr(currentLang, filteredOrders.length === 1 ? 'Order' : 'Orders', 'سفارش', 'سفارشونه')}
            </span>
          </div>
          <p className="text-xs text-[#5A657D] dark:text-slate-400 mt-1">
            {tr(
              currentLang,
              'Manage wholesale shipments, customs clearances, and inspect commercial invoices.',
              'مدیریت بارنامه‌های صادراتی، پیگیری گمرکی و بازبینی فاکتورهای عمده‌فروشی',
              'د صادراتي بارنامو مدیریت، ګمرکي تعقیب او د عمده پلور فاکتورونو بیاکتنه'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          className="px-4 py-2 rounded-xl text-xs font-bold glass-card hover:border-[#C9A96E]/50 text-[#101C35] dark:text-slate-200 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <Download className="w-4 h-4 text-[#C9A96E]" />
          <span>{tr(currentLang, 'Export CSV', 'خروجی اکسل / CSV', 'CSV صادرول')}</span>
        </button>
      </div>

      {/* Demo Notice */}
      <div className="px-4 py-2.5 rounded-xl glass-card text-[#5A657D] dark:text-slate-300 text-xs flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#C9A96E] shrink-0" />
          <span>
            <strong className="text-[#101C35] dark:text-white font-bold">
              {tr(currentLang, 'Demo Staging:', 'محیط آزمایشی:', 'آزمېښتي چاپېریال:')}
            </strong>{' '}
            {tr(
              currentLang,
              `Consignments below illustrate realistic B2B consignment workflows for ${company.name}.`,
              `سفارشات زیر فرآیند ارسال و صدور پیش‌فاکتور برای ${company.name} را شبیه‌سازی می‌کنند.`,
              `لاندې سفارشونه د ${company.name} لپاره د لېږد او پیش‌فاکتور بهیر ښيي.`
            )}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase font-bold text-[#8C6D2E] dark:text-[#E6D2A8] glass-badge-gold px-2 py-0.5 rounded">
          {tr(currentLang, 'DEMO DATA', 'داده‌های نمونه', 'بیلګه ارقام')}
        </span>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-black/30 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs font-semibold overflow-x-auto">
          {['all', 'processing', 'shipped', 'delivered', 'pending'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs font-bold'
                  : 'text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
              }`}
            >
              {statusLabels[st] || st}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-[#5A657D] dark:text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
          <input
            type="text"
            placeholder={tr(
              currentLang,
              'Search by order #, client, country...',
              'جستجو بر اساس شماره سفارش، مشتری، کشور...',
              'د سفارش شمېرې، پېرودونکي یا هېواد پر بنسټ پلټنه...'
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs py-2 rounded-xl glass-input ps-9 pe-3"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="glass-table-head text-[11px] font-bold text-[#5A657D] dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-4 text-start">{tr(currentLang, 'Order', 'سفارش', 'سفارش')}</th>
                <th className="py-3 px-4 text-start">{tr(currentLang, 'Client Organization', 'مشتری / سازمان خریدار', 'پېرودونکی / شرکت')}</th>
                <th className="py-3 px-4 text-start">{tr(currentLang, 'Consignment Items', 'اقلام محموله', 'د محمولې توکي')}</th>
                <th className="py-3 px-4 text-start">{tr(currentLang, 'Amount & Payment', 'مبلغ و تسویه', 'مبلغ او تادیه')}</th>
                <th className="py-3 px-4 text-start">{tr(currentLang, 'Carrier & Tracking', 'باربری و رهگیری', 'لېږد او تعقیب')}</th>
                <th className="py-3 px-4 text-start">{tr(currentLang, 'Status', 'وضعیت', 'حالت')}</th>
                <th className="py-3 px-4 text-end">{tr(currentLang, 'Invoice', 'مشاهده', 'فاکتور')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className="glass-table-row cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#101C35] dark:text-slate-100 block tabular-nums">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-[#5A657D] dark:text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <strong className="text-[#101C35] dark:text-slate-100 block font-bold">
                        {order.customerName}
                      </strong>
                      <span className="text-[#5A657D] dark:text-slate-400 block text-[11px]">
                        {order.clientCompany || order.customerLocation}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="text-[#101C35] dark:text-slate-200 truncate">
                          <span className="font-mono font-bold text-[#C9A96E]">{it.quantity}x</span> {it.productName}
                        </div>
                      ))}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#101C35] dark:text-slate-100 text-sm block tabular-nums">
                        {order.currency}{order.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 capitalize font-medium">
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[#101C35] dark:text-slate-200 font-medium block truncate max-w-[150px]">
                        {order.shippingMethod}
                      </span>
                      {order.trackingNumber && (
                        <span className="font-mono text-[10px] text-[#C9A96E] block font-semibold">
                          {order.trackingNumber}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                          statusColors[order.status] || 'bg-black/5 text-[#5A657D]'
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder(order);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#101C35] dark:bg-[#C9A96E] hover:bg-[#192b52] dark:hover:bg-[#d8be8d] text-white dark:text-[#0B1220] transition shadow-2xs cursor-pointer"
                      >
                        {tr(currentLang, 'Inspect', 'پیش‌فاکتور', 'کتل')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5A657D] dark:text-slate-400">
                    {tr(
                      currentLang,
                      'No orders match your filter criteria.',
                      'هیچ سفارشی با شرایط جستجو یافت نشد.',
                      'د پلټنې شرایطو سره هیڅ سفارش ونه موندل شو.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
