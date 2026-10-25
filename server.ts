import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbManager } from './src/server/db';
import { generateUniversalSalesReply } from './src/utils/salesAssistantEngine';
import { Language, NotificationChannel } from './src/types';
import {
  dispatchQuotationNotifications,
  getNotificationProviderStatus
} from './src/server/notificationService';
import {
  parseCookies,
  sanitizeUserForClient
} from './src/server/authSecurity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const SESSION_COOKIE_NAME = 'heka_session';

app.use(express.json({ limit: '10mb' }));

function setSessionCookie(req: Request, res: Response, sessionId: string) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const sameSiteDirective = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; HttpOnly; Path=/; Max-Age=604800; ${sameSiteDirective}`
  );
}

function clearSessionCookie(req: Request, res: Response) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const sameSiteDirective = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; ${sameSiteDirective}`
  );
}

// Auth middleware for extracting and checking user via HttpOnly session cookie or Bearer header
function authenticate(req: Request, res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies[SESSION_COOKIE_NAME];
  const authHeader = req.headers.authorization;

  if (!sessionCookie && !authHeader) {
    return res.status(401).json({ error: 'UNAUTHENTICATED: Active session required' });
  }

  const user = dbManager.authenticateRequest(sessionCookie, authHeader);
  if (!user) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS: User session not found or expired' });
  }

  (req as any).user = user;
  next();
}

// -------------------------------------------------------------
// PUBLIC API ENDPOINTS (No login required)
// -------------------------------------------------------------

// 1. Get Public Catalog for any company via slug
app.get('/api/public/catalog/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const company = dbManager.getCompanyBySlug(slug);
  if (!company) {
    return res.status(404).json({ error: 'Company catalog not found' });
  }

  // Strictly return ONLY approved & published products in active categories
  const publishedProducts = dbManager.getProducts(company.id, null, false);
  const activeCategories = dbManager.getCategories(company.id, true);

  res.json({
    company: {
      id: company.id,
      slug: company.slug,
      name: company.name,
      industry: company.industry,
      country: company.country,
      currency: company.currency,
      logoUrl: company.logoUrl,
      bannerUrl: company.bannerUrl,
      brandColors: company.brandColors,
      contactPhone: company.contactPhone,
      contactEmail: company.contactEmail,
      address: company.address,
      settings: company.settings
    },
    products: publishedProducts,
    categories: activeCategories
  });
});

// 1b. Public Active Categories Endpoint (Used by public marketplace & seller forms)
app.get('/api/public/categories', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_heka_ltd';
  const activeCategories = dbManager.getCategories(companyId, true);
  res.json(activeCategories);
});

