import React from 'react';
import { X, CheckCircle2, Clock, Truck, Printer, Phone, Mail, Building, MapPin, Package, FileText } from 'lucide-react';
import { Order, Company, Language } from '../types';
import { tr } from '../translations';

interface OrderDetailModalProps {
  order: Order | null;
  company: Company;
  onClose: () => void;
  isRtl?: boolean;
  currentLang?: Language;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  company,
  onClose,
  isRtl = false,
  currentLang,
}) => {
  if (!order) return null;

  const lang: Language =
    currentLang ||
    (typeof document !== 'undefined' && (document.documentElement.lang === 'ps' || document.documentElement.lang === 'fa')
      ? (document.documentElement.lang as Language)
      : isRtl
      ? 'fa'
      : 'en');

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const phone = order.customerPhone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello ${order.customerName}, regarding your consignment ${order.orderNumber} with ${company.name}...`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-[#101C35]/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="glass-modal rounded-3xl max-w-2xl w-full overflow-hidden my-8 shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#101C35] to-[#1c2e56] dark:from-[#C9A96E]/20 dark:to-[#C9A96E]/5 flex items-center justify-center border border-[#C9A96E]/30">
              <FileText className="w-5 h-5 text-[#C9A96E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {tr(lang, 'Commercial Consignment', 'پیش‌فاکتور رسمی بازرگانی', 'سوداګریز رسمي انوایس')}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#C9A96E]/20 text-[#8C6D2E] dark:text-[#C9A96E] border border-[#C9A96E]/40 backdrop-blur-xs">
                  {order.isDemo
                    ? tr(lang, 'DEMO INVOICE', 'سفارش آزمایشی', 'ازمایښتي فرمایش')
                    : tr(lang, 'OFFICIAL', 'رسمی', 'رسمي')}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-[#101C35] dark:text-white tracking-tight mt-0.5">
                {tr(lang, `Order ${order.orderNumber}`, `سفارش ${order.orderNumber}`, `فرمایش ${order.orderNumber}`)}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Status & Carrier Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 backdrop-blur-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                {tr(lang, 'Status', 'وضعیت سفارش', 'د فرمایش حالت')}
              </span>
              <span className="font-bold text-slate-900 dark:text-white capitalize text-sm">{order.status}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                {tr(lang, 'Payment', 'وضعیت پرداخت', 'د تادیې حالت')}
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize text-sm">{order.paymentStatus}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                {tr(lang, 'Order Date', 'تاریخ ثبت', 'د ثبت نېټه')}
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                {tr(lang, 'Shipping Carrier', 'باربری و ارسال', 'بار وړونکی او لېږد')}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-200 text-xs truncate block">
                {order.shippingMethod}
              </span>
            </div>
          </div>

          {/* Customer & Destination Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                {tr(lang, 'Client Details', 'مشخصات خریدار / شرکت', 'د پیرودونکي / شرکت مشخصات')}
              </span>
              <strong className="text-sm font-bold text-[#101C35] dark:text-white block">{order.customerName}</strong>
              {order.clientCompany && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.clientCompany}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate" dir="ltr">{order.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span dir="ltr">{order.customerPhone}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                {tr(lang, 'Delivery Destination', 'مقصد تحویل بار', 'د بار سپارلو منزل')}
              </span>
              <div className="flex items-start gap-2 text-slate-900 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-[#C9A96E] shrink-0 mt-0.5" />
                <span>{order.customerLocation}</span>
              </div>
              {order.trackingNumber && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                    {tr(lang, 'Consignment Tracking', 'شماره رهگیری بارنامه', 'د بارنامې د تعقیب شمېره')}
                  </span>
                  <span className="font-mono font-bold text-[#101C35] dark:text-[#C9A96E] text-xs" dir="ltr">
                    {order.trackingNumber}
                  </span>
                </div>
              )}
              {order.notes && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 italic text-[11px]">
                  &ldquo;{order.notes}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs">
            <div className="px-4 py-3 bg-white/60 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-white/10 font-bold text-[#101C35] dark:text-white text-xs">
              {tr(lang, 'Ordered Items & Commercial Pricing', 'اقلام سفارش داده‌شده و نرخ‌های بازرگانی', 'فرمایش شوي توکي او سوداګریز نرخونه')}
            </div>
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="glass-table-head text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <th className="py-2.5 px-4">{tr(lang, 'Item Description', 'شرح کالا', 'د توکي شرحه')}</th>
                  <th className="py-2.5 px-3 text-center">{tr(lang, 'Qty', 'تعداد', 'مقدار')}</th>
                  <th className="py-2.5 px-3 text-end">{tr(lang, 'Unit Price', 'قیمت واحد', 'د واحد بیه')}</th>
                  <th className="py-2.5 px-4 text-end">{tr(lang, 'Total', 'مجموع', 'ټولټال')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="glass-table-row">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {item.productName}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-end font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {order.currency}{item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-end font-mono font-bold tabular-nums text-[#101C35] dark:text-white">
                      {order.currency}{item.totalPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white/70 dark:bg-slate-800/70 border-t border-slate-200/80 dark:border-white/10 font-bold">
                  <td colSpan={3} className="py-3 px-4 text-end text-[#101C35] dark:text-white">
                    {tr(lang, 'Grand Total:', 'مجموع کل فاکتور:', 'د انوایس ټولیزه مجموعه:')}
                  </td>
                  <td className="py-3 px-4 text-end font-mono text-sm tabular-nums text-[#101C35] dark:text-[#C9A96E]">
                    {order.currency}{order.totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{tr(lang, 'Contact Client', 'ارتباط واتساپ با خریدار', 'له پیرودونکي سره د واتساپ اړیکه')}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-slate-700 text-[#101C35] dark:text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>{tr(lang, 'Print Invoice', 'چاپ فاکتور', 'انوایس چاپ کړئ')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#101C35] hover:bg-[#192b52] dark:bg-[#C9A96E] dark:hover:bg-[#d4b984] text-white dark:text-[#101C35] font-bold text-xs cursor-pointer shadow-sm border border-[#C9A96E]/30 active:scale-95"
          >
            {tr(lang, 'Close', 'بستن', 'تړل')}
          </button>
        </div>
      </div>
    </div>
  );
};

