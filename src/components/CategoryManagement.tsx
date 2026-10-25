import React, { useState } from 'react';
import { ProductCategory, Product, Language } from '../types';
import { api } from '../services/api';
import {
  getCategoryLocalizedName,
  getCategoryLocalizedDesc,
  getMainCategories,
  getSubcategories
} from '../utils/categoryHelpers';
import {
  FolderTree,
  Plus,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  ChevronRight,
  ChevronDown,
  Package,
  Save,
  X,
  ShieldAlert,
  RefreshCw,
  Tag
} from 'lucide-react';

interface CategoryManagementProps {
  categories: ProductCategory[];
  products: Product[];
  companyId: string;
  lang: Language;
  onRefreshData: () => Promise<void>;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  products,
  companyId,
  lang,
  onRefreshData
}) => {
  const isRtl = lang === 'fa' || lang === 'ps';

  const [expandedMains, setExpandedMains] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.filter((c) => c.parentId === null).forEach((c) => {
      initial[c.id] = true;
    });
    return initial;
  });

  // Modal state for Create / Edit Category
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState<{
    parentId: string | null;
    name: string;
    nameFa: string;
    namePs: string;
    description: string;
    descriptionFa: string;
    descriptionPs: string;
    isActive: boolean;
  }>({
    parentId: null,
    name: '',
    nameFa: '',
    namePs: '',
    description: '',
    descriptionFa: '',
    descriptionPs: '',
    isActive: true
  });

  // Safe Delete & Reassign Modal State
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  const [reassignMainId, setReassignMainId] = useState<string>('');
  const [reassignSubId, setReassignSubId] = useState<string>('');

  // Manual assignment state for uncategorized products
  const [manualAssignState, setManualAssignState] = useState<
    Record<string, { categoryId: string; subcategoryId: string }>
  >({});

  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showBanner = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const mainCategories = getMainCategories(categories, false);
  const activeMainCategories = getMainCategories(categories, true);
  const uncategorizedProducts = products.filter((p) => !p.categoryId);

  const toggleExpand = (mainId: string) => {
    setExpandedMains((prev) => ({ ...prev, [mainId]: !prev[mainId] }));
  };

  const openCreateMainModal = () => {
    setEditingCategory(null);
    setFormData({
      parentId: null,
      name: '',
      nameFa: '',
      namePs: '',
      description: '',
      descriptionFa: '',
      descriptionPs: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openCreateSubModal = (parentMainId: string) => {
    setEditingCategory(null);
    setFormData({
      parentId: parentMainId,
      name: '',
      nameFa: '',
      namePs: '',
      description: '',
      descriptionFa: '',
      descriptionPs: '',
      isActive: true
    });
    setExpandedMains((prev) => ({ ...prev, [parentMainId]: true }));
    setIsModalOpen(true);
  };

  const openEditModal = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setFormData({
      parentId: cat.parentId || null,
      name: cat.name || '',
      nameFa: cat.nameFa || '',
      namePs: cat.namePs || '',
      description: cat.description || '',
      descriptionFa: cat.descriptionFa || '',
      descriptionPs: cat.descriptionPs || '',
      isActive: cat.isActive
    });
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showBanner(
        'error',
        lang === 'fa'
          ? 'نام دسته‌بندی به انگلیسی الزامی است.'
          : lang === 'ps'
          ? 'په انګلیسي ژبه د کټګورۍ نوم اړین دی.'
          : 'Category English name is required.'
      );
      return;
    }

    setBusyId('modal-save');
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, {
          parentId: formData.parentId,
          name: formData.name.trim(),
          nameFa: formData.nameFa.trim() || formData.name.trim(),
          namePs: formData.namePs.trim() || formData.nameFa.trim() || formData.name.trim(),
          description: formData.description.trim(),
          descriptionFa: formData.descriptionFa.trim(),
          descriptionPs: formData.descriptionPs.trim(),
          isActive: formData.isActive
        });
        showBanner(
          'success',
          lang === 'fa'
            ? 'دسته‌بندی با موفقیت ویرایش شد.'
            : lang === 'ps'
            ? 'کټګوري په بریالیتوب سره تازه شوه.'
            : 'Category updated successfully.'
        );
      } else {
        const created = await api.createCategory({
          companyId,
          parentId: formData.parentId,
          name: formData.name.trim(),
          nameFa: formData.nameFa.trim() || formData.name.trim(),
          namePs: formData.namePs.trim() || formData.nameFa.trim() || formData.name.trim(),
          description: formData.description.trim(),
          descriptionFa: formData.descriptionFa.trim(),
          descriptionPs: formData.descriptionPs.trim(),
          isActive: formData.isActive
        });
        if (created.parentId === null) {
          setExpandedMains((prev) => ({ ...prev, [created.id]: true }));
        }
        showBanner(
          'success',
          lang === 'fa'
            ? 'دسته‌بندی جدید با موفقیت ایجاد شد.'
            : lang === 'ps'
            ? 'نوې کټګوري په بریالیتوب سره جوړه شوه.'
            : 'New category created successfully.'
        );
      }
      setIsModalOpen(false);
      await onRefreshData();
    } catch (err: any) {
      showBanner('error', err.message || 'Failed to save category');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (cat: ProductCategory) => {
    setBusyId(cat.id);
    try {
      await api.updateCategory(cat.id, { isActive: !cat.isActive });
      await onRefreshData();
      showBanner(
        'success',
        !cat.isActive
          ? lang === 'fa'
            ? 'دسته‌بندی فعال شد.'
            : lang === 'ps'
            ? 'کټګوري فعاله شوه.'
            : 'Category activated.'
          : lang === 'fa'
          ? 'دسته‌بندی غیرفعال شد (محصولات حفظ شدند).'
          : lang === 'ps'
          ? 'کټګوري غیرفعاله شوه (محصولات خوندي پاتې شول).'
          : 'Category deactivated (products preserved safely).'
      );
    } catch (err: any) {
      showBanner('error', err.message || 'Failed to toggle status');
    } finally {
      setBusyId(null);
    }
  };

  const handleMoveOrder = async (cat: ProductCategory, direction: 'up' | 'down') => {
    const siblings = categories
      .filter((c) => (c.parentId || null) === (cat.parentId || null))
      .sort((a, b) => a.order - b.order);

    const currentIndex = siblings.findIndex((s) => s.id === cat.id);
    if (currentIndex === -1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) return;

    const reordered = [...siblings];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(swapIndex, 0, moved);

    const orderedPayload = reordered.map((item, idx) => ({
      id: item.id,
      order: idx + 1
    }));

    setBusyId(cat.id);
    try {
      await api.reorderCategories(orderedPayload, companyId);
      await onRefreshData();
    } catch (err: any) {
      showBanner('error', err.message || 'Failed to reorder categories');
    } finally {
      setBusyId(null);
    }
  };

  const initiateDeleteCategory = (cat: ProductCategory) => {
    setDeleteTarget(cat);
    setReassignMainId('');
    setReassignSubId('');
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await api.deleteCategory(deleteTarget.id, {
        reassignToCategoryId: reassignMainId || null,
        reassignToSubcategoryId: reassignSubId || null
      });
      setDeleteTarget(null);
      await onRefreshData();
      showBanner(
        'success',
        res.reassignedProductsCount > 0
          ? `Category deleted and ${res.reassignedProductsCount} product(s) safely reassigned.`
          : 'Category deleted safely.'
      );
    } catch (err: any) {
      showBanner('error', err.message || 'Could not delete category');
    } finally {
      setBusyId(null);
    }
  };

  const handleManualAssignProduct = async (product: Product) => {
    const selection = manualAssignState[product.id];
    if (!selection || !selection.categoryId) {
      showBanner(
        'error',
        lang === 'fa'
          ? 'لطفاً یک دسته‌بندی اصلی انتخاب کنید.'
          : lang === 'ps'
          ? 'مهرباني وکړئ اصلي کټګوري وټاکئ.'
          : 'Please select a main category first.'
      );
      return;
    }

    setBusyId(product.id);
    try {
      await api.updateProduct(product.id, {
        categoryId: selection.categoryId,
        subcategoryId: selection.subcategoryId || null
      });
      await onRefreshData();
      showBanner(
        'success',
        lang === 'fa'
          ? `دسته‌بندی محصول «${product.nameFa || product.name}» ثبت شد.`
          : lang === 'ps'
          ? `د «${product.namePs || product.nameFa || product.name}» کټګوري ثبت شوه.`
          : `Category assigned to "${product.name}".`
      );
    } catch (err: any) {
      showBanner('error', err.message || 'Failed to assign category');
    } finally {
      setBusyId(null);
    }
  };

  const getProductCountForMain = (mainId: string) =>
    products.filter((p) => p.categoryId === mainId).length;

  const getProductCountForSub = (subId: string) =>
    products.filter((p) => p.subcategoryId === subId).length;

  const targetHasSubcategories = deleteTarget
    ? categories.filter((c) => c.parentId === deleteTarget.id)
    : [];

  const targetDependentProducts = deleteTarget
    ? products.filter((p) => p.categoryId === deleteTarget.id || p.subcategoryId === deleteTarget.id)
    : [];

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-[#C9A96E]/25 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#101C35] to-[#1E293B] border border-[#C9A96E]/40 flex items-center justify-center text-[#C9A96E] shrink-0 shadow-lg">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {lang === 'fa'
                ? 'مدیریت ساختار دسته‌بندی‌ها و زیردسته‌ها'
                : lang === 'ps'
                ? 'د کټګوریو او فرعي کټګوریو مدیریت'
                : 'Dynamic Category & Subcategory Hierarchy'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {lang === 'fa'
                ? 'افزودن، ویرایش، تغییر ترتیب، فعال/غیرفعال‌سازی و اتصال خودکار به محصولات بازار عمومی HEKA LTD'
                : lang === 'ps'
                ? 'د HEKA LTD عمومي بازار محصولاتو لپاره د کټګوریو اضافه کول، سمول، ترتیب او فعال/غیرفعال کول'
                : 'Add, edit, reorder, activate/deactivate categories and subcategories with automatic public marketplace synchronization.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateMainModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A96E] to-[#B38E50] text-[#101C35] font-bold text-sm shadow-md hover:brightness-105 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {lang === 'fa'
              ? 'افزودن دسته‌بندی اصلی'
              : lang === 'ps'
              ? 'اصلي کټګوري اضافه کړئ'
              : 'Add Main Category'}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {lang === 'fa' ? 'دسته‌بندی‌های اصلی' : lang === 'ps' ? 'اصلي کټګورۍ' : 'Main Categories'}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {mainCategories.length}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            {activeMainCategories.length}{' '}
            {lang === 'fa' ? 'فعال در بازار' : lang === 'ps' ? 'په بازار کې فعال' : 'Active in Marketplace'}
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {lang === 'fa' ? 'زیردسته‌های تخصصی' : lang === 'ps' ? 'فرعي کټګورۍ' : 'Subcategories'}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {categories.filter((c) => c.parentId !== null).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {categories.filter((c) => c.parentId !== null && c.isActive).length}{' '}
            {lang === 'fa' ? 'فعال' : lang === 'ps' ? 'فعال' : 'Active'}
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {lang === 'fa' ? 'محصولات دسته‌بندی‌شده' : lang === 'ps' ? 'کټګوري شوي محصولات' : 'Categorized Products'}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {products.filter((p) => Boolean(p.categoryId)).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'fa' ? 'متصل به شناسه پایدار' : lang === 'ps' ? 'له ثابت ID سره تړلي' : 'Linked via stable ID'}
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            {lang === 'fa'
              ? 'بدون دسته‌بندی (نیازمند تعیین دستی)'
              : lang === 'ps'
              ? 'بې کټګورۍ (لاسي ټاکنې ته اړتیا لري)'
              : 'Uncategorized (Manual Assignment)'}
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {uncategorizedProducts.length}
          </div>
          <div className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
            {lang === 'fa'
              ? 'عدم حدس خودکار؛ حفظ سوابق قبلی'
              : lang === 'ps'
              ? 'پخواني محصولات پرته له اټکل ساتل شوي'
              : 'Preserved without auto-guessing'}
          </div>
        </div>
      </div>

      {/* Uncategorized Products Queue (Requirement 5: Flag existing products without categoryId for manual assignment) */}
      {uncategorizedProducts.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-amber-500/30 bg-amber-500/5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'fa'
                    ? 'محصولات فاقد دسته‌بندی (نیازمند تخصیص دستی توسط ادمین)'
                    : lang === 'ps'
                    ? 'بې کټګورۍ محصولات (د اډمین لخوا لاسي ټاکنې ته اړتیا لري)'
                    : 'Existing Products Flagged for Manual Category Assignment'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {lang === 'fa'
                    ? 'طبق قوانین سیستم، دسته‌بندی محصولات قبلی به صورت حدسی تغییر نکرده است. لطفاً دسته‌بندی و زیردسته مناسب را به صورت دستی تعیین کنید.'
                    : lang === 'ps'
                    ? 'د سیستم د اصولو له مخې، د پخوانیو محصولاتو کټګورۍ په اټکلي ډول نه دي ټاکل شوي. مهرباني وکړئ مناسبه کټګوري په لاسي ډول وټاکئ.'
                    : 'Existing product records are preserved without guessing categories. Assign each product to its verified main category and subcategory below.'}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {uncategorizedProducts.map((prod) => {
              const currentSel = manualAssignState[prod.id] || { categoryId: '', subcategoryId: '' };
              const availableSubs = currentSel.categoryId
                ? getSubcategories(categories, currentSel.categoryId, true)
                : [];

              return (
                <div
                  key={prod.id}
                  className="py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200'}
                      alt={prod.name}
                      className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {lang === 'fa'
                          ? prod.nameFa || prod.name
                          : lang === 'ps'
                          ? prod.namePs || prod.nameFa || prod.name
                          : prod.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>ID: {prod.id}</span>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {lang === 'fa'
                            ? `برچسب قبلی: ${prod.category || 'بدون دسته'}`
                            : lang === 'ps'
                            ? `پخوانی لیبل: ${prod.category || 'بې کټګورۍ'}`
                            : `Legacy label: ${prod.category || 'None'}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={currentSel.categoryId}
                      onChange={(e) =>
                        setManualAssignState((prev) => ({
                          ...prev,
                          [prod.id]: { categoryId: e.target.value, subcategoryId: '' }
                        }))
                      }
                      className="glass-input px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80"
                    >
                      <option value="">
                        {lang === 'fa'
                          ? '-- انتخاب دسته‌بندی اصلی --'
                          : lang === 'ps'
                          ? '-- اصلي کټګوري وټاکئ --'
                          : '-- Select Main Category --'}
                      </option>
                      {activeMainCategories.map((mc) => (
                        <option key={mc.id} value={mc.id}>
                          {getCategoryLocalizedName(mc, lang)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={currentSel.subcategoryId}
                      disabled={!currentSel.categoryId || availableSubs.length === 0}
                      onChange={(e) =>
                        setManualAssignState((prev) => ({
                          ...prev,
                          [prod.id]: { ...currentSel, subcategoryId: e.target.value }
                        }))
                      }
                      className="glass-input px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 disabled:opacity-50"
                    >
                      <option value="">
                        {lang === 'fa'
                          ? '-- زیردسته (اختیاری) --'
                          : lang === 'ps'
                          ? '-- فرعي کټګوري (اختیاري) --'
                          : '-- Subcategory (Optional) --'}
                      </option>
                      {availableSubs.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {getCategoryLocalizedName(sc, lang)}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleManualAssignProduct(prod)}
                      disabled={!currentSel.categoryId || busyId === prod.id}
                      className="px-3.5 py-2 rounded-xl bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#101C35] text-xs font-bold hover:opacity-90 disabled:opacity-40 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {lang === 'fa' ? 'ثبت دسته' : lang === 'ps' ? 'ثبت کړئ' : 'Assign'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hierarchical Category Tree */}
      <div className="space-y-4">
        {mainCategories.map((mainCat, mainIdx) => {
          const subs = getSubcategories(categories, mainCat.id, false);
          const isExpanded = expandedMains[mainCat.id] ?? true;
          const mainProductCount = getProductCountForMain(mainCat.id);

          return (
            <div
              key={mainCat.id}
              className={`glass-card rounded-2xl border transition-all ${
                mainCat.isActive
                  ? 'border-slate-200/80 dark:border-slate-700/70'
                  : 'border-rose-500/30 bg-rose-500/5 opacity-80'
              }`}
            >
              {/* Main Category Row */}
              <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleExpand(mainCat.id)}
                    className="mt-1 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Toggle Subcategories"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    )}
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        #{mainCat.order}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {getCategoryLocalizedName(mainCat, lang)}
                      </h3>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          mainCat.isActive
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {mainCat.isActive
                          ? lang === 'fa'
                            ? 'فعال'
                            : lang === 'ps'
                            ? 'فعال'
                            : 'Active'
                          : lang === 'fa'
                          ? 'غیرفعال'
                          : lang === 'ps'
                          ? 'غیرفعال'
                          : 'Inactive'}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#C9A96E]/15 text-[#9A7B3E] dark:text-[#C9A96E] font-medium">
                        {subs.length}{' '}
                        {lang === 'fa' ? 'زیردسته' : lang === 'ps' ? 'فرعي کټګورۍ' : 'subcategories'}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium">
                        {mainProductCount}{' '}
                        {lang === 'fa' ? 'محصول' : lang === 'ps' ? 'محصولات' : 'products'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {getCategoryLocalizedDesc(mainCat, lang)}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>EN: {mainCat.name}</span>
                      <span>•</span>
                      <span>FA: {mainCat.nameFa || '-'}</span>
                      <span>•</span>
                      <span>PS: {mainCat.namePs || '-'}</span>
                      <span>•</span>
                      <span className="font-mono">ID: {mainCat.id}</span>
                    </div>
                  </div>
                </div>

                {/* Main Category Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleMoveOrder(mainCat, 'up')}
                    disabled={mainIdx === 0 || busyId === mainCat.id}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(mainCat, 'down')}
                    disabled={mainIdx === mainCategories.length - 1 || busyId === mainCat.id}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => openCreateSubModal(mainCat.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#C9A96E]/15 hover:bg-[#C9A96E]/25 text-[#8C6D32] dark:text-[#C9A96E] border border-[#C9A96E]/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {lang === 'fa' ? 'افزودن زیردسته' : lang === 'ps' ? 'فرعي کټګوري' : 'Add Subcategory'}
                  </button>

                  <button
                    onClick={() => handleToggleActive(mainCat)}
                    disabled={busyId === mainCat.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      mainCat.isActive
                        ? 'border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10'
                        : 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10'
                    }`}
                  >
                    {mainCat.isActive
                      ? lang === 'fa'
                        ? 'غیرفعال کردن'
                        : lang === 'ps'
                        ? 'غیرفعال کړئ'
                        : 'Deactivate'
                      : lang === 'fa'
                      ? 'فعال کردن'
                      : lang === 'ps'
                      ? 'فعال کړئ'
                      : 'Activate'}
                  </button>

                  <button
                    onClick={() => openEditModal(mainCat)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => initiateDeleteCategory(mainCat)}
                    className="p-2 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subcategories List */}
              {isExpanded && (
                <div className="border-t border-slate-200/70 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 px-4 py-3 sm:px-6 rounded-b-2xl space-y-2">
                  {subs.length === 0 ? (
                    <div className="text-xs text-slate-400 py-2 flex items-center justify-between">
                      <span>
                        {lang === 'fa'
                          ? 'هیچ زیردسته‌ای برای این دسته‌بندی تعریف نشده است.'
                          : lang === 'ps'
                          ? 'د دې کټګورۍ لپاره هیڅ فرعي کټګوري نشته.'
                          : 'No subcategories yet under this main category.'}
                      </span>
                      <button
                        onClick={() => openCreateSubModal(mainCat.id)}
                        className="text-[#C9A96E] hover:underline font-semibold"
                      >
                        + {lang === 'fa' ? 'ایجاد اولین زیردسته' : lang === 'ps' ? 'لومړۍ فرعي کټګوري جوړه کړئ' : 'Create first subcategory'}
                      </button>
                    </div>
                  ) : (
                    subs.map((subCat, subIdx) => {
                      const subProductCount = getProductCountForSub(subCat.id);
                      return (
                        <div
                          key={subCat.id}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                            subCat.isActive
                              ? 'bg-white/80 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/60'
                              : 'bg-rose-500/5 border-rose-500/25 opacity-75'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {mainCat.order}.{subCat.order}
                              </span>
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {getCategoryLocalizedName(subCat, lang)}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  subCat.isActive
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {subCat.isActive
                                  ? lang === 'fa'
                                    ? 'فعال'
                                    : lang === 'ps'
                                    ? 'فعال'
                                    : 'Active'
                                  : lang === 'fa'
                                  ? 'غیرفعال'
                                  : lang === 'ps'
                                  ? 'غیرفعال'
                                  : 'Inactive'}
                              </span>
                              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                                ({subProductCount}{' '}
                                {lang === 'fa' ? 'محصول' : lang === 'ps' ? 'محصولات' : 'products'})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                              <span>EN: {subCat.name}</span>
                              <span>•</span>
                              <span>FA: {subCat.nameFa || '-'}</span>
                              <span>•</span>
                              <span>PS: {subCat.namePs || '-'}</span>
                              <span>•</span>
                              <span className="font-mono">ID: {subCat.id}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleMoveOrder(subCat, 'up')}
                              disabled={subIdx === 0 || busyId === subCat.id}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(subCat, 'down')}
                              disabled={subIdx === subs.length - 1 || busyId === subCat.id}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(subCat)}
                              disabled={busyId === subCat.id}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            >
                              {subCat.isActive
                                ? lang === 'fa'
                                  ? 'غیرفعال'
                                  : lang === 'ps'
                                  ? 'غیرفعال'
                                  : 'Deactivate'
                                : lang === 'fa'
                                ? 'فعال'
                                : lang === 'ps'
                                ? 'فعال'
                                : 'Activate'}
                            </button>
                            <button
                              onClick={() => openEditModal(subCat)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => initiateDeleteCategory(subCat)}
                              className="p-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-modal w-full max-w-xl rounded-2xl p-6 border border-[#C9A96E]/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingCategory
                  ? lang === 'fa'
                    ? 'ویرایش دسته‌بندی'
                    : lang === 'ps'
                    ? 'کټګوري سمول'
                    : 'Edit Category'
                  : formData.parentId
                  ? lang === 'fa'
                    ? 'ایجاد زیردسته جدید'
                    : lang === 'ps'
                    ? 'نوې فرعي کټګوري جوړه کړئ'
                    : 'Create New Subcategory'
                  : lang === 'fa'
                  ? 'ایجاد دسته‌بندی اصلی جدید'
                  : lang === 'ps'
                  ? 'نوې اصلي کټګوري جوړه کړئ'
                  : 'Create New Main Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 mt-4">
              {/* Parent Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'fa'
                    ? 'سطح دسته‌بندی (اصلی یا زیردسته)'
                    : lang === 'ps'
                    ? 'د کټګورۍ کچه (اصلي یا فرعي)'
                    : 'Category Hierarchy Level'}
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, parentId: e.target.value ? e.target.value : null }))
                  }
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="">
                    {lang === 'fa'
                      ? 'دسته‌بندی اصلی (سطح اول)'
                      : lang === 'ps'
                      ? 'اصلي کټګوري (لومړۍ کچه)'
                      : 'Top-Level Main Category'}
                  </option>
                  {mainCategories
                    .filter((mc) => !editingCategory || mc.id !== editingCategory.id)
                    .map((mc) => (
                      <option key={mc.id} value={mc.id}>
                        {lang === 'fa' ? 'زیردسته برای: ' : lang === 'ps' ? 'فرعي کټګوري د: ' : 'Subcategory under: '}
                        {getCategoryLocalizedName(mc, lang)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Names in EN / FA / PS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Construction Materials"
                    className="glass-input w-full px-3 py-2 rounded-xl text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام (دری / فارسی)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formData.nameFa}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nameFa: e.target.value }))}
                    placeholder="مثال: مواد ساختمانی"
                    className="glass-input w-full px-3 py-2 rounded-xl text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نوم (پښتو)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formData.namePs}
                    onChange={(e) => setFormData((prev) => ({ ...prev, namePs: e.target.value }))}
                    placeholder="بېلګه: ودانیز توکي"
                    className="glass-input w-full px-3 py-2 rounded-xl text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description (English)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of products in this category"
                    className="glass-input w-full px-3 py-2 rounded-xl text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      توضیحات (دری)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={formData.descriptionFa}
                      onChange={(e) => setFormData((prev) => ({ ...prev, descriptionFa: e.target.value }))}
                      className="glass-input w-full px-3 py-2 rounded-xl text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      تشریح (پښتو)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={formData.descriptionPs}
                      onChange={(e) => setFormData((prev) => ({ ...prev, descriptionPs: e.target.value }))}
                      className="glass-input w-full px-3 py-2 rounded-xl text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Active Status Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="cat-active-toggle"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[#C9A96E]"
                />
                <label htmlFor="cat-active-toggle" className="text-sm text-slate-700 dark:text-slate-200">
                  {lang === 'fa'
                    ? 'فعال (قابل انتخاب توسط فروشندگان و نمایش در بازار عمومی)'
                    : lang === 'ps'
                    ? 'فعال (د پلورونکو لپاره د ټاکلو وړ او په عمومي بازار کې ښودل کیږي)'
                    : 'Active (Selectable by sellers & visible in public marketplace)'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300"
                >
                  {lang === 'fa' ? 'انصراف' : lang === 'ps' ? 'لغوه' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={busyId === 'modal-save'}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C9A96E] to-[#B38E50] text-[#101C35] font-bold text-sm shadow-md cursor-pointer"
                >
                  {editingCategory
                    ? lang === 'fa'
                      ? 'ذخیره تغییرات'
                      : lang === 'ps'
                      ? 'بدلونونه خوندي کړئ'
                      : 'Save Changes'
                    : lang === 'fa'
                    ? 'ایجاد دسته‌بندی'
                    : lang === 'ps'
                    ? 'کټګوري جوړه کړئ'
                    : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Deletion & Reassignment Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-modal w-full max-w-lg rounded-2xl p-6 border border-rose-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                <ShieldAlert className="w-5 h-5" />
                <span>
                  {lang === 'fa'
                    ? 'حذف ایمن دسته‌بندی (بدون حذف محصولات)'
                    : lang === 'ps'
                    ? 'د کټګورۍ خوندي حذف کول (پرته له محصولاتو حذف کولو)'
                    : 'Safe Category Deletion Check'}
                </span>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-200 space-y-3">
              <p>
                {lang === 'fa' ? 'دسته‌بندی مورد نظر: ' : lang === 'ps' ? 'ټاکل شوې کټګوري: ' : 'Target Category: '}
                <strong className="font-bold">{getCategoryLocalizedName(deleteTarget, lang)}</strong>
              </p>

              {targetHasSubcategories.length > 0 ? (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                  <div className="font-bold">
                    {lang === 'fa'
                      ? `امکان حذف وجود ندارد: این دسته‌بندی دارای ${targetHasSubcategories.length} زیردسته وابسته است.`
                      : lang === 'ps'
                      ? `حذف شونی نه دی: دا کټګوري ${targetHasSubcategories.length} فرعي کټګورۍ لري.`
                      : `Cannot Delete Yet: This main category has ${targetHasSubcategories.length} dependent subcategory(ies).`}
                  </div>
                  <p>
                    {lang === 'fa'
                      ? 'لطفاً ابتدا زیردسته‌های آن را حذف یا به دسته‌بندی دیگری منتقل کنید، یا به جای حذف، این دسته‌بندی را غیرفعال نمایید.'
                      : lang === 'ps'
                      ? 'مهرباني وکړئ لومړی فرعي کټګورۍ حذف یا انتقال کړئ، یا دا کټګوري غیرفعاله کړئ.'
                      : 'Please delete or move its subcategories first, or deactivate this category instead.'}
                  </p>
                </div>
              ) : targetDependentProducts.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
                    {lang === 'fa'
                      ? `${targetDependentProducts.length} محصول به این دسته‌بندی متصل هستند. محصولات هرگز حذف نمی‌شوند. برای حذف این دسته‌بندی، لطفاً یک دسته‌بندی فعال جایگزین برای انتقال ایمن محصولات انتخاب کنید:`
                      : lang === 'ps'
                      ? `${targetDependentProducts.length} محصولات په دې کټګورۍ پورې تړلي دي. محصولات هیڅکله نه حذف کیږي. د حذف کولو دمخه، د محصولاتو خوندي لیږد لپاره بله فعاله کټګوري وټاکئ:`
                      : `${targetDependentProducts.length} product(s) depend on this category. Products are never deleted. Select an active replacement category to safely reassign them before deletion:`}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {lang === 'fa'
                        ? 'انتقال محصولات به دسته‌بندی اصلی فعال *'
                        : lang === 'ps'
                        ? 'فعالې اصلي کټګورۍ ته انتقال *'
                        : 'Reassign Products to Active Main Category *'}
                    </label>
                    <select
                      value={reassignMainId}
                      onChange={(e) => {
                        setReassignMainId(e.target.value);
                        setReassignSubId('');
                      }}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="">
                        {lang === 'fa'
                          ? '-- انتخاب دسته‌بندی جایگزین --'
                          : lang === 'ps'
                          ? '-- بدیله کټګوري وټاکئ --'
                          : '-- Select Replacement Main Category --'}
                      </option>
                      {activeMainCategories
                        .filter((mc) => mc.id !== deleteTarget.id)
                        .map((mc) => (
                          <option key={mc.id} value={mc.id}>
                            {getCategoryLocalizedName(mc, lang)}
                          </option>
                        ))}
                    </select>
                  </div>

                  {reassignMainId && (
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        {lang === 'fa'
                          ? 'زیردسته جایگزین (اختیاری)'
                          : lang === 'ps'
                          ? 'بدیله فرعي کټګوري (اختیاري)'
                          : 'Replacement Subcategory (Optional)'}
                      </label>
                      <select
                        value={reassignSubId}
                        onChange={(e) => setReassignSubId(e.target.value)}
                        className="glass-input w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="">
                          {lang === 'fa' ? '-- بدون زیردسته --' : lang === 'ps' ? '-- پرته له فرعي کټګورۍ --' : '-- None --'}
                        </option>
                        {getSubcategories(categories, reassignMainId, true)
                          .filter((sc) => sc.id !== deleteTarget.id)
                          .map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {getCategoryLocalizedName(sc, lang)}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'fa'
                    ? 'هیچ محصول یا زیردسته‌ای به این مورد وابسته نیست. می‌توانید با اطمینان آن را حذف کنید.'
                    : lang === 'ps'
                    ? 'هیڅ محصول یا فرعي کټګوري پدې پورې اړه نلري. تاسو کولی شئ دا په خوندي ډول حذف کړئ.'
                    : 'No products or subcategories depend on this category. It can be safely deleted.'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                {lang === 'fa' ? 'انصراف' : lang === 'ps' ? 'لغوه' : 'Cancel'}
              </button>
              {targetHasSubcategories.length === 0 && (
                <button
                  onClick={confirmDeleteCategory}
                  disabled={
                    busyId === deleteTarget.id ||
                    (targetDependentProducts.length > 0 && !reassignMainId)
                  }
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                >
                  {targetDependentProducts.length > 0
                    ? lang === 'fa'
                      ? 'انتقال محصولات و حذف دسته‌بندی'
                      : lang === 'ps'
                      ? 'محصولات انتقال او کټګوري حذف کړئ'
                      : 'Reassign Products & Delete Category'
                    : lang === 'fa'
                    ? 'تأیید حذف دسته‌بندی'
                    : lang === 'ps'
                    ? 'کټګوري حذف کړئ'
                    : 'Confirm Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
