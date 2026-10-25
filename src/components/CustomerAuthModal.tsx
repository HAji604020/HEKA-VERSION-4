import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { User as UserType, AccountType, Language } from '../types';
import { api } from '../services/api';
import { tr } from '../translations';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  currentLang: Language;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentLang
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'recovery'>('signin');
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [city, setCity] = useState('London');

  // Business specific fields
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('Wholesaler / Distributor');
  const [regNumber, setRegNumber] = useState('');

  // Password recovery provider readiness
  const [recoveryStatus, setRecoveryStatus] = useState<{
    configured: boolean;
    provider: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && mode === 'recovery') {
      api
        .getRecoveryStatus()
        .then((res) => setRecoveryStatus(res))
        .catch(() => {});
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const isRtl = currentLang === 'fa' || currentLang === 'ps';

  const handleQuickLogin = async (token: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.login('', token, 'customer');
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      api.clearToken();
      setError(err.message || tr(currentLang, 'Failed to sign in', 'خطا در ورود به حساب', 'حساب ته په ننوتلو کې تېروتنه'));
    } finally {
      setLoading(false);
    }
  };

  const validateClientSide = (): string | null => {
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      return tr(
        currentLang,
        'Please enter a valid email address.',
        'لطفاً یک آدرس ایمیل معتبر وارد نمایید.',
        'مهرباني وکړئ یو سم برېښنالیک ولیکئ.'
      );
    }

    if (mode === 'signin') {
      if (!password) {
        return tr(
          currentLang,
          'Please enter your password.',
          'لطفاً رمز عبور خود را وارد نمایید.',
          'مهرباني وکړئ خپل پټنوم ولیکئ.'
        );
      }
      return null;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        return tr(
          currentLang,
          'Full name or contact person name is required.',
          'وارد کردن نام کامل الزامی است.',
          'بشپړ نوم لیکل اړین دي.'
        );
      }
      if (accountType === 'business' && !companyName.trim()) {
        return tr(
          currentLang,
          'Company legal name is required for Business accounts.',
          'وارد کردن نام قانونی شرکت برای حساب تجارتی الزامی است.',
          'د سوداګریز حساب لپاره د شرکت قانوني نوم اړین دی.'
        );
      }
      if (!phone.trim()) {
        return tr(
          currentLang,
          'Phone or WhatsApp number is required.',
          'وارد کردن شماره تماس الزامی است.',
          'د تلیفون یا واټساپ شمېره اړینه ده.'
        );
      }
      if (!country.trim() || !city.trim()) {
        return tr(
          currentLang,
          'Country and city are required.',
          'وارد کردن کشور و شهر الزامی است.',
          'هېواد او ښار لیکل اړین دي.'
        );
      }
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return tr(
          currentLang,
          'Password must be at least 8 characters and contain at least one letter and one number.',
          'رمز عبور باید حداقل ۸ کاراکتر بوده و شامل حداقل یک حرف و یک عدد باشد.',
          'پټنوم باید لږترلږه ۸ توري وي او لږترلږه یو توری او یوه شمېره ولري.'
        );
      }
      if (password !== confirmPassword) {
        return tr(
          currentLang,
          'Password and password confirmation do not match.',
          'رمز عبور و تکرار رمز عبور مطابقت ندارند.',
          'پټنوم او د پټنوم تایید سره سمون نه خوري.'
        );
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === 'recovery') {
      setLoading(true);
      try {
        const res = await api.requestPasswordReset(email.trim());
        setSuccessMessage(res.message);
      } catch (err: any) {
        setError(
          err.message ||
            tr(
              currentLang,
              'Password recovery is not configured.',
              'بازیابی خودکار رمز عبور تنظیم نشده است.',
              'د پټنوم اتومات بیا رغونه فعاله شوې نه ده.'
            )
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    const validationErr = validateClientSide();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const res = await api.login(email.trim(), undefined, 'customer', password);
        setPassword('');
        onSuccess(res.user);
        onClose();
      } else {
        const payload = {
          name: fullName.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          accountType,
          country: country.trim(),
          city: city.trim(),
          phone: phone.trim(),
          preferredLanguage: currentLang,
          personalProfile:
            accountType === 'personal'
              ? {
                  fullName: fullName.trim(),
                  country: country.trim(),
                  city: city.trim(),
                  phone: phone.trim()
                }
              : undefined,
          businessProfile:
            accountType === 'business'
              ? {
                  contactPerson: fullName.trim(),
                  companyName: companyName.trim(),
                  country: country.trim(),
                  city: city.trim(),
                  businessEmail: email.trim(),
                  businessPhone: phone.trim(),
                  businessType,
                  registrationNumber: regNumber.trim() || undefined
                }
              : undefined
        };

        const res = await api.registerCustomer(payload);
        setPassword('');
        setConfirmPassword('');
        setSuccessMessage(
          tr(
            currentLang,
            'Account registered and persisted successfully!',
            'حساب کاربری شما با موفقیت ایجاد و ذخیره شد!',
            'ستاسو حساب په بریا سره جوړ او خوندي شو!'
          )
        );
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || tr(currentLang, 'Authentication error', 'خطای احراز هویت', 'د ننوتلو تېروتنه'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 bg-white/95 dark:bg-[#101C35]/95 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl text-[#172033] dark:text-[#E2E8F0]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 end-5 p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#101C35] to-[#C9A96E] text-white shadow-lg shadow-[#C9A96E]/20 mb-3">
            <ShieldCheck className="w-7 h-7 text-[#C9A96E]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#101C35] dark:text-white">
            {mode === 'signin'
              ? tr(currentLang, 'Sign In to HEKA LTD', 'ورود به حساب کاربری HEKA LTD', 'د HEKA LTD حساب ته ننوتل')
              : mode === 'signup'
              ? tr(currentLang, 'Create Customer Account', 'ایجاد حساب کاربری جدید', 'د پېرودونکي نوی حساب جوړول')
              : tr(currentLang, 'Password Recovery', 'بازیابی رمز عبور', 'د پټنوم بیا رغونه')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {mode === 'signin'
              ? tr(
                  currentLang,
                  'Sign in with your registered email and password',
                  'با ایمیل و رمز عبور ثبت‌شده خود وارد شوید',
                  'د خپل ثبت شوي برېښنالیک او پټنوم سره ننوځئ'
                )
              : mode === 'signup'
              ? tr(
                  currentLang,
                  'Register a Personal or Business account with secure server-side password hashing',
                  'حساب شخصی یا تجارتی خود را با رمزنگاری امن ایجاد کنید',
                  'خپل شخصي یا سوداګریز حساب په خوندي بڼه جوړ کړئ'
                )
              : tr(
                  currentLang,
                  'Verify password recovery availability for your account',
                  'بررسی وضعیت بازیابی رمز عبور از طریق ایمیل',
                  'د خپل حساب لپاره د پټنوم د بیا رغونې حالت وګورئ'
                )}
          </p>
        </div>

        {/* Mode switcher tabs (Sign In vs Register) */}
        <div className="flex p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/20 dark:border-white/5 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white dark:bg-[#101C35] text-[#101C35] dark:text-[#C9A96E] shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tr(currentLang, 'Sign In', 'ورود با رمز عبور', 'په پټنوم ننوتل')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white dark:bg-[#101C35] text-[#101C35] dark:text-[#C9A96E] shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tr(currentLang, 'Register New Account', 'ثبت‌نام حساب جدید', 'د نوي حساب نوم لیکنه')}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'recovery' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 text-amber-900 dark:text-amber-200">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    {recoveryStatus?.configured
                      ? tr(currentLang, 'Verified Email Recovery Available', 'بازیابی ایمیلی فعال است', 'د برېښنالیک له لارې بیا رغونه فعاله ده')
                      : tr(currentLang, 'Automated Password Reset Not Configured', 'ارسال خودکار ایمیل بازیابی تنظیم نشده است', 'د پټنوم اتومات بیا رغونه تنظیم شوې نه ده')}
                  </span>
                </div>
                <p className="leading-relaxed">
                  {recoveryStatus?.message ||
                    tr(
                      currentLang,
                      'Automated password reset emails cannot be dispatched until a server-side transactional email provider (RESEND_API_KEY or SENDGRID_API_KEY) is configured. Signed-in users can change their password directly in Account Settings.',
                      'ارسال خودکار ایمیل بازیابی رمز عبور تا زمان تنظیم سرویس ایمیل سرور (RESEND_API_KEY یا SENDGRID_API_KEY) فعال نیست. کاربران واردشده می‌توانند رمز عبور خود را مستقیماً در بخش امنیت حساب تغییر دهند.',
                      'د پټنوم د بیا رغونې اتومات برېښنالیک تر هغه نشي استول کېدای ترڅو چې د سرور برېښنالیک خدمت (RESEND_API_KEY یا SENDGRID_API_KEY) تنظیم شوی نه وي. ننوتي کاروونکي کولی شي خپل پټنوم د حساب په تنظیماتو کې بدل کړي.'
                    )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {tr(currentLang, 'Registered Email Address *', 'آدرس ایمیل ثبت‌شده *', 'ثبت شوی برېښنالیک *')}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    dir="ltr"
                    className="w-full px-3 py-2.5 pe-10 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:border-[#C9A96E] text-start font-mono"
                  />
                  <Mail className="absolute end-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="text-xs font-bold text-[#101C35] dark:text-[#C9A96E] hover:underline cursor-pointer"
                >
                  {tr(currentLang, '← Back to Sign In', '→ بازگشت به صفحه ورود', '→ بېرته ننوتلو ته')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#101C35] text-xs font-bold cursor-pointer"
                >
                  {loading
                    ? tr(currentLang, 'Checking...', 'در حال بررسی...', 'کتل کېږي...')
                    : tr(currentLang, 'Check Recovery Status', 'بررسی وضعیت بازیابی', 'د بیا رغونې حالت کتل')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {mode === 'signup' && (
                <div className="space-y-4">
                  {/* Account Type Selector: Personal vs Business */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {tr(currentLang, 'Select Account Type', 'نوع حساب کاربری', 'د حساب ډول وټاکئ')}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAccountType('personal')}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                          accountType === 'personal'
                            ? 'border-[#C9A96E] bg-[#C9A96E]/10 dark:bg-[#C9A96E]/15 text-[#101C35] dark:text-white ring-1 ring-[#C9A96E]'
                            : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white dark:bg-white/10 text-[#C9A96E] shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm">
                            {tr(currentLang, 'Personal Account', 'حساب شخصی', 'شخصي حساب')}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {tr(currentLang, 'For individual buyers', 'برای خرید انفرادی و استعلام', 'د انفرادي پېرودونکو لپاره')}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountType('business')}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                          accountType === 'business'
                            ? 'border-[#C9A96E] bg-[#C9A96E]/10 dark:bg-[#C9A96E]/15 text-[#101C35] dark:text-white ring-1 ring-[#C9A96E]'
                            : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white dark:bg-white/10 text-[#C9A96E] shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm">
                            {tr(currentLang, 'Business Account', 'حساب تجارتی / شرکتی', 'سوداګریز / شرکتي حساب')}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {tr(currentLang, 'Companies & B2B trade', 'شرکت‌ها و عمده‌فروشان', 'شرکتونه او عمده سوداګر')}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Personal vs Business Fields */}
                  {accountType === 'business' && (
                    <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3">
                      <div className="text-xs font-semibold text-[#C9A96E] flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span>
                          {tr(currentLang, 'Business Entity Details', 'مشخصات حقوقی و تجاری شرکت', 'د سوداګریز شرکت مشخصات')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {tr(currentLang, 'Company Legal Name *', 'نام قانونی شرکت *', 'د شرکت قانوني نوم *')}
                          </label>
                          <input
                            type="text"
                            required={accountType === 'business'}
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder={tr(
                              currentLang,
                              'e.g. Apex Global Trading Ltd',
                              'مثال: شرکت بازرگانی بین‌المللی آریا',
                              'د بېلګې په توګه: نړیوال سوداګریز شرکت'
                            )}
                            className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:border-[#C9A96E]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {tr(currentLang, 'Business Type *', 'نوع فعالیت تجاری *', 'د سوداګرۍ ډول *')}
                          </label>
                          <select
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:border-[#C9A96E]"
                          >
                            <option value="Wholesaler / Distributor">
                              {tr(currentLang, 'Wholesaler / Distributor', 'عمده‌فروش / توزیع‌کننده', 'عمده پلورونکی / وېشونکی')}
                            </option>
                            <option value="Import / Export Company">
                              {tr(currentLang, 'Import / Export Company', 'شرکت واردات و صادرات', 'د وارداتو او صادراتو شرکت')}
                            </option>
                            <option value="Manufacturer / Producer">
                              {tr(currentLang, 'Manufacturer / Producer', 'تولیدکننده / کارخانه', 'تولیدوونکی / فابریکه')}
                            </option>
                            <option value="Retail Chain / Supermarket">
                              {tr(currentLang, 'Retail Chain / Supermarket', 'فروشگاه زنجیره‌ای / سوپرمارکت', 'ځنځیري پلورنځی / سوپرمارکیټ')}
                            </option>
                            <option value="Commercial Broker / Agency">
                              {tr(currentLang, 'Commercial Broker / Agency', 'نمایندگی تجاری / کارگزار', 'سوداګریزه استازولي')}
                            </option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {tr(
                            currentLang,
                            'Commercial Registration Number (Optional)',
                            'شماره جواز کسب / ثبت شرکت (اختیاری)',
                            'د سوداګریز جواز شمېره (اختیاري)'
                          )}
                        </label>
                        <input
                          type="text"
                          value={regNumber}
                          onChange={(e) => setRegNumber(e.target.value)}
                          placeholder="e.g. CR-8839210-UK"
                          dir="ltr"
                          className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:border-[#C9A96E] font-mono text-start"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {accountType === 'business'
                          ? tr(currentLang, 'Contact Person Name *', 'نام نماینده یا مسئول خرید *', 'د اړیکې د مسوول نوم *')
                          : tr(currentLang, 'Full Name *', 'نام و نام خانوادگی *', 'بشپړ نوم *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={tr(currentLang, 'e.g. Sarah Jenkins', 'مثال: احمد رسولی', 'د بېلګې په توګه: احمد خان')}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {tr(currentLang, 'Phone / WhatsApp *', 'شماره تماس / واتساپ *', 'د اړیکې / واټساپ شمېره *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+44 7700 900123"
                        dir="ltr"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:border-[#C9A96E] font-mono text-start"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {tr(currentLang, 'Country *', 'کشور *', 'هېواد *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="United Kingdom"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {tr(currentLang, 'City *', 'شهر *', 'ښار *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="London"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {mode === 'signup' && accountType === 'business'
                    ? tr(currentLang, 'Official Business Email *', 'ایمیل رسمی شرکت *', 'د شرکت رسمي برېښنالیک *')
                    : tr(currentLang, 'Email Address *', 'آدرس ایمیل *', 'برېښنالیک پته *')}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    dir="ltr"
                    className="w-full px-3 py-2.5 pe-10 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:border-[#C9A96E] font-mono text-start"
                  />
                  <Mail className="absolute end-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className={mode === 'signup' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2'}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                      {mode === 'signup'
                        ? tr(currentLang, 'Create Password *', 'ایجاد رمز عبور *', 'پټنوم جوړ کړئ *')
                        : tr(currentLang, 'Password *', 'رمز عبور *', 'پټنوم *')}
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('recovery');
                          setError(null);
                        }}
                        className="text-[11px] font-semibold text-[#101C35] dark:text-[#C9A96E] hover:underline cursor-pointer"
                      >
                        {tr(currentLang, 'Forgot password?', 'فراموشی رمز عبور؟', 'پټنوم مو هېر شوی؟')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === 'signup'
                          ? tr(currentLang, 'Min. 8 chars (letters & numbers)', 'حداقل ۸ کاراکتر (حروف و عدد)', 'لږترلږه ۸ توري او شمېرې')
                          : tr(currentLang, 'Enter your password', 'رمز عبور خود را وارد کنید', 'خپل پټنوم ولیکئ')
                      }
                      className="w-full px-3 py-2.5 pe-10 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:border-[#C9A96E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute end-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {tr(currentLang, 'Confirm Password *', 'تکرار رمز عبور *', 'د پټنوم تایید *')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={tr(currentLang, 'Re-enter password', 'رمز عبور را مجدداً وارد کنید', 'پټنوم بیا ولیکئ')}
                        className="w-full px-3 py-2.5 pe-10 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-slate-300 dark:border-white/10 text-sm focus:outline-none focus:border-[#C9A96E]"
                      />
                      <Lock className="absolute end-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              {mode === 'signup' && (
                <div className="text-[11px] text-gray-500 dark:text-gray-400 flex flex-wrap items-center justify-between gap-2 px-1">
                  <span>
                    {tr(
                      currentLang,
                      'Password policy: 8+ characters with at least 1 letter and 1 number.',
                      'قانون رمز عبور: حداقل ۸ کاراکتر شامل حروف انگلیسی و عدد.',
                      'د پټنوم شرط: لږترلږه ۸ توري چې لږترلږه یو توری او یوه شمېره ولري.'
                    )}
                  </span>
                  {confirmPassword && (
                    <span
                      className={
                        password === confirmPassword
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-rose-600 dark:text-rose-400 font-bold'
                      }
                    >
                      {password === confirmPassword
                        ? tr(currentLang, 'Passwords match', 'رمزهای عبور مطابقت دارند', 'پټنومونه سره سمون خوري')
                        : tr(currentLang, 'Passwords do not match', 'عدم تطابق رمز عبور', 'پټنومونه سره سمون نه خوري')}
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#101C35] to-[#1E2E4F] dark:from-[#C9A96E] dark:to-[#B69255] text-white dark:text-[#101C35] font-bold text-sm shadow-xl shadow-[#101C35]/15 dark:shadow-[#C9A96E]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white dark:border-[#101C35] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'signin'
                        ? tr(currentLang, 'Sign In', 'ورود به حساب کاربری', 'حساب ته ننوتل')
                        : tr(currentLang, 'Complete Registration & Sign In', 'ثبت حساب و ورود امن', 'نوم لیکنه بشپړول او ننوتل')}
                    </span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </>
          )}
        </form>

        {/* Quick Demo Switcher for Evaluation */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-[#C9A96E]/30">
          <div className="flex items-center justify-between gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-[#C9A96E]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                {tr(
                  currentLang,
                  'Demo Evaluation Accounts (Password: HekaDemo2026!)',
                  'حساب‌های آزمایشی جهت ارزیابی سریع (رمز: HekaDemo2026!)',
                  'د چټکې ازموینې حسابونه (پټنوم: HekaDemo2026!)'
                )}
              </span>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('token_sarah_buyer')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-white/5 hover:bg-[#C9A96E]/15 border border-white/50 dark:border-white/10 text-start transition-all group cursor-pointer"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-[#C9A96E]">Sarah Jenkins</p>
                <p className="text-[10px] text-gray-500 font-mono">sarah.jenkins@gmail.com</p>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {tr(currentLang, 'Personal', 'شخصی', 'شخصي')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('token_marcus_buyer')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-white/5 hover:bg-[#C9A96E]/15 border border-white/50 dark:border-white/10 text-start transition-all group cursor-pointer"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-[#C9A96E]">Marcus Sterling</p>
                <p className="text-[10px] text-gray-500 font-mono">marcus.sterling@auraglobal.co.uk</p>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400">
                {tr(currentLang, 'Business', 'تجارتی', 'سوداګریز')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('token_zahir_seller')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-white/5 hover:bg-[#C9A96E]/15 border border-white/50 dark:border-white/10 text-start transition-all group cursor-pointer"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-[#C9A96E]">Zahir Afghan</p>
                <p className="text-[10px] text-gray-500 font-mono">kabul.crafts@afghantrade.com</p>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {tr(currentLang, 'Approved Seller', 'فروشنده تاییدشده', 'تایید شوی پلورونکی')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('token_farid_pending_seller')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-white/5 hover:bg-[#C9A96E]/15 border border-white/50 dark:border-white/10 text-start transition-all group cursor-pointer"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-[#C9A96E]">Farid Saffron</p>
                <p className="text-[10px] text-gray-500 font-mono">herat.saffron@afghanexport.com</p>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {tr(currentLang, 'Pending Seller', 'فروشنده در انتظار', 'انتظار کې پلورونکی')}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/10 text-center text-xs text-gray-500">
          <p>
            {tr(
              currentLang,
              'Passwords are hashed server-side using cryptographic scrypt. Sessions are managed via HttpOnly cookies.',
              'رمزهای عبور با الگوریتم scrypt در سرور هش شده و نشست‌ها با کوکی HttpOnly محافظت می‌شوند.',
              'پټنومونه په سرور کې د scrypt له لارې کوډ شوي او ناستې د HttpOnly کوکي له لارې ساتل کېږي.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