// 1c. Authenticated Category Management Endpoints (HEKA Admin)
app.get('/api/categories', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const companyId = (req.query.companyId as string) || user.companyId || 'comp_heka_ltd';
  const activeOnly = req.query.activeOnly === 'true' || (user.role !== 'company_admin' && user.role !== 'platform_owner');
  try {
    const categories = dbManager.getCategories(companyId, activeOnly, user);
    res.json(categories);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/categories', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const created = dbManager.createCategory(req.body, user);
    res.status(201).json(created);
  } catch (err: any) {
    const status = err.message.startsWith('FORBIDDEN') || err.message.startsWith('TENANT_ISOLATION') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.put('/api/categories/reorder', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const { orderedIds, companyId } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds array is required' });
    }
    const updated = dbManager.reorderCategories(orderedIds, user, companyId || user.companyId || 'comp_heka_ltd');
    res.json(updated);
  } catch (err: any) {
    const status = err.message.startsWith('FORBIDDEN') || err.message.startsWith('TENANT_ISOLATION') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.put('/api/categories/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const updated = dbManager.updateCategory(req.params.id, req.body, user);
    res.json(updated);
  } catch (err: any) {
    const status = err.message.startsWith('FORBIDDEN') || err.message.startsWith('TENANT_ISOLATION') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const reassignToCategoryId = (req.body?.reassignToCategoryId || req.query.reassignToCategoryId || null) as string | null;
    const reassignToSubcategoryId = (req.body?.reassignToSubcategoryId || req.query.reassignToSubcategoryId || null) as string | null;
    const result = dbManager.deleteCategory(req.params.id, user, {
      reassignToCategoryId,
      reassignToSubcategoryId
    });
    res.json(result);
  } catch (err: any) {
    const status = err.message.startsWith('FORBIDDEN') || err.message.startsWith('TENANT_ISOLATION') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

// 2. Submit Public Customer Inquiry or Wholesale Quote Request (Save-Before-Notify Architecture)
app.post('/api/public/inquiries', async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      customerName,
      customerContact,
      customerLocation,
      inquiryType,
      productId,
      productName,
      requestedQuantity,
      message,
      replyLanguage,
      customerId,
      customerEmail
    } = req.body;

    if (!companyId || !String(companyId).trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR: companyId is required.' });
    }
    if (!customerContact || !String(customerContact).trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR: Customer contact details (phone, WhatsApp, or email) are required.' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR: Quotation request message is required.' });
    }

    // Lookup sellerId if product belongs to a seller
    let sellerId: string | undefined = undefined;
    let resolvedProductName: string | undefined = productName;
    if (productId) {
      const prod = dbManager.getProductById(productId);
      if (prod) {
        if (prod.sellerId) sellerId = prod.sellerId;
        if (!resolvedProductName) resolvedProductName = prod.name;
      }
    }

    // Step 1: Strictly persist quotation request to database BEFORE attempting any notifications
    const persistedInquiry = dbManager.createInquiry({
      companyId: String(companyId).trim(),
      customerName: customerName ? String(customerName).trim() : 'Prospective Commercial Buyer',
      customerContact: String(customerContact).trim(),
      customerLocation: customerLocation ? String(customerLocation).trim() : undefined,
      inquiryType: inquiryType || 'wholesale_quote',
      productId,
      productName: resolvedProductName,
      sellerId,
      customerId,
      customerEmail: customerEmail ? String(customerEmail).trim() : undefined,
      requestedQuantity: parseInt(String(requestedQuantity), 10) || 1,
      message: String(message).trim(),
      replyLanguage: replyLanguage || 'en'
    });

    // Step 2: Dispatch notifications safely (failures never delete or roll back the saved request)
    let finalInquiry = persistedInquiry;
    try {
      const company = dbManager.getCompanyById(persistedInquiry.companyId);
      const updatedMap = await dispatchQuotationNotifications(
        persistedInquiry,
        company?.settings?.notificationDestinations
      );
      const savedWithNotifications = dbManager.updateInquiryNotifications(persistedInquiry.id, updatedMap);
      if (savedWithNotifications) {
        finalInquiry = savedWithNotifications;
      }
    } catch (notifErr) {
      // Never fail or roll back a persisted quotation request due to notification errors
      console.warn('Quotation saved, but post-persistence notification dispatch encountered an error:', notifErr);
    }

    res.status(201).json(finalInquiry);
  } catch (error: any) {
    const msg = error?.message || 'Failed to save quotation request';
    const status = msg.startsWith('VALIDATION_ERROR') ? 400 : 500;
    res.status(status).json({ error: msg });
  }
});

// 3. Image Upload Endpoint (Persists data URLs / base64 image strings)
app.post('/api/upload-image', (req: Request, res: Response) => {
  const { imageData, name } = req.body;
  if (!imageData) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  // Returns persistent image URI
  res.json({
    url: imageData,
    filename: name || `product-image-${Date.now()}`
  });
});

// -------------------------------------------------------------
// AUTHENTICATION, SESSION MANAGEMENT & ONBOARDING
// -------------------------------------------------------------

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { token, email, password, portal } = req.body;
    const user = dbManager.authenticateCredentials({
      email,
      password,
      token,
      portal
    });

    const session = dbManager.createSession(user.id);
    setSessionCookie(req, res, session.id);

    const company = user.companyId ? dbManager.getCompanyById(user.companyId) : null;
    res.json({
      user: sanitizeUserForClient(user),
      company
    });
  } catch (err: any) {
    const msg = err?.message || 'Authentication failed';
    const status = msg.startsWith('FORBIDDEN')
      ? 403
      : msg.startsWith('VALIDATION_ERROR')
      ? 400
      : 401;
    res.status(status).json({ error: msg });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies[SESSION_COOKIE_NAME];
  if (sessionCookie) {
    dbManager.revokeSession(sessionCookie);
  }
  clearSessionCookie(req, res);
  res.json({ success: true });
});

