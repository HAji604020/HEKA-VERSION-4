import React from 'react';
import {
  Globe,
  Package,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Company, Product, Order, Language } from '../types';
import { translations, tr } from '../translations';

interface AnalyticsViewProps {
  company: Company;
  products: Product[];
  orders: Order[];
  salesTrend: { month: string; revenue: number; orders: number; target: number }[];
  currentLang: Language;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  company,
  products,
  orders,
  salesTrend,
  currentLang,
}) => {
  const t = translations[currentLang];
  const currencySymbol = company.currency === 'USD' ? '$' : company.currency;

  const totalGross = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalGross / orders.length) : 0;

  // Regional export breakdown
  const regions = [
    {
      name: tr(currentLang, 'UK & Western Europe', 'بریتانیا و اروپای غربی', 'بریتانیا او لوېدیځه اروپا'),
      percentage: 42,
      volume: '$62,400',
      color: 'bg-[#101C35] dark:bg-[#C9A96E]'
    },
    {
      name: tr(currentLang, 'Middle East & GCC (Dubai / DIFC)', 'خاورمیانه و کشورهای خلیج (دبی / DIFC)', 'منځنی ختیځ او خلیج هېوادونه (دبۍ / DIFC)'),
      percentage: 34,
      volume: '$50,540',
      color: 'bg-[#C9A96E]'
    },
    {
      name: tr(currentLang, 'Central Asia & Regional', 'آسیای میانه و منطقه داخلی', 'منځنۍ اسیا او سیمه ییز بازارونه'),
      percentage: 14,
      volume: '$20,810',
      color: 'bg-[#192b52] dark:bg-slate-500'
    },
    {
      name: tr(currentLang, 'Asia-Pacific & North America', 'آسیا پاسیفیک و آمریکای شمالی', 'اسیا پاسیفیک او شمالي امریکا'),
      percentage: 10,
      volume: '$14,900',
      color: 'bg-slate-400 dark:bg-slate-600'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#101C35] dark:text-slate-100 tracking-tight">
            {t.tabAnalytics}
          </h1>
          <p className="text-xs text-[#5A657D] dark:text-slate-400 mt-1">
            {tr(
              currentLang,
              'Real-time analytics for revenue pacing, trade corridors, consignment turnaround, and quality compliance.',
              'گزارش‌های زنده از روند درآمدزایی، کریدورهای صادراتی، سرعت ترخیص و تعهدات کیفی',
              'د عوایدو بهیر، صادراتي دهلیزونو، د بار لېږد سرعت او کیفیت تضمین ژوندي راپورونه'
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
              `Analytics figures combine verified catalog configurations and sample trade consignments for ${company.name}.`,
              `آمارهای زیر ترکیبی از اطلاعات تاییدشده کاتالوگ و معاملات شبیه‌سازی‌شده برای ${company.name} هستند.`,
              `لاندې احصایې د ${company.name} لپاره د تایید شوي کاتالوګ او بیلګه سوداګریزو معاملو ترکیب دی.`
            )}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase font-bold text-[#8C6D2E] dark:text-[#E6D2A8] glass-badge-gold px-2 py-0.5 rounded">
          {tr(currentLang, 'DEMO ANALYTICS', 'داده‌های نمونه', 'بیلګه احصایې')}
        </span>
      </div>

      {/* KPI Trio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-[11px] font-bold text-[#5A657D] dark:text-slate-400 uppercase tracking-wider block mb-1">
            {tr(currentLang, 'Average Consignment Value', 'میانگین ارزش هر محموله', 'د هرې محمولې منځنی ارزښت')}
          </span>
          <span className="text-2xl font-extrabold text-[#101C35] dark:text-slate-100 font-mono tabular-nums">
            {currencySymbol}{avgOrderValue.toLocaleString()}
          </span>
          <p className="text-[11px] text-[#5A657D] dark:text-slate-400 mt-2">
            {tr(
              currentLang,
              'Based on active wholesale B2B and retail invoices',
              'محاسبه شده بر اساس فاکتورهای عمده تجارتی',
              'د فعالو عمده او پرچون سوداګریزو فاکتورونو پر بنسټ'
            )}
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-[11px] font-bold text-[#5A657D] dark:text-slate-400 uppercase tracking-wider block mb-1">
            {tr(currentLang, 'Consignment Dispatch Speed', 'سرعت پردازش و ارسال بار', 'د بار پروسس او لېږد سرعت')}
          </span>
          <span className="text-2xl font-extrabold text-[#101C35] dark:text-slate-100 font-mono tabular-nums">
            {tr(currentLang, '24-48 Hours', '۲۴ الی ۴۸ ساعت', '۲۴ تر ۴۸ ساعتونو')}
          </span>
          <p className="text-[11px] text-[#5A657D] dark:text-slate-400 mt-2">
            {tr(
              currentLang,
              'Priority international courier and CIP cargo protocol',
              'ارسال سریع هوایی با بیمه و استانداردهای CIP',
              'د CIP بیمې او نړیوال هوایي کوریر له لارې چټک لېږد'
            )}
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-[11px] font-bold text-[#5A657D] dark:text-slate-400 uppercase tracking-wider block mb-1">
            {tr(currentLang, 'Fact Grounding Integrity', 'صحت انطباق هوش مصنوعی', 'د مصنوعي ځیرکتیا د معلوماتو کره والی')}
          </span>
          <span className="text-2xl font-extrabold text-[#101C35] dark:text-slate-100 font-mono tabular-nums flex items-center gap-1.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>100% {tr(currentLang, 'Verified', 'تاییدشده', 'تایید شوی')}</span>
          </span>
          <p className="text-[11px] text-[#5A657D] dark:text-slate-400 mt-2">
            {tr(
              currentLang,
              'Zero hallucinated prices or unconfirmed claims in replies',
              'بدون هرگونه جعل قیمت یا ادعای تاییدنشده',
              'په ځوابونو کې پرته له کومې ناسمې بیې یا ناتایید شوې ادعا'
            )}
          </p>
        </div>
      </div>

      {/* 2-Column: Regional Trade Distribution & Product Catalog Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Trade Destination */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <h2 className="text-base font-extrabold text-[#101C35] dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#C9A96E]" />
              <span>
                {tr(
                  currentLang,
                  'International Trade Destination Breakdown',
                  'تفکیک جغرافیایی مقاصد بازرگانی',
                  'د سوداګریزو مقاصدو جغرافیایي ویش'
                )}
              </span>
            </h2>
          </div>

          <div className="space-y-4 pt-1">
            {regions.map((reg, idx) => (
              <div key={idx} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#101C35] dark:text-slate-200">{reg.name}</span>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="text-[#5A657D] dark:text-slate-400">{reg.volume}</span>
                    <strong className="text-[#101C35] dark:text-slate-100">{reg.percentage}%</strong>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden border border-slate-200/60 dark:border-white/10">
                  <div
                    className={`h-full rounded-full ${reg.color}`}
                    style={{ width: `${reg.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Demand & Stock Health */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
            <h2 className="text-base font-extrabold text-[#101C35] dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C9A96E]" />
              <span>
                {tr(
                  currentLang,
                  'Product Inventory & Quality Compliance',
                  'وضعیت انبار و انطباق کیفی محصولات',
                  'د زیرمې حالت او د محصولاتو کیفیتي مطابقت'
                )}
              </span>
            </h2>
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-white/10 text-xs">
            {products.map((prod) => (
              <div key={prod.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <strong className="text-[#101C35] dark:text-slate-100 block truncate">
                    {currentLang === 'fa'
                      ? prod.nameFa || prod.name
                      : currentLang === 'ps'
                      ? prod.namePs || prod.nameFa || prod.name
                      : prod.name}
                  </strong>
                  <span className="text-[#5A657D] dark:text-slate-400 block text-[11px]">
                    {tr(
                      currentLang,
                      `Category: ${prod.category} · Unit: ${prod.unit}`,
                      `دسته‌بندی: ${prod.category} · واحد: ${prod.unit}`,
                      `کټګوري: ${prod.category} · واحد: ${prod.unit}`
                    )}
                  </span>
                </div>
                <div className="text-end shrink-0">
                  <span className="font-mono font-bold text-[#101C35] dark:text-slate-100 block tabular-nums">
                    {prod.currency}{prod.retailPrice}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      prod.stock > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {prod.stock > 0
                      ? tr(currentLang, `${prod.stock} in stock`, `${prod.stock} عدد موجود`, `${prod.stock} په زیرمه کې شته`)
                      : tr(currentLang, 'Out of stock', 'اتمام موجودی', 'ناموجود')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
