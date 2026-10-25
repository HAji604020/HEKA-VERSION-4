import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  DollarSign,
  Layers,
  Percent,
  Truck,
  Award,
  Check,
  X,
  UploadCloud,
  FileText,
  FolderTree,
  AlertTriangle
} from 'lucide-react';
import { Product, Company, Language, ProductPackageSize, ProductAttribute, ProductCategory } from '../types';
import { translations, tr } from '../translations';
import { api } from '../services/api';
import {
  getCategoryLocalizedName,
  getMainCategories,
  getSubcategories,
  resolveProductCategory
} from '../utils/categoryHelpers';

interface ProductManagementProps {
  company: Company;
  products: Product[];
  categories?: ProductCategory[];
  onRefresh: () => void;
  currentLang: Language;
  initialIsAdding?: boolean;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  company,
  products,
  categories: propCategories,
  onRefresh,
  currentLang,
  initialIsAdding = false,
}) => {
  const t = translations[currentLang];
  const [isEditing, setIsEditing] = useState(initialIsAdding);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localCategories, setLocalCategories] = useState<ProductCategory[]>(propCategories || []);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setLocalCategories(propCategories);
    } else {
      api
        .getCategories(company.id, false)
        .then((cats) => setLocalCategories(cats))
        .catch(() => {});
    }
  }, [propCategories, company.id]);

  const activeMains = getMainCategories(localCategories, true);
  const allMains = getMainCategories(localCategories, false);

  // Form helpers
  const handleAddNew = () => {
    const defaultMain = activeMains[0] || null;
    const defaultSubs = defaultMain ? getSubcategories(localCategories, defaultMain.id, true) : [];
    const defaultSub = defaultSubs[0] || null;

    setEditingProduct({
      companyId: company.id,
      name: '',
      nameFa: '',
      namePs: '',
      categoryId: defaultMain ? defaultMain.id : null,
      subcategoryId: defaultSub ? defaultSub.id : null,
      category: defaultMain
        ? defaultSub
          ? `${defaultMain.name} > ${defaultSub.name}`
          : defaultMain.name
        : 'Uncategorized',
      description: '',
      descriptionFa: '',
      descriptionPs: '',
      images: ['https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=800&auto=format&fit=crop&q=80'],
      unit: 'unit',
      retailPrice: 20,
      currency: company.currency || '$',
      stock: 10,
      packageSizes: [],
      attributes: [],
      wholesaleRules: {
        minQuantity: 10,
        discountPercent: 10,
        requireQuote: false,
        termsNote: '',
        isConfirmed: true
      },
      shippingDetails: {
        fee: 'Courier delivery available.',
        transitTime: '24-48 hours',
        coverage: 'Domestic & Regional',
        isConfirmed: true
      },
      qualityInfo: {
        grade: 'Premium Quality Verified',
        isConfirmed: true
      },
      isPublished: true
    });
    setStatusError(null);
    setIsEditing(true);
  };

  const handleEdit = (prod: Product) => {
    setEditingProduct(JSON.parse(JSON.stringify(prod)));
    setStatusError(null);
    setIsEditing(true);
  };

  const handleTogglePublish = async (prod: Product) => {
    try {
      await api.updateProduct(prod.id, { isPublished: !prod.isPublished });
      onRefresh();
    } catch (err: any) {
      setStatusError(`Publish toggle failed: ${err.message}`);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      onRefresh();
    } catch (err: any) {
      setStatusError(`Delete failed: ${err.message}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    setIsSaving(true);
    setStatusError(null);
    try {
      if (editingProduct.id) {
        await api.updateProduct(editingProduct.id, editingProduct);
      } else {
        await api.createProduct({
          ...editingProduct,
          companyId: company.id
        });
      }
      setIsEditing(false);
      setEditingProduct(null);
      onRefresh();
    } catch (err: any) {
      setStatusError(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Package size helpers
  const handleAddPackageSize = () => {
    if (!editingProduct) return;
    const sizes = editingProduct.packageSizes || [];
    const newSize: ProductPackageSize = {
      id: `size_${Date.now()}`,
      name: 'Standard Option',
      weightOrSize: '1 unit',
      price: editingProduct.retailPrice || 10,
      stock: 10,
      isAvailable: true
    };
    setEditingProduct({
      ...editingProduct,
      packageSizes: [...sizes, newSize]
    });
  };

  const handleRemovePackageSize = (id: string) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      packageSizes: (editingProduct.packageSizes || []).filter((s) => s.id !== id)
    });
  };

  // Image helpers
  const handleAddImageUrl = () => {
    if (!editingProduct || !newImageUrl.trim()) return;
    if (newImageUrl.trim().startsWith('http') || newImageUrl.trim().startsWith('/')) {
      setEditingProduct({
        ...editingProduct,
        images: [...(editingProduct.images || []), newImageUrl.trim()]
      });
      setNewImageUrl('');
    }
  };

  const filteredProducts = products.filter((prod) => {
    if (filterCategoryId === 'all') return true;
    if (filterCategoryId === 'uncategorized') return !prod.categoryId;
    return prod.categoryId === filterCategoryId || prod.subcategoryId === filterCategoryId;
  });

  const uncategorizedCount = products.filter((p) => !p.categoryId).length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar with Frosted Glass */}
      <div className="glass-card p-5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold text-[#101C35] dark:text-white">{t.manageProductsTitle}</h2>
            <span className="glass-badge-gold text-[10px] font-bold px-2 py-0.5 rounded-full">
              {products.length} {tr(currentLang, 'Items', 'قلم کالا', 'توکي')}
            </span>
            {uncategorizedCount > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {uncategorizedCount}{' '}
                {currentLang === 'fa'
                  ? 'بدون دسته‌بندی (نیازمند تعیین دستی)'
                  : currentLang === 'ps'
                  ? 'بې کټګورۍ (لاسي ټاکنه)'
                  : 'Uncategorized (Needs Manual Assignment)'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.manageProductsDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className="glass-input px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-300/70 dark:border-slate-700"
          >
            <option value="all">
              {currentLang === 'fa'
                ? 'همه دسته‌بندی‌ها'
                : currentLang === 'ps'
                ? 'ټولې کټګورۍ'
                : 'All Categories'}
            </option>
            {uncategorizedCount > 0 && (
              <option value="uncategorized">
                {currentLang === 'fa'
                  ? `بدون دسته‌بندی (${uncategorizedCount})`
                  : currentLang === 'ps'
                  ? `بې کټګورۍ (${uncategorizedCount})`
                  : `Uncategorized (${uncategorizedCount})`}
              </option>
            )}
            {allMains.map((mc) => (
              <option key={mc.id} value={mc.id}>
                {getCategoryLocalizedName(mc, currentLang)} {!mc.isActive ? '(Inactive)' : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddNew}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#101C35] to-[#1c2e56] hover:from-[#192b52] hover:to-[#223a6c] dark:from-[#C9A96E] dark:to-[#d4b984] text-white dark:text-[#101C35] transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95 border border-[#C9A96E]/30"
          >
            <Plus className="w-4 h-4 text-[#C9A96E] dark:text-[#101C35]" />
            <span>{t.addNewProductBtn}</span>
          </button>
        </div>
      </div>

      {statusError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{statusError}</span>
          <button onClick={() => setStatusError(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Product List Table / Grid with Frosted Glass Surfaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((prod) => {
          const resolvedCat = resolveProductCategory(prod, localCategories, currentLang);
          return (
            <div
              key={prod.id}
              className={`glass-card rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-lg ${
                prod.isPublished
                  ? 'border-white/80 dark:border-white/10'
                  : 'border-amber-400/50 bg-amber-500/5'
              }`}
            >
              <div>
                {/* Product Card Image */}
                <div className="relative aspect-16/9 bg-slate-100/50 dark:bg-slate-800/40 overflow-hidden">
                  <img
                    src={prod.images[0] || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=800&auto=format&fit=crop&q=80'}
                    alt={prod.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs backdrop-blur-md ${
                        prod.isPublished
                          ? 'bg-emerald-600/90 text-white border border-emerald-400/40'
                          : 'bg-amber-600/90 text-white border border-amber-400/40'
                      }`}
                    >
                      {prod.isPublished ? t.publishedStatus : t.privateStatus}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {currentLang === 'fa'
                          ? prod.nameFa || prod.name
                          : currentLang === 'ps'
                          ? prod.namePs || prod.nameFa || prod.name
                          : prod.name}
                      </h3>
                      {prod.nameFa && currentLang === 'en' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{prod.nameFa}</p>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Category / Subcategory Badge */}
                  <div>
                    {resolvedCat.isUncategorized ? (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {currentLang === 'fa'
                            ? 'بدون دسته‌بندی (نیاز به تعیین دستی)'
                            : currentLang === 'ps'
                            ? 'بې کټګورۍ (لاسي ټاکنې ته اړتیا لري)'
                            : 'Uncategorized — Assign Manually'}
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#C9A96E]/15 text-[#8C6D32] dark:text-[#C9A96E] border border-[#C9A96E]/30">
                        <FolderTree className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{resolvedCat.displayBadge}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white/60 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/10 backdrop-blur-xs">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">{t.retailPrice}</span>
                      <strong className="text-slate-900 dark:text-white font-mono text-sm">
                        {prod.currency}{prod.retailPrice} <span className="text-xs font-normal text-slate-500">/{prod.unit}</span>
                      </strong>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/10 backdrop-blur-xs">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">{t.stockLabel}</span>
                      <strong className={prod.stock > 0 ? 'text-emerald-600 dark:text-emerald-400 font-mono text-sm' : 'text-rose-600 dark:text-rose-400 font-mono text-sm'}>
                        {prod.stock} {prod.unit}s
                      </strong>
                    </div>
                  </div>

                  {prod.packageSizes && prod.packageSizes.length > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {tr(currentLang, 'Variants:', 'بسته‌بندی‌ها:', 'بسته بندي:')} {prod.packageSizes.map((s) => s.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Bar */}
              <div className="p-3 bg-white/40 dark:bg-slate-800/30 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(prod)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer backdrop-blur-xs ${
                    prod.isPublished
                      ? 'text-amber-700 dark:text-amber-300 hover:bg-amber-500/10'
                      : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10'
                  }`}
                  title={prod.isPublished ? 'Unpublish from Public Store' : 'Publish to Public Store'}
                >
                  {prod.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  <span>{prod.isPublished ? t.unpublishProduct : t.publishProduct}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleEdit(prod)}
                    className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(prod.id)}
                    className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Modal for Create / Edit Product with Glassmorphism */}
      {isEditing && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101C35]/60 dark:bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="glass-modal rounded-3xl max-w-2xl w-full my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#101C35] to-[#1c2e56] dark:from-[#C9A96E]/20 dark:to-[#C9A96E]/5 flex items-center justify-center border border-[#C9A96E]/30">
                  <Package className="w-4 h-4 text-[#C9A96E]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#101C35] dark:text-white text-base">
                    {editingProduct.id ? t.editProduct : t.addNewProductBtn}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {tr(currentLang, 'HEKA LTD Trading Catalog Specification', 'مشخصات کاتالوگ بازرگانی HEKA LTD', 'د HEKA LTD د سوداګریز کاتالوګ مشخصات')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              {/* Product Name (En, Fa, Ps) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.productNameLabel} (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.productNameLabel} (دری / فارسی)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.nameFa || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameFa: e.target.value })}
                    className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.productNameLabel} (پښتو)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.namePs || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, namePs: e.target.value })}
                    className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Hierarchical Category, Subcategory & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {currentLang === 'fa' ? 'دسته‌بندی اصلی *' : currentLang === 'ps' ? 'اصلي کټګوري *' : 'Main Category *'}
                  </label>
                  <select
                    value={editingProduct.categoryId || ''}
                    onChange={(e) => {
                      const nextMainId = e.target.value || null;
                      const subs = nextMainId ? getSubcategories(localCategories, nextMainId, true) : [];
                      setEditingProduct({
                        ...editingProduct,
                        categoryId: nextMainId,
                        subcategoryId: subs.length > 0 ? subs[0].id : null
                      });
                    }}
                    className="glass-input w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl font-medium cursor-pointer"
                  >
                    <option value="" className="dark:bg-[#101C35]">
                      {currentLang === 'fa'
                        ? '-- بدون دسته‌بندی --'
                        : currentLang === 'ps'
                        ? '-- بې کټګورۍ --'
                        : '-- Uncategorized --'}
                    </option>
                    {activeMains.map((mc) => (
                      <option key={mc.id} value={mc.id} className="dark:bg-[#101C35]">
                        {getCategoryLocalizedName(mc, currentLang)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {currentLang === 'fa' ? 'زیردسته تخصصی' : currentLang === 'ps' ? 'فرعي کټګوري' : 'Subcategory'}
                  </label>
                  <select
                    value={editingProduct.subcategoryId || ''}
                    disabled={!editingProduct.categoryId}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        subcategoryId: e.target.value || null
                      })
                    }
                    className="glass-input w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl font-medium cursor-pointer disabled:opacity-50"
                  >
                    <option value="" className="dark:bg-[#101C35]">
                      {currentLang === 'fa'
                        ? '-- همه / بدون زیردسته --'
                        : currentLang === 'ps'
                        ? '-- پرته له فرعي کټګورۍ --'
                        : '-- None / General --'}
                    </option>
                    {editingProduct.categoryId &&
                      getSubcategories(localCategories, editingProduct.categoryId, true).map((sc) => (
                        <option key={sc.id} value={sc.id} className="dark:bg-[#101C35]">
                          {getCategoryLocalizedName(sc, currentLang)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.unitLabel}</label>
                  <input
                    type="text"
                    value={editingProduct.unit || 'piece'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Retail Price, Currency, and Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.retailPriceLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProduct.retailPrice ?? ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, retailPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tr(currentLang, 'Currency', 'واحد پول', 'اسعار')}
                  </label>
                  <select
                    value={editingProduct.currency || '$'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, currency: e.target.value })}
                    className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-medium cursor-pointer"
                  >
                    <option value="$" className="dark:bg-[#101C35]">$ (USD)</option>
                    <option value="AFN" className="dark:bg-[#101C35]">AFN (افغانی)</option>
                    <option value="€" className="dark:bg-[#101C35]">€ (EUR)</option>
                    <option value="AED" className="dark:bg-[#101C35]">AED (درهم)</option>
                    <option value="TRY" className="dark:bg-[#101C35]">TRY (لیره)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.stockLabel}</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.stock ?? 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })
                    }
                    className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-mono font-medium"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {tr(currentLang, 'Description (English)', 'توضیحات محصول (انگلیسی)', 'د محصول تفصیل (انګلیسي)')}
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="glass-input w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl resize-none font-medium"
                />
              </div>

              {/* Images */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>{t.imagesLabel}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="text-xs text-[#C9A96E] hover:text-[#b39255] font-bold cursor-pointer"
                  >
                    {t.addImageUrl}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {(editingProduct.images || []).map((imgUrl, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl border border-white/60 dark:border-white/10 overflow-hidden group shadow-xs">
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editingProduct.images || []).filter((_, idx) => idx !== i);
                          setEditingProduct({ ...editingProduct, images: updated });
                        }}
                        className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Package Sizes / Variants Section */}
              <div className="rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 p-3.5 space-y-2.5 backdrop-blur-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>{t.packageSizesTitle}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPackageSize}
                    className="text-xs text-[#C9A96E] font-bold hover:underline cursor-pointer"
                  >
                    {t.addPackageSize}
                  </button>
                </div>
                {(editingProduct.packageSizes || []).map((size, idx) => (
                  <div key={size.id} className="flex items-center gap-2 bg-white/70 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs">
                    <input
                      type="text"
                      placeholder="Size Name (e.g. 10g or M)"
                      value={size.name}
                      onChange={(e) => {
                        const sizes = [...(editingProduct.packageSizes || [])];
                        sizes[idx].name = e.target.value;
                        setEditingProduct({ ...editingProduct, packageSizes: sizes });
                      }}
                      className="glass-input flex-1 px-2.5 py-1 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Weight/Size"
                      value={size.weightOrSize}
                      onChange={(e) => {
                        const sizes = [...(editingProduct.packageSizes || [])];
                        sizes[idx].weightOrSize = e.target.value;
                        setEditingProduct({ ...editingProduct, packageSizes: sizes });
                      }}
                      className="glass-input w-24 px-2.5 py-1 rounded-lg font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={size.price}
                      onChange={(e) => {
                        const sizes = [...(editingProduct.packageSizes || [])];
                        sizes[idx].price = parseFloat(e.target.value) || 0;
                        setEditingProduct({ ...editingProduct, packageSizes: sizes });
                      }}
                      className="glass-input w-20 px-2.5 py-1 rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePackageSize(size.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Wholesale Rules */}
              <div className="rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 p-3.5 space-y-2.5 backdrop-blur-xs">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.wholesaleSectionTitle}</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">{t.minQuantity}</label>
                    <input
                      type="number"
                      min="1"
                      value={editingProduct.wholesaleRules?.minQuantity || 10}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          wholesaleRules: {
                            ...(editingProduct.wholesaleRules || { minQuantity: 10, discountPercent: 0, requireQuote: false, isConfirmed: true, termsNote: '' }),
                            minQuantity: parseInt(e.target.value, 10) || 1
                          }
                        })
                      }
                      className="glass-input w-full text-xs px-3 py-2 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">{t.discountPercent}</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingProduct.wholesaleRules?.discountPercent || 0}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          wholesaleRules: {
                            ...(editingProduct.wholesaleRules || { minQuantity: 10, requireQuote: false, isConfirmed: true, termsNote: '' }),
                            discountPercent: parseFloat(e.target.value) || 0
                          }
                        })
                      }
                      className="glass-input w-full text-xs px-3 py-2 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Published Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 backdrop-blur-xs">
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-white block">
                    {tr(currentLang, 'Catalog Visibility', 'وضعیت نمایش در کاتالوگ', 'په کاتالوګ کې د ښودلو حالت')}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {editingProduct.isPublished ? t.publishedStatus : t.privateStatus}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={!!editingProduct.isPublished}
                  onChange={(e) => setEditingProduct({ ...editingProduct, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded text-[#101C35] focus:ring-[#C9A96E] cursor-pointer accent-[#C9A96E]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#101C35] to-[#1c2e56] hover:from-[#192b52] hover:to-[#223a6c] dark:from-[#C9A96E] dark:to-[#d4b984] text-white dark:text-[#101C35] transition shadow-md cursor-pointer active:scale-95 border border-[#C9A96E]/30"
                >
                  {isSaving ? tr(currentLang, 'Saving...', 'در حال ذخیره...', 'په خوندي کولو کې...') : t.saveProductBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
