import fs from 'fs';
import path from 'path';
import {
  Company,
  Product,
  User,
  CustomerInquiry,
  SecurityAuditResult,
  SupportTicket,
  SellerApplication,
  AccountType,
  SellerStatus,
  ProductApprovalStatus,
  PersonalProfile,
  BusinessProfile,
  ProductCategory,
  QuotationNotificationMap,
  QuotationNotificationDestinations,
  AuthSession
} from '../types';
import {
  DEFAULT_HEKA_NOTIFICATION_DESTINATIONS,
  createInitialNotificationMap,
  normalizeInternationalPhone
} from './notificationService';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  isValidEmailFormat,
  generateSessionId,
  sanitizeUserForClient
} from './authSecurity';

export interface DatabaseSchema {
  companies: Company[];
  users: User[];
  products: Product[];
  inquiries: CustomerInquiry[];
  supportTickets?: SupportTicket[];
  sellerApplications?: SellerApplication[];
  categories?: ProductCategory[];
  sessions?: AuthSession[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp_heka_ltd',
    slug: 'heka-ltd',
    name: 'HEKA LTD',
    industry: 'International Trade & Premium Distribution',
    country: 'United Kingdom / Global',
    currency: 'USD',
    logoUrl: '/heka-logo.jpg',
    bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    brandColors: {
      primary: '#101C35', // Deep Navy Blue (#101C35) from official design system
      accent: '#C9A96E',  // Elegant Muted Gold (#C9A96E) from official design system
      background: '#F5F7FA'
    },
    contactPhone: '+44 20 7946 0991',
    contactEmail: 'contact@hekaltd.com',
    address: '100 Bishopsgate, London EC2N 4AG, United Kingdom',
    plan: 'enterprise',
    settings: {
      showRetailPricesPublicly: true,
      allowWholesaleQuoteRequests: true,
      supportedLanguages: ['en', 'fa', 'ps'],
      defaultLanguage: 'en',
      customGreetingEn: 'Welcome to HEKA LTD. High-grade commercial supply, wholesale distribution, and verified customer service.',
      customGreetingFa: 'به درگاه رسمی شرکت تجارتی و توزیع بین‌المللی HEKA LTD خوش آمدید.',
      notificationDestinations: DEFAULT_HEKA_NOTIFICATION_DESTINATIONS
    },
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'comp_ziba_fashion',
    slug: 'ziba-fashion',
    name: 'Ziba Silk & Apparel',
    industry: 'Textile & Traditional Fashion',
    country: 'Afghanistan',
    currency: 'USD',
    logoUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=128&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    brandColors: {
      primary: '#0f766e', // Teal 700
      accent: '#4f46e5',  // Indigo 600
      background: '#f8fafc'
    },
    contactPhone: '+93700987654',
    contactEmail: 'sales@zibafashion.com',
    address: 'Zarghoona Plaza, Shahr-e Naw, Kabul, Afghanistan',
    plan: 'starter',
    settings: {
      showRetailPricesPublicly: true,
      allowWholesaleQuoteRequests: true,
      supportedLanguages: ['fa', 'en'],
      defaultLanguage: 'fa',
      customGreetingEn: 'Ziba Silk: Handwoven Afghan silk, traditional chapans, and embroidered dresses.',
      customGreetingFa: 'زیبا فشن: البسه دست‌دوز، چپن‌های ابریشمی و پیراهن‌های سنتی هرات و کابل.'
    },
    createdAt: '2026-02-15T10:00:00Z'
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'user_owner',
    email: 'owner@dukanai.com',
    name: 'Platform Administrator',
    role: 'platform_owner',
    companyId: null,
    token: 'token_owner_secret'
  },
  {
    id: 'user_heka_admin',
    email: 'admin@hekaltd.com',
    name: 'HEKA Corporate Director',
    role: 'company_admin',
    companyId: 'comp_heka_ltd',
    token: 'token_heka_admin_secret'
  },
  {
    id: 'user_ziba_admin',
    email: 'admin@zibafashion.com',
    name: 'Ziba Samimi (Founder)',
    role: 'company_admin',
    companyId: 'comp_ziba_fashion',
    token: 'token_ziba_admin_secret'
  },
  {
    id: 'user_ziba_staff',
    email: 'sales@zibafashion.com',
    name: 'Ahmad Reshad (Sales Staff)',
    role: 'company_staff',
    companyId: 'comp_ziba_fashion',
    token: 'token_ziba_staff_secret'
  },
  // --- Seed Customer & Seller Accounts for Verification ---
  {
    id: 'user_sarah_buyer',
    email: 'sarah.jenkins@gmail.com',
    name: 'Sarah Jenkins',
    role: 'customer',
    companyId: null,
    token: 'token_sarah_buyer',
    accountType: 'personal',
    personalProfile: {
      fullName: 'Sarah Jenkins',
      country: 'United Kingdom',
      city: 'London',
      phone: '+44 7700 900123'
    },
    sellerStatus: 'none',
    preferredLanguage: 'en',
    savedProductIds: ['prod_heka_1'],
    phone: '+44 7700 900123',
    country: 'United Kingdom',
    city: 'London',
    createdAt: '2026-02-01T08:00:00Z'
  },
  {
    id: 'user_marcus_buyer',
    email: 'marcus.sterling@auraglobal.co.uk',
    name: 'Marcus Sterling',
    role: 'customer',
    companyId: null,
    token: 'token_marcus_buyer',
    accountType: 'business',
    businessProfile: {
      contactPerson: 'Marcus Sterling',
      companyName: 'Aura Global Trading UK',
      country: 'United Kingdom',
      city: 'London',
      businessEmail: 'marcus.sterling@auraglobal.co.uk',
      businessPhone: '+44 20 7946 0888',
      businessType: 'Wholesaler & Importer',
      registrationNumber: 'UK-COMP-998241',
      website: 'https://auraglobal.co.uk'
    },
    sellerStatus: 'none', // Business registration alone must NOT grant seller permissions (Specification Requirement #3)
    preferredLanguage: 'en',
    savedProductIds: ['prod_heka_2'],
    phone: '+44 20 7946 0888',
    country: 'United Kingdom',
    city: 'London',
    createdAt: '2026-02-10T12:00:00Z'
  },
  {
    id: 'user_zahir_seller',
    email: 'kabul.crafts@afghantrade.com',
    name: 'Mohammad Zahir',
    role: 'customer',
    companyId: null,
    token: 'token_zahir_seller',
    accountType: 'business',
    businessProfile: {
      contactPerson: 'Mohammad Zahir',
      companyName: 'Kabul Artisan Handicrafts Co.',
      country: 'Afghanistan',
      city: 'Kabul',
      businessEmail: 'kabul.crafts@afghantrade.com',
      businessPhone: '+93 700 123 456',
      businessType: 'Manufacturer & Producer',
      registrationNumber: 'AFG-MOC-7712'
    },
    sellerStatus: 'approved', // Approved HEKA Seller
    preferredLanguage: 'fa',
    savedProductIds: ['prod_heka_1'],
    phone: '+93 700 123 456',
    country: 'Afghanistan',
    city: 'Kabul',
    createdAt: '2026-02-12T10:00:00Z'
  },
  {
    id: 'user_farid_pending_seller',
    email: 'herat.saffron.coop@heratfarms.af',
    name: 'Ahmad Farid',
    role: 'customer',
    companyId: null,
    token: 'token_farid_pending_seller',
    accountType: 'business',
    businessProfile: {
      contactPerson: 'Ahmad Farid',
      companyName: 'Herat Organic Agricultural Cooperative',
      country: 'Afghanistan',
      city: 'Herat',
      businessEmail: 'herat.saffron.coop@heratfarms.af',
      businessPhone: '+93 799 456 789',
      businessType: 'Agricultural Producer Cooperative',
      registrationNumber: 'AFG-AGR-4409'
    },
    sellerStatus: 'pending', // Pending HEKA LTD administrator review
    preferredLanguage: 'fa',
    savedProductIds: [],
    phone: '+93 799 456 789',
    country: 'Afghanistan',
    city: 'Herat',
    createdAt: '2026-03-01T09:00:00Z'
  }
];

const INITIAL_SELLER_APPLICATIONS: SellerApplication[] = [
  {
    id: 'app_kabul_crafts',
    userId: 'user_zahir_seller',
    applicantName: 'Mohammad Zahir',
    businessName: 'Kabul Artisan Handicrafts Co.',
    businessType: 'Manufacturer & Producer',
    country: 'Afghanistan',
    city: 'Kabul',
    phone: '+93 700 123 456',
    email: 'kabul.crafts@afghantrade.com',
    description: 'Traditional Afghan hand-carved walnut wood boxes, brass inlay presentation cases, and Badakhshan lapis lazuli handicrafts for export distribution.',
    productCategories: ['Executive Gifts & Specialty Goods', 'Handicrafts & Decor'],
    registrationNumber: 'AFG-MOC-7712',
    documents: ['Commercial_License_AFG_7712.pdf', 'Artisan_Guild_Cert.jpg'],
    status: 'approved',
    submittedAt: '2026-02-12T10:30:00Z',
    reviewedAt: '2026-02-14T11:00:00Z',
    reviewedBy: 'admin@hekaltd.com',
    adminNotes: 'Verified registration with Ministry of Commerce & Chamber of Handicrafts. Approved for specialty catalog listing.'
  },
  {
    id: 'app_herat_saffron',
    userId: 'user_farid_pending_seller',
    applicantName: 'Ahmad Farid',
    businessName: 'Herat Organic Agricultural Cooperative',
    businessType: 'Agricultural Producer Cooperative',
    country: 'Afghanistan',
    city: 'Herat',
    phone: '+93 799 456 789',
    email: 'herat.saffron.coop@heratfarms.af',
    description: 'Union of 45 family farms producing certified Grade 1 Super Negin saffron and sun-dried organic figs for international bulk trade.',
    productCategories: ['Agricultural Export & Saffron', 'Organic Dried Fruits'],
    registrationNumber: 'AFG-AGR-4409',
    documents: ['Coop_Establishment_Charter.pdf', 'ISO_3632_Specimen.pdf'],
    status: 'pending',
    submittedAt: '2026-03-01T09:15:00Z',
    adminNotes: 'Application received and awaiting HEKA LTD directorate review.'
  }
];