app.get('/api/auth/recovery-status', (_req: Request, res: Response) => {
  const hasEmailProvider = Boolean(
    process.env.RESEND_API_KEY ||
      process.env.SENDGRID_API_KEY ||
      process.env.EMAIL_WEBHOOK_URL
  );
  res.json({
    configured: hasEmailProvider,
    provider: hasEmailProvider ? 'Configured Email Provider' : 'Not Configured',
    message: hasEmailProvider
      ? 'Verified email password recovery is available.'
      : 'Automated password reset emails are not available because no transactional email provider (RESEND_API_KEY or SENDGRID_API_KEY) is configured on the server.'
  });
});

app.post('/api/auth/request-password-reset', (req: Request, res: Response) => {
  const hasEmailProvider = Boolean(
    process.env.RESEND_API_KEY ||
      process.env.SENDGRID_API_KEY ||
      process.env.EMAIL_WEBHOOK_URL
  );
  if (!hasEmailProvider) {
    return res.status(503).json({
      error:
        'PASSWORD_RECOVERY_NOT_CONFIGURED: Automated password recovery is not configured because no server-side email provider (RESEND_API_KEY or SENDGRID_API_KEY) is connected. Please contact HEKA LTD Administration (khanedriss5951@gmail.com) for manual account recovery.'
    });
  }
  res.status(501).json({
    error: 'Password reset token dispatch requires verified sender domain configuration.'
  });
});

