export type Language = 'en' | 'fa' | 'ps';
export type ConversationLanguage = 'en' | 'fa' | 'ps';

export type UserRole = 'platform_owner' | 'company_admin' | 'company_staff' | 'customer';

export type AccountType = 'personal' | 'business';
export type SellerStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';
export type ProductApprovalStatus = 'approved' | 'pending_review' | 'draft' | 'rejected' | 'suspended';

export interface PersonalProfile {
  fullName: string;
  avatarUrl?: string;
  country: string;
  city: string;
  phone: string;
}

export interface BusinessProfile {
  contactPerson: string;
  companyName: string;
  country: string;
  city: string;
  businessEmail: string;
  businessPhone: string;
  businessType: string; // e.g. "Wholesaler", "Distributor", "Manufacturer", "Retailer", "Import/Export"
  registrationNumber?: string;
  documents?: string[];
  website?: string;
}

export interface SellerApplication {
  id: string;
  userId: string;
  applicantName: string;
  businessName: string;
  businessType: string;
  country: string;
  city: string;
  phone: string;
  email: string;
  description: string;
  productCategories: string[];
  registrationNumber?: string;
  documents?: string[];
  status: SellerStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
}

export interface CompanyBrandColors {
  primary: string;
  accent: string;
  background?: string;
}

export type NotificationChannel = 'email' | 'telegram' | 'whatsapp';
export type NotificationDeliveryStatus = 'not_configured' | 'pending' | 'sent_accepted' | 'failed';

export interface ChannelNotificationRecord {
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  destination: string;
  normalizedDestination: string;
  provider?: string;
  providerMessageId?: string;
  providerNote: string;
  attempts: number;
  lastAttemptAt?: string;
  acceptedAt?: string;
  idempotencyKey: string;
}

export interface QuotationNotificationMap {
  email: ChannelNotificationRecord;
  telegram: ChannelNotificationRecord;
  whatsapp: ChannelNotificationRecord;
}

export interface QuotationNotificationDestinations {
  email: string; // e.g. "khanedriss5951@gmail.com"
  whatsappRaw: string; // e.g. "0093728224060"
  whatsappNormalized: string; // e.g. "+93728224060"
  telegramPublicLink: string; // e.g. "https://t.me/HEKA_480"
  telegramChatId?: string; // Numeric chat_id or authorized @channel_id
  enabledChannels: {
    email: boolean;
    telegram: boolean;
    whatsapp: boolean;
  };
}

export interface NotificationProviderStatusSummary {
  destinations: QuotationNotificationDestinations;
  channels: {
    email: {
      configured: boolean;
      providerName: string;
      destination: string;
      missingEnvVars: string[];
      setupInstructions: string[];
    };
    telegram: {
      configured: boolean;
      providerName: string;
      publicReference: string;
      chatIdConfigured: boolean;
      missingEnvVars: string[];
      setupInstructions: string[];
    };
    whatsapp: {
      configured: boolean;
      providerName: string;
      destinationRaw: string;
      destinationNormalized: string;
      missingEnvVars: string[];
      setupInstructions: string[];
    };
  };
}

export interface CompanySettings {
  showRetailPricesPublicly: boolean;
  allowWholesaleQuoteRequests: boolean;
  supportedLanguages: Language[];
  defaultLanguage: Language;
  customGreetingEn?: string;
  customGreetingFa?: string;
  notificationDestinations?: QuotationNotificationDestinations;
}

export interface Company {
  id: string; // e.g. "comp_heka_ltd", "comp_ziba_fashion"
  slug: string; // e.g. "heka-ltd", "ziba-fashion"
  name: string;
  industry: string; // e.g. "Saffron & Agricultural Export", "Textile & Apparel", etc.
  country: string;
  currency: string;
  logoUrl: string;
  bannerUrl?: string;
  brandColors: CompanyBrandColors;
  contactPhone: string; // WhatsApp enabled phone
  contactEmail: string;
  address: string;
  plan: 'starter' | 'growth' | 'enterprise';
  settings: CompanySettings;
  createdAt: string;
}

export interface AuthSession {
  id: string; // Opaque session identifier stored in HttpOnly cookie
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string | null; // null for platform_owner and customer
  token?: string; // Server-internal token; stripped from client API responses
  passwordHash?: string; // Server-internal scrypt hash; NEVER sent to client