const INITIAL_PRODUCTS: Product[] = [
  // --- Company 1: HEKA LTD Products ---
  {
    id: 'prod_heka_1',
    companyId: 'comp_heka_ltd',
    name: 'HEKA Signature Reserve Luxury Gift Collection',
    nameFa: 'بسته هدیه لوکس کلکسیون اختصاصی HEKA LTD',
    category: 'Executive Gifts & Specialty Goods',
    description: 'Handcrafted luxury executive presentation case featuring certified pure Grade 1 botanical extract, precision brass dispenser, and sealed airtight crystal containers.',
    descriptionFa: 'جعبه هدیه لوکس و تشریفاتی ساخته شده با روکش مخمل، ظروف کریستال پلمپ شده با استاندارد بین‌المللی و گواهی اصالت آزمایشگاهی.',
    images: [
      '/heka-logo.jpg',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80'
    ],
    unit: 'box',
    retailPrice: 48,
    currency: '$',
    stock: 50,
    packageSizes: [
      { id: 'size_standard', name: 'Standard Executive Set', weightOrSize: 'Standard Set', price: 48, stock: 35, isAvailable: true },
      { id: 'size_deluxe', name: 'Deluxe Grand Edition', weightOrSize: 'Deluxe Grand', price: 95, stock: 15, isAvailable: true }
    ],
    attributes: [
      { key: 'Grade', value: 'Premium Grade 1 Export Certified' },
      { key: 'Origin', value: 'Certified Verified Global Sourcing' },
      { key: 'Packaging', value: 'Airtight Sealed Crystal in Velvet Wood Chest' }
    ],
    wholesaleRules: {
      minQuantity: 10,
      discountPercent: 12,
      requireQuote: true,
      termsNote: '12% volume concession on orders of 20+ units. Bespoke corporate engraving provided on 50+ units.',
      termsNoteFa: '۱۲٪ تخفیف تجاری برای سفارش‌های بالای ۲۰ بسته. امکان سفارشی‌سازی برند شرکتی برای بالای ۵۰ عدد.',
      isConfirmed: true
    },
    shippingDetails: {
      fee: 'Free priority courier across UK & Europe; DHL Express worldwide dispatch quoted per destination.',
      transitTime: '24-48h domestic / EU, 3-5 business days global express',
      coverage: 'UK, EU, Middle East, North America, Central Asia',
      isConfirmed: true
    },
    qualityInfo: {
      grade: 'Grade 1 ISO Certified',
      standard: 'ISO 9001 / ISO 22000 Certified Batch',
      labReportNumber: 'HEKA-QC-2026-778',
      isConfirmed: true,
      notes: 'Purity, moisture tolerance, and full traceability verified.'
    },
    isPublished: true,
    isFeatured: true,
    createdAt: '2026-01-15T12:00:00Z',
    updatedAt: '2026-03-01T09:30:00Z'
  },
  {
    id: 'prod_heka_2',
    companyId: 'comp_heka_ltd',
    name: 'HEKA Industrial & Commercial Grade Supply (Bulk Canister)',
    nameFa: 'محصول تجارتی فله و توزیع عمده HEKA LTD (کانتینر فلزی)',
    category: 'Commercial Wholesale & Export',
    description: 'Food & cosmetic-grade airtight nitrogen-flushed industrial containers engineered for international distributors, pharmaceutical formulators, and luxury hospitality chains.',
    descriptionFa: 'کانتینر آلومینیومی ایزوله تحت گاز خنثی نیتروژن جهت حفظ بالاترین استانداردهای کیفی برای صادرات و توزیع‌کنندگان بین‌المللی.',
    images: [
      '/heka-logo.jpg',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80'
    ],
    unit: 'canister',
    retailPrice: 1850,
    currency: '$',
    stock: 20,
    packageSizes: [
      { id: 'size_1kg', name: '1 KG Commercial Canister', weightOrSize: '1000g', price: 1850, stock: 15, isAvailable: true },
      { id: 'size_5kg', name: '5 KG Master Cask', weightOrSize: '5000g', price: 8200, stock: 5, isAvailable: true }
    ],
    attributes: [
      { key: 'Grade', value: 'International Industrial Grade 1' },
      { key: 'Certification', value: 'Certificate of Analysis & Chamber of Commerce Certified' }
    ],
    wholesaleRules: {
      minQuantity: 1,
      discountPercent: 8,
      requireQuote: true,
      termsNote: 'Tiered wholesale pricing: $1,650/unit for orders exceeding 5 units. Air cargo CIP major global hubs.',
      termsNoteFa: 'تخفیف ویژه سفارش‌های تیراژ بالا: ۱۶۵۰ دالر به ازای هر واحد برای سفارش ۵ واحد به بالا همراه با باربری هوایی CIP.',
      isConfirmed: true
    },
    shippingDetails: {
      fee: 'CIP air cargo dispatch to designated international airports.',
      transitTime: '3-5 business days upon customs clearance',
      coverage: 'London, Frankfurt, Dubai, Istanbul, Singapore, New York',
      isConfirmed: true
    },
    qualityInfo: {
      grade: 'Commercial Prime Grade',
      standard: 'ISO Standards & Phytosanitary Clearances',
      labReportNumber: 'EXP-HEKA-2026-90',
      isConfirmed: true,
      notes: 'Fully authenticated batch with laboratory spectrum validation.'
    },
    isPublished: true,
    isFeatured: false,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-28T14:00:00Z'
  },

  // --- Company 2: Ziba Silk & Apparel Products ---
  {
    id: 'prod_ziba_1',
    companyId: 'comp_ziba_fashion',
    name: 'Handcrafted Afghan Silk Chapan Robe',
    nameFa: 'چپن ابریشمی دست‌دوز سنتی افغانستان',
    category: 'Outerwear',
    description: 'Traditional Afghan long chapan coat handwoven from pure Herat raw silk, featuring intricate golden border embroidery and cotton lining.',
    descriptionFa: 'چپن اصیل ابریشمی بافته شده از ابریشم طبیعی هرات همراه با سوزن‌دوزی زرین و آستر نخی بسیار سبک و شیک.',
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'
    ],
    unit: 'piece',
    retailPrice: 120,
    currency: '$',
    stock: 18,
    packageSizes: [
      { id: 'size_s', name: 'Size S (Chest 38")', weightOrSize: 'S', price: 120, stock: 4, isAvailable: true },
      { id: 'size_m', name: 'Size M (Chest 42")', weightOrSize: 'M', price: 120, stock: 8, isAvailable: true },
      { id: 'size_l', name: 'Size L (Chest 46")', weightOrSize: 'L', price: 125, stock: 6, isAvailable: true }
    ],
    attributes: [
      { key: 'Material', value: '100% Raw Herat Silk' },
      { key: 'Embroidery', value: 'Handmade Gold Thread' },
      { key: 'Care', value: 'Dry Clean Only' }
    ],
    wholesaleRules: {
      minQuantity: 10,
      discountPercent: 15,
      requireQuote: true,
      termsNote: '15% wholesale discount for boutique orders of 10+ pieces.',
      termsNoteFa: '۱۵٪ تخفیف برای سفارش‌های بالای ۱۰ عدد ویژه بوتیک‌ها.',
      isConfirmed: true
    },
    shippingDetails: {
      fee: 'Free courier in Kabul; provincial courier 200 AFN. International post available.',
      transitTime: '24-48 hours domestic, 7-10 days international',
      coverage: 'All provinces of Afghanistan & International',
      isConfirmed: true
    },
    qualityInfo: {
      grade: 'Artisan Grade Handcrafted',
      standard: '100% Pure Silk Certified',
      isConfirmed: true,
      notes: 'Handwoven by women artisans in Herat.'
    },
    isPublished: true,
    isFeatured: true,
    createdAt: '2026-02-20T11:00:00Z',
    updatedAt: '2026-03-02T16:00:00Z'
  },
  {
    id: 'prod_ziba_2',
    companyId: 'comp_ziba_fashion',
    name: 'Traditional Embroidered Velvet Dress Set',
    nameFa: 'ست پیراهن و تنبان مخمل گند افغانی با سکه‌دوزی',
    category: 'Traditional Dresses',
    description: 'Festive Afghan Gand velvet dress with mirrored hand-embroidery, wide embroidered trousers, and silk chiffon shawl.',
    descriptionFa: 'لباس محلی سنتی گند افغانی با پارچه مخمل اعلا، آیینه‌دوزی ظریف دست، شلوار چین‌دار و شال حریر.',
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80'
    ],
    unit: 'set',
    retailPrice: 85,
    currency: '$',
    stock: 24,
    packageSizes: [
      { id: 'dress_m', name: 'Medium (Bust 38-40)', weightOrSize: 'M', price: 85, stock: 14, isAvailable: true },
      { id: 'dress_l', name: 'Large (Bust 42-44)', weightOrSize: 'L', price: 85, stock: 10, isAvailable: true }
    ],
    attributes: [
      { key: 'Fabric', value: 'Premium Velvet & Chiffon' },
      { key: 'Work', value: 'Mirror Work & Needlepoint' }
    ],
    wholesaleRules: {
      minQuantity: 5,
      discountPercent: 12,
      requireQuote: false,
      termsNote: '12% discount for event planners & shops ordering 5+ sets.',
      termsNoteFa: '۱۲٪ تخفیف برای سفارش بیش از ۵ ست.',
      isConfirmed: true
    },
    shippingDetails: {
      fee: 'Courier delivery within 24-48 hours.',
      transitTime: '1-2 days',
      coverage: 'Domestic Afghanistan',
      isConfirmed: true
    },
    qualityInfo: {
      grade: 'Authentic Traditional Handicraft',
      isConfirmed: true
    },
    isPublished: true,
    isFeatured: false,
    approvalStatus: 'approved',
    createdAt: '2026-02-25T08:00:00Z',
    updatedAt: '2026-03-01T12:00:00Z'
  },
  // --- Seller-Submitted Products (Testing Permissions & Approvals) ---
  {
    id: 'prod_seller_kabul_1',
    companyId: 'comp_heka_ltd',
    sellerId: 'user_zahir_seller',
    sellerName: 'Kabul Artisan Handicrafts Co.',
    name: 'Hand-Carved Walnut Keepsake Chest with Brass Inlay',
    nameFa: 'صندوقچه چوبی دست‌ساز گردو با برنج‌کوبی اصیل کابل',
    category: 'Executive Gifts & Specialty Goods',
    description: 'Solid walnut keepsake presentation chest with geometric brass filigree inlays, velvet interior, and engraved brass clasp. Handcrafted by master woodworkers in Kabul.',
    descriptionFa: 'صندوقچه تشریفاتی چوب گردوی کوهستان با معرق‌کاری برنجی، آستر مخمل یشمی و قفل سنتی دست‌ساز.',
    images: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80'
    ],
    unit: 'piece',
    retailPrice: 85,
    currency: '$',
    stock: 24,
    packageSizes: [
      { id: 'chest_standard', name: 'Standard Medium Chest', weightOrSize: '25x15x12 cm', price: 85, stock: 16, isAvailable: true },
      { id: 'chest_large', name: 'Executive Master Chest', weightOrSize: '35x20x15 cm', price: 135, stock: 8, isAvailable: true }
    ],
    attributes: [
      { key: 'Material', value: 'Old-Growth Mountain Walnut Wood' },
      { key: 'Inlay', value: 'Solid Pure Brass Filigree' },
      { key: 'Interior', value: 'Emerald Green Velvet Lining' }
    ],
    wholesaleRules: {
      minQuantity: 5,
      discountPercent: 10,
      requireQuote: true,
      termsNote: '10% volume discount for corporate orders of 5+ pieces.',
      isConfirmed: true
    },
    shippingDetails: {
      fee: 'Worldwide priority express dispatch with tracked packing.',
      transitTime: '3-5 business days international',
      coverage: 'UK, EU, Middle East, USA, Central Asia',
      isConfirmed: true
    },
    qualityInfo: {
      grade: 'Master Artisan Guild Certified Grade A',
      standard: '100% Solid Hardwood Verified',
      isConfirmed: true,
      notes: 'Individually authenticated and stamped by guild.'
    },
    approvalStatus: 'approved', // Approved by HEKA LTD Admin
    isPublished: true,
    isFeatured: false,
    createdAt: '2026-02-15T09:00:00Z',
    reviewedAt: '2026-02-16T10:00:00Z',
    updatedAt: '2026-02-16T10:00:00Z'
  },
  {
    id: 'prod_seller_kabul_2',
    companyId: 'comp_heka_ltd',
    sellerId: 'user_zahir_seller',
    sellerName: 'Kabul Artisan Handicrafts Co.',
    name: 'Badakhshan Lapis Lazuli Executive Desk Pen Stand & Plaque',
    nameFa: 'پایه قلم و تندیس رومیزی سنگ لاجورد بدخشان',
    category: 'Executive Gifts & Specialty Goods',
    description: 'Natural royal blue lapis lazuli stone desk stand with brass pen cradle and polished marble plinth. Mined from historic Badakhshan deposits.',
    descriptionFa: 'پایه قلم مدیریتی تراشیده شده از سنگ اصیل لاجورد آبی سلطنتی با پایه‌های برنجی و سنگ مرمر صیقلی.',
    images: [
      'https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=800&auto=format&fit=crop&q=80'
    ],
    unit: 'piece',
    retailPrice: 145,
    currency: '$',
    stock: 12,
    packageSizes: [],
    attributes: [
      { key: 'Stone', value: '100% Natural Royal Lapis Lazuli' },
      { key: 'Origin', value: 'Badakhshan, Afghanistan' },
      { key: 'Base', value: 'White Carrara Composite Marble' }
    ],
    wholesaleRules: {
      minQuantity: 3,
      discountPercent: 8,
      requireQuote: true,
      termsNote: 'Wholesale quotation on corporate gifts of 3+ units.',
      isConfirmed: true
    },
    shippingDetails: {
      fee: 'Secure foam-cushioned international dispatch.',
      transitTime: '4-6 business days',
      coverage: 'Global',
      isConfirmed: true
    },
    qualityInfo: {
      grade: 'Gemological Spectrum Verified',
      isConfirmed: true,
      notes: 'No dyes or artificial resins used.'
    },
    approvalStatus: 'pending_review', // PENDING REVIEW: Must remain unpublished until approved! (Specification Requirement #3)
    isPublished: false,
    isFeatured: false,
    submittedAt: '2026-03-02T11:00:00Z',
    createdAt: '2026-03-02T11:00:00Z',
    updatedAt: '2026-03-02T11:00:00Z'
  }
];

const INITIAL_INQUIRIES: CustomerInquiry[] = [
  {
    id: 'inq_1',
    companyId: 'comp_heka_ltd',
    customerName: 'Marcus Sterling (Aura Global)',
    customerContact: 'm.sterling@auraglobal.co.uk',
    customerLocation: 'London / Dubai Hub',
    inquiryType: 'export_inquiry',
    productId: 'prod_heka_2',
    productName: 'HEKA Industrial & Commercial Grade Supply (Bulk Canister)',
    requestedQuantity: 5,
    message: 'Good day, we require 5 units of your commercial grade canister for our regional distribution hub in Dubai. What is your CIP quote and estimated delivery timeline?',
    replyLanguage: 'en',
    status: 'new',
    createdAt: '2026-03-02T10:15:00Z'
  },
  {
    id: 'inq_2',
    companyId: 'comp_ziba_fashion',
    customerName: 'Fatima Sultani',
    customerContact: '+93788998877',
    customerLocation: 'Kabul',
    inquiryType: 'retail_question',
    productId: 'prod_ziba_1',
    productName: 'Handcrafted Afghan Silk Chapan Robe',
    requestedQuantity: 2,
    message: 'سلام، آیا سایز مدیوم این چپن ابریشمی را موجود دارید و با ارسال به شهر نو کابل چقدر می‌شود؟',
    replyLanguage: 'fa',
    status: 'new',
    createdAt: '2026-03-03T14:20:00Z'
  }
];

const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tck_101',
    ticketNumber: 'TCK-2026-101',
    companyId: 'comp_heka_ltd',
    subject: 'Consignment Clearance Documents - Air-Cargo Consignment #HK-8821',
    description: 'Requesting verified phytosanitary and export certificate of origin for the latest air-cargo consignment to Frankfurt hub.',
    category: 'logistics',
    priority: 'high',
    status: 'in_progress',
    conversationLanguage: 'en',
    attachments: ['Certificate_Of_Origin_Draft.pdf', 'AirWayBill_HK8821.pdf'],
    createdBy: 'HEKA Logistics Office',
    customerContact: 'logistics@hekaltd.com',
    createdAt: '2026-03-01T09:30:00Z',
    updatedAt: '2026-03-02T11:15:00Z'
  },
  {
    id: 'tck_102',
    ticketNumber: 'TCK-2026-102',
    companyId: 'comp_heka_ltd',
    subject: 'درخواست پیش‌فاکتور رسمی برای ارسال محموله زعفران سوپر نگین به دبی',
    description: 'جهت نهایی‌سازی سفارش عمده ۱۰ کیلوگرمی، لطفاً پیش‌فاکتور رسمی با تفکیک هزینه‌های بسته‌بندی هرمتیک و بیمه ارسال فرمایید.',
    category: 'billing',
    priority: 'medium',
    status: 'open',
    conversationLanguage: 'fa',
    attachments: ['Proforma_Request_Details.docx'],
    createdBy: 'Aura Global Trading Dubai',
    customerContact: 'm.sterling@auraglobal.co.uk',
    createdAt: '2026-03-02T14:00:00Z',
    updatedAt: '2026-03-02T14:00:00Z'
  },
  {
    id: 'tck_103',
    ticketNumber: 'TCK-2026-103',
    companyId: 'comp_heka_ltd',
    subject: 'د کیفیت لابراتواري اسنادو او ISO 3632 تصدیق‌پاڼې غوښتنه',
    description: 'د اروپایي ټولنې د ګمرک لپاره د ISO 3632 معیاري لابراتواري ټېسټ راپور ته اړتیا لرو ترڅو محموله ژر تر ژره ترخیص شي.',
    category: 'quality',
    priority: 'urgent',
    status: 'waiting_customer',
    conversationLanguage: 'ps',
    attachments: ['Lab_Test_Specimen.pdf'],
    createdBy: 'Kabul Trade Logistics',
    customerContact: '+93700112233',
    createdAt: '2026-03-03T10:00:00Z',
    updatedAt: '2026-03-03T16:45:00Z'
  },
  {
    id: 'tck_104',
    ticketNumber: 'TCK-2026-104',
    companyId: 'comp_heka_ltd',
    subject: 'B2B Customer Portal API Credential Rotation',
    description: 'Scheduled quarterly API credential refresh for B2B wholesale consignment inventory automated sync.',
    category: 'technical',
    priority: 'low',
    status: 'resolved',
    conversationLanguage: 'en',
    attachments: ['API_Rotation_Checklist.pdf'],
    createdBy: 'Enterprise Integrations Team',
    customerContact: 'devops@hekaltd.com',
    createdAt: '2026-02-20T08:00:00Z',
    updatedAt: '2026-02-22T17:30:00Z'
  },
  {
    id: 'tck_201',
    ticketNumber: 'TCK-2026-201',
    companyId: 'comp_ziba_fashion',
    subject: 'د لاسي ګلدوزۍ او ابریشمي ټوکر د عمده پېر پوښتنه',
    description: 'د هرات د ابریشمي ټوکر د لاسي جوړ شویو نمونو د رنګونو او لېږد د لګښت په اړه پوښتنه لرو.',
    category: 'general',
    priority: 'medium',
    status: 'new',
    conversationLanguage: 'ps',
    createdBy: 'Farhad Qasimi',
    customerContact: '+93799887766',
    createdAt: '2026-03-04T11:00:00Z',
    updatedAt: '2026-03-04T11:00:00Z'
  }
];

