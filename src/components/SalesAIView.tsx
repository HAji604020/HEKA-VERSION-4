import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Package
} from 'lucide-react';
import { Product, Company, Language, GeneratedSalesReply } from '../types';
import { translations, tr } from '../translations';
import { generateUniversalSalesReply } from '../utils/salesAssistantEngine';

interface SalesAIViewProps {
  company: Company;
  products: Product[];
  currentLang: Language;
  initialInquiryMessage?: string;
  initialProductId?: string;
}

export const SalesAIView: React.FC<SalesAIViewProps> = ({
  company,
  products,
  currentLang,
  initialInquiryMessage,
  initialProductId,
}) => {
  const t = translations[currentLang] || translations.en;
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || products[0]?.id || ''
  );
  const [replyLang, setReplyLang] = useState<Language>(currentLang);
  const [customerMessage, setCustomerMessage] = useState<string>(
    initialInquiryMessage ||
      tr(
        currentLang,
        'Hello! Is this product in stock? What is the final price with delivery, and do you give any discount if I buy 2 units?',
        'سلام و احترام، آیا این جنس را در گدام موجود دارید؟ قیمت نهایی با ارسال چند می‌شود و آیا برای خرید ۲ عدد تخفیف می‌دهید؟',
        'سلام او درنښت، آیا دا توکی په ګودام کې شته؟ له لیږد سره وروستۍ بیه څو کیږي او آیا د ۲ دانو اخیستلو لپاره تخفیف ورکوئ؟'
      )
  );
  const [reply, setReply] = useState<GeneratedSalesReply | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setReplyLang(currentLang);
  }, [currentLang]);

  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleGenerate = () => {
    if (!selectedProduct || !customerMessage.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      const result = generateUniversalSalesReply(selectedProduct, company, customerMessage, replyLang);
      setReply(result);
      setIsGenerating(false);
    }, 250);
  };

  // Generate on first mount or selection
  useEffect(() => {
    if (selectedProduct && customerMessage.trim()) {
      const result = generateUniversalSalesReply(selectedProduct, company, customerMessage, replyLang);
      setReply(result);
    }
  }, [selectedProductId, replyLang]);

  const handleCopy = async () => {
    if (!reply?.text) return;
    try {
      await navigator.clipboard.writeText(reply.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleWhatsAppSend = () => {
    if (!reply?.text) return;
    const phone = company.contactPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(reply.text);
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-start">
      {/* Left Column: Product Selection & Inquiry Input */}
      <div className="lg:col-span-5 space-y-5">
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C9A96E]" />
              <h2 className="text-base font-extrabold text-[#101C35] dark:text-white">{t.salesAITitle}</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.salesAIDesc}</p>
          </div>

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>{t.selectProductLabel}</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-[#101C35]">
                  {currentLang === 'fa' ? p.nameFa || p.name : currentLang === 'ps' ? p.namePs || p.nameFa || p.name : p.name} ({p.currency}{p.retailPrice} • {p.stock} {tr(currentLang, 'in stock', 'موجود', 'شته')})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Product Card Snapshot */}
          {selectedProduct && (
            <div className="rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 p-3.5 flex items-center gap-3 backdrop-blur-xs">
              <img
                src={selectedProduct.images[0] || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=800&auto=format&fit=crop&q=80'}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-slate-200/60 dark:border-white/10 shrink-0"
              />
              <div className="flex-1 text-xs min-w-0">
                <strong className="text-slate-900 dark:text-white block truncate">
                  {currentLang === 'fa'
                    ? selectedProduct.nameFa || selectedProduct.name
                    : currentLang === 'ps'
                    ? selectedProduct.namePs || selectedProduct.nameFa || selectedProduct.name
                    : selectedProduct.name}
                </strong>
                <span className="text-slate-500 dark:text-slate-400">
                  {selectedProduct.currency}{selectedProduct.retailPrice} / {selectedProduct.unit} •{' '}
                  {tr(currentLang, 'Stock:', 'موجودی:', 'ذخیره:')} {selectedProduct.stock}
                </span>
              </div>
            </div>
          )}

          {/* Customer Message Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span>{t.customerInquiryLabel}</span>
              </label>

              {/* Reply Language Switcher (EN / دری / پښتو) */}
              <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => setReplyLang('en')}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                    replyLang === 'en'
                      ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#101C35] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setReplyLang('fa')}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                    replyLang === 'fa'
                      ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#101C35] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  دری
                </button>
                <button
                  type="button"
                  onClick={() => setReplyLang('ps')}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                    replyLang === 'ps'
                      ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#101C35] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  پښتو
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl resize-none leading-relaxed font-sans"
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !customerMessage.trim()}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#101C35] to-[#1c2e56] hover:from-[#192b52] hover:to-[#223a6c] dark:from-[#C9A96E] dark:to-[#d4b984] text-white dark:text-[#101C35] transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 border border-[#C9A96E]/30"
          >
            {isGenerating ? (
              <span>{t.generating}</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#C9A96E] dark:text-[#101C35]" />
                <span>{t.generateReplyBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Column: Grounded Reply Card */}
      <div className="lg:col-span-7 space-y-4">
        {reply && (
          <div className="glass-card p-6 rounded-3xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#101C35] dark:text-white text-base">{t.step3Title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {tr(
                      currentLang,
                      'Strictly verified against company inventory rules',
                      'بررسی‌شده بر اساس اطلاعات واقعی موجودی و قوانین شرکت',
                      'د شرکت د تایید شوو معلوماتو او اصولو پر بنسټ'
                    )}
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{reply.createdAt}</span>
            </div>

            {/* Warning if unconfirmed details */}
            {reply.hasUnconfirmedDetails && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 backdrop-blur-xs">
                <div className="font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{t.unconfirmedAlertTitle}</span>
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">{t.unconfirmedAlertDesc}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {reply.unconfirmedItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 font-bold text-[10px]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Text Box with Frosted Glass Surface */}
            <div
              dir={replyLang === 'fa' || replyLang === 'ps' ? 'rtl' : 'ltr'}
              className="bg-white/60 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 whitespace-pre-wrap text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans shadow-inner backdrop-blur-xs text-start"
            >
              {reply.text}
            </div>

            {/* Action Buttons: Copy and WhatsApp */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white border border-emerald-500'
                    : 'bg-[#101C35] hover:bg-[#192b52] dark:bg-[#C9A96E] dark:hover:bg-[#d4b984] text-white dark:text-[#101C35] border border-[#C9A96E]/30'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-[#C9A96E] dark:text-[#101C35]" />}
                <span>{copied ? t.copiedBtn : t.copyReplyBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppSend}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 transition cursor-pointer backdrop-blur-xs"
                title={tr(currentLang, 'Send reply via WhatsApp', 'ارسال پاسخ در واتساپ', 'د واټساپ له لارې ځواب استول')}
              >
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t.whatsappReply}</span>
              </button>
            </div>

            {/* Verified Facts List */}
            {reply.factsUsed.length > 0 && (
              <div className="rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 p-3.5 space-y-2 text-xs backdrop-blur-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">{t.verifiedFacts}</span>
                <div className="flex flex-wrap gap-2">
                  {reply.factsUsed.map((fact, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-medium"
                    >
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {fact}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
