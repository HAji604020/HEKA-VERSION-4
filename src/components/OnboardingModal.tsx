import React, { useState } from 'react';
import { Building, PlusCircle, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { Company, Language } from '../types';
import { translations } from '../translations';
import { api } from '../services/api';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (newCompany: Company) => void;
  currentLang: Language;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompanyCreated,
  currentLang,
}) => {
  if (!isOpen) return null;
  const t = translations[currentLang];

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('General Retail & Trade');
  const [country, setCountry] = useState('Afghanistan');
  const [currency, setCurrency] = useState('USD');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+93');
  const [primaryColor, setPrimaryColor] = useState('#101C35');
  const [accentColor, setAccentColor] = useState('#C9A96E');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adminEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.registerCompany({
        name,
        industry,
        country,
        currency,
        adminName: adminName || 'Company Admin',
        adminEmail,
        contactPhone,
        brandColors: { primary: primaryColor, accent: accentColor }
      });
      onCompanyCreated(res.company);
      onClose();
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101C35]/60 dark:bg-black/75 backdrop-blur-md">
      <div className="glass-modal rounded-3xl max-w-lg w-full overflow-hidden my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#101C35] to-[#1c2e56] dark:from-[#C9A96E]/20 dark:to-[#C9A96E]/5 flex items-center justify-center border border-[#C9A96E]/30">
              <PlusCircle className="w-4 h-4 text-[#C9A96E]" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#101C35] dark:text-white text-base">{t.onboardingTitle}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Deploy Isolated Enterprise Trading Workspace</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm max-h-[75vh] overflow-y-auto">
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{t.onboardingDesc}</p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.companyNameLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pamir Handwoven Rugs or Aryana Spices"
              className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.industryLabel}</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Apparel, Food, Electronics"
                className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.countryLabel}</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.adminEmailLabel} <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@yourbusiness.com"
                className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.adminNameLabel}</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Full Name"
                className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.phoneLabel}</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.currencyLabel}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium cursor-pointer"
              >
                <option value="USD" className="dark:bg-[#101C35]">$ (USD)</option>
                <option value="AFN" className="dark:bg-[#101C35]">AFN (افغانی)</option>
                <option value="EUR" className="dark:bg-[#101C35]">€ (EUR)</option>
                <option value="AED" className="dark:bg-[#101C35]">AED (درهم)</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed backdrop-blur-xs">
            {t.noPaymentNotice}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#101C35] to-[#1c2e56] hover:from-[#192b52] hover:to-[#223a6c] dark:from-[#C9A96E] dark:to-[#d4b984] text-white dark:text-[#101C35] transition flex items-center gap-1.5 shadow-md cursor-pointer border border-[#C9A96E]/30 active:scale-95"
            >
              {isSubmitting ? 'Creating...' : t.registerBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