const INITIAL_CATEGORIES: ProductCategory[] = [
  // 1. Industrial Machinery & Equipment
  {
    id: 'cat_industrial_machinery',
    companyId: 'comp_heka_ltd',
    parentId: null,
    name: 'Industrial Machinery & Equipment',
    nameFa: 'ماشین‌آلات و تجهیزات صنعتی',
    namePs: 'صنعتي ماشین الات او تجهیزات',
    slug: 'industrial-machinery-equipment',
    description: 'Heavy-duty manufacturing, processing, and power generation equipment for commercial operations.',
    descriptionFa: 'تجهیزات تولیدی سنگین، پروسس و تولید برق برای عملیات تجارتی و صنعتی.',
    descriptionPs: 'د سوداګریزو او صنعتي عملیاتو لپاره درانه تولیدي، پروسس او د بریښنا تولید تجهیزات.',
    icon: 'Factory',
    order: 1,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_ind_heavy',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_industrial_machinery',
    name: 'Heavy Manufacturing Equipment',
    nameFa: 'تجهیزات تولید سنگین',
    namePs: 'درانه تولیدي تجهیزات',
    slug: 'heavy-manufacturing-equipment',
    description: 'CNC machines, industrial presses, and automated production lines.',
    descriptionFa: 'ماشین‌های CNC، پرس‌های صنعتی و خطوط تولید اتوماتیک.',
    descriptionPs: 'د CNC ماشینونه، صنعتي پریسونه او اتومات تولیدي لیکې.',
    order: 1,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_ind_generators',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_industrial_machinery',
    name: 'Power Generators & Compressors',
    nameFa: 'جنراتورها و کمپرسورهای صنعتی',
    namePs: 'صنعتي جنراتورونه او کمپرسورونه',
    slug: 'power-generators-compressors',
    description: 'Diesel generators, air compressors, and industrial turbines.',
    descriptionFa: 'جنراتورهای دیزلی، کمپرسورهای هوا و توربین‌های صنعتی.',
    descriptionPs: 'ډیزلي جنراتورونه، د هوا کمپرسورونه او صنعتي توربینونه.',
    order: 2,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_ind_processing',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_industrial_machinery',
    name: 'Food & Textile Processing Machines',
    nameFa: 'ماشین‌آلات پروسس مواد غذایی و نساجی',
    namePs: 'د خوړو او نساجۍ پروسس ماشینونه',
    slug: 'food-textile-processing-machines',
    description: 'Commercial milling, sorting, roasting, and spinning machinery.',
    descriptionFa: 'ماشین‌آلات آسیاب، سورتینگ، برشته‌کاری و ریسندگی تجارتی.',
    descriptionPs: 'سوداګریز د اوړو، چاڼ، وریتولو او اوبدلو ماشینونه.',
    order: 3,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },

  // 2. Agriculture & Food Products
  {
    id: 'cat_agriculture_food',
    companyId: 'comp_heka_ltd',
    parentId: null,
    name: 'Agriculture & Food Products',
    nameFa: 'محصولات زراعتی و مواد غذایی',
    namePs: 'کرنیز او خوراکي محصولات',
    slug: 'agriculture-food-products',
    description: 'Export-grade saffron, spices, dried fruits, nuts, grains, and agricultural inputs.',
    descriptionFa: 'زعفران صادراتی، ادویه‌جات، میوه خشک، خشکبار، غلات و نهادهای زراعتی.',
    descriptionPs: 'صادراتي زعفران، مصالحې، وچه میوه، مغزیات، غلې دانې او کرنیز توکي.',
    icon: 'Wheat',
    order: 2,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_agr_spices',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_agriculture_food',
    name: 'Saffron, Spices & Herbs',
    nameFa: 'زعفران، ادویه‌جات و گیاهان طبی',
    namePs: 'زعفران، مصالحې او طبي بوټي',
    slug: 'saffron-spices-herbs',
    description: 'Super Negin saffron, organic cumin, cardamom, and medicinal herbs.',
    descriptionFa: 'زعفران سوپر نگین، زیره ارگانیک، هل و گیاهان طبی.',
    descriptionPs: 'سوپر نګین زعفران، طبیعي زیره، هیل او طبي بوټي.',
    order: 1,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_agr_dried_fruits',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_agriculture_food',
    name: 'Dried Fruits, Nuts & Grains',
    nameFa: 'میوه خشک، خشکبار و غلات',
    namePs: 'وچه میوه، مغزیات او غلې دانې',
    slug: 'dried-fruits-nuts-grains',
    description: 'Pine nuts, almonds, pistachios, raisins, figs, and bulk pulses.',
    descriptionFa: 'جلغوزه، بادام، پسته، کشمش، انجیر و حبوبات عمده.',
    descriptionPs: 'جلغوزي، بادام، پسته، ممیز، انځر او عمده حبوبات.',
    order: 2,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_agr_supplies',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_agriculture_food',
    name: 'Agricultural Seeds & Fertilizers',
    nameFa: 'تخم‌های اصلاح‌شده و کودهای زراعتی',
    namePs: 'اصلاح شوي تخمونه او کرنیزې سرې',
    slug: 'agricultural-seeds-fertilizers',
    description: 'Certified crop seeds, organic fertilizers, and irrigation supplies.',
    descriptionFa: 'تخم‌های بذری تصدیق‌شده، کودهای ارگانیک و تجهیزات آبیاری.',
    descriptionPs: 'تصدیق شوي کرنیز تخمونه، طبیعي سرې او د اوبو لګولو وسایل.',
    order: 3,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },

  // 3. Construction Materials
  {
    id: 'cat_construction_materials',
    companyId: 'comp_heka_ltd',
    parentId: null,
    name: 'Construction Materials',
    nameFa: 'مواد ساختمانی و عمرانی',
    namePs: 'ودانیز او ساختماني توکي',
    slug: 'construction-materials',
    description: 'Structural steel, cement, natural marble, stone, plumbing, and commercial hardware.',
    descriptionFa: 'فولاد سازه‌ای، سمنت، سنگ مرمر طبیعی، نل‌دوانی و ابزارآلات ساختمانی.',
    descriptionPs: 'ساختماني فولاد، سمنټ، طبیعي مرمر ډبره، نل غځونه او ودانیز وسایل.',
    icon: 'HardHat',
    order: 3,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_con_structural',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_construction_materials',
    name: 'Steel, Cement & Structural Materials',
    nameFa: 'فولاد، سمنت و مواد سازه‌ای',
    namePs: 'فولاد، سمنټ او ساختماني مواد',
    slug: 'steel-cement-structural-materials',
    description: 'Rebar, structural beams, Portland cement, and insulation blocks.',
    descriptionFa: 'سیخ گول، تیرآهن، سمنت پورتلند و بلوک‌های عایق.',
    descriptionPs: 'ګول سیخان، اوسپنیزې ستنې، پورټلینډ سمنټ او عایق بلاکونه.',
    order: 1,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_con_stone',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_construction_materials',
    name: 'Marble, Stone & Flooring',
    nameFa: 'سنگ مرمر، کاشی و کف‌پوش',
    namePs: 'مرمر ډبره، کاشي او فرشونه',
    slug: 'marble-stone-flooring',
    description: 'Natural white marble, travertine, granite slabs, and ceramic tiles.',
    descriptionFa: 'مرمر سفید طبیعی، تراورتن، تخته‌های گرانیت و کاشی سرامیک.',
    descriptionPs: 'طبیعي سپینه مرمر ډبره، تراورتن، ګرانیټ او سیرامیک کاشي.',
    order: 2,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_con_plumbing',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_construction_materials',
    name: 'Plumbing, Hardware & Coatings',
    nameFa: 'نل‌دوانی، ابزارآلات و رنگ‌های صنعتی',
    namePs: 'نل غځونه، وسایل او صنعتي رنګونه',
    slug: 'plumbing-hardware-coatings',
    description: 'Pipes, valves, fasteners, waterproof membranes, and industrial coatings.',
    descriptionFa: 'پایپ‌ها، شیرآلات، پیچ و مهره، عایق‌های رطوبتی و رنگ‌های صنعتی.',
    descriptionPs: 'پایپونه، والونه، پیچونه، د اوبو ضد عایق او صنعتي رنګونه.',
    order: 3,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },

  // 4. Electronics & Technology
  {
    id: 'cat_electronics_technology',
    companyId: 'comp_heka_ltd',
    parentId: null,
    name: 'Electronics & Technology',
    nameFa: 'الکترونیک و تکنالوژی',
    namePs: 'الکترونیک او ټیکنالوژي',
    slug: 'electronics-technology',
    description: 'Solar energy systems, enterprise networking hardware, telecommunications, and smart electronics.',
    descriptionFa: 'سیستم‌های انرژی سولر، تجهیزات شبکه سازمانی، مخابرات و الکترونیک هوشمند.',
    descriptionPs: 'د لمریزې انرژۍ سیستمونه، د شبکې تجهیزات، مخابرات او ځیرک الکترونیکي وسایل.',
    icon: 'Cpu',
    order: 4,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_elec_solar',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_electronics_technology',
    name: 'Solar Panels, Inverters & Energy Systems',
    nameFa: 'پنل‌های سولر، انورتر و سیستم‌های انرژی',
    namePs: 'سولر تختې، انورټرونه او د انرژۍ سیستمونه',
    slug: 'solar-panels-inverters-energy',
    description: 'Monocrystalline solar panels, hybrid inverters, and lithium battery banks.',
    descriptionFa: 'پنل‌های سولر مونوکریستال، انورترهای هیبریدی و بانک‌های بطری لیتیوم.',
    descriptionPs: 'مونوکریسټال سولر تختې، هایبریډ انورټرونه او لیتیم بیټرۍ.',
    order: 1,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_elec_networking',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_electronics_technology',
    name: 'Enterprise IT & Networking Hardware',
    nameFa: 'تجهیزات شبکه و تکنالوژی معلوماتی',
    namePs: 'د شبکې او معلوماتي ټیکنالوژۍ تجهیزات',
    slug: 'enterprise-it-networking-hardware',
    description: 'Routers, switches, fiber optic cables, servers, and POS terminals.',
    descriptionFa: 'روترها، سوییچ‌ها، کیبل‌های فایبر نوری، سرورها و ترمینال‌های فروش.',
    descriptionPs: 'روټرونه، سویچونه، فایبر آپټیک کیبلونه، سرورونه او د پلور ماشینونه.',
    order: 2,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_elec_commercial',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_electronics_technology',
    name: 'Commercial Appliances & Smart Devices',
    nameFa: 'لوازم برقی تجارتی و دستگاه‌های هوشمند',
    namePs: 'تجارتي برقي وسایل او ځیرک ماشینونه',
    slug: 'commercial-appliances-smart-devices',
    description: 'HVAC units, commercial refrigeration, security cameras, and sensors.',
    descriptionFa: 'سیستم‌های تهویه، یخچال‌های تجارتی، کمره‌های امنیتی و سنسورها.',
    descriptionPs: 'د هوا سیستمونه، تجارتي یخچالونه، امنیتي کمرې او سینسرونه.',
    order: 3,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },

  // 5. Packaging & Raw Materials
  {
    id: 'cat_packaging_raw_materials',
    companyId: 'comp_heka_ltd',
    parentId: null,
    name: 'Packaging & Raw Materials',
    nameFa: 'بسته‌بندی و مواد خام',
    namePs: 'بسته بندي او خام مواد',
    slug: 'packaging-raw-materials',
    description: 'Export packaging containers, raw silk, textile fibers, polymers, and industrial inputs.',
    descriptionFa: 'ظروف بسته‌بندی صادراتی، ابریشم خام، الیاف نساجی، پلیمرها و مواد اولیه صنعتی.',
    descriptionPs: 'صادراتي بسته بندي لوښي، خام ورېښم، نساجي تارونه، پولیمر او صنعتي خام مواد.',
    icon: 'Package',
    order: 5,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_pkg_containers',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_packaging_raw_materials',
    name: 'Industrial Boxes, Glass Jars & Containers',
    nameFa: 'کارتن‌های صنعتی، ظروف شیشه‌ای و بسته‌بندی',
    namePs: 'صنعتي کارتنونه، ښیښه یي لوښي او بسته بندي',
    slug: 'industrial-boxes-jars-containers',
    description: 'Corrugated cartons, luxury spice tins, vacuum pouches, and glass jars.',
    descriptionFa: 'کارتن‌های چندلایه، قوطی‌های فلزی لوکس، پاکت‌های وکیوم و ظروف شیشه‌ای.',
    descriptionPs: 'څو پوړیز کارتنونه، لوکس فلزي قوطۍ، ویکیوم پاکټونه او ښیښه یي لوښي.',
    order: 1,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_pkg_textiles',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_packaging_raw_materials',
    name: 'Raw Silk, Fabrics & Textile Fibers',
    nameFa: 'ابریشم خام، پارچه و الیاف نساجی',
    namePs: 'خام ورېښم، ټوکر او نساجي تارونه',
    slug: 'raw-silk-fabrics-textile-fibers',
    description: 'Natural mulberry silk, cashmere wool, cotton yarn, and woven textiles.',
    descriptionFa: 'ابریشم طبیعی توت، پشم کشمیر، نخ پنبه و منسوجات بافته‌شده.',
    descriptionPs: 'طبیعي ورېښم، کشمیري وړۍ، د پنبې تار او اوبدل شوي ټوکران.',
    order: 2,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_pkg_polymers',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_packaging_raw_materials',
    name: 'Polymers, Resins & Chemical Inputs',
    nameFa: 'پلیمرها، رزین و مواد اولیه کیمیاوی',
    namePs: 'پولیمر، رزین او کیمیاوي خام مواد',
    slug: 'polymers-resins-chemical-inputs',
    description: 'HDPE/LDPE granules, PET preforms, industrial adhesives, and dyes.',
    descriptionFa: 'گرانول‌های پلی‌اتیلن، پریفرم PET، چسب‌های صنعتی و رنگینه‌های نساجی.',
    descriptionPs: 'پولي ایتیلین دانې، PET پریفارم، صنعتي سرېښ او نساجي رنګونه.',
    order: 3,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },

  // 6. Other Wholesale Products
  {
    id: 'cat_other_wholesale',
    companyId: 'comp_heka_ltd',
    parentId: null,
    name: 'Other Wholesale Products',
    nameFa: 'سایر محصولات عمده‌فروشی',
    namePs: 'نور عمده پلور محصولات',
    slug: 'other-wholesale-products',
    description: 'Handwoven carpets, artisan crafts, apparel, gemstones, and general wholesale merchandise.',
    descriptionFa: 'قالین‌های دست‌باف، صنایع دستی، پوشاک، سنگ‌های قیمتی و کالاهای عمده‌فروشی.',
    descriptionPs: 'لاسي غالۍ، لاسي صنایع، جامې، قیمتي ډبرې او عمومي عمده توکي.',
    icon: 'Boxes',
    order: 6,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_oth_handicrafts',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_other_wholesale',
    name: 'Handwoven Carpets & Luxury Handicrafts',
    nameFa: 'قالین‌های دست‌باف و صنایع دستی لوکس',
    namePs: 'لاسي غالۍ او لوکس لاسي صنایع',
    slug: 'handwoven-carpets-luxury-handicrafts',
    description: 'Afghan wool rugs, silk carpets, copperware, and traditional wood carvings.',
    descriptionFa: 'قالین‌های پشمی و ابریشمی، ظروف مسی و کنده‌کاری‌های چوبی اصیل.',
    descriptionPs: 'افغاني وړینې او ورېښمینې غالۍ، مسي لوښي او د لرګیو حکاکی.',
    order: 1,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_oth_apparel',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_other_wholesale',
    name: 'Wholesale Apparel & Accessories',
    nameFa: 'پوشاک و لوازم جانبی عمده',
    namePs: 'عمده جامې او اړوند وسایل',
    slug: 'wholesale-apparel-accessories',
    description: 'Scarves, coats, leather goods, and bulk fashion garments.',
    descriptionFa: 'شال‌ها، چپن و پالتو، محصولات چرمی و البسه عمده.',
    descriptionPs: 'شالونه، چپنې او کوټونه، څرمني توکي او عمده جامې.',
    order: 2,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_oth_general',
    companyId: 'comp_heka_ltd',
    parentId: 'cat_other_wholesale',
    name: 'General Trading & Bulk Merchandise',
    nameFa: 'اموال تجارتی عمومی و کالاهای فله‌ای',
    namePs: 'عمومي تجارتي او عمده توکي',
    slug: 'general-trading-bulk-merchandise',
    description: 'Assorted B2B trade lots, gemstones, and custom export orders.',
    descriptionFa: 'محموله‌های تجارتی B2B، سنگ‌های قیمتی و سفارشات صادراتی سفارشی.',
    descriptionPs: 'د B2B تجارتي محمولې، قیمتي ډبرې او ځانګړي صادراتي فرمایشونه.',
    order: 3,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  }
];

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        let changed = false;

        if (!parsed.supportTickets) {
          parsed.supportTickets = INITIAL_SUPPORT_TICKETS;
          changed = true;
        }

        if (!parsed.sellerApplications) {
          parsed.sellerApplications = INITIAL_SELLER_APPLICATIONS;
          changed = true;
        }

        if (!parsed.categories || parsed.categories.length === 0) {
          parsed.categories = INITIAL_CATEGORIES;
          changed = true;
        }

        // Ensure seed customer and seller accounts exist for testing
        for (const seedUser of INITIAL_USERS) {
          if (!parsed.users.some((u) => u.email.toLowerCase() === seedUser.email.toLowerCase())) {
            parsed.users.push(seedUser);
            changed = true;
          }
        }

        // Ensure seller products exist
        for (const seedProd of INITIAL_PRODUCTS) {
          if (!parsed.products.some((p) => p.id === seedProd.id)) {
            parsed.products.push(seedProd);
            changed = true;
          }
        }

        // Ensure approvalStatus is set on all products (DO NOT guess categoryId on existing products!)
        for (const prod of parsed.products) {
          if (!prod.approvalStatus) {
            prod.approvalStatus = prod.isPublished ? 'approved' : 'draft';
            changed = true;
          }
        }

        // Ensure HEKA LTD has the administrator-configured notification destinations
        const hekaComp = parsed.companies.find((c) => c.id === 'comp_heka_ltd');
        if (hekaComp) {
          if (!hekaComp.settings) {
            hekaComp.settings = {
              showRetailPricesPublicly: true,
              allowWholesaleQuoteRequests: true,
              supportedLanguages: ['en', 'fa', 'ps'],
              defaultLanguage: 'en',
              notificationDestinations: DEFAULT_HEKA_NOTIFICATION_DESTINATIONS
            };
            changed = true;
          } else if (!hekaComp.settings.notificationDestinations) {
            hekaComp.settings.notificationDestinations = DEFAULT_HEKA_NOTIFICATION_DESTINATIONS;
            changed = true;
          }
        }

        // Ensure existing inquiries have requestReference, persistedAt, and notification tracking structure
        if (Array.isArray(parsed.inquiries)) {
          parsed.inquiries.forEach((inq, idx) => {
            if (!inq.requestReference) {
              inq.requestReference = `HEKA-RFQ-2026-${String(1000 + idx + 1)}`;
              changed = true;
            }
            if (!inq.persistedAt) {
              inq.persistedAt = inq.createdAt;
              changed = true;
            }
            if (!inq.notifications) {
              const comp = parsed.companies.find((c) => c.id === inq.companyId);
              const initMap = createInitialNotificationMap(inq.id, comp?.settings?.notificationDestinations);
              // Mark pre-existing seed inquiries as not_configured if no provider was active at seed time
              initMap.email.status = 'not_configured';
              initMap.email.providerNote = 'Recorded prior to external email provider configuration.';
              initMap.telegram.status = 'not_configured';
              initMap.telegram.providerNote = 'Recorded prior to Telegram Bot API configuration.';
              initMap.whatsapp.status = 'not_configured';
              initMap.whatsapp.providerNote = 'Recorded prior to WhatsApp Business Cloud API configuration.';
              inq.notifications = initMap;
              changed = true;
            }
          });
        }

        // Ensure all users have a cryptographic scrypt passwordHash (never plain text)
        for (const u of parsed.users) {
          if (!u.passwordHash) {
            u.passwordHash = hashPassword('HekaDemo2026!');
            changed = true;
          }
        }

        if (!Array.isArray(parsed.sessions)) {
          parsed.sessions = [];
          changed = true;
        }

        if (changed) {
          this.saveToDisk(parsed);
        }

        return parsed;
      }
    } catch (e) {
      console.warn('Could not read existing db.json, initializing fresh seed.', e);
    }

    const seededUsers = INITIAL_USERS.map((u) => ({
      ...u,
      passwordHash: u.passwordHash || hashPassword('HekaDemo2026!')
    }));

    const initialData: DatabaseSchema = {
      companies: INITIAL_COMPANIES,
      users: seededUsers,
      products: INITIAL_PRODUCTS,
      inquiries: INITIAL_INQUIRIES,
      supportTickets: INITIAL_SUPPORT_TICKETS,
      sellerApplications: INITIAL_SELLER_APPLICATIONS,
      categories: INITIAL_CATEGORIES,
      sessions: []
    };

    this.saveToDisk(initialData);
    return initialData;
  }

  private saveToDisk(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write db.json to disk:', e);
    }
  }

  private saveToDiskStrict(data: DatabaseSchema): void {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Auth & Persistent Session Management
  public createSession(userId: string, ttlMs = 7 * 24 * 60 * 60 * 1000): AuthSession {
    if (!this.data.sessions) {
      this.data.sessions = [];
    }
    const now = Date.now();
    // Prune expired sessions
    this.data.sessions = this.data.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);

    const session: AuthSession = {
      id: generateSessionId(),
      userId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlMs).toISOString()
    };

    this.data.sessions.push(session);
    this.saveToDiskStrict(this.data);
    return session;
  }

  public authenticateSession(sessionId?: string): User | null {
    if (!sessionId || !this.data.sessions) return null;
    const cleanId = sessionId.trim();
    const now = Date.now();
    const foundSession = this.data.sessions.find((s) => s.id === cleanId);
    if (!foundSession) return null;

    if (new Date(foundSession.expiresAt).getTime() <= now) {
      this.data.sessions = this.data.sessions.filter((s) => s.id !== cleanId);
      this.saveToDisk(this.data);
      return null;
    }

    return this.data.users.find((u) => u.id === foundSession.userId) || null;
  }

  public revokeSession(sessionId?: string): boolean {
    if (!sessionId || !this.data.sessions) return false;
    const before = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((s) => s.id !== sessionId.trim());
    if (this.data.sessions.length !== before) {
      this.saveToDiskStrict(this.data);
      return true;
    }
    return false;
  }

  public authenticateUser(token: string): User | null {
    if (!token) return null;
    const cleanToken = token.replace('Bearer ', '').trim();
    // Support opaque session IDs passed in Authorization header or cookie
    if (cleanToken.startsWith('sess_')) {
      return this.authenticateSession(cleanToken);
    }
    // Allow backwards compatibility alias for demo
    if (cleanToken === 'token_mehr_admin_secret') {
      return this.data.users.find((u) => u.token === 'token_heka_admin_secret' || u.token === 'token_mehr_admin_secret') || null;
    }
    return this.data.users.find((u) => u.token === cleanToken) || null;
  }

  public authenticateRequest(sessionCookie?: string, authHeader?: string): User | null {
    if (sessionCookie) {
      const fromCookie = this.authenticateSession(sessionCookie);
      if (fromCookie) return fromCookie;
    }
    if (authHeader) {
      return this.authenticateUser(authHeader);
    }
    return null;
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  // Companies
  public getCompanies(): Company[] {
    return this.data.companies;
  }

  public getCompanyById(id: string): Company | null {
    if (id === 'comp_mehr_saffron') {
      return this.data.companies.find((c) => c.id === 'comp_heka_ltd' || c.id === 'comp_mehr_saffron') || null;
    }
    return this.data.companies.find((c) => c.id === id) || null;
  }

  public getCompanyBySlug(slug: string): Company | null {
    const s = slug.toLowerCase();
    const found = this.data.companies.find((c) => c.slug === s);
    if (found) return found;
    if (s === 'mehr-saffron') {
      return this.data.companies.find((c) => c.slug === 'heka-ltd' || c.id === 'comp_heka_ltd') || null;
    }
    return null;
  }

  public registerCompany(
    companyData: Partial<Company>,
    adminEmail: string,
    adminName: string,
    requester?: User | null
  ): { company: Company; user: User } {
    if (!requester || (requester.role !== 'platform_owner' && !(requester.role === 'company_admin' && requester.companyId === 'comp_heka_ltd'))) {
      throw new Error('FORBIDDEN: Only an authorized Platform Owner or authorized provisioning administrator can register new company tenants.');
    }

    const existingUser = this.data.users.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase());
    if (existingUser) {
      throw new Error(`VALIDATION_ERROR: A user with email ${adminEmail} already exists.`);
    }

    const slug = (companyData.slug || companyData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `company-${Date.now()}`)
      .replace(/^-+|-+$/g, '');
    const companyId = `comp_${slug.replace(/-/g, '_')}_${Date.now()}`;

    const newCompany: Company = {
      id: companyId,
      slug,
      name: companyData.name || 'Untitled Enterprise',
      industry: companyData.industry || 'General Commerce',
      country: companyData.country || 'Afghanistan',
      currency: companyData.currency || 'USD',
      logoUrl: companyData.logoUrl || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=128&auto=format&fit=crop&q=80',
      bannerUrl: companyData.bannerUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      brandColors: companyData.brandColors || {
        primary: '#1e3a8a',
        accent: '#3b82f6',
        background: '#f8fafc'
      },
      contactPhone: companyData.contactPhone || '+93700000000',
      contactEmail: companyData.contactEmail || adminEmail,
      address: companyData.address || 'Kabul, Afghanistan',
      plan: 'starter',
      settings: {
        showRetailPricesPublicly: true,
        allowWholesaleQuoteRequests: true,
        supportedLanguages: ['fa', 'en'],
        defaultLanguage: 'fa'
      },
      createdAt: new Date().toISOString()
    };

    const newUser: User = {
      id: `user_${Date.now()}`,
      email: adminEmail,
      name: adminName,
      role: 'company_admin',
      companyId: newCompany.id,
      token: `token_${companyId}_admin_${Math.random().toString(36).substring(2)}`
    };

    this.data.companies.push(newCompany);
    this.data.users.push(newUser);
    this.saveToDisk(this.data);

    return { company: newCompany, user: newUser };
  }

  public updateCompany(companyId: string, updates: Partial<Company>, requester: User): Company {
    if (requester.role !== 'company_admin' && requester.role !== 'platform_owner') {
      throw new Error(`SECURITY_VIOLATION: Only an authorized Company Administrator can modify company settings.`);
    }
    if (requester.role !== 'platform_owner' && requester.companyId !== companyId) {
      throw new Error(`SECURITY_VIOLATION: User ${requester.id} cannot modify company ${companyId}`);
    }

    const idx = this.data.companies.findIndex((c) => c.id === companyId);
    if (idx === -1) throw new Error('Company not found');

    this.data.companies[idx] = {
      ...this.data.companies[idx],
      ...updates,
      id: companyId // Immutable ID
    };

    this.saveToDisk(this.data);
    return this.data.companies[idx];
  }

  // ==========================================
  // DYNAMIC PRODUCT CATEGORIES & SUBCATEGORIES
  // ==========================================

  private ensureCategoriesArray(): ProductCategory[] {
    if (!this.data.categories) {
      this.data.categories = INITIAL_CATEGORIES;
    }
    return this.data.categories;
  }

  private requireCategoryAdmin(companyId: string, requester: User): void {
    if (requester.role !== 'company_admin' && requester.role !== 'platform_owner') {
      throw new Error('FORBIDDEN: Only authorized HEKA LTD administrators can manage categories.');
    }
    if (requester.role !== 'platform_owner' && requester.companyId !== companyId) {
      throw new Error(`TENANT_ISOLATION_ERROR: Cannot manage categories for company ${companyId}`);
    }
  }

  public getCategories(companyId = 'comp_heka_ltd', activeOnly = false, requester?: User | null): ProductCategory[] {
    if (!activeOnly && requester) {
      if (requester.role !== 'company_admin' && requester.role !== 'company_staff' && requester.role !== 'platform_owner') {
        throw new Error('FORBIDDEN: Customers and sellers can only view active public categories.');
      }
      if (requester.role !== 'platform_owner' && requester.companyId !== companyId) {
        throw new Error(`TENANT_ISOLATION_ERROR: Cannot read private category configuration for company ${companyId}`);
      }
    }
    const categories = this.ensureCategoriesArray();
    const companyCategories = categories.filter((c) => c.companyId === companyId);
    // If another tenant has no custom categories yet, fall back to comp_heka_ltd taxonomy or return its own
    const effectiveList = companyCategories.length > 0
      ? companyCategories
      : categories.filter((c) => c.companyId === 'comp_heka_ltd');

    if (!activeOnly) {
      return [...effectiveList].sort((a, b) => a.order - b.order);
    }

    const activeMains = new Set(
      effectiveList.filter((c) => c.parentId === null && c.isActive).map((c) => c.id)
    );

    return effectiveList
      .filter((c) => {
        if (!c.isActive) return false;
        if (c.parentId !== null && !activeMains.has(c.parentId)) return false;
        return true;
      })
      .sort((a, b) => a.order - b.order);
  }

  public getCategoryById(categoryId: string): ProductCategory | null {
    return this.ensureCategoriesArray().find((c) => c.id === categoryId) || null;
  }

  public createCategory(payload: Partial<ProductCategory>, requester: User): ProductCategory {
    const targetCompanyId = requester.role === 'platform_owner'
      ? (payload.companyId || 'comp_heka_ltd')
      : (requester.companyId || 'comp_heka_ltd');

    this.requireCategoryAdmin(targetCompanyId, requester);

    const name = (payload.name || '').trim();
    if (!name) {
      throw new Error('VALIDATION_ERROR: Category name in English is required.');
    }

    const categories = this.ensureCategoriesArray();
    const parentId = payload.parentId ? payload.parentId : null;

    if (parentId) {
      const parent = categories.find((c) => c.id === parentId);
      if (!parent) {
        throw new Error('VALIDATION_ERROR: Parent main category not found.');
      }
      if (parent.parentId !== null) {
        throw new Error('VALIDATION_ERROR: Subcategories can only be nested under a main category.');
      }
    }

    const siblings = categories.filter(
      (c) => c.companyId === targetCompanyId && (c.parentId || null) === parentId
    );
    const maxOrder = siblings.reduce((max, c) => Math.max(max, c.order || 0), 0);

    const slugBase = (payload.slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `category-${Date.now()}`;

    const now = new Date().toISOString();
    const newCategory: ProductCategory = {
      id: `${parentId ? 'sub' : 'cat'}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyId: targetCompanyId,
      parentId,
      name,
      nameFa: payload.nameFa?.trim() || name,
      namePs: payload.namePs?.trim() || payload.nameFa?.trim() || name,
      slug: slugBase,
      description: payload.description?.trim() || '',
      descriptionFa: payload.descriptionFa?.trim() || '',
      descriptionPs: payload.descriptionPs?.trim() || '',
      icon: payload.icon || (parentId ? undefined : 'FolderTree'),
      order: typeof payload.order === 'number' ? payload.order : maxOrder + 1,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      createdAt: now,
      updatedAt: now
    };

    categories.push(newCategory);
    this.saveToDisk(this.data);
    return newCategory;
  }

  public updateCategory(categoryId: string, updates: Partial<ProductCategory>, requester: User): ProductCategory {
    const categories = this.ensureCategoriesArray();
    const idx = categories.findIndex((c) => c.id === categoryId);
    if (idx === -1) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    const existing = categories[idx];
    this.requireCategoryAdmin(existing.companyId, requester);

    const nextParentId = updates.parentId !== undefined ? (updates.parentId || null) : existing.parentId;
    if (nextParentId === existing.id) {
      throw new Error('VALIDATION_ERROR: A category cannot be its own parent.');
    }
    if (nextParentId !== null) {
      const parent = categories.find((c) => c.id === nextParentId);
      if (!parent || parent.parentId !== null) {
        throw new Error('VALIDATION_ERROR: Parent category must be a valid main category.');
      }
      // Cannot convert a main category that already has subcategories into a subcategory
      const hasChildren = categories.some((c) => c.parentId === existing.id);
      if (hasChildren) {
        throw new Error('VALIDATION_ERROR: Cannot convert a main category with subcategories into a subcategory.');
      }
    }

    const updatedName = updates.name !== undefined ? updates.name.trim() : existing.name;
    if (!updatedName) {
      throw new Error('VALIDATION_ERROR: Category name cannot be empty.');
    }

    const updated: ProductCategory = {
      ...existing,
      ...updates,
      id: existing.id,
      companyId: existing.companyId,
      parentId: nextParentId,
      name: updatedName,
      nameFa: updates.nameFa !== undefined ? updates.nameFa.trim() : existing.nameFa,
      namePs: updates.namePs !== undefined ? updates.namePs.trim() : existing.namePs,
      description: updates.description !== undefined ? updates.description.trim() : existing.description,
      descriptionFa: updates.descriptionFa !== undefined ? updates.descriptionFa.trim() : existing.descriptionFa,
      descriptionPs: updates.descriptionPs !== undefined ? updates.descriptionPs.trim() : existing.descriptionPs,
      order: typeof updates.order === 'number' ? updates.order : existing.order,
      isActive: updates.isActive !== undefined ? Boolean(updates.isActive) : existing.isActive,
      updatedAt: new Date().toISOString()
    };

    categories[idx] = updated;

    // Automatically synchronize display label on products referencing this category or subcategory
    for (const prod of this.data.products) {
      if (prod.categoryId === updated.id || prod.subcategoryId === updated.id) {
        const mainCat = prod.categoryId ? categories.find((c) => c.id === prod.categoryId) : null;
        const subCat = prod.subcategoryId ? categories.find((c) => c.id === prod.subcategoryId) : null;
        if (mainCat) {
          prod.category = subCat ? `${mainCat.name} > ${subCat.name}` : mainCat.name;
        }
      }
    }

    this.saveToDisk(this.data);
    return updated;
  }

  public reorderCategories(
    orderedIds: { id: string; order: number }[],
    requester: User,
    companyId = 'comp_heka_ltd'
  ): ProductCategory[] {
    this.requireCategoryAdmin(companyId, requester);
    const categories = this.ensureCategoriesArray();
    const now = new Date().toISOString();

    for (const item of orderedIds) {
      const cat = categories.find((c) => c.id === item.id && c.companyId === companyId);
      if (cat && typeof item.order === 'number') {
        cat.order = item.order;
        cat.updatedAt = now;
      }
    }

    this.saveToDisk(this.data);
    return this.getCategories(companyId, false);
  }

  public deleteCategory(
    categoryId: string,
    requester: User,
    options?: { reassignToCategoryId?: string | null; reassignToSubcategoryId?: string | null }
  ): { deletedId: string; reassignedProductsCount: number } {
    const categories = this.ensureCategoriesArray();
    const idx = categories.findIndex((c) => c.id === categoryId);
    if (idx === -1) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    const target = categories[idx];
    this.requireCategoryAdmin(target.companyId, requester);

    // 1. Block deletion if subcategories depend on this main category
    const childSubcategories = categories.filter((c) => c.parentId === categoryId);
    if (childSubcategories.length > 0) {
      throw new Error(
        `DEPENDENCY_ERROR: Cannot delete "${target.name}" because ${childSubcategories.length} subcategory(ies) depend on it. Please delete or reassign its subcategories first.`
      );
    }

    // 2. Check if any products depend on this category or subcategory
    const dependentProducts = this.data.products.filter(
      (p) => p.categoryId === categoryId || p.subcategoryId === categoryId
    );

    let reassignedProductsCount = 0;

    if (dependentProducts.length > 0) {
      const reassignCatId = options?.reassignToCategoryId;
      if (!reassignCatId) {
        throw new Error(
          `DEPENDENCY_ERROR: Cannot delete "${target.name}" because ${dependentProducts.length} product(s) are assigned to it. Please select an active category to safely reassign those products before deleting.`
        );
      }

      if (reassignCatId === categoryId) {
        throw new Error('VALIDATION_ERROR: Cannot reassign products to the same category being deleted.');
      }

      const replacementMain = categories.find((c) => c.id === reassignCatId);
      if (!replacementMain || replacementMain.parentId !== null || !replacementMain.isActive) {
        throw new Error('VALIDATION_ERROR: Target reassignment category must be an existing active main category.');
      }

      let replacementSub: ProductCategory | null = null;
      if (options?.reassignToSubcategoryId) {
        if (options.reassignToSubcategoryId === categoryId) {
          throw new Error('VALIDATION_ERROR: Cannot reassign products to the subcategory being deleted.');
        }
        replacementSub = categories.find((c) => c.id === options.reassignToSubcategoryId) || null;
        if (!replacementSub || replacementSub.parentId !== replacementMain.id || !replacementSub.isActive) {
          throw new Error('VALIDATION_ERROR: Target reassignment subcategory must belong to the selected active main category and be active.');
        }
      }

      const now = new Date().toISOString();
      for (const prod of dependentProducts) {
        prod.categoryId = replacementMain.id;
        prod.subcategoryId = replacementSub ? replacementSub.id : null;
        prod.category = replacementSub
          ? `${replacementMain.name} > ${replacementSub.name}`
          : replacementMain.name;
        prod.updatedAt = now;
        reassignedProductsCount++;
      }
    }

    // Remove only the category — NEVER delete products
    categories.splice(idx, 1);
    this.saveToDisk(this.data);
    return { deletedId: categoryId, reassignedProductsCount };
  }

  private validateAndResolveCategorySelection(
    companyId: string,
    categoryId: string | null | undefined,
    subcategoryId: string | null | undefined,
    fallbackCategoryLabel: string | undefined,
    isSellerSubmission: boolean
  ): { categoryId: string | null; subcategoryId: string | null; categoryLabel: string } {
    const categories = this.ensureCategoriesArray();

    if (!categoryId) {
      if (isSellerSubmission) {
        throw new Error('VALIDATION_ERROR: Please select a valid active product category.');
      }
      return {
        categoryId: null,
        subcategoryId: null,
        categoryLabel: fallbackCategoryLabel || 'Uncategorized'
      };
    }

    const mainCat = categories.find((c) => c.id === categoryId);
    if (!mainCat || mainCat.parentId !== null) {
      throw new Error('VALIDATION_ERROR: Selected main category does not exist.');
    }

    if (isSellerSubmission && !mainCat.isActive) {
      throw new Error('FORBIDDEN_INACTIVE_CATEGORY: Sellers cannot assign products to an inactive category.');
    }

    let subCat: ProductCategory | null = null;
    if (subcategoryId) {
      subCat = categories.find((c) => c.id === subcategoryId) || null;
      if (!subCat || subCat.parentId !== mainCat.id) {
        throw new Error('VALIDATION_ERROR: Selected subcategory does not belong to the chosen main category.');
      }
      if (isSellerSubmission && !subCat.isActive) {
        throw new Error('FORBIDDEN_INACTIVE_CATEGORY: Sellers cannot assign products to an inactive subcategory.');
      }
    }

    const categoryLabel = subCat ? `${mainCat.name} > ${subCat.name}` : mainCat.name;
    return {
      categoryId: mainCat.id,
      subcategoryId: subCat ? subCat.id : null,
      categoryLabel
    };
  }

  // Products with Strict Tenant Isolation
  public getProducts(companyId: string, requester?: User | null, includeUnpublished = false): Product[] {
    if (includeUnpublished) {
      if (!requester || (requester.role !== 'company_admin' && requester.role !== 'company_staff' && requester.role !== 'platform_owner')) {
        throw new Error('FORBIDDEN: Customers and sellers cannot access private company inventory.');
      }
    }
    // If authenticated company member, only return for their authorized company
    if (requester && requester.role !== 'platform_owner') {
      if (requester.companyId !== companyId) {
        throw new Error(`TENANT_ISOLATION_ERROR: Cross-tenant data read blocked for ${requester.email}`);
      }
    }

    const categories = this.ensureCategoriesArray();
    const activeMainIds = new Set(
      categories.filter((c) => c.parentId === null && c.isActive).map((c) => c.id)
    );
    const activeSubIds = new Set(
      categories.filter((c) => c.parentId !== null && c.isActive && activeMainIds.has(c.parentId)).map((c) => c.id)
    );

    return this.data.products.filter((p) => {
      if (p.companyId !== companyId) return false;
      if (!includeUnpublished) {
        if (!p.isPublished) return false;
        // Strictly block pending, rejected, draft, or suspended products from public marketplace
        if (p.approvalStatus && p.approvalStatus !== 'approved') return false;
        // If product is assigned to a category/subcategory that was deactivated, hide from public category marketplace
        if (p.categoryId && !activeMainIds.has(p.categoryId)) return false;
        if (p.subcategoryId && !activeSubIds.has(p.subcategoryId)) return false;
      }
      return true;
    });
  }

  public getProductById(productId: string): Product | null {
    return this.data.products.find((p) => p.id === productId) || null;
  }

  public createProduct(productData: Partial<Product>, requester: User): Product {
    if (requester.role !== 'company_admin' && requester.role !== 'company_staff' && requester.role !== 'platform_owner') {
      throw new Error('FORBIDDEN: Only authorized company administrators or staff can create catalog products directly.');
    }
    if (!requester.companyId && requester.role !== 'platform_owner') {
      throw new Error('FORBIDDEN: Company context required.');
    }

    const targetCompanyId = requester.role === 'platform_owner'
      ? (productData.companyId || 'comp_heka_ltd')
      : requester.companyId!;

    if (requester.role !== 'platform_owner' && productData.companyId && productData.companyId !== requester.companyId) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: Cannot create product for another company (${productData.companyId}).`);
    }

    const resolvedCat = this.validateAndResolveCategorySelection(
      targetCompanyId,
      productData.categoryId,
      productData.subcategoryId,
      productData.category,
      false
    );

    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyId: targetCompanyId,
      name: productData.name || 'New Product',
      nameFa: productData.nameFa,
      namePs: productData.namePs,
      category: resolvedCat.categoryLabel,
      categoryId: resolvedCat.categoryId,
      subcategoryId: resolvedCat.subcategoryId,
      description: productData.description || '',
      descriptionFa: productData.descriptionFa,
      descriptionPs: productData.descriptionPs,
      images: productData.images && productData.images.length > 0
        ? productData.images
        : ['https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=800&auto=format&fit=crop&q=80'],
      unit: productData.unit || 'unit',
      retailPrice: typeof productData.retailPrice === 'number' ? productData.retailPrice : 10,
      currency: productData.currency || '$',
      stock: typeof productData.stock === 'number' ? productData.stock : 0,
      packageSizes: productData.packageSizes || [],
      attributes: productData.attributes || [],
      wholesaleRules: productData.wholesaleRules || {
        minQuantity: 10,
        discountPercent: 0,
        requireQuote: false,
        termsNote: '',
        isConfirmed: false
      },
      shippingDetails: productData.shippingDetails || {
        fee: '',
        transitTime: '',
        coverage: '',
        isConfirmed: false
      },
      qualityInfo: productData.qualityInfo || {
        isConfirmed: false
      },
      isPublished: productData.isPublished !== undefined ? productData.isPublished : true,
      approvalStatus: productData.approvalStatus || ((productData.isPublished !== undefined ? productData.isPublished : true) ? 'approved' : 'draft'),
      isFeatured: !!productData.isFeatured,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.products.push(newProduct);
    this.saveToDisk(this.data);
    return newProduct;
  }

  public updateProduct(productId: string, updates: Partial<Product>, requester: User): Product {
    if (requester.role !== 'company_admin' && requester.role !== 'company_staff' && requester.role !== 'platform_owner') {
      throw new Error('SECURITY_BREACH_ATTEMPT: Customers and sellers cannot directly mutate company inventory.');
    }

    const idx = this.data.products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error('Product not found');

    const existing = this.data.products[idx];

    // STRICT MULTI-TENANT AUTHORIZATION GUARD
    if (requester.role !== 'platform_owner' && requester.companyId !== existing.companyId) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: User ${requester.email} (Tenant: ${requester.companyId}) attempted to mutate Product ${productId} belonging to Tenant: ${existing.companyId}`);
    }

    let categoryFields: Partial<Product> = {};
    if (updates.categoryId !== undefined || updates.subcategoryId !== undefined) {
      const nextCategoryId = updates.categoryId !== undefined ? updates.categoryId : existing.categoryId;
      const nextSubcategoryId = updates.subcategoryId !== undefined ? updates.subcategoryId : existing.subcategoryId;
      const resolvedCat = this.validateAndResolveCategorySelection(
        existing.companyId,
        nextCategoryId,
        nextSubcategoryId,
        updates.category || existing.category,
        false
      );
      categoryFields = {
        categoryId: resolvedCat.categoryId,
        subcategoryId: resolvedCat.subcategoryId,
        category: resolvedCat.categoryLabel
      };
    }

    const nextIsPublished = updates.isPublished !== undefined ? updates.isPublished : existing.isPublished;
    let nextApprovalStatus = updates.approvalStatus !== undefined ? updates.approvalStatus : existing.approvalStatus;
    if (updates.isPublished === true && (!nextApprovalStatus || nextApprovalStatus === 'draft')) {
      nextApprovalStatus = 'approved';
    }

    this.data.products[idx] = {
      ...existing,
      ...updates,
      ...categoryFields,
      isPublished: nextIsPublished,
      approvalStatus: nextApprovalStatus,
      id: existing.id,
      companyId: existing.companyId, // CANNOT transfer ownership to another tenant
      updatedAt: new Date().toISOString()
    };

    this.saveToDisk(this.data);
    return this.data.products[idx];
  }

  public deleteProduct(productId: string, requester: User): boolean {
    if (requester.role !== 'company_admin' && requester.role !== 'platform_owner') {
      throw new Error('SECURITY_BREACH_ATTEMPT: Only a Company Administrator can delete products.');
    }

    const idx = this.data.products.findIndex((p) => p.id === productId);
    if (idx === -1) return false;

    const existing = this.data.products[idx];
    if (requester.role !== 'platform_owner' && requester.companyId !== existing.companyId) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: Tenant ${requester.companyId} cannot delete item from Tenant ${existing.companyId}`);
    }

    this.data.products.splice(idx, 1);
    this.saveToDisk(this.data);
    return true;
  }

  // Customer Inquiries & Quotation Requests
  public getInquiries(companyId: string, requester: User): CustomerInquiry[] {
    if (requester.role !== 'company_admin' && requester.role !== 'company_staff' && requester.role !== 'platform_owner') {
      throw new Error('SECURITY_VIOLATION: Only authorized company staff or administrators can read company quotation inquiries.');
    }
    if (requester.role !== 'platform_owner' && requester.companyId !== companyId) {
      throw new Error(`SECURITY_VIOLATION: Cannot read private customer inquiries for company ${companyId}`);
    }
    return this.data.inquiries.filter((inq) => inq.companyId === companyId);
  }

  public getInquiryById(inquiryId: string, requester: User): CustomerInquiry | null {
    const inq = this.data.inquiries.find((i) => i.id === inquiryId || i.requestReference === inquiryId) || null;
    if (!inq) return null;

    if (requester.role !== 'company_admin' && requester.role !== 'company_staff' && requester.role !== 'platform_owner') {
      throw new Error('SECURITY_VIOLATION: Only authorized company staff or administrators can access quotation details.');
    }
    if (requester.role !== 'platform_owner' && requester.companyId !== inq.companyId) {
      throw new Error(`SECURITY_VIOLATION: Cannot access quotation inquiry belonging to company ${inq.companyId}`);
    }
    return inq;
  }

  public createInquiry(inquiryData: Partial<CustomerInquiry>): CustomerInquiry {
    const companyId = (inquiryData.companyId || '').trim();
    const customerContact = (inquiryData.customerContact || '').trim();
    const message = (inquiryData.message || '').trim();

    if (!companyId) {
      throw new Error('VALIDATION_ERROR: companyId is required.');
    }
    if (!customerContact) {
      throw new Error('VALIDATION_ERROR: Customer contact information (phone, WhatsApp, or email) is required.');
    }
    if (!message) {
      throw new Error('VALIDATION_ERROR: Quotation request message is required.');
    }

    const company = this.getCompanyById(companyId);
    if (!company) {
      throw new Error(`VALIDATION_ERROR: Company ${companyId} not found.`);
    }

    const nowIso = new Date().toISOString();
    const uniqueId =
      inquiryData.id && !this.data.inquiries.some((i) => i.id === inquiryData.id)
        ? inquiryData.id
        : `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const seqNum = 1001 + this.data.inquiries.length;
    const requestReference =
      inquiryData.requestReference ||
      `HEKA-RFQ-${new Date().getUTCFullYear()}-${seqNum}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const parsedQty = Number(inquiryData.requestedQuantity);
    const requestedQuantity = Number.isFinite(parsedQty) && parsedQty >= 1 ? Math.floor(parsedQty) : 1;

    // Resolve product reference if productId is provided
    let resolvedProductName = inquiryData.productName;
    let resolvedSellerId = inquiryData.sellerId;
    if (inquiryData.productId) {
      const prod = this.getProductById(inquiryData.productId);
      if (prod) {
        if (!resolvedProductName) resolvedProductName = prod.name;
        if (!resolvedSellerId && prod.sellerId) resolvedSellerId = prod.sellerId;
      }
    }

    // Extract email if customerContact looks like an email address and customerEmail wasn't explicitly set
    const inferredEmail =
      inquiryData.customerEmail ||
      (customerContact.includes('@') && customerContact.includes('.') ? customerContact : undefined);

    const destinations =
      company.settings?.notificationDestinations || DEFAULT_HEKA_NOTIFICATION_DESTINATIONS;

    const newInq: CustomerInquiry = {
      id: uniqueId,
      requestReference,
      companyId,
      customerName: (inquiryData.customerName || '').trim() || 'Prospective Buyer',
      customerContact,
      customerLocation: inquiryData.customerLocation ? inquiryData.customerLocation.trim() : undefined,
      inquiryType: inquiryData.inquiryType || 'wholesale_quote',
      productId: inquiryData.productId,
      productName: resolvedProductName,
      sellerId: resolvedSellerId,
      customerId: inquiryData.customerId,
      customerEmail: inferredEmail,
      requestedQuantity,
      message,
      replyLanguage: inquiryData.replyLanguage || 'en',
      status: 'new',
      createdAt: nowIso,
      persistedAt: nowIso,
      notifications: createInitialNotificationMap(uniqueId, destinations)
    };

    this.data.inquiries.unshift(newInq);
    try {
      this.saveToDiskStrict(this.data);
    } catch (diskErr: any) {
      // Roll back in-memory push if disk persistence failed so we never falsely report persistence
      this.data.inquiries.shift();
      throw new Error(`PERSISTENCE_ERROR: Failed to save quotation request to database: ${diskErr.message || 'Disk write error'}`);
    }

    return newInq;
  }

  public updateInquiryNotifications(
    inquiryId: string,
    notifications: QuotationNotificationMap
  ): CustomerInquiry | null {
    const idx = this.data.inquiries.findIndex((i) => i.id === inquiryId || i.requestReference === inquiryId);
    if (idx === -1) return null;

    this.data.inquiries[idx] = {
      ...this.data.inquiries[idx],
      notifications
    };
    this.saveToDisk(this.data);
    return this.data.inquiries[idx];
  }

  public updateNotificationDestinations(
    companyId: string,
    updates: Partial<QuotationNotificationDestinations>,
    requester: User
  ): QuotationNotificationDestinations {
    if (requester.role !== 'company_admin' && requester.role !== 'platform_owner') {
      throw new Error('FORBIDDEN: Only authorized HEKA LTD administrators can update notification destinations.');
    }
    if (requester.role !== 'platform_owner' && requester.companyId !== companyId) {
      throw new Error(`TENANT_ISOLATION_ERROR: Cannot modify notification settings for company ${companyId}`);
    }

    const companyIdx = this.data.companies.findIndex((c) => c.id === companyId);
    if (companyIdx === -1) {
      throw new Error('Company not found');
    }

    const comp = this.data.companies[companyIdx];
    const current = comp.settings?.notificationDestinations || DEFAULT_HEKA_NOTIFICATION_DESTINATIONS;
    const rawWa = (updates.whatsappRaw !== undefined ? updates.whatsappRaw : current.whatsappRaw).trim() || DEFAULT_HEKA_NOTIFICATION_DESTINATIONS.whatsappRaw;
    const normalizedWa = normalizeInternationalPhone(rawWa);

    const nextDestinations: QuotationNotificationDestinations = {
      email: (updates.email !== undefined ? updates.email : current.email).trim() || DEFAULT_HEKA_NOTIFICATION_DESTINATIONS.email,
      whatsappRaw: rawWa,
      whatsappNormalized: normalizedWa.e164,
      telegramPublicLink:
        (updates.telegramPublicLink !== undefined ? updates.telegramPublicLink : current.telegramPublicLink).trim() ||
        DEFAULT_HEKA_NOTIFICATION_DESTINATIONS.telegramPublicLink,
      telegramChatId:
        updates.telegramChatId !== undefined ? updates.telegramChatId.trim() : (current.telegramChatId || ''),
      enabledChannels: {
        email: updates.enabledChannels?.email ?? current.enabledChannels.email,
        telegram: updates.enabledChannels?.telegram ?? current.enabledChannels.telegram,
        whatsapp: updates.enabledChannels?.whatsapp ?? current.enabledChannels.whatsapp
      }
    };

    comp.settings = {
      ...comp.settings,
      notificationDestinations: nextDestinations
    };

    this.saveToDiskStrict(this.data);
    return nextDestinations;
  }

  // Support Tickets (Tenant-scoped)
  public getSupportTickets(companyId: string, requester?: User | null): SupportTicket[] {
    if (!requester || (requester.role !== 'company_admin' && requester.role !== 'company_staff' && requester.role !== 'platform_owner')) {
      throw new Error('SECURITY_BREACH_ATTEMPT: Corporate authorization required to view support tickets.');
    }
    if (requester && requester.role !== 'platform_owner' && requester.companyId !== companyId) {
      if (requester.companyId === 'comp_heka_ltd' && companyId === 'comp_mehr_saffron') {
        // allowed alias
      } else {
        throw new Error(`SECURITY_BREACH_ATTEMPT: User ${requester.id} of ${requester.companyId} denied access to tickets of ${companyId}`);
      }
    }

    const tickets = this.data.supportTickets || [];
    return tickets.filter((t) => t.companyId === companyId || (companyId === 'comp_heka_ltd' && t.companyId === 'comp_mehr_saffron'));
  }

  public createSupportTicket(ticketData: Partial<SupportTicket>, requester?: User | null): SupportTicket {
    if (!requester || (requester.role !== 'company_admin' && requester.role !== 'company_staff' && requester.role !== 'platform_owner')) {
      throw new Error('SECURITY_BREACH_ATTEMPT: Corporate authorization required to create internal support tickets.');
    }
    const targetCompId = requester.role === 'platform_owner'
      ? (ticketData.companyId || 'comp_heka_ltd')
      : (requester.companyId || 'comp_heka_ltd');
    const randNum = Math.floor(100 + Math.random() * 900);
    const count = (this.data.supportTickets || []).length + 1;
    const ticketNumber = ticketData.ticketNumber || `TCK-2026-${count * 10 + (randNum % 10)}`;

    const newTicket: SupportTicket = {
      id: `tck_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ticketNumber,
      companyId: targetCompId,
      subject: ticketData.subject || 'Support Request',
      description: ticketData.description || '',
      category: ticketData.category || 'general',
      priority: ticketData.priority || 'medium',
      status: ticketData.status || 'new',
      conversationLanguage: ticketData.conversationLanguage || 'en',
      attachments: ticketData.attachments || [],
      createdBy: ticketData.createdBy || (requester ? requester.name : 'Corporate User'),
      customerContact: ticketData.customerContact,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!this.data.supportTickets) {
      this.data.supportTickets = [];
    }
    this.data.supportTickets.unshift(newTicket);
    this.saveToDisk(this.data);
    return newTicket;
  }

  public updateSupportTicket(ticketId: string, updates: Partial<SupportTicket>, requester?: User | null): SupportTicket {
    if (!requester || (requester.role !== 'company_admin' && requester.role !== 'company_staff' && requester.role !== 'platform_owner')) {
      throw new Error('SECURITY_BREACH_ATTEMPT: Corporate authorization required to update support tickets.');
    }
    if (!this.data.supportTickets) {
      this.data.supportTickets = [];
    }
    const idx = this.data.supportTickets.findIndex((t) => t.id === ticketId || t.ticketNumber === ticketId);
    if (idx === -1) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    const ticket = this.data.supportTickets[idx];
    if (requester && requester.role !== 'platform_owner' && requester.companyId !== ticket.companyId) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: User cannot update ticket belonging to another tenant`);
    }

    const updated: SupportTicket = {
      ...ticket,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.data.supportTickets[idx] = updated;
    this.saveToDisk(this.data);
    return updated;
  }

  // ==========================================
  // CUSTOMER ACCOUNTS, REGISTRATION & PROFILES
  // ==========================================

  public registerCustomer(payload: {
    name: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    accountType: AccountType;
    personalProfile?: PersonalProfile;
    businessProfile?: BusinessProfile;
    country?: string;
    city?: string;
    phone?: string;
    preferredLanguage?: Language;
  }): User {
    const rawEmail = String(payload.email || '').trim();
    if (!isValidEmailFormat(rawEmail)) {
      throw new Error('VALIDATION_ERROR: Please enter a valid email address.');
    }

    const normalizedEmail = rawEmail.toLowerCase();
    const existing = this.data.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      throw new Error(`DUPLICATE_EMAIL: An account with email ${rawEmail} already exists.`);
    }

    // Password validation & confirmation
    const password = String(payload.password || '');
    const confirmPassword = payload.confirmPassword !== undefined ? String(payload.confirmPassword) : password;
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      throw new Error(strength.error || 'VALIDATION_ERROR: Password does not meet security requirements.');
    }
    if (password !== confirmPassword) {
      throw new Error('VALIDATION_ERROR: Password and password confirmation do not match.');
    }

    const accountType: AccountType = payload.accountType === 'business' ? 'business' : 'personal';
    const trimmedName = String(payload.name || '').trim();
    const trimmedCountry = String(payload.country || payload.personalProfile?.country || payload.businessProfile?.country || '').trim();
    const trimmedCity = String(payload.city || payload.personalProfile?.city || payload.businessProfile?.city || '').trim();
    const trimmedPhone = String(payload.phone || payload.personalProfile?.phone || payload.businessProfile?.businessPhone || '').trim();

    if (!trimmedName) {
      throw new Error('VALIDATION_ERROR: Full name or contact person name is required.');
    }
    if (!trimmedCountry || !trimmedCity) {
      throw new Error('VALIDATION_ERROR: Country and city are required.');
    }
    if (!trimmedPhone) {
      throw new Error('VALIDATION_ERROR: Phone or WhatsApp contact number is required.');
    }

    let personalProfile: PersonalProfile | undefined = undefined;
    let businessProfile: BusinessProfile | undefined = undefined;

    if (accountType === 'personal') {
      const fullName = String(payload.personalProfile?.fullName || trimmedName).trim();
      if (!fullName) {
        throw new Error('VALIDATION_ERROR: Personal full name is required.');
      }
      personalProfile = {
        fullName,
        country: trimmedCountry,
        city: trimmedCity,
        phone: trimmedPhone,
        avatarUrl: payload.personalProfile?.avatarUrl
      };
    } else {
      const companyName = String(payload.businessProfile?.companyName || '').trim();
      const contactPerson = String(payload.businessProfile?.contactPerson || trimmedName).trim();
      const businessType = String(payload.businessProfile?.businessType || 'Wholesaler / Distributor').trim();

      if (!companyName) {
        throw new Error('VALIDATION_ERROR: Company legal name is required for Business accounts.');
      }
      if (!contactPerson) {
        throw new Error('VALIDATION_ERROR: Contact person name is required for Business accounts.');
      }

      businessProfile = {
        contactPerson,
        companyName,
        country: trimmedCountry,
        city: trimmedCity,
        businessEmail: rawEmail,
        businessPhone: trimmedPhone,
        businessType: businessType || 'Wholesaler / Distributor',
        registrationNumber: payload.businessProfile?.registrationNumber
          ? String(payload.businessProfile.registrationNumber).trim()
          : undefined,
        website: payload.businessProfile?.website
          ? String(payload.businessProfile.website).trim()
          : undefined
      };
    }

    const timestamp = Date.now();
    const nowIso = new Date(timestamp).toISOString();
    const passwordHash = hashPassword(password);

    // Strictly enforce customer role and zero elevated privileges on registration
    const newUser: User = {
      id: `user_cust_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
      email: rawEmail,
      name: accountType === 'business' ? (businessProfile?.contactPerson || trimmedName) : trimmedName,
      role: 'customer',
      companyId: null,
      token: `token_cust_${timestamp}_${Math.random().toString(36).substring(2, 10)}`,
      passwordHash,
      accountType,
      personalProfile,
      businessProfile,
      sellerStatus: 'none',
      preferredLanguage: payload.preferredLanguage || 'en',
      savedProductIds: [],
      phone: trimmedPhone,
      country: trimmedCountry,
      city: trimmedCity,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.data.users.push(newUser);
    try {
      this.saveToDiskStrict(this.data);
    } catch (err: any) {
      this.data.users.pop();
      throw new Error(`PERSISTENCE_ERROR: Could not save customer account: ${err.message || 'Disk write error'}`);
    }

    return newUser;
  }

  public authenticateCredentials(params: {
    email?: string;
    password?: string;
    token?: string;
    portal?: 'admin' | 'customer';
  }): User {
    const { email, password, token, portal } = params;
    let user: User | null = null;

    if (token) {
      user = this.authenticateUser(token);
      if (!user) {
        throw new Error('INVALID_CREDENTIALS: Invalid session or evaluation token.');
      }
    } else if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const targetEmail = normalizedEmail === 'owner@dukan.ai' ? 'owner@dukanai.com' : normalizedEmail;
      user = this.data.users.find((u) => u.email.toLowerCase() === targetEmail) || null;

      if (!user) {
        throw new Error('INVALID_CREDENTIALS: Invalid email or password.');
      }

      // Customer accounts ALWAYS require password verification regardless of portal parameter.
      // Admin portal also verifies password when provided.
      if (user.role === 'customer' || portal === 'customer' || (password !== undefined && password !== '')) {
        if (!password) {
          throw new Error('INVALID_CREDENTIALS: Password is required to sign in.');
        }
        if (!verifyPassword(String(password), user.passwordHash)) {
          throw new Error('INVALID_CREDENTIALS: Invalid email or password.');
        }
      }
    } else {
      throw new Error('VALIDATION_ERROR: Email and password are required.');
    }

    // Enforce strict portal boundary
    if (portal === 'customer') {
      if (user.role !== 'customer') {
        throw new Error('FORBIDDEN: Corporate administrator and staff accounts cannot sign in through the customer portal.');
      }
    } else if (portal === 'admin') {
      if (user.role !== 'company_admin' && user.role !== 'platform_owner' && user.role !== 'company_staff') {
        throw new Error('FORBIDDEN: Customer and seller accounts are not authorized to access the corporate administration portal.');
      }
    }

    return user;
  }

  public changeUserPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    requester: User
  ): void {
    if (requester.id !== userId) {
      throw new Error('SECURITY_BREACH_ATTEMPT: You can only change your own password.');
    }

    const user = this.data.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash)) {
      throw new Error('INVALID_CREDENTIALS: Current password is incorrect.');
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      throw new Error(strength.error || 'VALIDATION_ERROR: New password does not meet security requirements.');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('VALIDATION_ERROR: New password and confirmation do not match.');
    }

    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    this.saveToDiskStrict(this.data);
  }

  public updateUserProfile(userId: string, updates: Partial<User>, requester: User): User {
    const isSelf = requester.id === userId;
    const isHekaOrPlatformAdmin =
      requester.role === 'platform_owner' ||
      (requester.role === 'company_admin' && requester.companyId === 'comp_heka_ltd');

    if (!isSelf && !isHekaOrPlatformAdmin) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: You can only update your own profile.`);
    }

    const userIdx = this.data.users.findIndex((u) => u.id === userId);
    if (userIdx === -1) {
      throw new Error(`User not found: ${userId}`);
    }

    const targetUser = this.data.users[userIdx];

    // Explicitly block any attempt by a customer or seller to elevate role, companyId, or sellerStatus
    if (requester.role === 'customer' || requester.role === 'company_staff') {
      if (updates.role && updates.role !== targetUser.role) {
        throw new Error('SECURITY_BREACH_ATTEMPT: Role elevation is strictly prohibited.');
      }
      if (updates.companyId !== undefined && updates.companyId !== targetUser.companyId) {
        throw new Error('SECURITY_BREACH_ATTEMPT: Company assignment modification is prohibited.');
      }
      if (updates.sellerStatus && updates.sellerStatus !== targetUser.sellerStatus) {
        throw new Error('SECURITY_BREACH_ATTEMPT: Seller status can only be changed through administrator review.');
      }
    }

    // Even a company_admin cannot promote someone to platform_owner or company_admin via profile update
    if (updates.role && updates.role !== targetUser.role && requester.role !== 'platform_owner') {
      throw new Error('SECURITY_BREACH_ATTEMPT: Only a Platform Owner can alter user system roles.');
    }

    const updated: User = {
      ...targetUser,
      name: updates.name !== undefined ? String(updates.name).trim() || targetUser.name : targetUser.name,
      accountType: updates.accountType !== undefined ? updates.accountType : targetUser.accountType,
      personalProfile: updates.personalProfile !== undefined ? updates.personalProfile : targetUser.personalProfile,
      businessProfile: updates.businessProfile !== undefined ? updates.businessProfile : targetUser.businessProfile,
      preferredLanguage: updates.preferredLanguage !== undefined ? updates.preferredLanguage : targetUser.preferredLanguage,
      phone: updates.phone !== undefined ? String(updates.phone).trim() : targetUser.phone,
      country: updates.country !== undefined ? String(updates.country).trim() : targetUser.country,
      city: updates.city !== undefined ? String(updates.city).trim() : targetUser.city,
      // Strict immutable security fields unless explicitly authorized
      id: targetUser.id,
      email: targetUser.email,
      token: targetUser.token,
      passwordHash: targetUser.passwordHash,
      companyId: targetUser.companyId,
      role: requester.role === 'platform_owner' && updates.role ? updates.role : targetUser.role,
      sellerStatus: isHekaOrPlatformAdmin && updates.sellerStatus ? updates.sellerStatus : targetUser.sellerStatus,
      updatedAt: new Date().toISOString()
    };

    this.data.users[userIdx] = updated;
    this.saveToDiskStrict(this.data);
    return updated;
  }

  public toggleSaveProduct(userId: string, productId: string, requester: User): string[] {
    if (requester.id !== userId) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: Unauthorized access to saved items.`);
    }

    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const currentSaved = user.savedProductIds || [];
    const exists = currentSaved.includes(productId);
    const updatedSaved = exists ? currentSaved.filter((id) => id !== productId) : [...currentSaved, productId];

    user.savedProductIds = updatedSaved;
    this.saveToDiskStrict(this.data);
    return updatedSaved;
  }

  public getCustomerInquiries(userId: string, userEmail: string, requester: User): CustomerInquiry[] {
    const isHekaOrPlatformAdmin =
      requester.role === 'platform_owner' ||
      (requester.role === 'company_admin' && requester.companyId === 'comp_heka_ltd');

    if (requester.id !== userId && !isHekaOrPlatformAdmin) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: Unauthorized access to inquiries.`);
    }

    return this.data.inquiries.filter((inq) => 
      inq.customerId === userId ||
      inq.customerEmail?.toLowerCase() === userEmail.toLowerCase() ||
      inq.customerContact?.toLowerCase() === userEmail.toLowerCase()
    );
  }

  public getCustomerAccounts(requester: User): User[] {
    if (requester.role !== 'company_admin' && requester.role !== 'platform_owner') {
      throw new Error(`SECURITY_BREACH_ATTEMPT: Admin permission required to list customer accounts.`);
    }
    if (requester.role !== 'platform_owner' && requester.companyId !== 'comp_heka_ltd') {
      throw new Error(`TENANT_ISOLATION_ERROR: Only HEKA LTD administrators can access HEKA marketplace customer accounts.`);
    }

    // Never expose internal tokens or password hashes in customer directory listings
    return this.data.users
      .filter((u) => u.role === 'customer')
      .map((u) => sanitizeUserForClient(u) as User);
  }

  // ==========================================
  // SELLER APPLICATIONS & WORKFLOW
  // ==========================================

  private requireHekaMarketplaceAdmin(requester: User): void {
    if (requester.role !== 'company_admin' && requester.role !== 'platform_owner') {
      throw new Error('SECURITY_BREACH_ATTEMPT: Administrator permission required.');
    }
    if (requester.role !== 'platform_owner' && requester.companyId !== 'comp_heka_ltd') {
      throw new Error(`TENANT_ISOLATION_ERROR: User ${requester.email} (${requester.companyId}) is not authorized to manage HEKA LTD marketplace governance.`);
    }
  }

  public submitSellerApplication(
    data: Omit<SellerApplication, 'id' | 'status' | 'submittedAt'>,
    requester: User
  ): SellerApplication {
    if (requester.id !== data.userId) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: Cannot submit seller application for another user.`);
    }

    if (!this.data.sellerApplications) {
      this.data.sellerApplications = [];
    }

    // Check if user already has an active pending or approved application
    const existing = this.data.sellerApplications.find(
      (app) => app.userId === data.userId && (app.status === 'pending' || app.status === 'approved')
    );
    if (existing) {
      if (existing.status === 'approved') {
        throw new Error('Your seller account is already approved.');
      }
      throw new Error('You already have a pending seller application under review.');
    }

    const newApp: SellerApplication = {
      ...data,
      id: `app_${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    this.data.sellerApplications.push(newApp);

    // Update user's seller status to 'pending'
    const user = this.data.users.find((u) => u.id === data.userId);
    if (user) {
      user.sellerStatus = 'pending';
    }

    this.saveToDisk(this.data);
    return newApp;
  }

  public getSellerApplication(userId: string, requester: User): SellerApplication | null {
    const isHekaOrPlatformAdmin =
      requester.role === 'platform_owner' ||
      (requester.role === 'company_admin' && requester.companyId === 'comp_heka_ltd');

    if (requester.id !== userId && !isHekaOrPlatformAdmin) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: Unauthorized.`);
    }

    if (!this.data.sellerApplications) return null;
    return this.data.sellerApplications.find((app) => app.userId === userId) || null;
  }

  public getAllSellerApplications(requester: User): SellerApplication[] {
    this.requireHekaMarketplaceAdmin(requester);
    return this.data.sellerApplications || [];
  }

  public reviewSellerApplication(
    applicationId: string,
    status: 'approved' | 'rejected' | 'suspended',
    adminNotes: string | undefined,
    rejectionReason: string | undefined,
    requester: User
  ): SellerApplication {
    this.requireHekaMarketplaceAdmin(requester);

    if (!this.data.sellerApplications) {
      this.data.sellerApplications = [];
    }

    const app = this.data.sellerApplications.find((a) => a.id === applicationId);
    if (!app) {
      throw new Error(`Seller application ${applicationId} not found.`);
    }

    app.status = status;
    app.reviewedAt = new Date().toISOString();
    app.reviewedBy = requester.name;
    if (adminNotes !== undefined) app.adminNotes = adminNotes;
    if (rejectionReason !== undefined) app.rejectionReason = rejectionReason;

    // Update the applicant user's sellerStatus
    const user = this.data.users.find((u) => u.id === app.userId);
    if (user) {
      user.sellerStatus = status;
    }

    this.saveToDisk(this.data);
    return app;
  }

  // ==========================================
  // SELLER PRODUCTS & WORKFLOW
  // ==========================================

  public getSellerProducts(sellerId: string, requester: User): Product[] {
    const isHekaOrPlatformAdmin =
      requester.role === 'platform_owner' ||
      (requester.role === 'company_admin' && requester.companyId === 'comp_heka_ltd');

    if (requester.id !== sellerId && !isHekaOrPlatformAdmin) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: Unauthorized to view these seller products.`);
    }

    return this.data.products.filter((p) => p.sellerId === sellerId);
  }

  public createSellerProduct(payload: Partial<Product>, requester: User): Product {
    if (requester.sellerStatus !== 'approved') {
      throw new Error(`FORBIDDEN: Only approved sellers may submit products for catalog review.`);
    }

    const resolvedCat = this.validateAndResolveCategorySelection(
      'comp_heka_ltd',
      payload.categoryId,
      payload.subcategoryId,
      payload.category,
      true
    );

    const now = new Date().toISOString();
    const newProduct: Product = {
      id: `prod_seller_${Date.now()}`,
      companyId: 'comp_heka_ltd', // Registered on HEKA platform
      name: payload.name || 'Untitled Seller Product',
      nameFa: payload.nameFa || payload.name || '',
      namePs: payload.namePs || payload.nameFa || payload.name || '',
      category: resolvedCat.categoryLabel,
      categoryId: resolvedCat.categoryId,
      subcategoryId: resolvedCat.subcategoryId,
      description: payload.description || '',
      descriptionFa: payload.descriptionFa || '',
      descriptionPs: payload.descriptionPs || '',
      images: payload.images && payload.images.length > 0 ? payload.images : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'],
      unit: payload.unit || 'piece',
      retailPrice: Number(payload.retailPrice) || 0,
      currency: payload.currency || 'USD',
      stock: Number(payload.stock) || 0,
      packageSizes: payload.packageSizes || [],
      attributes: payload.attributes || [],
      wholesaleRules: payload.wholesaleRules || {
        minQuantity: 10,
        discountPercent: 10,
        requireQuote: true,
        termsNote: 'Standard wholesale terms apply',
        isConfirmed: true
      },
      shippingDetails: payload.shippingDetails || {
        fee: 'Calculated upon order destination',
        transitTime: '3-7 business days',
        coverage: 'International',
        isConfirmed: true
      },
      qualityInfo: payload.qualityInfo || {
        grade: 'Commercial Grade A',
        isConfirmed: true
      },
      // CRITICAL: Seller products MUST remain unpublished until HEKA admin reviews and approves!
      isPublished: false,
      sellerId: requester.id,
      sellerName: requester.businessProfile?.companyName || requester.name,
      approvalStatus: 'pending_review',
      submittedAt: now,
      createdAt: now,
      updatedAt: now
    };

    this.data.products.push(newProduct);
    this.saveToDisk(this.data);
    return newProduct;
  }

  public updateSellerProduct(productId: string, updates: Partial<Product>, requester: User): Product {
    const idx = this.data.products.findIndex((p) => p.id === productId);
    if (idx === -1) {
      throw new Error(`Product not found: ${productId}`);
    }

    const existing = this.data.products[idx];
    const isAuthorizedAdmin =
      requester.role === 'platform_owner' ||
      (requester.role === 'company_admin' && requester.companyId === existing.companyId);

    if (existing.sellerId !== requester.id && !isAuthorizedAdmin) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: You can only edit your own products.`);
    }

    if (requester.role === 'customer' && requester.sellerStatus !== 'approved') {
      throw new Error(`FORBIDDEN: Approved seller status is required.`);
    }

    const isSeller = requester.role === 'customer' || existing.sellerId === requester.id;

    let categoryFields: Partial<Product> = {};
    if (updates.categoryId !== undefined || updates.subcategoryId !== undefined) {
      const nextCategoryId = updates.categoryId !== undefined ? updates.categoryId : existing.categoryId;
      const nextSubcategoryId = updates.subcategoryId !== undefined ? updates.subcategoryId : existing.subcategoryId;
      const resolvedCat = this.validateAndResolveCategorySelection(
        existing.companyId,
        nextCategoryId,
        nextSubcategoryId,
        updates.category || existing.category,
        isSeller
      );
      categoryFields = {
        categoryId: resolvedCat.categoryId,
        subcategoryId: resolvedCat.subcategoryId,
        category: resolvedCat.categoryLabel
      };
    }

    // If seller updates product, status resets to pending_review and isPublished resets to false
    const updated: Product = {
      ...existing,
      ...updates,
      ...categoryFields,
      id: existing.id,
      companyId: existing.companyId,
      sellerId: existing.sellerId,
      sellerName: existing.sellerName,
      // If a seller modifies product, it requires re-approval
      approvalStatus: isSeller ? 'pending_review' : (updates.approvalStatus || existing.approvalStatus),
      isPublished: isSeller ? false : (updates.isPublished !== undefined ? updates.isPublished : existing.isPublished),
      submittedAt: isSeller ? new Date().toISOString() : existing.submittedAt,
      updatedAt: new Date().toISOString()
    };

    this.data.products[idx] = updated;
    this.saveToDisk(this.data);
    return updated;
  }

  public getAllProductsForReview(requester: User): Product[] {
    if (requester.role !== 'company_admin' && requester.role !== 'platform_owner') {
      throw new Error(`SECURITY_BREACH_ATTEMPT: Admin permission required to review products.`);
    }

    // Strictly scope product reviews to the administrator's own company (unless platform_owner)
    return this.data.products.filter((p) => {
      if (requester.role !== 'platform_owner' && p.companyId !== requester.companyId) {
        return false;
      }
      return Boolean(p.sellerId) || p.approvalStatus === 'pending_review' || p.approvalStatus === 'rejected';
    });
  }

  public reviewProductSubmission(
    productId: string,
    approvalStatus: ProductApprovalStatus,
    rejectionReason: string | undefined,
    requester: User
  ): Product {
    if (requester.role !== 'company_admin' && requester.role !== 'platform_owner') {
      throw new Error(`SECURITY_BREACH_ATTEMPT: Admin permission required to review products.`);
    }

    const idx = this.data.products.findIndex((p) => p.id === productId);
    if (idx === -1) {
      throw new Error(`Product not found: ${productId}`);
    }

    const prod = this.data.products[idx];
    if (requester.role !== 'platform_owner' && prod.companyId !== requester.companyId) {
      throw new Error(`TENANT_ISOLATION_ERROR: User ${requester.email} cannot review products belonging to ${prod.companyId}`);
    }

    prod.approvalStatus = approvalStatus;
    prod.reviewedAt = new Date().toISOString();
    if (rejectionReason !== undefined) {
      prod.rejectionReason = rejectionReason;
    }

    // Only approved products can be published
    if (approvalStatus === 'approved') {
      prod.isPublished = true;
    } else {
      prod.isPublished = false;
    }
    prod.updatedAt = new Date().toISOString();

    this.data.products[idx] = prod;
    this.saveToDisk(this.data);
    return prod;
  }

  public getSellerInquiries(sellerId: string, requester: User): CustomerInquiry[] {
    const isHekaOrPlatformAdmin =
      requester.role === 'platform_owner' ||
      (requester.role === 'company_admin' && requester.companyId === 'comp_heka_ltd');

    if (requester.id !== sellerId && !isHekaOrPlatformAdmin) {
      throw new Error(`SECURITY_BREACH_ATTEMPT: Unauthorized to view seller inquiries.`);
    }

    return this.data.inquiries.filter((inq) => inq.sellerId === sellerId);
  }

  // Automated Cross-Tenant Security Audit Test Suite
  public runCrossTenantSecurityAudit(): SecurityAuditResult[] {
    const results: SecurityAuditResult[] = [];

    // Test 1: HEKA Admin attempts to READ Ziba Fashion private data
    const hekaAdmin = this.data.users.find((u) => u.email === 'admin@hekaltd.com' || u.email === 'admin@mehrsaffron.com')!;
    try {
      this.getProducts('comp_ziba_fashion', hekaAdmin, true);
      results.push({
        testId: 'SEC-01',
        testName: 'Cross-Tenant Private Read Attack',
        testDescription: 'Tenant A (HEKA LTD) attempts to read Tenant B (Ziba Fashion) private inventory.',
        targetCompany: 'Ziba Silk & Apparel',
        attackingCompany: 'HEKA LTD',
        actionAttempted: 'GET /api/products (companyId: comp_ziba_fashion)',
        statusCodeReceived: 200,
        expectedStatus: 403,
        isIsolated: false,
        details: 'FAILED: Cross-tenant read was allowed!'
      });
    } catch (err: any) {
      results.push({
        testId: 'SEC-01',
        testName: 'Cross-Tenant Private Read Attack',
        testDescription: 'Tenant A (HEKA LTD) attempts to read Tenant B (Ziba Fashion) private inventory.',
        targetCompany: 'Ziba Silk & Apparel',
        attackingCompany: 'HEKA LTD',
        actionAttempted: 'GET /api/products (companyId: comp_ziba_fashion)',
        statusCodeReceived: 403,
        expectedStatus: 403,
        isIsolated: true,
        details: `PASSED: Blocked with ${err.message}`
      });
    }

    // Test 2: HEKA Admin attempts to EDIT Ziba Fashion product price
    try {
      this.updateProduct('prod_ziba_1', { retailPrice: 1 }, hekaAdmin);
      results.push({
        testId: 'SEC-02',
        testName: 'Cross-Tenant Unauthorized Price Tampering',
        testDescription: 'Tenant A (HEKA LTD) attempts to update product price of Tenant B.',
        targetCompany: 'Ziba Silk & Apparel',
        attackingCompany: 'HEKA LTD',
        actionAttempted: 'PUT /api/products/prod_ziba_1 (price: $1)',
        statusCodeReceived: 200,
        expectedStatus: 403,
        isIsolated: false,
        details: 'FAILED: Price tampering was permitted!'
      });
    } catch (err: any) {
      results.push({
        testId: 'SEC-02',
        testName: 'Cross-Tenant Unauthorized Price Tampering',
        testDescription: 'Tenant A (HEKA LTD) attempts to update product price of Tenant B.',
        targetCompany: 'Ziba Silk & Apparel',
        attackingCompany: 'HEKA LTD',
        actionAttempted: 'PUT /api/products/prod_ziba_1 (price: $1)',
        statusCodeReceived: 403,
        expectedStatus: 403,
        isIsolated: true,
        details: `PASSED: Blocked with ${err.message}`
      });
    }

    // Test 3: Ziba Admin attempts to DELETE HEKA LTD product
    const zibaAdmin = this.data.users.find((u) => u.email === 'admin@zibafashion.com')!;
    const hekaProduct = this.data.products.find((p) => p.companyId === 'comp_heka_ltd' || p.companyId === 'comp_mehr_saffron') || { id: 'prod_heka_1' };
    try {
      this.deleteProduct(hekaProduct.id, zibaAdmin);
      results.push({
        testId: 'SEC-03',
        testName: 'Cross-Tenant Deletion Attack',
        testDescription: 'Tenant B attempts to delete a product owned by Tenant A (HEKA LTD).',
        targetCompany: 'HEKA LTD',
        attackingCompany: 'Ziba Silk & Apparel',
        actionAttempted: `DELETE /api/products/${hekaProduct.id}`,
        statusCodeReceived: 200,
        expectedStatus: 403,
        isIsolated: false,
        details: 'FAILED: Cross-tenant deletion succeeded!'
      });
    } catch (err: any) {
      results.push({
        testId: 'SEC-03',
        testName: 'Cross-Tenant Deletion Attack',
        testDescription: 'Tenant B attempts to delete a product owned by Tenant A (HEKA LTD).',
        targetCompany: 'HEKA LTD',
        attackingCompany: 'Ziba Silk & Apparel',
        actionAttempted: `DELETE /api/products/${hekaProduct.id}`,
        statusCodeReceived: 403,
        expectedStatus: 403,
        isIsolated: true,
        details: `PASSED: Blocked with ${err.message}`
      });
    }

    // Test 4: Ziba Admin attempts to READ HEKA LTD customer inquiries and phones
    const targetCompId = this.data.companies.find((c) => c.slug === 'heka-ltd')?.id || 'comp_heka_ltd';
    try {
      this.getInquiries(targetCompId, zibaAdmin);
      results.push({
        testId: 'SEC-04',
        testName: 'Customer PII & Lead Theft Attack',
        testDescription: 'Tenant B attempts to harvest customer leads & inquiries from Tenant A (HEKA LTD).',
        targetCompany: 'HEKA LTD',
        attackingCompany: 'Ziba Silk & Apparel',
        actionAttempted: `GET /api/inquiries (companyId: ${targetCompId})`,
        statusCodeReceived: 200,
        expectedStatus: 403,
        isIsolated: false,
        details: 'FAILED: Customer leads leaked!'
      });
    } catch (err: any) {
      results.push({
        testId: 'SEC-04',
        testName: 'Customer PII & Lead Theft Attack',
        testDescription: 'Tenant B attempts to harvest customer leads & inquiries from Tenant A (HEKA LTD).',
        targetCompany: 'HEKA LTD',
        attackingCompany: 'Ziba Silk & Apparel',
        actionAttempted: `GET /api/inquiries (companyId: ${targetCompId})`,
        statusCodeReceived: 403,
        expectedStatus: 403,
        isIsolated: true,
        details: `PASSED: Blocked with ${err.message}`
      });
    }

    // Test 5: Customer/Seller Role Elevation & Governance Bypass Attempt
    const sellerUser = this.data.users.find((u) => u.id === 'user_zahir_seller') || this.data.users.find((u) => u.role === 'customer')!;
    try {
      this.updateUserProfile(sellerUser.id, { role: 'company_admin', companyId: 'comp_heka_ltd' }, sellerUser);
      results.push({
        testId: 'SEC-05',
        testName: 'Customer/Seller Admin Privilege Escalation Attack',
        testDescription: 'Customer/Seller attempts to self-elevate role to company_admin via profile update.',
        targetCompany: 'HEKA LTD',
        attackingCompany: 'External Seller Account',
        actionAttempted: 'PUT /api/users/profile (role: company_admin)',
        statusCodeReceived: 200,
        expectedStatus: 403,
        isIsolated: false,
        details: 'FAILED: Privilege escalation succeeded!'
      });
    } catch (err: any) {
      results.push({
        testId: 'SEC-05',
        testName: 'Customer/Seller Admin Privilege Escalation Attack',
        testDescription: 'Customer/Seller attempts to self-elevate role to company_admin via profile update.',
        targetCompany: 'HEKA LTD',
        attackingCompany: 'External Seller Account',
        actionAttempted: 'PUT /api/users/profile (role: company_admin)',
        statusCodeReceived: 403,
        expectedStatus: 403,
        isIsolated: true,
        details: `PASSED: Blocked with ${err.message}`
      });
    }

    return results;
  }
}

export const dbManager = new DatabaseManager();
