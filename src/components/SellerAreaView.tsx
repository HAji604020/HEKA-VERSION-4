import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  ExternalLink,
  ChevronLeft,
  FolderTree,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { User, Product, CustomerInquiry, Language, ProductApprovalStatus, ProductCategory } from '../types';
import { api } from '../services/api';
import { tr } from '../translations';
import {
  getCategoryLocalizedName,
  getMainCategories,
  getSubcategories,
  resolveProductCategory
} from '../utils/categoryHelpers';

interface SellerAreaViewProps {
  currentUser: User;
  onBackToDashboard: () => void;
  onNavigateToCatalog: () => void;
  currentLang: Language;
}

export const SellerAreaView: React.FC<SellerAreaViewProps> = ({
  currentUser,
  onBackToDashboard,
  onNavigateToCatalog,
  currentLang
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [activeCategories, setActiveCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'quotes'>('products');

  // Submit / Edit product modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameFa, setNameFa] = useState('');
  const [namePs, setNamePs] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subcategoryId, setSubcategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [descriptionFa, setDescriptionFa] = useState('');
  const [descriptionPs, setDescriptionPs] = useState('');
  const [retailPrice, setRetailPrice] = useState('120');
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('500');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800');
  const [minQuantity, setMinQuantity] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isRtl = currentLang === 'fa' || currentLang === 'ps';

  const loadSellerData = async () => {
    setLoading(true);
    try {
      const [prods, inqs, cats] = await Promise.all([
        api.getSellerProducts(),
        api.getSellerInquiries(),
        api.getPublicCategories('comp_heka_ltd')
      ]);
      setProducts(prods);
      setInquiries(inqs);
      setActiveCategories(cats);

      const mains = getMainCategories(cats, true);
      if (mains.length > 0 && !categoryId) {
        setCategoryId(mains[0].id);
        const subs = getSubcategories(cats, mains[0].id, true);
        setSubcategoryId(subs[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to load seller products/inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, []);

  const activeMains = getMainCategories(activeCategories, true);
  const availableSubs = categoryId ? getSubcategories(activeCategories, categoryId, true) : [];

  const openCreateModal = () => {
    setEditingProductId(null);
    setName('');
    setNameFa('');
    setNamePs('');
    const firstMain = activeMains[0]?.id || '';
    const firstSubs = firstMain ? getSubcategories(activeCategories, firstMain, true) : [];
    setCategoryId(firstMain);
    setSubcategoryId(firstSubs[0]?.id || '');
    setDescription('');
    setDescriptionFa('');
    setDescriptionPs('');
    setRetailPrice('120');
    setUnit('kg');
    setStock('500');
    setImageUrl('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800');
    setMinQuantity('10');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProductId(prod.id);
    setName(prod.name || '');
    setNameFa(prod.nameFa || '');
    setNamePs(prod.namePs || '');
    const validActiveMain = prod.categoryId && activeMains.some((m) => m.id === prod.categoryId)
      ? prod.categoryId
      : (activeMains[0]?.id || '');
    const subs = validActiveMain ? getSubcategories(activeCategories, validActiveMain, true) : [];
    const validActiveSub = prod.subcategoryId && subs.some((s) => s.id === prod.subcategoryId)
      ? prod.subcategoryId
      : (subs[0]?.id || '');

    setCategoryId(validActiveMain);
    setSubcategoryId(validActiveSub);
    setDescription(prod.description || '');
    setDescriptionFa(prod.descriptionFa || '');
    setDescriptionPs(prod.descriptionPs || '');
    setRetailPrice(String(prod.retailPrice ?? 0));
    setUnit(prod.unit || 'piece');
    setStock(String(prod.stock ?? 0));
    setImageUrl(prod.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800');
    setMinQuantity(String(prod.wholesaleRules?.minQuantity ?? 10));
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setErrorMessage(
        tr(
          currentLang,
          'Please select an active main category.',
          'لطفاً یک دسته‌بندی اصلی فعال انتخاب کنید.',
          'مهرباني وکړئ یوه فعاله اصلي کټګوري وټاکئ.'
        )
      );
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const payload: Partial<Product> = {
        name: name.trim(),
        nameFa: nameFa.trim() || name.trim(),
        namePs: namePs.trim() || nameFa.trim() || name.trim(),
        categoryId,
        subcategoryId: subcategoryId || null,
        description: description.trim(),
        descriptionFa: descriptionFa.trim(),
        descriptionPs: descriptionPs.trim(),
        retailPrice: parseFloat(retailPrice) || 0,
        currency: 'USD',
        unit: unit.trim() || 'piece',
        stock: parseInt(stock, 10) || 0,
        images: [imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
        wholesaleRules: {
          minQuantity: parseInt(minQuantity, 10) || 5,
          discountPercent: 10,
          requireQuote: true,
          termsNote: 'Standard wholesale terms. Commercial invoice provided upon shipment.',
          isConfirmed: true
        }
      };

      if (editingProductId) {
        const updated = await api.updateSellerProduct(editingProductId, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setStatusMessage(
          tr(
            currentLang,
            'Product updated and queued for HEKA LTD admin review!',
            'محصول ویرایش شد و برای بررسی مجدد مدیریت HEKA LTD ارسال گردید.',
            'محصول تازه شو او د HEKA LTD اډمین بیاکتنې ته واستول شو.'
          )
        );
      } else {
        const newProd = await api.createSellerProduct(payload);
        setProducts([newProd, ...products]);
        setStatusMessage(
          tr(
            currentLang,
            'Product submitted for HEKA LTD admin review! Once approved, it will automatically appear in the selected category.',
            'محصول با موفقیت برای بررسی مدیریت HEKA LTD ثبت شد و پس از تأیید در دسته‌بندی مربوطه منتشر می‌شود.',
            'محصول په بریالیتوب سره د HEKA LTD بیاکتنې لپاره ثبت شو او له تایید وروسته به په کټګورۍ کې خپور شي.'
          )
        );
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          tr(currentLang, 'Failed to submit product', 'خطا در ثبت محصول', 'د محصول په ثبتولو کې تېروتنه')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status?: ProductApprovalStatus, isPublished?: boolean) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>
              {tr(currentLang, 'Approved', 'تأیید شده', 'تایید شوی')}{' '}
              {isPublished
                ? tr(currentLang, '(Published in Catalog)', '(منتشر شده در کاتالوگ)', '(په کاتالوګ کې خپور شوی)')
                : tr(currentLang, '(Unpublished)', '(عدم انتشار)', '(ناخپور شوی)')}
            </span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>
              {tr(
                currentLang,
                'Pending Admin Review (Unpublished)',
                'در انتظار بررسی ادمین (منتشر نشده)',
                'د اډمین بیاکتنې ته په تمه (ناخپور شوی)'
              )}
            </span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
            <XCircle className="w-3 h-3" />
            <span>{tr(currentLang, 'Rejected by Admin', 'رد شده توسط مدیریت', 'د اډمین لخوا رد شوی')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-500/15 text-gray-600 dark:text-gray-400 border border-gray-500/30">
            {tr(currentLang, 'Draft', 'پیش‌نویس', 'مسوده')}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen pb-16 text-[#172033] dark:text-[#E2E8F0]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 mb-8 bg-white/70 dark:bg-[#101C35]/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToDashboard}
              className="p-2.5 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-white/40 dark:border-white/10 transition-colors cursor-pointer"
              title={tr(currentLang, 'Back to Customer Dashboard', 'بازگشت به حساب مشتری', 'د پېرودونکي ډشبورډ ته ستنېدل')}
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#101C35] dark:text-white flex items-center gap-2">
                  <Store className="w-7 h-7 text-[#C9A96E] shrink-0" />
                  <span>
                    {currentUser.businessProfile?.companyName || currentUser.name} –{' '}
                    {tr(currentLang, 'Seller Center', 'مرکز فروشندگان', 'د پلورونکو مرکز')}
                  </span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {tr(currentLang, 'Approved Seller', 'فروشنده تأیید شده', 'تایید شوی پلورونکی')}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tr(
                  currentLang,
                  'Manage your product catalog submissions, category assignments, and incoming wholesale inquiries.',
                  'مدیریت ثبت محصولات، تخصیص دسته‌بندی‌ها و استعلام‌های خرید عمده دریافتی.',
                  'د خپلو محصولاتو ثبت، کټګوریو ټاکل او د عمده پلور راغلي استعلامونه مدیریت کړئ.'
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#B69255] text-[#101C35] font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{tr(currentLang, 'Submit New Product', 'ثبت محصول جدید', 'نوی محصول ثبت کړئ')}</span>
            </button>
            <button
              onClick={onNavigateToCatalog}
              className="px-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-white/40 dark:border-white/10 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{tr(currentLang, 'Public Catalog', 'کاتالوگ عمومی', 'عمومي کاتالوګ')}</span>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-white/60 dark:bg-[#101C35]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-[#101C35] text-white dark:bg-[#C9A96E] dark:text-[#101C35] shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>
            {tr(currentLang, 'My Product Submissions', 'محصولات ثبت‌شده من', 'زما ثبت شوي محصولات')} ({products.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'quotes'
              ? 'bg-[#101C35] text-white dark:bg-[#C9A96E] dark:text-[#101C35] shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>
            {tr(currentLang, 'Buyer Quotation Inquiries', 'استعلام‌های قیمت خریداران', 'د پېرودونکو د نرخ استعلامونه')} ({inquiries.length})
          </span>
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h4 className="text-base font-bold text-[#101C35] dark:text-white">
                {tr(currentLang, 'No Products Submitted Yet', 'هنوز محصولی ثبت نشده است', 'تر اوسه کوم محصول نه دی ثبت شوی')}
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                {tr(
                  currentLang,
                  'As an approved seller, you can submit items for HEKA LTD admin review. Approved items appear in the public catalog.',
                  'به عنوان فروشنده تأیید شده، می‌توانید کالاهای خود را برای بررسی مدیریت HEKA LTD ثبت کنید تا در کاتالوگ عمومی نمایش داده شوند.',
                  'د تایید شوي پلورونکي په توګه، تاسو کولی شئ خپل توکي د HEKA LTD بیاکتنې لپاره ثبت کړئ ترڅو په عمومي کاتالوګ کې خپاره شي.'
                )}
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#C9A96E] text-[#101C35] text-xs font-bold shadow-md hover:bg-[#B69255] cursor-pointer"
              >
                {tr(currentLang, 'Submit First Product', 'ثبت اولین محصول', 'لومړنی محصول ثبت کړئ')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => {
                const resolvedCat = resolveProductCategory(p, activeCategories, currentLang);
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl overflow-hidden bg-white/80 dark:bg-[#101C35]/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between text-start"
                  >
                    <div className="relative h-48 w-full bg-gray-100 dark:bg-black/20">
                      <img
                        src={p.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                        {getStatusBadge(p.approvalStatus, p.isPublished)}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        {resolvedCat.isUncategorized ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>
                              {tr(
                                currentLang,
                                'Uncategorized (Edit to assign category)',
                                'بدون دسته‌بندی (برای تخصیص ویرایش کنید)',
                                'بې کټګورۍ (د ټاکلو لپاره سمول وکړئ)'
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C9A96E]">
                            <FolderTree className="w-3.5 h-3.5" />
                            <span>{resolvedCat.displayBadge}</span>
                          </div>
                        )}
                        <h3 className="font-bold text-base text-[#101C35] dark:text-white mt-1.5">
                          {currentLang === 'fa' ? p.nameFa || p.name : currentLang === 'ps' ? p.namePs || p.nameFa || p.name : p.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {currentLang === 'fa'
                            ? p.descriptionFa || p.description
                            : currentLang === 'ps'
                            ? p.descriptionPs || p.descriptionFa || p.description
                            : p.description}
                        </p>
                      </div>

                      {p.rejectionReason && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                          <span className="font-bold block mb-0.5">
                            {tr(currentLang, 'Admin Review Feedback:', 'پاسخ بررسی مدیریت:', 'د اډمین بیاکتنې نظر:')}
                          </span>
                          <p>{p.rejectionReason}</p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-gray-400 block text-[10px]">
                            {tr(currentLang, 'Price', 'قیمت', 'نرخ')}
                          </span>
                          <span className="font-extrabold text-sm text-[#101C35] dark:text-white">
                            ${p.retailPrice} / {p.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">
                            {tr(currentLang, 'Stock', 'موجودی', 'ذخیره')}
                          </span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {p.stock} {p.unit}
                          </span>
                        </div>
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-3 py-1.5 rounded-xl bg-[#C9A96E]/15 hover:bg-[#C9A96E]/25 text-[#8C6D32] dark:text-[#C9A96E] border border-[#C9A96E]/30 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{tr(currentLang, 'Edit', 'ویرایش', 'سمول')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quotes Tab */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10">
              <Mail className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h4 className="text-base font-bold text-[#101C35] dark:text-white">
                {tr(
                  currentLang,
                  'No Inquiries for Your Products Yet',
                  'هنوز استعلامی برای محصولات شما ثبت نشده است',
                  'ستاسو د محصولاتو لپاره تر اوسه کوم استعلام نه دی ثبت شوی'
                )}
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                {tr(
                  currentLang,
                  'When buyers request quotations for your approved products, inquiries will appear here.',
                  'هنگامی که خریداران برای محصولات تأیید شده شما درخواست قیمت ثبت کنند، در این بخش نمایش داده می‌شود.',
                  'کله چې پېرودونکي ستاسو د تایید شوو محصولاتو لپاره د نرخ غوښتنه وکړي، دلته به ښکاره شي.'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-5 rounded-2xl bg-white/80 dark:bg-[#101C35]/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm text-start"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#101C35] dark:text-white">
                      {tr(currentLang, 'Quote for:', 'استعلام برای:', 'د نرخ غوښتنه د:')} {inq.productName}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(inq.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 mb-3">
                    <p>
                      <span className="text-gray-400">{tr(currentLang, 'Buyer Name:', 'نام خریدار:', 'د پېرودونکي نوم:')}</span>{' '}
                      {inq.customerName}
                    </p>
                    <p>
                      <span className="text-gray-400">{tr(currentLang, 'Buyer Contact:', 'اطلاعات تماس خریدار:', 'د اړیکې معلومات:')}</span>{' '}
                      <span dir="ltr">{inq.customerContact}</span>
                    </p>
                    <p>
                      <span className="text-gray-400">{tr(currentLang, 'Requested Volume:', 'مقدار درخواستی:', 'غوښتل شوې اندازه:')}</span>{' '}
                      {inq.requestedQuantity || 1} {tr(currentLang, 'units', 'واحد', 'واحدونه')}
                    </p>
                    <p>
                      <span className="text-gray-400">{tr(currentLang, 'Message:', 'پیام:', 'پیغام:')}</span> "{inq.message}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Submit or Edit Seller Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 bg-white dark:bg-[#101C35] border border-white/20 shadow-2xl text-start">
            <h3 className="text-lg font-bold text-[#101C35] dark:text-white mb-1">
              {editingProductId
                ? tr(
                    currentLang,
                    'Edit Product & Category Assignment',
                    'ویرایش محصول و دسته‌بندی',
                    'محصول او کټګوري سمول'
                  )
                : tr(
                    currentLang,
                    'Submit Product for HEKA Review',
                    'ثبت محصول جدید برای بررسی HEKA LTD',
                    'د HEKA LTD بیاکتنې لپاره نوی محصول ثبت کړئ'
                  )}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {tr(
                currentLang,
                'Only active categories and subcategories can be selected. Approved products automatically appear in the corresponding public category.',
                'فقط دسته‌بندی‌ها و زیردسته‌های فعال قابل انتخاب هستند. محصولات پس از تأیید ادمین به صورت خودکار در دسته‌بندی عمومی نمایش داده می‌شوند.',
                'یوازې فعالې کټګورۍ او فرعي کټګورۍ ټاکل کیدی شي. محصولات د اډمین له تایید وروسته په اوتومات ډول په عمومي بازار کې ښودل کیږي.'
              )}
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    {tr(currentLang, 'Product Title (EN) *', 'عنوان محصول (انگلیسی) *', 'د محصول نوم (انګلیسي) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Industrial Diesel Generator"
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">نام محصول (دری)</label>
                  <input
                    type="text"
                    value={nameFa}
                    onChange={(e) => setNameFa(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">د محصول نوم (پښتو)</label>
                  <input
                    type="text"
                    value={namePs}
                    onChange={(e) => setNamePs(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>
              </div>

              {/* Dynamic Active Category & Subcategory Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    {tr(currentLang, 'Main Category (Active Only) *', 'دسته‌بندی اصلی (فعال) *', 'اصلي کټګوري (فعاله) *')}
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => {
                      const nextMain = e.target.value;
                      setCategoryId(nextMain);
                      const subs = nextMain ? getSubcategories(activeCategories, nextMain, true) : [];
                      setSubcategoryId(subs[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E]"
                  >
                    {activeMains.map((mc) => (
                      <option key={mc.id} value={mc.id} className="dark:bg-[#101C35]">
                        {getCategoryLocalizedName(mc, currentLang)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    {tr(currentLang, 'Subcategory', 'زیردسته تخصصی', 'فرعي کټګوري')}
                  </label>
                  <select
                    value={subcategoryId}
                    disabled={!categoryId || availableSubs.length === 0}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E] disabled:opacity-50"
                  >
                    <option value="" className="dark:bg-[#101C35]">
                      {tr(currentLang, '-- General / None --', '-- عمومی / بدون زیردسته --', '-- عمومي --')}
                    </option>
                    {availableSubs.map((sc) => (
                      <option key={sc.id} value={sc.id} className="dark:bg-[#101C35]">
                        {getCategoryLocalizedName(sc, currentLang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    {tr(currentLang, 'Price (USD) *', 'قیمت (USD) *', 'نرخ (USD) *')}
                  </label>
                  <input
                    type="number"
                    required
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    {tr(currentLang, 'Unit of Measure', 'واحد سنجش', 'د اندازې واحد')}
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. kg, piece, set"
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    {tr(currentLang, 'Available Stock', 'موجودی انبار', 'شتون لرونکې ذخیره')}
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  {tr(currentLang, 'Product Description', 'توضیحات فنی محصول', 'د محصول تفصیلات')}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={tr(
                    currentLang,
                    'Detail the specifications, origin, purity, processing method...',
                    'مشخصات فنی، کشور مبدأ، خلوص و روش فرآوری را وارد کنید...',
                    'تخنیکي مشخصات، اصلي هېواد او د پروسس طریقه ولیکئ...'
                  )}
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">
                  {tr(currentLang, 'Image URL', 'آدرس تصویر محصول (URL)', 'د انځور پته (URL)')}
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 font-semibold cursor-pointer"
                >
                  {tr(currentLang, 'Cancel', 'انصراف', 'لغوه کول')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#C9A96E] text-[#101C35] font-bold shadow-md hover:bg-[#B69255] cursor-pointer"
                >
                  {submitting
                    ? tr(currentLang, 'Saving...', 'در حال ذخیره...', 'په ثبتولو کې...')
                    : editingProductId
                    ? tr(currentLang, 'Update & Resubmit', 'بروزرسانی و ارسال مجدد', 'تازه کول او بیا استول')
                    : tr(currentLang, 'Submit for Review', 'ثبت برای بررسی', 'د بیاکتنې لپاره ثبتول')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
