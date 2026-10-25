import { ProductCategory, Product, Language } from '../types';

export function getCategoryLocalizedName(category: ProductCategory | null | undefined, lang: Language): string {
  if (!category) return '';
  if (lang === 'fa' && category.nameFa) return category.nameFa;
  if (lang === 'ps' && category.namePs) return category.namePs;
  if ((lang === 'fa' || lang === 'ps') && category.nameFa) return category.nameFa;
  return category.name;
}

export function getCategoryLocalizedDesc(category: ProductCategory | null | undefined, lang: Language): string {
  if (!category) return '';
  if (lang === 'fa' && category.descriptionFa) return category.descriptionFa;
  if (lang === 'ps' && category.descriptionPs) return category.descriptionPs;
  if ((lang === 'fa' || lang === 'ps') && category.descriptionFa) return category.descriptionFa;
  return category.description || '';
}

export interface ResolvedProductCategory {
  isCategorized: boolean;
  isUncategorized: boolean;
  isMainActive: boolean;
  isSubActive: boolean;
  mainCategory: ProductCategory | null;
  subcategory: ProductCategory | null;
  displayLabel: string;
  displayBadge: string;
  fullPathLabel: string;
  legacyCategoryLabel?: string;
}

export function resolveProductCategory(
  product: Product,
  categories: ProductCategory[],
  lang: Language
): ResolvedProductCategory {
  const uncategorizedText =
    lang === 'fa'
      ? 'دسته‌بندی‌نشده'
      : lang === 'ps'
      ? 'ناوېشل شوی'
      : 'Uncategorized';

  const uncategorizedFullText =
    lang === 'fa'
      ? 'دسته‌بندی‌نشده (نیازمند تخصیص دستی)'
      : lang === 'ps'
      ? 'ناوېشل شوی (د لاسي ټاکنې وړ)'
      : 'Uncategorized (Needs Manual Assignment)';

  if (!product.categoryId) {
    const label = product.category && product.category !== 'Uncategorized' ? product.category : uncategorizedText;
    return {
      isCategorized: false,
      isUncategorized: true,
      isMainActive: false,
      isSubActive: false,
      mainCategory: null,
      subcategory: null,
      displayLabel: label,
      displayBadge: label,
      fullPathLabel: uncategorizedFullText,
      legacyCategoryLabel: product.category && product.category !== 'Uncategorized' ? product.category : undefined
    };
  }

  const foundCat = categories.find((c) => c.id === product.categoryId) || null;
  if (!foundCat) {
    const label = product.category || uncategorizedText;
    return {
      isCategorized: false,
      isUncategorized: true,
      isMainActive: false,
      isSubActive: false,
      mainCategory: null,
      subcategory: null,
      displayLabel: label,
      displayBadge: label,
      fullPathLabel: uncategorizedFullText,
      legacyCategoryLabel: product.category
    };
  }

  // Handle case where categoryId points to a subcategory or main category
  let mainCat: ProductCategory | null = foundCat;
  let subCat: ProductCategory | null = null;

  if (foundCat.parentId) {
    mainCat = categories.find((c) => c.id === foundCat.parentId) || foundCat;
    subCat = foundCat;
  } else if (product.subcategoryId) {
    subCat = categories.find((c) => c.id === product.subcategoryId && c.parentId === foundCat.id) || null;
  }

  const mainLabel = getCategoryLocalizedName(mainCat, lang);
  const subLabel = subCat ? getCategoryLocalizedName(subCat, lang) : '';
  const combinedLabel = subLabel ? `${mainLabel} › ${subLabel}` : mainLabel;

  return {
    isCategorized: true,
    isUncategorized: false,
    isMainActive: Boolean(mainCat?.isActive),
    isSubActive: subCat ? Boolean(subCat.isActive) : true,
    mainCategory: mainCat,
    subcategory: subCat,
    displayLabel: combinedLabel,
    displayBadge: combinedLabel,
    fullPathLabel: combinedLabel,
    legacyCategoryLabel: product.category
  };
}

export function isProductPubliclyVisible(product: Product, categories?: ProductCategory[]): boolean {
  if (!product.isPublished) return false;
  if (product.approvalStatus && product.approvalStatus !== 'approved') return false;
  if (categories && categories.length > 0 && product.categoryId) {
    const resolved = resolveProductCategory(product, categories, 'en');
    if (resolved.isCategorized && (!resolved.isMainActive || !resolved.isSubActive)) {
      return false;
    }
  }
  return true;
}

export function getMainCategories(categories: ProductCategory[], activeOnly = false): ProductCategory[] {
  return categories
    .filter((c) => c.parentId === null && (!activeOnly || c.isActive))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function getSubcategories(
  categories: ProductCategory[],
  parentId: string,
  activeOnly = false
): ProductCategory[] {
  return categories
    .filter((c) => c.parentId === parentId && (!activeOnly || c.isActive))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