// Provisioned Company Registration Flow (Protected: Requires authorized Platform Owner or Admin)
app.post('/api/auth/register-company', authenticate, (req: Request, res: Response) => {
  const requester = (req as any).user;
  try {
    const { name, industry, country, currency, adminEmail, adminName, contactPhone, brandColors } = req.body;
    if (!name || !adminEmail) {
      return res.status(400).json({ error: 'Company name and admin email are required' });
    }

    const result = dbManager.registerCompany(
      {
        name,
        industry: industry || 'Retail & Trade',
        country: country || 'Afghanistan',
        currency: currency || 'USD',
        contactPhone: contactPhone || '+93700000000',
        brandColors: brandColors || { primary: '#1e3a8a', accent: '#3b82f6' }
      },
      adminEmail,
      adminName || 'Company Administrator',
      requester
    );

    res.status(201).json({
      company: result.company,
      user: sanitizeUserForClient(result.user)
    });
  } catch (error: any) {
    const status = error.message.startsWith('FORBIDDEN') ? 403 : 400;
    res.status(status).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// SECURE MULTI-TENANT PRIVATE ENDPOINTS
// -------------------------------------------------------------

// List companies (Platform Owner sees all; Company Admin/Staff only see their own; Customers forbidden)
app.get('/api/companies', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role === 'customer') {
    return res.status(403).json({ error: 'FORBIDDEN: Customers and sellers cannot access private tenant administration.' });
  }
  if (user.role === 'platform_owner') {
    return res.json(dbManager.getCompanies());
  }
  if (user.companyId) {
    const myComp = dbManager.getCompanyById(user.companyId);
    return res.json(myComp ? [myComp] : []);
  }
  res.json([]);
});

// Update company profile and branding (Tenant Admin only)
app.put('/api/companies/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const companyId = req.params.id;

  try {
    const updated = dbManager.updateCompany(companyId, req.body, user);
    res.json(updated);
  } catch (err: any) {
    if (err.message.startsWith('SECURITY_VIOLATION')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// Products: List private inventory for authenticated company
app.get('/api/products', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const requestedCompanyId = (req.query.companyId as string) || user.companyId;

  if (!requestedCompanyId) {
    return res.status(400).json({ error: 'companyId query param required' });
  }

  try {
    const products = dbManager.getProducts(requestedCompanyId, user, true);
    res.json(products);
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }
});

// Create product (Authenticated company admin or staff)
app.post('/api/products', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const newProduct = dbManager.createProduct(req.body, user);
    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Update product (Strict Tenant Check: product must belong to user's company!)
app.put('/api/products/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const productId = req.params.id;

  try {
    const updated = dbManager.updateProduct(productId, req.body, user);
    res.json(updated);
  } catch (err: any) {
    if (err.message.startsWith('SECURITY_BREACH_ATTEMPT')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete product (Strict Tenant Check)
app.delete('/api/products/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const productId = req.params.id;

  try {
    const success = dbManager.deleteProduct(productId, user);
    res.json({ success });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Inquiries: List private leads for company
app.get('/api/inquiries', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const companyId = (req.query.companyId as string) || user.companyId;

  if (!companyId) {
    return res.status(400).json({ error: 'companyId required' });
  }

  try {
    const inquiries = dbManager.getInquiries(companyId, user);
    res.json(inquiries);
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }
});

// Admin: Get Quotation Notification Destinations & Server Provider Readiness
app.get('/api/admin/notification-status', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'company_admin' && user.role !== 'company_staff' && user.role !== 'platform_owner') {
    return res.status(403).json({ error: 'FORBIDDEN: Only authorized corporate staff or administrators can inspect notification configuration.' });
  }

  const companyId = (req.query.companyId as string) || user.companyId || 'comp_heka_ltd';
  if (user.role !== 'platform_owner' && user.companyId !== companyId) {
    return res.status(403).json({ error: `TENANT_ISOLATION_ERROR: Cannot inspect notification configuration for company ${companyId}` });
  }

  const company = dbManager.getCompanyById(companyId);
  const statusSummary = getNotificationProviderStatus(company?.settings?.notificationDestinations);
  res.json(statusSummary);
});

// Admin: Update Quotation Notification Destinations (Email, WhatsApp, Telegram reference/chat_id)
app.put('/api/admin/notification-settings', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const companyId = (req.body?.companyId as string) || user.companyId || 'comp_heka_ltd';

  try {
    const updatedDestinations = dbManager.updateNotificationDestinations(companyId, req.body, user);
    const statusSummary = getNotificationProviderStatus(updatedDestinations);
    res.json(statusSummary);
  } catch (err: any) {
    const status = err.message.startsWith('FORBIDDEN') || err.message.startsWith('TENANT_ISOLATION') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

// Admin: Safely Retry Notifications for a Persisted Quotation Request (Idempotent)
app.post('/api/inquiries/:id/retry-notifications', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'company_admin' && user.role !== 'platform_owner') {
    return res.status(403).json({ error: 'FORBIDDEN: Only authorized HEKA LTD administrators can retry quotation notifications.' });
  }

  try {
    const inquiry = dbManager.getInquiryById(req.params.id, user);
    if (!inquiry) {
      return res.status(404).json({ error: 'Quotation request not found' });
    }

    const company = dbManager.getCompanyById(inquiry.companyId);
    const requestedChannels = Array.isArray(req.body?.channels)
      ? (req.body.channels.filter((c: string) => ['email', 'telegram', 'whatsapp'].includes(c)) as NotificationChannel[])
      : undefined;

    const updatedMap = await dispatchQuotationNotifications(
      inquiry,
      company?.settings?.notificationDestinations,
      {
        targetChannels: requestedChannels,
        forceDuplicateSend: Boolean(req.body?.forceDuplicateSend)
      }
    );

    const updatedInquiry = dbManager.updateInquiryNotifications(inquiry.id, updatedMap);
    res.json(updatedInquiry || inquiry);
  } catch (err: any) {
    const status = err.message.startsWith('SECURITY') || err.message.startsWith('FORBIDDEN') ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

// Support Tickets: List private tickets for company
app.get('/api/support/tickets', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const companyId = (req.query.companyId as string) || user.companyId;

  if (!companyId) {
    return res.status(400).json({ error: 'companyId required' });
  }

  try {
    const tickets = dbManager.getSupportTickets(companyId, user);
    res.json(tickets);
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }
});

// Support Tickets: Create a new support ticket
app.post('/api/support/tickets', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const newTicket = dbManager.createSupportTicket(req.body, user);
    res.status(201).json(newTicket);
  } catch (err: any) {
    const status = err.message.startsWith('SECURITY') || err.message.startsWith('FORBIDDEN') ? 403 : 500;
    return res.status(status).json({ error: err.message });
  }
});

// Support Tickets: Update ticket status or fields
app.patch('/api/support/tickets/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const ticketId = req.params.id;
  try {
    const updated = dbManager.updateSupportTicket(ticketId, req.body, user);
    res.json(updated);
  } catch (err: any) {
    const status = err.message.startsWith('SECURITY') || err.message.startsWith('FORBIDDEN') ? 403 : 500;
    return res.status(status).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// CUSTOMER & SELLER PLATFORM ENDPOINTS
// -------------------------------------------------------------

// Customer Registration (Personal or Business with Secure Password Hashing)
app.post('/api/auth/register-customer', (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      accountType,
      personalProfile,
      businessProfile,
      country,
      city,
      phone,
      preferredLanguage
    } = req.body;

    const newUser = dbManager.registerCustomer({
      name,
      email,
      password,
      confirmPassword,
      accountType: accountType || 'personal',
      personalProfile,
      businessProfile,
      country,
      city,
      phone,
      preferredLanguage
    });

    const session = dbManager.createSession(newUser.id);
    setSessionCookie(req, res, session.id);

    res.status(201).json({
      user: sanitizeUserForClient(newUser)
    });
  } catch (err: any) {
    const msg = err?.message || 'Registration failed';
    const status = msg.startsWith('DUPLICATE_EMAIL')
      ? 409
      : msg.startsWith('PERSISTENCE_ERROR')
      ? 500
      : 400;
    res.status(status).json({ error: msg });
  }
});

// Get Current User Profile (Sanitized: never exposes passwordHash or token)
app.get('/api/users/profile', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user: sanitizeUserForClient(user) });
});

// Update User Profile (Switch Account Type, Update Personal/Business Details)
app.put('/api/users/profile', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const updatedUser = dbManager.updateUserProfile(user.id, req.body, user);
    res.json({ user: sanitizeUserForClient(updatedUser) });
  } catch (err: any) {
    const status = err.message.startsWith('SECURITY_BREACH_ATTEMPT') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

// Change Password for Authenticated User
app.put('/api/users/password', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    dbManager.changeUserPassword(user.id, currentPassword, newPassword, confirmPassword, user);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    const msg = err?.message || 'Password update failed';
    const status = msg.startsWith('SECURITY_BREACH_ATTEMPT')
      ? 403
      : msg.startsWith('INVALID_CREDENTIALS')
      ? 401
      : 400;
    res.status(status).json({ error: msg });
  }
});

// Bookmark / Save Product
app.post('/api/users/save-product', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'productId is required' });
  }

  try {
    const savedProductIds = dbManager.toggleSaveProduct(user.id, productId, user);
    res.json({ savedProductIds });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Customer Quotation Requests & Inquiries
app.get('/api/customer/inquiries', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const inquiries = dbManager.getCustomerInquiries(user.id, user.email, user);
    res.json(inquiries);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Customer Saved Products Full Details
app.get('/api/customer/saved-products', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const savedIds = user.savedProductIds || [];
  const products = savedIds.map((id: string) => dbManager.getProductById(id)).filter(Boolean);
  res.json(products);
});

// Seller Application: Get Current Status
app.get('/api/seller/application', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const appData = dbManager.getSellerApplication(user.id, user);
    res.json({ application: appData, sellerStatus: user.sellerStatus || 'none' });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Seller Application: Submit Application
app.post('/api/seller/application', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const { businessName, businessType, country, city, phone, email, description, productCategories, registrationNumber, documents } = req.body;
    if (!businessName || !description) {
      return res.status(400).json({ error: 'Business name and description are required.' });
    }

    const application = dbManager.submitSellerApplication({
      userId: user.id,
      applicantName: user.name,
      businessName,
      businessType: businessType || (user.businessProfile?.businessType || 'Wholesale / Distribution'),
      country: country || user.country || 'United Kingdom',
      city: city || user.city || 'London',
      phone: phone || user.phone || '',
      email: email || user.email,
      description,
      productCategories: productCategories || ['General'],
      registrationNumber,
      documents
    }, user);

    res.status(201).json({ application });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Seller: List My Products
app.get('/api/seller/products', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const products = dbManager.getSellerProducts(user.id, user);
    res.json(products);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Seller: Submit New Product for Admin Review (Unpublished by default)
app.post('/api/seller/products', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const product = dbManager.createSellerProduct(req.body, user);
    res.status(201).json(product);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Seller: Update My Product (Triggers re-review by Admin)
app.put('/api/seller/products/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const productId = req.params.id;
  try {
    const product = dbManager.updateSellerProduct(productId, req.body, user);
    res.json(product);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Seller: Incoming Customer Quotes & Inquiries for My Products
app.get('/api/seller/inquiries', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const inquiries = dbManager.getSellerInquiries(user.id, user);
    res.json(inquiries);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// HEKA LTD ADMIN: SELLER & PRODUCT APPROVAL MANAGEMENT
// -------------------------------------------------------------

// Admin: Get All Seller Applications
app.get('/api/admin/seller-applications', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const applications = dbManager.getAllSellerApplications(user);
    res.json(applications);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Admin: Review Seller Application (Approve / Reject / Suspend)
app.put('/api/admin/seller-applications/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const applicationId = req.params.id;
  const { status, adminNotes, rejectionReason } = req.body;

  if (!status || !['approved', 'rejected', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (approved, rejected, suspended) is required' });
  }

  try {
    const appResult = dbManager.reviewSellerApplication(applicationId, status, adminNotes, rejectionReason, user);
    res.json(appResult);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Admin: Get All Submitted Products for Review
app.get('/api/admin/product-reviews', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const products = dbManager.getAllProductsForReview(user);
    res.json(products);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Admin: Review Product Submission (Approve / Reject / Suspend)
app.put('/api/admin/product-reviews/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const productId = req.params.id;
  const { approvalStatus, rejectionReason } = req.body;

  if (!approvalStatus || !['approved', 'pending_review', 'rejected', 'draft', 'suspended'].includes(approvalStatus)) {
    return res.status(400).json({ error: 'Valid approvalStatus is required' });
  }

  try {
    const product = dbManager.reviewProductSubmission(productId, approvalStatus, rejectionReason, user);
    res.json(product);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Admin: Get All Customer Accounts
app.get('/api/admin/customers', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const customers = dbManager.getCustomerAccounts(user);
    res.json(customers);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// AI Sales Assistant endpoint (strictly grounded in company & product facts)
app.post('/api/ai/generate-reply', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'company_admin' && user.role !== 'company_staff' && user.role !== 'platform_owner') {
    return res.status(403).json({ error: 'FORBIDDEN: Only authorized company staff and administrators can use the AI Sales Assistant.' });
  }

  const { productId, customerMessage, targetLang } = req.body;
  if (!productId || !customerMessage) {
    return res.status(400).json({ error: 'productId and customerMessage required' });
  }

  const product = dbManager.getProductById(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (user.role !== 'platform_owner' && user.companyId !== product.companyId) {
    return res.status(403).json({
      error: `TENANT_ISOLATION_ERROR: User ${user.email} cannot generate sales replies for products of company ${product.companyId}.`
    });
  }

  const company = dbManager.getCompanyById(product.companyId);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  const reply = generateUniversalSalesReply(product, company, customerMessage, (targetLang as Language) || 'fa');

  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI();
      const prompt = `You are a professional B2B customer sales assistant for "${company.name}".
A customer sent the following message:
"${customerMessage}"

Product Name: ${targetLang === 'fa' ? (product.nameFa || product.name) : product.name}
Facts verified from catalog:
${reply.factsUsed.map((f) => `- ${f}`).join('\n')}

Unconfirmed/missing items:
${reply.unconfirmedItems.length > 0 ? reply.unconfirmedItems.map((u) => `- ${u} (UNCONFIRMED - do NOT promise or invent)`).join('\n') : 'None'}

Target Language: ${targetLang === 'fa' ? 'Persian (Farsi/Dari)' : targetLang === 'ps' ? 'Pashto' : 'English'}

Write a polite, professional sales response directly answering the customer based ONLY on the verified facts above.
DO NOT hallucinate or promise unconfirmed information. If something is unconfirmed, politely state that it will need to be confirmed directly with sales management.
Keep the tone natural, helpful, and concise.`;

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      if (geminiRes.text) {
        reply.text = geminiRes.text.trim();
        reply.engineUsed = 'gemini';
      }
    } catch (geminiErr) {
      console.warn('Gemini generation fallback to local engine:', geminiErr);
    }
  }

  res.json(reply);
});

// Automated Cross-Tenant Security Audit endpoint
app.post('/api/tests/cross-tenant-isolation', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'company_admin' && user.role !== 'platform_owner') {
    return res.status(403).json({ error: 'FORBIDDEN: Only authorized administrators can run security audits.' });
  }
  const auditResults = dbManager.runCrossTenantSecurityAudit();
  res.json({
    timestamp: new Date().toISOString(),
    totalTests: auditResults.length,
    allPassed: auditResults.every((r) => r.isIsolated),
    results: auditResults
  });
});

// -------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// -------------------------------------------------------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DukanAI SaaS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