  // Customer & Seller extensions
  accountType?: AccountType;
  personalProfile?: PersonalProfile;
  businessProfile?: BusinessProfile;
  sellerStatus?: SellerStatus;
  preferredLanguage?: Language;
  savedProductIds?: string[];
  phone?: string;
  country?: string;
  city?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductPackageSize {
  id: string;
  name: string;
  weightOrSize: string; // e.g. "5g", "10g", "1kg" or "S", "M", "L", "XL"
  price: number;
  stock: number;
  isAvailable: boolean;
}

export interface ProductAttribute {
  key: string;
  value: string;
}

export interface WholesaleRules {
  minQuantity: number;
  discountPercent: number; // 0 if none
  requireQuote: boolean;
  termsNote: string;
  termsNoteFa?: string;
  isConfirmed: boolean;
}

export interface ShippingDetails {
  fee: string;
  transitTime: string;
  coverage: string;
  isConfirmed: boolean;
}

export interface QualityCertification {
  grade?: string;
  standard?: string; // e.g. ISO 3632, OEKO-TEX, GOTS
  labReportNumber?: string;
  isConfirmed: boolean;
  notes?: string;
}

export interface ProductCategory {
  id: string; // Stable category ID, e.g. "cat_industrial_machinery"
  companyId: string; // Tenant company ID, e.g. "comp_heka_ltd"
  parentId: string | null; // null for main category, parent category ID for subcategory
  name: string; // English name
  nameFa: string; // Dari (Farsi) name
  namePs: string; // Pashto name
  slug: string;
  description?: string;
  descriptionFa?: string;
  descriptionPs?: string;
  icon?: string;
  order: number; // Sort order within parent level
  isActive: boolean; // Active status
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  companyId: string; // CRITICAL: Tenant ownership isolation key
  name: string;
  nameFa?: string;
  namePs?: string;
  category: string; // Display or legacy category label
  categoryId?: string | null; // Stable ID of main category
  subcategoryId?: string | null; // Stable ID of subcategory
  description: string;
  descriptionFa?: string;
  descriptionPs?: string;
  images: string[];
  unit: string; // e.g. "box", "piece", "gram", "meter", "kg"
  retailPrice: number;
  currency: string;
  stock: number;
  packageSizes: ProductPackageSize[];
  attributes: ProductAttribute[];
  wholesaleRules: WholesaleRules;
  shippingDetails: ShippingDetails;
  qualityInfo: QualityCertification;
  isPublished: boolean; // Public catalog visibility
  isFeatured?: boolean;
  sellerId?: string; // ID of the user who submitted this product (if seller-submitted)
  sellerName?: string;
  approvalStatus?: ProductApprovalStatus; // 'approved' | 'pending_review' | 'draft' | 'rejected' | 'suspended'
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInquiry {
  id: string;
  requestReference?: string; // Stable human-readable request reference, e.g. "HEKA-RFQ-2026-1001"
  companyId: string; // Strict Tenant Key
  customerName: string;
  customerContact: string; // Phone / WhatsApp / Email
  customerLocation?: string;
  inquiryType: 'retail_question' | 'wholesale_quote' | 'export_inquiry';
  productId?: string;
  productName?: string;
  sellerId?: string; // If quote request is for a seller's product
  customerId?: string; // If submitted by a registered customer
  customerEmail?: string;
  requestedQuantity?: number;
  message: string;
  generatedReply?: string;
  replyLanguage: Language;
  status: 'new' | 'replied' | 'in_progress' | 'closed';
  createdAt: string;
  persistedAt?: string;
  notifications?: QuotationNotificationMap;
}

export interface GeneratedSalesReply {
  text: string;
  language: Language;
  createdAt: string;
  factsUsed: string[];
  missingInfoWarnings: string[];
  hasUnconfirmedDetails: boolean;
  unconfirmedItems: string[];
  companyName: string;
  engineUsed: 'local' | 'gemini';
}

export interface SecurityAuditResult {
  testId: string;
  testName: string;
  testDescription: string;
  targetCompany: string;
  attackingCompany: string;
  actionAttempted: string;
  statusCodeReceived: number;
  expectedStatus: number;
  isIsolated: boolean;
  details: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'invoiced' | 'refunded';

export interface Order {
  id: string; // e.g. "ORD-2026-1042"
  companyId: string; // Tenant isolation key
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerLocation: string;
  clientCompany?: string; // B2B client company name, e.g. "Aura Global Trading"
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingMethod: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  clientCompany?: string;
  location: string;
  type: 'b2b_wholesale' | 'corporate_client' | 'retail_buyer';
  totalOrders: number;
  totalSpent: number;
  currency: string;
  status: 'active' | 'lead' | 'vip';
  lastActive: string;
  notes?: string;
  isDemo?: boolean;
}

export interface AppNotification {
  id: string;
  companyId: string;
  title: string;
  message: string;
  type: 'order' | 'inquiry' | 'security' | 'system' | 'inventory';
  read: boolean;
  timestamp: string;
  linkTab?: string;
}

export interface ActivityItem {
  id: string;
  companyId: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'order' | 'product' | 'inquiry' | 'security' | 'system';
}

export type TicketStatus =
  | 'new'
  | 'open'
  | 'in_progress'
  | 'waiting_customer'
  | 'resolved'
  | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketCategory =
  | 'technical'
  | 'billing'
  | 'logistics'
  | 'quality'
  | 'account'
  | 'general';

export interface SupportTicket {
  id: string; // e.g. "TCK-2026-101"
  ticketNumber: string; // e.g. "TCK-2026-101"
  companyId: string; // Tenant isolation key
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  conversationLanguage: ConversationLanguage; // 'en' | 'fa' | 'ps'
  attachments?: string[];
  createdBy?: string;
  customerContact?: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}


