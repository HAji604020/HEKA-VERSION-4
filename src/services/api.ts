import {
  Company,
  Product,
  User,
  CustomerInquiry,
  GeneratedSalesReply,
  SecurityAuditResult,
  SupportTicket,
  SellerApplication,
  AccountType,
  ProductApprovalStatus,
  SellerStatus,
  PersonalProfile,
  BusinessProfile,
  ProductCategory,
  NotificationProviderStatusSummary,
  QuotationNotificationDestinations,
  NotificationChannel
} from '../types';

let currentAuthToken: string = '';

export const api = {
  setToken(token: string) {
    // Keep only in-memory for optional evaluation calls; never store raw tokens in localStorage
    currentAuthToken = token;
    try {
      localStorage.removeItem('heka_auth_token');
    } catch {
      // ignore
    }
  },

  clearToken() {
    currentAuthToken = '';
    try {
      localStorage.removeItem('heka_auth_token');
    } catch {
      // ignore
    }
  },

  getToken(): string {
    return currentAuthToken;
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include',
      headers
    });

    if (!response.ok) {
      let errMsg = `Request failed: ${response.status} ${response.statusText}`;
      try {
        const data = await response.json();
        if (data.error) errMsg = data.error;
      } catch {
        // fallback
      }
      throw new Error(errMsg);
    }

    return response.json();
  },

  // Public Catalog API
  async getPublicCatalog(slug: string): Promise<{ company: Company; products: Product[]; categories?: ProductCategory[] }> {
    return this.request<{ company: Company; products: Product[]; categories?: ProductCategory[] }>(`/api/public/catalog/${slug}`);
  },

  async getPublicCategories(companyId = 'comp_heka_ltd'): Promise<ProductCategory[]> {
    return this.request<ProductCategory[]>(`/api/public/categories?companyId=${encodeURIComponent(companyId)}`);
  },

  // Category Management API (Admin & Seller)
  async getCategories(companyId = 'comp_heka_ltd', activeOnly = false): Promise<ProductCategory[]> {
    return this.request<ProductCategory[]>(
      `/api/categories?companyId=${encodeURIComponent(companyId)}&activeOnly=${activeOnly ? 'true' : 'false'}`
    );
  },

  async createCategory(payload: Partial<ProductCategory>): Promise<ProductCategory> {
    return this.request<ProductCategory>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateCategory(categoryId: string, updates: Partial<ProductCategory>): Promise<ProductCategory> {
    return this.request<ProductCategory>(`/api/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async reorderCategories(orderedIds: { id: string; order: number }[], companyId = 'comp_heka_ltd'): Promise<ProductCategory[]> {
    return this.request<ProductCategory[]>('/api/categories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds, companyId })
    });
  },

  async deleteCategory(
    categoryId: string,
    options?: { reassignToCategoryId?: string | null; reassignToSubcategoryId?: string | null }
  ): Promise<{ deletedId: string; reassignedProductsCount: number }> {
    return this.request<{ deletedId: string; reassignedProductsCount: number }>(`/api/categories/${categoryId}`, {
      method: 'DELETE',
      body: JSON.stringify(options || {})
    });
  },

  async submitPublicInquiry(inquiry: Partial<CustomerInquiry>): Promise<CustomerInquiry> {
    return this.request<CustomerInquiry>('/api/public/inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiry)
    });
  },

  // Auth, Session Management & Onboarding
  async login(
    email: string,
    token?: string,
    portal: 'admin' | 'customer' = 'admin',
    password?: string
  ): Promise<{ user: User; company: Company | null }> {
    const res = await this.request<{ user: User; company: Company | null }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, token, portal })
    });
    // Session is maintained via HttpOnly cookie; clear any temporary evaluation header token
    this.clearToken();
    return res;
  },

  async logout(): Promise<{ success: boolean }> {
    this.clearToken();
    try {
      return await this.request<{ success: boolean }>('/api/auth/logout', {
        method: 'POST'
      });
    } catch {
      return { success: true };
    }
  },

  async getRecoveryStatus(): Promise<{ configured: boolean; provider: string; message: string }> {
    return this.request<{ configured: boolean; provider: string; message: string }>('/api/auth/recovery-status');
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async registerCustomer(payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    accountType: AccountType;
    personalProfile?: PersonalProfile;
    businessProfile?: BusinessProfile;
    country?: string;
    city?: string;
    phone?: string;
    preferredLanguage?: Language;
  }): Promise<{ user: User }> {
    const res = await this.request<{ user: User }>('/api/auth/register-customer', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    this.clearToken();
    return res;
  },

  async getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/users/profile');
  },

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/users/password', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async toggleSaveProduct(productId: string): Promise<{ savedProductIds: string[] }> {
    return this.request<{ savedProductIds: string[] }>('/api/users/save-product', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
  },

  async getCustomerInquiries(): Promise<CustomerInquiry[]> {
    return this.request<CustomerInquiry[]>('/api/customer/inquiries');
  },

  async getCustomerSavedProducts(): Promise<Product[]> {
    return this.request<Product[]>('/api/customer/saved-products');
  },

  // Seller Application & Management
  async getSellerApplication(): Promise<{ application: SellerApplication | null; sellerStatus: SellerStatus }> {
    return this.request<{ application: SellerApplication | null; sellerStatus: SellerStatus }>('/api/seller/application');
  },

  async submitSellerApplication(payload: {
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
  }): Promise<{ application: SellerApplication }> {
    return this.request<{ application: SellerApplication }>('/api/seller/application', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getSellerProducts(): Promise<Product[]> {
    return this.request<Product[]>('/api/seller/products');
  },

  async createSellerProduct(product: Partial<Product>): Promise<Product> {
    return this.request<Product>('/api/seller/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  },

  async updateSellerProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/api/seller/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async getSellerInquiries(): Promise<CustomerInquiry[]> {
    return this.request<CustomerInquiry[]>('/api/seller/inquiries');
  },

  // HEKA Admin Review Endpoints
  async getAdminSellerApplications(): Promise<SellerApplication[]> {
    return this.request<SellerApplication[]>('/api/admin/seller-applications');
  },

  async reviewSellerApplication(
    applicationId: string,
    status: 'approved' | 'rejected' | 'suspended',
    adminNotes?: string,
    rejectionReason?: string
  ): Promise<SellerApplication> {
    return this.request<SellerApplication>(`/api/admin/seller-applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes, rejectionReason })
    });
  },

  async getAdminProductReviews(): Promise<Product[]> {
    return this.request<Product[]>('/api/admin/product-reviews');
  },

  async reviewProductSubmission(
    productId: string,
    approvalStatus: ProductApprovalStatus,
    rejectionReason?: string
  ): Promise<Product> {
    return this.request<Product>(`/api/admin/product-reviews/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ approvalStatus, rejectionReason })
    });
  },

  async getAdminCustomers(): Promise<User[]> {
    return this.request<User[]>('/api/admin/customers');
  },

  async registerCompany(payload: {
    name: string;
    industry: string;
    country: string;
    currency: string;
    adminEmail: string;
    adminName: string;
    contactPhone: string;
    brandColors?: { primary: string; accent: string };
  }): Promise<{ company: Company; user: User }> {
    const res = await this.request<{ company: Company; user: User }>('/api/auth/register-company', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.user?.token) {
      this.setToken(res.user.token);
    }
    return res;
  },

  // Companies
  async getCompanies(): Promise<Company[]> {
    return this.request<Company[]>('/api/companies');
  },

  async updateCompany(companyId: string, updates: Partial<Company>): Promise<Company> {
    return this.request<Company>(`/api/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // Products
  async getProducts(companyId: string): Promise<Product[]> {
    return this.request<Product[]>(`/api/products?companyId=${encodeURIComponent(companyId)}`);
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    return this.request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  },

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteProduct(productId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/products/${productId}`, {
      method: 'DELETE'
    });
  },

  // Image Upload
  async uploadImage(imageData: string, name?: string): Promise<{ url: string }> {
    return this.request<{ url: string }>('/api/upload-image', {
      method: 'POST',
      body: JSON.stringify({ imageData, name })
    });
  },

  // Inquiries & Quotation Notifications
  async getInquiries(companyId: string): Promise<CustomerInquiry[]> {
    return this.request<CustomerInquiry[]>(`/api/inquiries?companyId=${encodeURIComponent(companyId)}`);
  },

  async getNotificationStatus(companyId = 'comp_heka_ltd'): Promise<NotificationProviderStatusSummary> {
    return this.request<NotificationProviderStatusSummary>(
      `/api/admin/notification-status?companyId=${encodeURIComponent(companyId)}`
    );
  },

  async updateNotificationSettings(
    payload: Partial<QuotationNotificationDestinations> & { companyId?: string }
  ): Promise<NotificationProviderStatusSummary> {
    return this.request<NotificationProviderStatusSummary>('/api/admin/notification-settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async retryInquiryNotifications(
    inquiryId: string,
    channels?: NotificationChannel[]
  ): Promise<CustomerInquiry> {
    return this.request<CustomerInquiry>(`/api/inquiries/${encodeURIComponent(inquiryId)}/retry-notifications`, {
      method: 'POST',
      body: JSON.stringify({ channels })
    });
  },

  // AI Grounded Sales Engine
  async generateAIReply(productId: string, customerMessage: string, targetLang: string): Promise<GeneratedSalesReply> {
    return this.request<GeneratedSalesReply>('/api/ai/generate-reply', {
      method: 'POST',
      body: JSON.stringify({ productId, customerMessage, targetLang })
    });
  },

  // Cross-Tenant Security Audit
  async runSecurityAudit(): Promise<{
    timestamp: string;
    totalTests: number;
    allPassed: boolean;
    results: SecurityAuditResult[];
  }> {
    return this.request('/api/tests/cross-tenant-isolation', {
      method: 'POST'
    });
  },

  // Support Tickets API
  async getSupportTickets(companyId: string): Promise<SupportTicket[]> {
    return this.request<SupportTicket[]>(`/api/support/tickets?companyId=${encodeURIComponent(companyId)}`);
  },

  async createSupportTicket(ticket: Partial<SupportTicket>): Promise<SupportTicket> {
    return this.request<SupportTicket>('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket)
    });
  },

  async updateSupportTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    return this.request<SupportTicket>(`/api/support/tickets/${encodeURIComponent(ticketId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }
};
