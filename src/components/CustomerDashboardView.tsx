import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Building2,
  Package,
  FileText,
  Bookmark,
  Store,
  Settings,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  ExternalLink,
  ChevronRight,
  LogOut,
  Edit3,
  Save,
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { User, Product, CustomerInquiry, Language, AccountType, SellerStatus, SellerApplication } from '../types';
import { api } from '../services/api';
import { tr } from '../translations';

interface CustomerDashboardViewProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  onNavigateToCatalog: () => void;
  onNavigateToSellerArea?: () => void;
  currentLang: Language;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  currentUser,
  onUpdateUser,
  onLogout,
  onNavigateToCatalog,
  onNavigateToSellerArea,
  currentLang
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inquiries' | 'orders' | 'saved' | 'seller' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [sellerApp, setSellerApp] = useState<SellerApplication | null>(null);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editAccountType, setEditAccountType] = useState<AccountType>(currentUser.accountType || 'personal');
  const [editFullName, setEditFullName] = useState(currentUser.personalProfile?.fullName || currentUser.name || '');
  const [editPhone, setEditPhone] = useState(currentUser.personalProfile?.phone || currentUser.businessProfile?.businessPhone || currentUser.phone || '');
  const [editCountry, setEditCountry] = useState(currentUser.personalProfile?.country || currentUser.businessProfile?.country || currentUser.country || '');
  const [editCity, setEditCity] = useState(currentUser.personalProfile?.city || currentUser.businessProfile?.city || currentUser.city || '');
  
  // Business fields
  const [editCompanyName, setEditCompanyName] = useState(currentUser.businessProfile?.companyName || '');
  const [editBusinessType, setEditBusinessType] = useState(currentUser.businessProfile?.businessType || 'Wholesaler / Distributor');
  const [editRegNumber, setEditRegNumber] = useState(currentUser.businessProfile?.registrationNumber || '');
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Seller application form state
  const [appBusinessName, setAppBusinessName] = useState(currentUser.businessProfile?.companyName || currentUser.name || '');
  const [appBusinessType, setAppBusinessType] = useState(currentUser.businessProfile?.businessType || 'Producer / Exporter');
  const [appDescription, setAppDescription] = useState('');
  const [appCategories, setAppCategories] = useState('Agricultural Commodities, Handcrafted Goods');
  const [appRegNumber, setAppRegNumber] = useState(currentUser.businessProfile?.registrationNumber || '');
  const [appSubmitting, setAppSubmitting] = useState(false);
  const [appMessage, setAppMessage] = useState<string | null>(null);

  const isRtl = currentLang === 'fa' || currentLang === 'ps';

  // Load customer data
  const loadData = async () => {
    setLoading(true);
    try {
      // Saved products
      const prods = await api.getCustomerSavedProducts();
      setSavedProducts(prods);

      // Inquiries & quotation requests
      const inqs = await api.getCustomerInquiries();
      setInquiries(inqs);

      // Seller app status
      const appRes = await api.getSellerApplication();
      setSellerApp(appRes.application);
    } catch (err) {
      console.error('Error loading customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProfileFeedback(null);
    try {
      const updates: Partial<User> = {
        name: editAccountType === 'business' ? (editCompanyName || editFullName) : editFullName,
        accountType: editAccountType,
        phone: editPhone,
        country: editCountry,
        city: editCity
      };

      if (editAccountType === 'personal') {
        updates.personalProfile = {
          fullName: editFullName,
          phone: editPhone,
          country: editCountry,
          city: editCity
        };
      } else {
        updates.businessProfile = {
          contactPerson: editFullName,
          companyName: editCompanyName,
          country: editCountry,
          city: editCity,
          businessEmail: currentUser.email,
          businessPhone: editPhone,
          businessType: editBusinessType,
          registrationNumber: editRegNumber
        };
      }

      const res = await api.updateProfile(updates);
      onUpdateUser(res.user);
      setIsEditingProfile(false);
      setProfileFeedback({
        type: 'success',
        text: tr(
          currentLang,
          'Account profile saved and persisted successfully.',
          'مشخصات پروفایل شما با موفقیت ذخیره گردید.',
          'ستاسو د حساب مالومات په بریا سره خوندي شول.'
        )
      });
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        text: err.message || tr(currentLang, 'Failed to update profile', 'خطا در به‌روزرسانی پروفایل', 'د پروفایل په تازه کولو کې تېروتنه')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (!currentPassword) {
      setPasswordFeedback({
        type: 'error',
        text: tr(currentLang, 'Current password is required.', 'وارد کردن رمز عبور فعلی الزامی است.', 'اوسنی پټنوم اړین دی.')
      });
      return;
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordFeedback({
        type: 'error',
        text: tr(
          currentLang,
          'New password must be at least 8 characters and include at least one letter and one number.',
          'رمز عبور جدید باید حداقل ۸ کاراکتر و شامل حداقل یک حرف و یک عدد باشد.',
          'نوی پټنوم باید لږترلږه ۸ توري وي او لږترلږه یو توری او یوه شمېره ولري.'
        )
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({
        type: 'error',
        text: tr(
          currentLang,
          'New password and password confirmation do not match.',
          'رمز عبور جدید و تکرار آن مطابقت ندارند.',
          'نوی پټنوم او د هغه تایید سره سمون نه خوري.'
        )
      });
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword, confirmNewPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordFeedback({
        type: 'success',
        text: res.message || tr(currentLang, 'Password updated securely.', 'رمز عبور با موفقیت تغییر یافت.', 'پټنوم په خوندي توګه بدل شو.')
      });
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        text: (err.message || tr(currentLang, 'Failed to update password', 'خطا در تغییر رمز عبور', 'د پټنوم په بدلولو کې تېروتنه')).replace(
          /^(VALIDATION_ERROR|INVALID_CREDENTIALS):\s*/i,
          ''
        )
      });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleRemoveSaved = async (productId: string) => {
    try {
      const res = await api.toggleSaveProduct(productId);
      setSavedProducts((prev) => prev.filter((p) => p.id !== productId));
      onUpdateUser({
        ...currentUser,
        savedProductIds: res.savedProductIds
      });
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        text: err.message || tr(currentLang, 'Failed to remove saved product', 'خطا در حذف محصول ذخیره‌شده', 'د خوندي شوي محصول په لرې کولو کې تېروتنه')
      });
    }
  };

  const handleSubmitSellerApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppSubmitting(true);
    setAppMessage(null);
    try {
      const res = await api.submitSellerApplication({
        businessName: appBusinessName,
        businessType: appBusinessType,
        country: editCountry || 'Afghanistan',
        city: editCity || 'Kabul',
        phone: editPhone || '+93 700 000000',
        email: currentUser.email,
        description: appDescription,
        productCategories: appCategories.split(',').map((c) => c.trim()),
        registrationNumber: appRegNumber
      });
      setSellerApp(res.application);
      onUpdateUser({
        ...currentUser,
        sellerStatus: 'pending'
      });
      setAppMessage(
        tr(
          currentLang,
          'Application submitted successfully! HEKA LTD Compliance will review your trade credentials.',
          'درخواست فروشندگی شما با موفقیت ثبت شد! واحد بازرسی HEKA LTD مدارک تجاری شما را بررسی خواهد کرد.',
          'ستاسو د پلورونکي غوښتنلیک په بریا سره ثبت شو! د HEKA LTD څانګه به ستاسو اسناد وڅېړي.'
        )
      );
    } catch (err: any) {
      setAppMessage(`Error: ${err.message}`);
    } finally {
      setAppSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 text-[#172033] dark:text-[#E2E8F0]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Banner / Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 mb-8 bg-white/70 dark:bg-[#101C35]/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl">
        <div className="absolute top-0 end-0 w-96 h-96 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-[#101C35] to-[#C9A96E] flex items-center justify-center text-white shadow-lg text-2xl font-bold shrink-0">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              <div className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#101C35]" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#101C35] dark:text-white">
                  {currentUser.name}
                </h1>
                {/* Account Type Badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${
                  currentUser.accountType === 'business'
                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                }`}>
                  {currentUser.accountType === 'business' ? <Building2 className="w-3 h-3 shrink-0" /> : <UserIcon className="w-3 h-3 shrink-0" />}
                  {currentUser.accountType === 'business'
                    ? tr(currentLang, 'Business Account', 'حساب تجارتی', 'سوداګریز حساب')
                    : tr(currentLang, 'Personal Account', 'حساب شخصی', 'شخصي حساب')}
                </span>

                {/* Seller Status Badge */}
                {currentUser.sellerStatus === 'approved' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    {tr(currentLang, 'Approved Seller', 'فروشنده تاییدشده', 'تایید شوی پلورونکی')}
                  </span>
                )}
                {currentUser.sellerStatus === 'pending' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    {tr(currentLang, 'Seller Pending Review', 'در انتظار تایید فروشندگی', 'د پلورونکي غوښتنه تر کتنې لاندې')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono">{currentUser.email}</span>
                <span>•</span>
                <span>{currentUser.city || 'London'}, {currentUser.country || 'United Kingdom'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                setProfileFeedback(null);
                setIsEditingProfile(!isEditingProfile);
              }}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-white/40 dark:border-white/10 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-[#C9A96E] shrink-0" />
              <span>
                {isEditingProfile
                  ? tr(currentLang, 'Cancel Edit', 'لغو ویرایش', 'سمون لغوه کول')
                  : tr(currentLang, 'Edit Account Type & Profile', 'ویرایش پروفایل و نوع حساب', 'د پروفایل او حساب ډول سمول')}
              </span>
            </button>

            {currentUser.sellerStatus === 'approved' && onNavigateToSellerArea && (
              <button
                onClick={onNavigateToSellerArea}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <Store className="w-4 h-4 shrink-0" />
                <span>{tr(currentLang, 'Seller Center', 'پنل فروشندگان', 'د پلورونکو مرکز')}</span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="px-3.5 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title={tr(currentLang, 'Sign Out', 'خروج از حساب', 'له حسابه وتل')}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{tr(currentLang, 'Sign Out', 'خروج', 'وتل')}</span>
            </button>
          </div>
        </div>

        {profileFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              profileFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            {profileFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{profileFeedback.text}</span>
          </div>
        )}

        {/* Inline Profile & Account Type Editor */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-black/10 dark:border-white/10 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-sm font-bold text-[#101C35] dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9A96E] shrink-0" />
                <span>
                  {tr(
                    currentLang,
                    'Account Classification & Profile Details',
                    'ویرایش نوع حساب و مشخصات پروفایل',
                    'د حساب ډول او د پروفایل جزییات'
                  )}
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                {tr(
                  currentLang,
                  'You can seamlessly change your account type without losing inquiries or saved items.',
                  'می‌توانید نوع حساب خود را بدون از دست دادن سوابق استعلام تغییر دهید.',
                  'تاسو کولی شئ د خپلو پوښتنو له لاسه ورکولو پرته د خپل حساب ډول بدل کړئ.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Account Type Toggle */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  {tr(currentLang, 'Account Type', 'نوع حساب کاربری', 'د حساب ډول')}
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setEditAccountType('personal')}
                    className={`p-3 rounded-xl border text-start flex items-center gap-3 transition-all cursor-pointer ${
                      editAccountType === 'personal'
                        ? 'border-[#C9A96E] bg-[#C9A96E]/15 text-[#101C35] dark:text-white ring-1 ring-[#C9A96E]'
                        : 'border-white/40 dark:border-white/10 bg-white/50 dark:bg-white/5'
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-[#C9A96E] shrink-0" />
                    <span className="text-xs font-semibold">
                      {tr(currentLang, 'Personal Account', 'حساب شخصی', 'شخصي حساب')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditAccountType('business')}
                    className={`p-3 rounded-xl border text-start flex items-center gap-3 transition-all cursor-pointer ${
                      editAccountType === 'business'
                        ? 'border-[#C9A96E] bg-[#C9A96E]/15 text-[#101C35] dark:text-white ring-1 ring-[#C9A96E]'
                        : 'border-white/40 dark:border-white/10 bg-white/50 dark:bg-white/5'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-[#C9A96E] shrink-0" />
                    <span className="text-xs font-semibold">
                      {tr(currentLang, 'Business Account', 'حساب تجارتی', 'سوداګریز حساب')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Business specific fields */}
              {editAccountType === 'business' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {tr(currentLang, 'Company Legal Name *', 'نام قانونی شرکت *', 'د شرکت قانوني نوم *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      placeholder="e.g. Apex Global Trade Ltd"
                      className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {tr(currentLang, 'Business Type', 'نوع فعالیت تجاری', 'د سوداګرۍ ډول')}
                    </label>
                    <select
                      value={editBusinessType}
                      onChange={(e) => setEditBusinessType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
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
                      <option value="Retail Chain">
                        {tr(currentLang, 'Retail Chain', 'فروشگاه زنجیره‌ای', 'ځنځیري پلورنځی')}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {tr(currentLang, 'Registration Number', 'شماره ثبت شرکت', 'د شرکت د ثبت شمېره')}
                    </label>
                    <input
                      type="text"
                      value={editRegNumber}
                      onChange={(e) => setEditRegNumber(e.target.value)}
                      placeholder="e.g. REG-99120"
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E] font-mono text-start"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {editAccountType === 'business'
                    ? tr(currentLang, 'Contact Person Name *', 'نام نماینده یا مسئول *', 'د اړیکې د مسوول نوم *')
                    : tr(currentLang, 'Full Name *', 'نام و نام خانوادگی *', 'بشپړ نوم *')}
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {tr(currentLang, 'Phone / WhatsApp', 'شماره تماس / واتساپ', 'د تلیفون / واټساپ شمېره')}
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E] font-mono text-start"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {tr(currentLang, 'Country', 'کشور', 'هېواد')}
                </label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {tr(currentLang, 'City', 'شهر', 'ښار')}
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-semibold cursor-pointer"
              >
                {tr(currentLang, 'Cancel', 'انصراف', 'لغوه کول')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-[#C9A96E] text-[#101C35] font-bold text-xs shadow-md hover:bg-[#B69255] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{tr(currentLang, 'Save Changes', 'ذخیره تغییرات', 'بدلونونه خوندي کول')}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 rounded-2xl bg-white/60 dark:bg-[#101C35]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#101C35] text-white dark:bg-[#C9A96E] dark:text-[#101C35] shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <UserIcon className="w-4 h-4 shrink-0" />
          <span>{tr(currentLang, 'Account Overview', 'خلاصه حساب کاربری', 'د حساب لنډیز')}</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'inquiries'
              ? 'bg-[#101C35] text-white dark:bg-[#C9A96E] dark:text-[#101C35] shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>{tr(currentLang, 'My Quotations & Inquiries', 'استعلام‌ها و پیش‌فاکتورهای من', 'زما د بیې غوښتنې او پوښتنې')}</span>
          {inquiries.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/20 font-mono">
              {inquiries.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'saved'
              ? 'bg-[#101C35] text-white dark:bg-[#C9A96E] dark:text-[#101C35] shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4 shrink-0" />
          <span>{tr(currentLang, 'Saved Products', 'محصولات ذخیره‌شده', 'خوندي شوي محصولات')}</span>
          {savedProducts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/20 font-mono">
              {savedProducts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('seller')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'seller'
              ? 'bg-[#101C35] text-white dark:bg-[#C9A96E] dark:text-[#101C35] shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Store className="w-4 h-4 shrink-0" />
          <span>{tr(currentLang, 'Seller Application & Status', 'درخواست و وضعیت فروشندگی', 'د پلورونکي غوښتنلیک او حالت')}</span>
          {currentUser.sellerStatus === 'approved' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#101C35] text-white dark:bg-[#C9A96E] dark:text-[#101C35] shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>{tr(currentLang, 'Password & Security', 'رمز عبور و امنیت', 'پټنوم او امنیت')}</span>
        </button>
      </div>

      {/* Tab Contents */}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">
                  {tr(currentLang, 'My Inquiries', 'استعلام‌های من', 'زما پوښتنې')}
                </span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#101C35] dark:text-white font-mono">{inquiries.length}</div>
              <p className="text-[11px] text-gray-500 mt-1">
                {tr(currentLang, 'Quotations & product queries', 'پیش‌فاکتورها و استعلام‌های کالا', 'نرخنامې او د توکو پوښتنې')}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">
                  {tr(currentLang, 'Saved Items', 'کالاهای نشان‌شده', 'خوندي شوي توکي')}
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Bookmark className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#101C35] dark:text-white font-mono">{savedProducts.length}</div>
              <p className="text-[11px] text-gray-500 mt-1">
                {tr(currentLang, 'Bookmarked for quotation', 'ذخیره‌شده برای استعلام قیمت', 'د نرخ غوښتنې لپاره خوندي شوي')}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">
                  {tr(currentLang, 'Seller Status', 'وضعیت فروشندگی', 'د پلورونکي حالت')}
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-bold text-[#101C35] dark:text-white capitalize">
                {currentUser.sellerStatus === 'approved'
                  ? tr(currentLang, 'Approved Merchant', 'فروشنده تاییدشده', 'تایید شوی پلورونکی')
                  : currentUser.sellerStatus === 'pending'
                  ? tr(currentLang, 'Application Under Review', 'در حال بررسی', 'تر کتنې لاندې')
                  : tr(currentLang, 'Buyer Account', 'حساب خریدار', 'د پېرودونکي حساب')}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {currentUser.sellerStatus === 'approved'
                  ? tr(currentLang, 'Can submit products', 'مجاز به ثبت کالا', 'محصولات ثبتولی شي')
                  : tr(currentLang, 'Selling requires admin review', 'فروش مستلزم تایید مدیریت است', 'پلورل د مدیریت تایید ته اړتیا لري')}
              </p>
            </div>
          </div>

          {/* Account Profile Card */}
          <div className="p-6 rounded-3xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-md">
            <h3 className="text-base font-bold text-[#101C35] dark:text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#C9A96E] shrink-0" />
              <span>
                {tr(
                  currentLang,
                  'Customer Verification & Profile Record',
                  'مشخصات ثبت‌شده و وضعیت تایید حساب',
                  'د پېرودونکي د حساب ثبت شوي مالومات'
                )}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                <span className="text-gray-500">
                  {tr(currentLang, 'Account Classification', 'نوع حساب کاربری', 'د حساب ډول')}
                </span>
                <p className="font-semibold text-sm capitalize">
                  {currentUser.accountType === 'business'
                    ? tr(currentLang, 'Business Account', 'حساب تجارتی / شرکتی', 'سوداګریز حساب')
                    : tr(currentLang, 'Personal Account', 'حساب شخصی', 'شخصي حساب')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                <span className="text-gray-500">
                  {tr(currentLang, 'Buyer Status', 'وضعیت خریدار', 'د پېرودونکي حالت')}
                </span>
                <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {tr(
                      currentLang,
                      'Eligible to browse and request quotations',
                      'مجاز به مشاهده کاتالوگ و ثبت پیش‌فاکتور',
                      'د کاتالوګ کتلو او د نرخ غوښتنې وړ'
                    )}
                  </span>
                </p>
              </div>

              {currentUser.accountType === 'business' && currentUser.businessProfile && (
                <>
                  <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                    <span className="text-gray-500">
                      {tr(currentLang, 'Company Legal Name', 'نام قانونی شرکت', 'د شرکت قانوني نوم')}
                    </span>
                    <p className="font-semibold text-sm">{currentUser.businessProfile.companyName}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                    <span className="text-gray-500">
                      {tr(currentLang, 'Business Sector / Type', 'نوع فعالیت تجاری', 'د سوداګرۍ ډول')}
                    </span>
                    <p className="font-semibold text-sm">{currentUser.businessProfile.businessType}</p>
                  </div>
                </>
              )}

              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                <span className="text-gray-500">
                  {tr(currentLang, 'Registered Email', 'ایمیل ثبت‌شده', 'ثبت شوی برېښنالیک')}
                </span>
                <p className="font-semibold text-sm font-mono">{currentUser.email}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                <span className="text-gray-500">
                  {tr(currentLang, 'Contact Phone', 'شماره تماس', 'د اړیکې شمېره')}
                </span>
                <p className="font-semibold text-sm font-mono" dir="ltr">
                  {currentUser.phone || tr(currentLang, 'Not specified', 'ثبت نشده', 'نه دی لیکل شوی')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                <span className="text-gray-500">
                  {tr(currentLang, 'Geographic Jurisdiction', 'موقعیت جغرافیایی', 'جغرافیایي موقعیت')}
                </span>
                <p className="font-semibold text-sm">{currentUser.city || 'London'}, {currentUser.country || 'United Kingdom'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                <span className="text-gray-500">
                  {tr(currentLang, 'Seller Authorization', 'مجوز فروشندگی', 'د پلورلو اجازه')}
                </span>
                <p className="font-semibold text-sm">
                  {currentUser.sellerStatus === 'approved' ? (
                    <span className="text-emerald-500 font-bold">
                      {tr(currentLang, 'Approved Seller', 'فروشنده تاییدشده', 'تایید شوی پلورونکی')}
                    </span>
                  ) : currentUser.sellerStatus === 'pending' ? (
                    <span className="text-amber-500 font-bold">
                      {tr(currentLang, 'Pending HEKA Admin Approval', 'در انتظار تایید مدیریت HEKA', 'د HEKA مدیریت تایید ته په تمه')}
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      {tr(currentLang, 'No application submitted', 'درخواستی ثبت نشده است', 'هېڅ غوښتنلیک نه دی ثبت شوی')}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onNavigateToCatalog}
                className="px-4 py-2.5 rounded-xl bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#101C35] text-xs font-bold flex items-center gap-2 hover:opacity-95 transition-all shadow-md cursor-pointer"
              >
                <span>{tr(currentLang, 'Browse HEKA Catalog', 'مشاهده کاتالوگ HEKA', 'د HEKA کاتالوګ کتل')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>

              {currentUser.sellerStatus !== 'approved' && (
                <button
                  onClick={() => setActiveTab('seller')}
                  className="px-4 py-2.5 rounded-xl bg-[#C9A96E]/15 hover:bg-[#C9A96E]/25 text-[#C9A96E] border border-[#C9A96E]/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {tr(
                      currentLang,
                      'Apply to Become a Verified Seller',
                      'ثبت درخواست فروشنده رسمی',
                      'د رسمي پلورونکي کېدو غوښتنه'
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. QUOTATIONS & INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-[#101C35] dark:text-white">
                {tr(
                  currentLang,
                  'My Quotation Requests & Communications',
                  'درخواست‌های پیش‌فاکتور و مکاتبات من',
                  'زما د نرخ غوښتنې او سوداګریزې اړیکې'
                )}
              </h3>
              <p className="text-xs text-gray-500">
                {tr(
                  currentLang,
                  'Real-time status of your wholesale quotes and product inquiries',
                  'وضعیت لحظه‌ای استعلام‌های خرید عمده و پاسخ‌های رسمی شرکت',
                  'ستاسو د عمده نرخ غوښتنو او پوښتنو ژوندی حالت'
                )}
              </p>
            </div>
            <button
              onClick={loadData}
              className="text-xs px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors cursor-pointer"
            >
              {tr(currentLang, 'Refresh', 'به‌روزرسانی', 'تازه کول')}
            </button>
          </div>

          {inquiries.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h4 className="text-base font-bold text-[#101C35] dark:text-white">
                {tr(currentLang, 'No Quotation Requests Yet', 'هنوز درخواست پیش‌فاکتوری ثبت نشده است', 'تر اوسه هېڅ د بیې غوښتنه نه ده شوې')}
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                {tr(
                  currentLang,
                  'Browse our high-grade export catalog and submit wholesale quotation requests to receive verified quotes.',
                  'کاتالوگ صادراتی ما را مشاهده کرده و برای دریافت پیش‌فاکتور رسمی، درخواست خود را ارسال نمایید.',
                  'زموږ صادراتي کاتالوګ وګورئ او د رسمي نرخ ترلاسه کولو لپاره خپله غوښتنه واستوئ.'
                )}
              </p>
              <button
                onClick={onNavigateToCatalog}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#C9A96E] text-[#101C35] text-xs font-bold shadow-md hover:bg-[#B69255] cursor-pointer"
              >
                {tr(currentLang, 'Browse Catalog', 'مشاهده کاتالوگ', 'کاتالوګ کتل')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-5 rounded-2xl bg-white/80 dark:bg-[#101C35]/80 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#101C35] dark:text-white">
                        {inq.productName || tr(currentLang, 'General Inquiry', 'استعلام عمومی', 'عمومي پوښتنه')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        inq.status === 'replied' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                        inq.status === 'new' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' :
                        'bg-gray-500/15 text-gray-600 dark:text-gray-400'
                      }`}>
                        {inq.status === 'replied'
                          ? tr(currentLang, 'Official Reply Ready', 'پاسخ رسمی آماده است', 'رسمي ځواب چمتو دی')
                          : inq.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-gray-700 dark:text-gray-300 mb-3">
                    <span className="font-semibold text-gray-500 block mb-0.5">
                      {tr(currentLang, 'Your Request:', 'متن درخواست شما:', 'ستاسو غوښتنه:')}
                    </span>
                    <p>{inq.message}</p>
                    {inq.requestedQuantity && (
                      <p className="mt-1 text-gray-500">
                        {tr(currentLang, 'Requested Volume:', 'مقدار درخواستی:', 'غوښتل شوې اندازه:')}{' '}
                        <span className="font-bold text-[#101C35] dark:text-white font-mono">{inq.requestedQuantity}</span>
                      </p>
                    )}
                  </div>

                  {inq.generatedReply && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#C9A96E]/15 to-transparent border border-[#C9A96E]/30 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[#C9A96E] mb-1">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {tr(currentLang, 'HEKA LTD Sales Team Response', 'پاسخ رسمی بخش فروش HEKA LTD', 'د HEKA LTD د پلور څانګې ځواب')}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">{inq.generatedReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. SAVED PRODUCTS */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-[#101C35] dark:text-white">
                {tr(currentLang, 'Saved Products & Bookmarks', 'محصولات ذخیره‌شده و نشان‌شده', 'خوندي شوي محصولات')}
              </h3>
              <p className="text-xs text-gray-500">
                {tr(
                  currentLang,
                  'Keep track of items you wish to negotiate or order',
                  'فهرست کالاهایی که برای مذاکره یا سفارش عمده نشان کرده‌اید',
                  'هغه توکي چې تاسو یې د عمده پېر یا خبرو لپاره خوندي کړي دي'
                )}
              </p>
            </div>
          </div>

          {savedProducts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10">
              <Bookmark className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h4 className="text-base font-bold text-[#101C35] dark:text-white">
                {tr(currentLang, 'No Saved Products', 'محصول ذخیره‌شده‌ای وجود ندارد', 'هېڅ خوندي شوی محصول نشته')}
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                {tr(
                  currentLang,
                  'You can bookmark any product in the public catalog by clicking the bookmark icon.',
                  'می‌توانید محصولات مورد نظر خود را در کاتالوگ عمومی ذخیره نمایید.',
                  'تاسو کولی شئ په عامه کاتالوګ کې د خپلې خوښې محصولات خوندي کړئ.'
                )}
              </p>
              <button
                onClick={onNavigateToCatalog}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#C9A96E] text-[#101C35] text-xs font-bold shadow-md hover:bg-[#B69255] cursor-pointer"
              >
                {tr(currentLang, 'Browse Catalog', 'مشاهده کاتالوگ', 'کاتالوګ کتل')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-2xl overflow-hidden bg-white/80 dark:bg-[#101C35]/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-gray-100 dark:bg-black/20">
                    <img
                      src={prod.images[0] || '/heka-logo.jpg'}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveSaved(prod.id)}
                      className="absolute top-3 end-3 p-2 rounded-xl bg-black/60 hover:bg-red-600 text-white transition-colors cursor-pointer"
                      title={tr(currentLang, 'Remove from saved', 'حذف از ذخیره‌شده‌ها', 'له خوندي شویو لرې کول')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A96E]">
                        {prod.category}
                      </div>
                      <h4 className="font-bold text-sm text-[#101C35] dark:text-white mt-1">
                        {currentLang === 'fa' && prod.nameFa
                          ? prod.nameFa
                          : currentLang === 'ps' && (prod.namePs || prod.nameFa)
                          ? prod.namePs || prod.nameFa
                          : prod.name}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {currentLang === 'fa' && prod.descriptionFa
                          ? prod.descriptionFa
                          : currentLang === 'ps' && (prod.descriptionPs || prod.descriptionFa)
                          ? prod.descriptionPs || prod.descriptionFa
                          : prod.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 block">
                          {tr(currentLang, 'Indicative Price', 'قیمت پایه', 'ابتدایي بیه')}
                        </span>
                        <span className="font-extrabold text-sm text-[#101C35] dark:text-white font-mono">
                          ${prod.retailPrice} <span className="text-[10px] font-normal text-gray-500">/{prod.unit}</span>
                        </span>
                      </div>

                      <button
                        onClick={onNavigateToCatalog}
                        className="px-3 py-1.5 rounded-lg bg-[#C9A96E] text-[#101C35] text-xs font-bold hover:bg-[#B69255] transition-colors cursor-pointer"
                      >
                        {tr(currentLang, 'Inquire', 'استعلام قیمت', 'پوښتنه کول')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. SELLER APPLICATION & STATUS */}
      {activeTab === 'seller' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#101C35] dark:text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#C9A96E] shrink-0" />
                  <span>
                    {tr(currentLang, 'HEKA Verified Seller Program', 'برنامه فروشندگان رسمی و تاییدشده HEKA', 'د HEKA د تایید شویو پلورونکو پروګرام')}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {tr(
                    currentLang,
                    "Sell premium products across HEKA's international distribution network.",
                    'محصولات صادراتی و ممتاز خود را در شبکه توزیع بین‌المللی HEKA عرضه کنید.',
                    'خپل غوره صادراتي محصولات د HEKA په نړیواله شبکه کې وپلورئ.'
                  )}
                </p>
              </div>

              {/* Status pill */}
              <div className="text-end">
                {currentUser.sellerStatus === 'approved' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {tr(currentLang, 'Verified & Approved Seller', 'فروشنده رسمی و تاییدشده', 'تایید شوی رسمي پلورونکی')}
                  </span>
                )}
                {currentUser.sellerStatus === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Clock className="w-4 h-4 shrink-0" />
                    {tr(currentLang, 'Application Pending Review', 'درخواست در انتظار بررسی', 'غوښتنلیک تر کتنې لاندې دی')}
                  </span>
                )}
                {currentUser.sellerStatus === 'rejected' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                    <XCircle className="w-4 h-4 shrink-0" />
                    {tr(currentLang, 'Application Rejected', 'درخواست رد شده', 'غوښتنلیک رد شوی')}
                  </span>
                )}
                {(currentUser.sellerStatus === 'none' || !currentUser.sellerStatus) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-500/15 text-gray-600 dark:text-gray-400 border border-gray-500/30">
                    {tr(currentLang, 'Not Applied', 'ثبت‌نام نشده', 'غوښتنه نه ده شوې')}
                  </span>
                )}
              </div>
            </div>

            {/* Crucial Explanatory Notice */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 mb-6">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {tr(currentLang, 'Strict Seller Governance Notice', 'اطلاعیه قوانین احراز هویت فروشندگان', 'د پلورونکو د تایید مهمه خبرتیا')}
                </span>
              </p>
              <p>
                {tr(
                  currentLang,
                  'In accordance with HEKA LTD international compliance policy, Business Account registration alone does NOT grant seller permissions. All sellers must submit their trade credentials and undergo review by an authorized HEKA LTD administrator. Any products submitted by sellers remain unpublished until individually reviewed and approved.',
                  'مطابق سیاست‌های نظارتی بین‌المللی HEKA LTD، ثبت حساب تجارتی به تنهایی مجوز فروشندگی اعطا نمی‌کند. تمامی تامین‌کنندگان باید مدارک تجاری خود را جهت بررسی و تایید مدیران HEKA LTD ارسال نمایند. همچنین کالاهای ثبت‌شده توسط فروشندگان تنها پس از تایید کیفی منتشر می‌شوند.',
                  'د HEKA LTD د نړیوالو اصولو له مخې، یوازې د سوداګریز حساب جوړول د پلورلو اجازه نه ورکوي. ټول پلورونکي باید خپل سوداګریز اسناد د HEKA LTD د مدیرانو د کتنې او تایید لپاره وسپاري.'
                )}
              </p>
            </div>

            {/* Approved View */}
            {currentUser.sellerStatus === 'approved' && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#101C35] dark:text-white">
                    {tr(currentLang, 'Your Seller Account is Active', 'حساب فروشندگی شما فعال است', 'ستاسو د پلورونکي حساب فعال دی')}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                    {tr(
                      currentLang,
                      'You have verified seller credentials. You can add new products, manage your inventory submissions, and respond to buyer quotation requests directly in the Seller Center.',
                      'مدارک فروشندگی شما تایید شده است. اکنون می‌توانید محصولات جدید ثبت کنید، موجودی خود را مدیریت نمایید و به استعلام‌های خریداران در پنل فروشندگان پاسخ دهید.',
                      'ستاسو د پلورونکي اسناد تایید شوي دي. تاسو کولی شئ نوي محصولات ثبت کړئ او د پلورونکو په مرکز کې د پېرودونکو پوښتنو ته ځواب ورکړئ.'
                    )}
                  </p>
                </div>
                {onNavigateToSellerArea && (
                  <button
                    onClick={onNavigateToSellerArea}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <Store className="w-4 h-4 shrink-0" />
                    <span>{tr(currentLang, 'Open Seller Center Now', 'ورود به پنل فروشندگان', 'د پلورونکو مرکز خلاصول')}</span>
                  </button>
                )}
              </div>
            )}

            {/* Pending View */}
            {currentUser.sellerStatus === 'pending' && (
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Clock className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#101C35] dark:text-white">
                      {tr(currentLang, 'Application Under Active Review', 'درخواست شما در حال بررسی است', 'ستاسو غوښتنلیک تر کتنې لاندې دی')}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {tr(currentLang, 'Submitted on:', 'تاریخ ارسال:', 'د استولو نېټه:')}{' '}
                      {sellerApp ? new Date(sellerApp.submittedAt).toLocaleDateString() : tr(currentLang, 'Recent', 'اخیر', 'تازه')}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/60 dark:bg-[#101C35]/60 text-xs space-y-2">
                  <p>
                    <span className="text-gray-500">{tr(currentLang, 'Applicant Business:', 'نام واحد تجاری:', 'سوداګریز نوم:')}</span>{' '}
                    <strong>{sellerApp?.businessName || currentUser.name}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">{tr(currentLang, 'Business Sector:', 'حوزه فعالیت:', 'کاري برخه:')}</span>{' '}
                    {sellerApp?.businessType}
                  </p>
                  <p>
                    <span className="text-gray-500">{tr(currentLang, 'Target Goods:', 'رده‌های کالایی:', 'د محصولاتو ډولونه:')}</span>{' '}
                    {sellerApp?.productCategories?.join(', ')}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 italic">&ldquo;{sellerApp?.description}&rdquo;</p>
                </div>

                <p className="text-xs text-gray-500">
                  {tr(
                    currentLang,
                    'A HEKA LTD compliance officer will review your application. You will be notified once a determination has been made.',
                    'بازرسان تجاری HEKA LTD درخواست شما را بررسی کرده و نتیجه نهایی را به اطلاع شما خواهند رساند.',
                    'د HEKA LTD مسوولین به ستاسو غوښتنلیک وڅېړي او له پرېکړې وروسته به خبر درکړل شي.'
                  )}
                </p>
              </div>
            )}

            {/* Not Applied or Rejected View: Application Form */}
            {(currentUser.sellerStatus === 'none' || currentUser.sellerStatus === 'rejected' || !currentUser.sellerStatus) && (
              <form onSubmit={handleSubmitSellerApplication} className="space-y-4">
                {currentUser.sellerStatus === 'rejected' && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 mb-4">
                    <p className="font-bold mb-1">
                      {tr(currentLang, 'Previous Application Status: Rejected', 'وضعیت درخواست قبلی: رد شده', 'د پخواني غوښتنلیک حالت: رد شوی')}
                    </p>
                    {sellerApp?.rejectionReason && <p>{tr(currentLang, 'Reason:', 'علت:', 'لامل:')} {sellerApp.rejectionReason}</p>}
                    <p className="mt-1">
                      {tr(
                        currentLang,
                        'You may revise your details and submit a new seller application below.',
                        'می‌توانید اطلاعات خود را تکمیل و اصلاح نموده و مجدداً درخواست ارسال نمایید.',
                        'تاسو کولی شئ خپل مالومات بشپړ کړئ او لاندې نوی غوښتنلیک واستوئ.'
                      )}
                    </p>
                  </div>
                )}

                {appMessage && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    appMessage.includes('Error') ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {appMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {tr(currentLang, 'Business or Producer Name *', 'نام شرکت یا تولیدکننده *', 'د شرکت یا تولیدوونکي نوم *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={appBusinessName}
                      onChange={(e) => setAppBusinessName(e.target.value)}
                      placeholder="e.g. Herat Saffron Collective"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {tr(currentLang, 'Producer / Business Type *', 'نوع فعالیت تولیدی / بازرگانی *', 'د تولید یا سوداګرۍ ډول *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={appBusinessType}
                      onChange={(e) => setAppBusinessType(e.target.value)}
                      placeholder="e.g. Agricultural Cooperative, Carpet Weavers"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {tr(currentLang, 'Product Categories to Sell *', 'دسته‌بندی کالاهای قابل عرضه *', 'د پلورلو وړ محصولاتو وېشنیزې *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={appCategories}
                    onChange={(e) => setAppCategories(e.target.value)}
                    placeholder="e.g. Saffron, Dry Fruits, Carpets, Precious Stones"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {tr(currentLang, 'Business Profile & Quality Standards *', 'شرح فعالیت و استانداردهای کیفی *', 'د سوداګرۍ لنډیز او د کیفیت معیارونه *')}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    placeholder={tr(
                      currentLang,
                      'Describe your manufacturing capacity, sourcing methods, certifications, and export history...',
                      'ظرفیت تولید، نحوه تامین، گواهینامه‌های آزمایشگاهی و سوابق صادراتی خود را شرح دهید...',
                      'د خپل تولید وړتیا، د کیفیت سندونه او د صادراتو مخینه دلته ولیکئ...'
                    )}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {tr(
                      currentLang,
                      'Commercial License / Registration Number (Optional)',
                      'شماره جواز کسب / ثبت شرکت (اختیاری)',
                      'د سوداګریز جواز شمېره (اختیاري)'
                    )}
                  </label>
                  <input
                    type="text"
                    value={appRegNumber}
                    onChange={(e) => setAppRegNumber(e.target.value)}
                    placeholder="e.g. AC-90218-AF"
                    dir="ltr"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E] font-mono text-start"
                  />
                </div>

                <button
                  type="submit"
                  disabled={appSubmitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C9A96E] hover:bg-[#B69255] text-[#101C35] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {appSubmitting ? (
                    <div className="w-4 h-4 border-2 border-[#101C35] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 rtl:-scale-x-100" />
                      <span>
                        {tr(
                          currentLang,
                          'Submit Seller Application for HEKA Review',
                          'ارسال درخواست فروشندگی جهت بررسی HEKA',
                          'د HEKA د کتنې لپاره د پلورونکي غوښتنلیک استول'
                        )}
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. PASSWORD & SECURITY */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-md max-w-2xl">
            <h3 className="text-lg font-bold text-[#101C35] dark:text-white flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-[#C9A96E] shrink-0" />
              <span>
                {tr(currentLang, 'Account Password & Session Security', 'رمز عبور حساب و امنیت نشست', 'د حساب پټنوم او د ناستې امنیت')}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              {tr(
                currentLang,
                'Update your account password. Passwords are encrypted server-side using salted cryptographic scrypt hashing and are never stored in plain text.',
                'رمز عبور حساب خود را به‌روزرسانی کنید. رمزهای عبور در سرور با الگوریتم رمزنگاری scrypt هش شده و هرگز به صورت متن ساده ذخیره نمی‌شوند.',
                'د خپل حساب پټنوم تازه کړئ. پټنومونه په سرور کې د scrypt کوډ کولو له لارې خوندي کېږي.'
              )}
            </p>

            {passwordFeedback && (
              <div
                className={`mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {tr(currentLang, 'Current Password *', 'رمز عبور فعلی *', 'اوسنی پټنوم *')}
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder={tr(currentLang, 'Enter your current password', 'رمز عبور فعلی خود را وارد کنید', 'خپل اوسنی پټنوم ولیکئ')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {tr(currentLang, 'New Password *', 'رمز عبور جدید *', 'نوی پټنوم *')}
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder={tr(currentLang, 'Min. 8 chars (letter + number)', 'حداقل ۸ کاراکتر (حرف + عدد)', 'لږترلږه ۸ توري (توری + شمېره)')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {tr(currentLang, 'Confirm New Password *', 'تکرار رمز عبور جدید *', 'د نوي پټنوم تایید *')}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder={tr(currentLang, 'Re-enter new password', 'رمز عبور جدید را مجدداً وارد کنید', 'نوی پټنوم بیا ولیکئ')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#101C35] text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>
                    {passwordSubmitting
                      ? tr(currentLang, 'Updating Password...', 'در حال تغییر رمز عبور...', 'پټنوم بدلېږي...')
                      : tr(currentLang, 'Update Password', 'تغییر رمز عبور', 'پټنوم بدلول')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>
                    {tr(currentLang, 'Sign Out of Current Session', 'خروج از نشست فعلی', 'له اوسنۍ ناستې وتل')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
