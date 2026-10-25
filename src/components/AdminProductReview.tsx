import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  RefreshCw,
  Search,
  FolderTree,
  AlertTriangle
} from 'lucide-react';
import { Product, Language, ProductCategory } from '../types';
import { api } from '../services/api';
import { tr } from '../translations';
import {
  getCategoryLocalizedName,
  getMainCategories,
  getSubcategories,
  resolveProductCategory
} from '../utils/categoryHelpers';

interface AdminProductReviewProps {
  currentLang: Language;
  categories?: ProductCategory[];
  onRefreshCatalog?: () => void;
}

export const AdminProductReview: React.FC<AdminProductReviewProps> = ({
  currentLang,
  categories: propCategories,
  onRefreshCatalog
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [localCategories, setLocalCategories] = useState<ProductCategory[]>(propCategories || []);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  // Rejection state
  const [rejectingProdId, setRejectingProdId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isRtl = currentLang === 'fa' || currentLang === 'ps';

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([
        api.getAdminProductReviews(),
        propCategories && propCategories.length > 0
          ? Promise.resolve(propCategories)
          : api.getCategories('comp_heka_ltd', false)
      ]);
      setProducts(data);
      setLocalCategories(cats);
    } catch (err) {
      console.error('Failed to load review products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [propCategories]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await api.reviewProductSubmission(id, 'approved');
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setFeedback(
        tr(
          currentLang,
          'Product approved and published to its public marketplace category.',
          'محصول تایید شد و در دسته‌بندی عمومی کاتالوگ منتشر گردید.',
          'محصول تایید شو او په عامه کاتالوګ کې خپور شو.'
        )
      );
      onRefreshCatalog?.();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to approve product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingProdId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await api.reviewProductSubmission(
        rejectingProdId,
        'rejected',
        rejectionReason || 'Specifications or imagery did not meet HEKA LTD quality standards'
      );
      setProducts((prev) => prev.map((p) => (p.id === rejectingProdId ? updated : p)));
      setRejectingProdId(null);
      setRejectionReason('');
      setFeedback(
        tr(
          currentLang,
          'Product rejected and removed from public marketplace.',
          'محصول رد شد و از کاتالوگ عمومی حذف گردید.',
          'محصول رد شو او له عامه کاتالوګ څخه لرې شو.'
        )
      );
      onRefreshCatalog?.();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to reject product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickAssignCategory = async (prodId: string, categoryId: string, subcategoryId: string | null) => {
    setActionLoading(true);
    try {
      const updated = await api.updateProduct(prodId, {
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null
      });
      setProducts((prev) => prev.map((p) => (p.id === prodId ? updated : p)));
      onRefreshCatalog?.();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to update category');
    } finally {
      setActionLoading(false);
    }
  };

  const activeMains = getMainCategories(localCategories, true);

  const filtered = products.filter((prod) => {
    if (filter !== 'all' && prod.approvalStatus !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        prod.name.toLowerCase().includes(q) ||
        (prod.sellerName && prod.sellerName.toLowerCase().includes(q)) ||
        prod.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusLabels: Record<'all' | 'pending_review' | 'approved' | 'rejected', string> = {
    all: tr(currentLang, 'All', 'همه', 'ټول'),
    pending_review: tr(currentLang, 'Pending Review', 'در انتظار بررسی', 'تر بیاکتنې لاندې'),
    approved: tr(currentLang, 'Approved', 'تاییدشده', 'تایید شوي'),
    rejected: tr(currentLang, 'Rejected', 'ردشده', 'رد شوي')
  };

  return (
    <div className="space-y-6 text-[#172033] dark:text-[#E2E8F0]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white/70 dark:bg-[#101C35]/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-[#C9A96E]" />
            <h2 className="text-xl font-extrabold text-[#101C35] dark:text-white">
              {tr(
                currentLang,
                'Seller Product Submissions & Quality Review',
                'بررسی و تایید کیفی کالاهای فروشندگان',
                'د پلورونکو د محصولاتو کیفیتي بیاکتنه او تایید'
              )}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {tr(
              currentLang,
              'Review submissions from approved merchants. Approved products automatically appear in their assigned public category and subcategory.',
              'کالاهای ثبت‌شده توسط فروشندگان تاییدشده را بررسی کنید. محصولات تاییدشده در دسته‌بندی مربوطه در کاتالوگ عمومی نمایش داده می‌شوند.',
              'د تایید شویو پلورونکو محصولات وڅېړئ. تایید شوي محصولات په عامه کاتالوګ کې په اړونده کټګورۍ کې ښودل کېږي.'
            )}
          </p>
        </div>

        <button
          onClick={loadProducts}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{tr(currentLang, 'Refresh', 'بروزرسانی', 'تازه کول')}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/30 text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-1.5 p-1 rounded-xl bg-white/60 dark:bg-[#101C35]/60 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs overflow-x-auto">
          {(['all', 'pending_review', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                filter === status
                  ? 'bg-[#101C35] text-white dark:bg-[#C9A96E] dark:text-[#101C35]'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr(
              currentLang,
              'Search product, seller, category...',
              'جستجوی محصول، فروشنده یا دسته‌بندی...',
              'د محصول، پلورونکي یا کټګورۍ پلټنه...'
            )}
            className="w-full pe-3 py-2 ps-9 rounded-xl bg-white/80 dark:bg-[#0B1220]/60 border border-white/40 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E]"
          />
          <Search className="absolute start-3 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-[#101C35]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 text-xs text-gray-500">
          {tr(
            currentLang,
            'No products found matching review criteria.',
            'هیچ محصولی مطابق فیلتر انتخابی یافت نشد.',
            'د ټاکل شوي فلټر سره هیڅ محصول ونه موندل شو.'
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prod) => {
            const resolvedCat = resolveProductCategory(prod, localCategories, currentLang);
            const subsForSelectedMain = prod.categoryId
              ? getSubcategories(localCategories, prod.categoryId, true)
              : [];

            return (
              <div
                key={prod.id}
                className="rounded-3xl overflow-hidden bg-white/80 dark:bg-[#101C35]/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between"
              >
                <div className="relative h-48 w-full bg-gray-100 dark:bg-black/20">
                  <img
                    src={prod.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 start-3 end-3 flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      prod.approvalStatus === 'approved' ? 'bg-emerald-500 text-white' :
                      prod.approvalStatus === 'pending_review' ? 'bg-amber-500 text-black' :
                      'bg-red-500 text-white'
                    }`}>
                      {prod.approvalStatus === 'approved'
                        ? tr(currentLang, 'Approved (Published)', 'تاییدشده (منتشر در کاتالوگ)', 'تایید شوی (خپور شوی)')
                        : prod.approvalStatus === 'pending_review'
                        ? tr(currentLang, 'Pending Review (Unpublished)', 'در انتظار بررسی (غیرفعال)', 'تر بیاکتنې لاندې')
                        : tr(currentLang, 'Rejected', 'ردشده', 'رد شوی')}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Store className="w-3.5 h-3.5 text-[#C9A96E]" />
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {prod.sellerName || 'HEKA Official'}
                      </span>
                    </div>

                    {resolvedCat.isUncategorized ? (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        <span>
                          {tr(currentLang, 'Uncategorized', 'بدون دسته‌بندی', 'بې کټګورۍ')} ({prod.category || 'None'})
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C9A96E]">
                        <FolderTree className="w-3.5 h-3.5" />
                        <span>{resolvedCat.displayBadge}</span>
                      </div>
                    )}

                    <h3 className="font-bold text-base text-[#101C35] dark:text-white">{prod.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{prod.description}</p>
                  </div>

                  {/* Admin Category Assignment / Override */}
                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-2 text-xs">
                    <div className="text-[10px] font-bold uppercase text-gray-400">
                      {tr(
                        currentLang,
                        'Category & Subcategory Assignment',
                        'تخصیص دسته‌بندی و زیردسته',
                        'د اصلي او فرعي کټګورۍ ټاکنه'
                      )}
                    </div>
                    <select
                      value={prod.categoryId || ''}
                      onChange={(e) => {
                        const nextMain = e.target.value;
                        const subs = nextMain ? getSubcategories(localCategories, nextMain, true) : [];
                        handleQuickAssignCategory(prod.id, nextMain, subs[0]?.id || null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0B1220] border border-black/10 dark:border-white/10 text-xs"
                    >
                      <option value="">{tr(currentLang, '-- Uncategorized --', '-- بدون دسته‌بندی --', '-- بې کټګورۍ --')}</option>
                      {activeMains.map((mc) => (
                        <option key={mc.id} value={mc.id}>
                          {getCategoryLocalizedName(mc, currentLang)}
                        </option>
                      ))}
                    </select>

                    {prod.categoryId && subsForSelectedMain.length > 0 && (
                      <select
                        value={prod.subcategoryId || ''}
                        onChange={(e) => handleQuickAssignCategory(prod.id, prod.categoryId!, e.target.value || null)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0B1220] border border-black/10 dark:border-white/10 text-xs"
                      >
                        <option value="">{tr(currentLang, '-- General Subcategory --', '-- زیردسته عمومی --', '-- عمومي فرعي کټګوري --')}</option>
                        {subsForSelectedMain.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            {getCategoryLocalizedName(sc, currentLang)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400 block text-[10px]">{tr(currentLang, 'Price', 'قیمت', 'بیه')}</span>
                      <span className="font-bold text-[#101C35] dark:text-white">${prod.retailPrice} / {prod.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">{tr(currentLang, 'Stock', 'موجودی', 'زیرمه')}</span>
                      <span className="font-semibold">{prod.stock} {prod.unit}s</span>
                    </div>
                  </div>

                  {prod.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 text-xs text-red-600 dark:text-red-400">
                      <span className="font-bold">{tr(currentLang, 'Rejection Reason:', 'دلیل رد:', 'د رد لامل:')}</span> {prod.rejectionReason}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-black/5 dark:border-white/5 flex gap-2">
                    {prod.approvalStatus !== 'approved' && (
                      <button
                        onClick={() => handleApprove(prod.id)}
                        disabled={actionLoading}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{tr(currentLang, 'Approve & Publish', 'تایید و انتشار', 'تایید او خپرول')}</span>
                      </button>
                    )}

                    {prod.approvalStatus !== 'rejected' && (
                      <button
                        onClick={() => {
                          setRejectingProdId(prod.id);
                          setRejectionReason('Image resolution or specifications do not meet export catalog guidelines');
                        }}
                        disabled={actionLoading}
                        className="flex-1 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{tr(currentLang, 'Reject', 'رد محصول', 'ردول')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingProdId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl p-6 bg-white dark:bg-[#101C35] border border-white/20 shadow-2xl">
            <h3 className="text-base font-bold text-[#101C35] dark:text-white mb-2">
              {tr(currentLang, 'Reject Product Submission', 'رد محصول ارسالی فروشنده', 'د پلورونکي محصول ردول')}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {tr(
                currentLang,
                'Specify what needs revision. The merchant will see this feedback in their Seller Center.',
                'موارد نیازمند اصلاح را بنویسید. این پیام در پنل فروشنده نمایش داده می‌شود.',
                'د اصلاح وړ ټکي ولیکئ. دا پیغام به د پلورونکي په پینل کې ښکاره شي.'
              )}
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Please provide high-resolution unwatermarked photos and detailed laboratory grade documentation"
              className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#C9A96E] mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingProdId(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-semibold cursor-pointer"
              >
                {tr(currentLang, 'Cancel', 'انصراف', 'لغوه')}
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {tr(currentLang, 'Confirm Rejection', 'تایید رد محصول', 'ردول تایید کړئ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
