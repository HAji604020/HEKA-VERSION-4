import React, { useState } from 'react';
import {
  Users,
  Search,
  Building,
  Phone,
  Mail,
  MapPin,
  Info
} from 'lucide-react';
import { Customer, Company, Language } from '../types';
import { translations, tr } from '../translations';

interface CustomersViewProps {
  company: Company;
  customers: Customer[];
  currentLang: Language;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  company,
  customers,
  currentLang,
}) => {
  const t = translations[currentLang];
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredCustomers = customers.filter((cust) => {
    if (typeFilter !== 'all' && cust.type !== typeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cust.name.toLowerCase().includes(q);
      const matchEmail = cust.email.toLowerCase().includes(q);
      const matchComp = cust.clientCompany?.toLowerCase().includes(q) || false;
      const matchLoc = cust.location.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchComp && !matchLoc) return false;
    }
    return true;
  });

  const getWhatsAppHref = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Hello ${name}, greeting from ${company.name}...`);
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#101C35] dark:text-slate-100 tracking-tight">
              {t.tabCustomers}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-black/5 dark:bg-white/10 text-[#101C35] dark:text-slate-200 border border-slate-200/60 dark:border-white/10 tabular-nums">
              {filteredCustomers.length} {tr(currentLang, filteredCustomers.length === 1 ? 'Client' : 'Clients', 'حساب', 'پېرودونکي')}
            </span>
          </div>
          <p className="text-xs text-[#5A657D] dark:text-slate-400 mt-1">
            {tr(
              currentLang,
              'Global distributors, enterprise procurement accounts, and verified commercial contacts.',
              'توزیع‌کنندگان بین‌المللی، حساب‌های سازمانی، خریداران عمده و مشتریان خرده‌فروشی',
              'نړیوال توزیع کوونکي، شرکتي حسابونه، عمده پېرودونکي او پرچون پیرودونکي'
            )}
          </p>
        </div>
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
              `Client directory reflects simulated commercial relationships and inquiry contacts for ${company.name}.`,
              `فهرست زیر مخاطبان تجارتی شبیه‌سازی‌شده برای شرکت ${company.name} را نمایش می‌دهد.`,
              `لاندې لړلیک د ${company.name} شرکت لپاره سوداګریزې اړیکې او استعلام کوونکي ښيي.`
            )}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase font-bold text-[#8C6D2E] dark:text-[#E6D2A8] glass-badge-gold px-2 py-0.5 rounded">
          {tr(currentLang, 'DEMO DIRECTORY', 'داده‌های نمونه', 'بیلګه لړلیک')}
        </span>
      </div>

      {/* Search & Type Filter */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-black/5 dark:bg-black/30 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'all', label: tr(currentLang, 'All Accounts', 'همه حساب‌ها', 'ټول حسابونه') },
            { id: 'b2b_wholesale', label: tr(currentLang, 'B2B Wholesale', 'عمده‌فروشی B2B', 'B2B عمده پلور') },
            { id: 'corporate_client', label: tr(currentLang, 'Corporate Clients', 'مشتریان سازمانی', 'شرکتي پېرودونکي') },
            { id: 'retail_buyer', label: tr(currentLang, 'Retail Buyers', 'خریداران تکی', 'پرچون پېرودونکي') }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                typeFilter === tab.id
                  ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs font-bold'
                  : 'text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-[#5A657D] dark:text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
          <input
            type="text"
            placeholder={tr(
              currentLang,
              'Search by name, organization, city...',
              'جستجو بر اساس نام، شرکت، شهر...',
              'د نوم، شرکت یا ښار پر بنسټ پلټنه...'
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs py-2 rounded-xl glass-input ps-9 pe-3"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="glass-card p-5 rounded-2xl hover:border-[#C9A96E]/50 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Top Row: Name, Status & Type */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-extrabold text-sm text-[#101C35] dark:text-slate-100 tracking-tight">
                      {cust.name}
                    </h2>
                    {cust.clientCompany ? (
                      <span className="text-xs font-semibold text-[#5A657D] dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <span>{cust.clientCompany}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-[#5A657D] dark:text-slate-400 block mt-0.5">
                        {tr(currentLang, 'Individual Client', 'خریدار حقیقی', 'انفرادي پېرودونکی')}
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      cust.status === 'vip'
                        ? 'bg-[#C9A96E]/20 text-[#8C6D2E] dark:text-[#E6D2A8] border border-[#C9A96E]/40'
                        : cust.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-black/5 dark:bg-white/10 text-[#5A657D] dark:text-slate-300 border border-slate-200/60 dark:border-white/10'
                    }`}
                  >
                    {cust.status}
                  </span>
                </div>

                {/* Location & Contact Info */}
                <div className="space-y-1.5 text-xs text-[#5A657D] dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
                    <span className="truncate">{cust.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400 shrink-0" />
                    <span dir="ltr" className="truncate">{cust.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400 shrink-0" />
                    <span dir="ltr">{cust.phone}</span>
                  </div>
                </div>

                {/* Notes if available */}
                {cust.notes && (
                  <p className="text-[11px] text-[#5A657D] dark:text-slate-300 italic bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/10">
                    &ldquo;{cust.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Bottom Metrics & Contact Buttons */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#5A657D] dark:text-slate-400 block">
                      {tr(currentLang, 'Orders', 'سفارشات', 'سفارشونه')}
                    </span>
                    <span className="font-mono font-bold text-[#101C35] dark:text-slate-100 tabular-nums">
                      {cust.totalOrders} {tr(currentLang, cust.totalOrders === 1 ? 'order' : 'orders', 'سفارش', 'سفارشونه')}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-[10px] uppercase font-bold text-[#5A657D] dark:text-slate-400 block">
                      {tr(currentLang, 'Total Spend', 'مجموع خرید', 'ټول پېر')}
                    </span>
                    <span className="font-mono font-bold text-[#101C35] dark:text-[#C9A96E] text-sm tabular-nums">
                      {cust.currency}{cust.totalSpent.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={getWhatsAppHref(cust.phone, cust.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`mailto:${cust.email}`}
                    className="px-3.5 py-2 rounded-xl glass-card hover:border-[#C9A96E]/50 text-[#101C35] dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 transition shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#5A657D] dark:text-slate-400" />
                    <span>{tr(currentLang, 'Email', 'ایمیل', 'ایمیل')}</span>
                  </a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-[#5A657D] dark:text-slate-400 glass-card rounded-2xl">
            {tr(
              currentLang,
              'No clients match the search criteria.',
              'هیچ مشتری با مشخصات جستجو شده یافت نشد.',
              'د پلټنې شرایطو سره هیڅ پېرودونکی ونه موندل شو.'
            )}
          </div>
        )}
      </div>
    </div>
  );
};
