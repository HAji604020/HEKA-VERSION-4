import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { CustomersView } from './components/CustomersView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { OrderDetailModal } from './components/OrderDetailModal';
import { NotificationsModal } from './components/NotificationsModal';
import { PublicCatalogView } from './components/PublicCatalogView';
import { ProductManagement } from './components/ProductManagement';
import { SalesAIView } from './components/SalesAIView';
import { InquiryManagement } from './components/InquiryManagement';
import { CompanyProfileView } from './components/CompanyProfileView';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SupportView } from './components/SupportView';
import { AuthModal } from './components/AuthModal';
import { CategoryManagement } from './components/CategoryManagement';
import { AdminProductReview } from './components/AdminProductReview';
import { AdminSellerReview } from './components/AdminSellerReview';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerDashboardView } from './components/CustomerDashboardView';
import { SellerAreaView } from './components/SellerAreaView';
import {
  Company,
  Product,
  User,
  CustomerInquiry,
  Language,
  Order,
  Customer,
  ActivityItem,
  AppNotification,
  SupportTicket,
  ProductCategory
} from './types';
import {
  sampleOrders,
  sampleCustomers,
  sampleActivities,
  sampleNotifications,
  sampleSalesTrend
} from './data/sampleData';
import { translations, tr } from './translations';
import { api } from './services/api';
import {
  ShieldCheck,
  ArrowLeft,
  Bell,
  Store,
  Lock,
  LayoutDashboard,
  Package,
  FolderTree,
  Sparkles,
  MessageSquare,
  Building2,
  CheckCircle2,
  ShoppingCart,
  PlusCircle,
  Users
} from 'lucide-react';

export default function App() {
  // Persist language across reloads
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('heka_lang');
      if (stored === 'fa' || stored === 'en' || stored === 'ps') return stored;
    } catch {
      // fallback
    }
    return 'en';
  });

  // Protected route checking: Default visitor view is ALWAYS 'public' (Customer-First Homepage)
  const getInitialRoute = (): 'public' | 'admin' => {
    try {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const isAuthLoggedIn = localStorage.getItem('heka_auth_logged_in') === 'true';

      if (
        (path === '/admin' || path === '/dashboard' || path === '/portal' || hash === '#admin' || hash === '#dashboard' || search.get('view') === 'admin') &&
        isAuthLoggedIn
      ) {
        return 'admin';
      }
    } catch {
      // fallback
    }
    return 'public'; // DEFAULT is ALWAYS Customer-First Public Homepage & Catalog!
  };

  const [currentRoute, setCurrentRoute] = useState<'public' | 'admin' | 'customer' | 'seller'>(getInitialRoute);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('heka_auth_logged_in') === 'true' && Boolean(localStorage.getItem('heka_auth_token'));
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);

  // Authenticated corporate user state (only populated after verified backend login)
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user_heka_admin',
    email: 'admin@hekaltd.com',
    name: 'HEKA Corporate Director',
    role: 'company_admin',
    companyId: 'comp_heka_ltd'
  });

  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState<boolean>(false);

  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>(sampleOrders['comp_heka_ltd'] || []);
  const [customers, setCustomers] = useState<Customer[]>(sampleCustomers['comp_heka_ltd'] || []);
  const [activities, setActivities] = useState<ActivityItem[]>(sampleActivities['comp_heka_ltd'] || []);
  const [notifications, setNotifications] = useState<AppNotification[]>(sampleNotifications['comp_heka_ltd'] || []);
  const [salesTrend, setSalesTrend] = useState<{ month: string; revenue: number; orders: number; target: number }[]>(
    sampleSalesTrend['comp_heka_ltd'] || []
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isSecurityAuditOpen, setIsSecurityAuditOpen] = useState<boolean>(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);

  // Transfer state from inquiry to AI Sales Assistant
  const [inquiryForAI, setInquiryForAI] = useState<CustomerInquiry | null>(null);

  const isRtl = currentLang === 'fa' || currentLang === 'ps';

  // Sync RTL/LTR & language in HTML document
  useEffect(() => {
    try {
      localStorage.setItem('heka_lang', currentLang);
    } catch {
      // fallback
    }
    document.documentElement.lang = currentLang;
    document.documentElement.dir = (currentLang === 'fa' || currentLang === 'ps') ? 'rtl' : 'ltr';
  }, [currentLang]);

  // Load public catalog without requiring or exposing any admin token
  const loadPublicCatalogData = async (slug = 'heka-ltd') => {
    setIsLoading(true);
    try {
      const pub = await api.getPublicCatalog(slug);
      setCurrentCompany(pub.company);
      setProducts(pub.products || []);
      setCategories(pub.categories || []);
    } catch (err) {
      console.error('Failed to load public catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load private tenant data for verified corporate admin/staff sessions only
  const loadTenantData = async (companyId?: string, verifiedUser?: User) => {
    setIsLoading(true);
    try {
      let activeUser = verifiedUser || currentUser;
      // 1. Verify session & role with backend if not already verified
      if (!verifiedUser) {
        const profileRes = await api.getProfile();
        const u = profileRes.user;
        if (!u || (u.role !== 'company_admin' && u.role !== 'platform_owner' && u.role !== 'company_staff')) {
          // Block customer/seller from accessing admin state
          setIsAuthenticated(false);
          setCurrentRoute('public');
          await loadPublicCatalogData('heka-ltd');
          return;
        }
        setCurrentUser(u);
        activeUser = u;
      }

      // 2. Get authorized companies for this user
      const companies = await api.getCompanies();
      setAllCompanies(companies);

      const targetId =
        activeUser.role === 'platform_owner'
          ? (companyId || companies[0]?.id || 'comp_heka_ltd')
          : (activeUser.companyId || companies[0]?.id || 'comp_heka_ltd');

      const comp = companies.find((c) => c.id === targetId) || companies[0] || null;
      setCurrentCompany(comp);

      if (comp) {
        // 3. Load private products & hierarchical categories for this authorized tenant
        const [prods, cats] = await Promise.all([
          api.getProducts(comp.id),
          api.getCategories(comp.id, false)
        ]);
        setProducts(prods);
        setCategories(cats);

        // 4. Load private inquiries for this tenant
        const inqs = await api.getInquiries(comp.id);
        setInquiries(inqs);

        // 5. Load private support tickets for this tenant
        try {
          const tcks = await api.getSupportTickets(comp.id);
          setSupportTickets(tcks);
        } catch (e) {
          console.warn('Could not load persistent support tickets:', e);
        }

        // 6. Load tenant-specific demo orders & customers
        setOrders(sampleOrders[comp.id] || sampleOrders['comp_heka_ltd'] || []);
        setCustomers(sampleCustomers[comp.id] || sampleCustomers['comp_heka_ltd'] || []);
        setActivities(sampleActivities[comp.id] || sampleActivities['comp_heka_ltd'] || []);
        setNotifications(sampleNotifications[comp.id] || sampleNotifications['comp_heka_ltd'] || []);
        setSalesTrend(sampleSalesTrend[comp.id] || sampleSalesTrend['comp_heka_ltd'] || []);
      }
    } catch (err: any) {
      console.warn('Session verification or tenant load failed, falling back to public catalog:', err);
      setIsAuthenticated(false);
      setCurrentRoute('public');
      await loadPublicCatalogData('heka-ltd');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { user } = await api.getProfile();
        if (user) {
          if (user.role === 'customer') {
            setCustomerUser(user);
            setIsAuthenticated(false);
            await loadPublicCatalogData('heka-ltd');
            return;
          }
          if (user.role === 'company_admin' || user.role === 'platform_owner' || user.role === 'company_staff') {
            setCurrentUser(user);
            setIsAuthenticated(true);
            await loadTenantData(user.companyId || 'comp_heka_ltd', user);
            return;
          }
        }
      } catch {
        // No active server session cookie
      }
      setIsAuthenticated(false);
      await loadPublicCatalogData('heka-ltd');
    };
    restoreSession();
  }, []);

  // Handle browser navigation & popstate
  useEffect(() => {
    const handleUrlChange = async () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash === '#admin' || path === '/admin' || hash === '#dashboard' || path === '/dashboard') {
        try {
          const { user } = await api.getProfile();
          if (user && (user.role === 'company_admin' || user.role === 'platform_owner' || user.role === 'company_staff')) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            setCurrentRoute('admin');
            return;
          }
        } catch {
          // fall through to auth modal
        }
        setIsAuthenticated(false);
        setCurrentRoute('public');
        setIsAuthModalOpen(true);
      } else {
        setCurrentRoute('public');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Route switcher
  const navigateToRoute = (target: 'public' | 'admin') => {
    if (target === 'admin') {
      if (!isAuthenticated || (currentUser.role !== 'company_admin' && currentUser.role !== 'platform_owner' && currentUser.role !== 'company_staff')) {
        setIsAuthModalOpen(true);
        return;
      }
      setCurrentRoute('admin');
      try {
        window.history.pushState(null, '', '#admin');
      } catch {
        // fallback
      }
    } else {
      setCurrentRoute('public');
      try {
        window.history.pushState(null, '', window.location.pathname.replace(/#admin|#dashboard/, ''));
      } catch {
        // fallback
      }
    }
  };

  // Auth handler (Corporate Admin / Staff Portal)
  const handleAuthSuccess = (user: User, company: Company | null) => {
    if (user.role !== 'company_admin' && user.role !== 'platform_owner' && user.role !== 'company_staff') {
      setIsAuthenticated(false);
      api.clearToken();
      return;
    }
    // Clear any active customer session to avoid mixed role tokens
    setCustomerUser(null);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('heka_auth_logged_in', 'true');
    } catch {
      // fallback
    }
    setCurrentUser(user);
    if (company) {
      setCurrentCompany(company);
      loadTenantData(company.id, user);
    } else {
      loadTenantData('comp_heka_ltd', user);
    }
    setCurrentRoute('admin');
    try {
      window.history.pushState(null, '', '#admin');
    } catch {
      // fallback
    }
  };

  const handleSignOut = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setCustomerUser(null);
    loadPublicCatalogData('heka-ltd');
    navigateToRoute('public');
  };

  // Tenant switch (Strictly restricted to Platform Owner using their own token)
  const handleSelectCompany = async (companyId: string) => {
    if (currentUser.role !== 'platform_owner' && currentUser.companyId !== companyId) {
      return;
    }
    const comp = allCompanies.find((c) => c.id === companyId);
    if (!comp) return;

    setCurrentCompany(comp);

    try {
      const [prods, cats, inqs] = await Promise.all([
        api.getProducts(companyId),
        api.getCategories(companyId, false),
        api.getInquiries(companyId)
      ]);
      setProducts(prods);
      setCategories(cats);
      setInquiries(inqs);
      setOrders(sampleOrders[companyId] || sampleOrders['comp_heka_ltd'] || []);
      setCustomers(sampleCustomers[companyId] || sampleCustomers['comp_heka_ltd'] || []);
      setActivities(sampleActivities[companyId] || sampleActivities['comp_heka_ltd'] || []);
      setNotifications(sampleNotifications[companyId] || sampleNotifications['comp_heka_ltd'] || []);
      setSalesTrend(sampleSalesTrend[companyId] || sampleSalesTrend['comp_heka_ltd'] || []);
    } catch (err: any) {
      console.warn('Tenant data reload error:', err);
    }
  };

  // Switch role only through authenticated login
  const handleSwitchUserRole = async (email: string) => {
    try {
      const { user, company } = await api.login(email, undefined, 'admin');
      handleAuthSuccess(user, company);
    } catch (err: any) {
      console.error(`Authentication error: ${err.message}`);
    }
  };

  // Handle transfer from Inquiries tab to AI Sales Assistant
  const handleSelectInquiryForAI = (inq: CustomerInquiry) => {
    setInquiryForAI(inq);
    setActiveTab('sales_ai');
  };

  // Handle new company created via Onboarding wizard
  const handleCompanyCreated = (newCompany: Company) => {
    setAllCompanies((prev) => [...prev, newCompany]);
    setCurrentCompany(newCompany);
    setProducts([]);
    setInquiries([]);
    setOrders([]);
    setCustomers([]);
    setActiveTab('dashboard');
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSelectNotification = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    if (notif.linkTab) {
      setActiveTab(notif.linkTab);
      setIsNotificationsModalOpen(false);
    }
  };

  const t = translations[currentLang] || translations.en;

  // Fallback HEKA LTD company object if initial fetch is pending
  const displayCompany: Company = currentCompany || {
    id: 'comp_heka_ltd',
    slug: 'heka-ltd',
    name: 'HEKA LTD',
    industry: 'International Trade & Premium Distribution',
    country: 'United Kingdom / Global',
    currency: 'USD',
    logoUrl: '/heka-logo.jpg',
    bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    brandColors: {
      primary: '#101C35',
      accent: '#C9A96E',
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
      customGreetingFa: 'به درگاه رسمی شرکت تجارتی و توزیع بین‌المللی HEKA LTD خوش آمدید.'
    },
    createdAt: '2026-01-10T08:00:00Z'
  };

  return (
    <div
      className="min-h-screen flex flex-col antialiased selection:bg-[#C9A96E]/30 selection:text-[#101C35] dark:selection:text-white transition-colors duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {currentRoute === 'public' ? (
        /* ============================================================ */
        /* 1. CUSTOMER-FIRST HOMEPAGE AND REAL PRODUCT CATALOG          */
        /* Default landing experience for all visitors                  */
        /* ============================================================ */
        <>
          {/* Authenticated Staff / Admin Quick-Return Bar (ONLY shown when signed in as staff/admin) */}
          {isAuthenticated && (
            <div className="bg-[#0B1220] text-white border-b border-[#C9A96E]/30 px-4 py-2 text-xs z-50 sticky top-0">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/40 font-bold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {tr(
                        currentLang,
                        `Authenticated Staff View (${currentUser.name})`,
                        `پیش‌نمایش کاتالوگ عمومی (${currentUser.name})`,
                        `د عمومي کاتالوګ مخکتنه (${currentUser.name})`
                      )}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dashboard');
                      navigateToRoute('admin');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#C9A96E] text-[#0B1220] font-extrabold hover:bg-[#d8be8d] transition cursor-pointer flex items-center gap-1"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>{tr(currentLang, 'Return to Admin Portal', 'بازگشت به پیشخوان مدیریت', 'مدیریت پورټل ته ستنېدل')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('products');
                      navigateToRoute('admin');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Package className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>{t.tabProducts || tr(currentLang, 'Products', 'محصولات و انبار', 'محصولات او انبار')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('categories');
                      navigateToRoute('admin');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <FolderTree className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>{tr(currentLang, 'Categories', 'دسته‌بندی‌ها', 'کټګورۍ')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('sales_ai');
                      navigateToRoute('admin');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>{t.tabSalesAI || tr(currentLang, 'AI Sales Assistant', 'دستیار هوشمند فروش', 'د پلور ځیرک مرستیال')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('inquiries');
                      navigateToRoute('admin');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>{t.tabInquiries || tr(currentLang, 'Quotations & Inquiries', 'استعلام قیمت', 'استعلامونه او نرخونه')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('company_profile');
                      navigateToRoute('admin');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>{t.tabCompanyProfile || tr(currentLang, 'Company Profile', 'پروفایل شرکت', 'د شرکت پروفایل')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <PublicCatalogView
            company={displayCompany}
            products={products}
            categories={categories}
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
            onOpenManagementPortal={() => navigateToRoute('admin')}
            onOpenCustomerPortal={() => {
              if (customerUser) {
                setCurrentRoute('customer');
              } else {
                setIsCustomerAuthOpen(true);
              }
            }}
            customerUser={customerUser}
          />
        </>
      ) : currentRoute === 'customer' && customerUser ? (
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <CustomerDashboardView
            currentUser={customerUser}
            onUpdateUser={(updated) => setCustomerUser(updated)}
            onLogout={async () => {
              await api.logout();
              setCustomerUser(null);
              loadPublicCatalogData('heka-ltd');
              setCurrentRoute('public');
            }}
            onNavigateToCatalog={() => {
              loadPublicCatalogData('heka-ltd');
              setCurrentRoute('public');
            }}
            onNavigateToSellerArea={() => setCurrentRoute('seller')}
            currentLang={currentLang}
          />
        </div>
      ) : currentRoute === 'seller' && customerUser ? (
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <SellerAreaView
            currentUser={customerUser}
            onBackToDashboard={() => setCurrentRoute('customer')}
            onNavigateToCatalog={() => {
              loadPublicCatalogData('heka-ltd');
              setCurrentRoute('public');
            }}
            currentLang={currentLang}
          />
        </div>
      ) : (
        /* ============================================================ */
        /* 2. PROTECTED INTERNAL ENTERPRISE MANAGEMENT PORTAL           */
        /* Only for authenticated corporate directors and staff        */
        /* ============================================================ */
        <div className="flex min-h-screen">
          {/* Sidebar Navigation */}
          <Sidebar
            currentCompany={displayCompany}
            currentUser={currentUser}
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (tab === 'security_audit') {
                setIsSecurityAuditOpen(true);
              } else if (tab === 'onboard_company') {
                if (currentUser.role === 'platform_owner') {
                  setIsOnboardingOpen(true);
                }
              } else {
                setActiveTab(tab);
              }
            }}
            isOpenMobile={isOpenMobileSidebar}
            onCloseMobile={() => setIsOpenMobileSidebar(false)}
            currentLang={currentLang}
            unreadCount={notifications.filter((n) => !n.read).length}
            ordersCount={orders.length}
            inquiriesCount={inquiries.length}
            supportCount={supportTickets.filter((tk) => tk.status === 'new' || tk.status === 'open' || tk.status === 'in_progress').length}
            onTogglePublicView={() => navigateToRoute('public')}
          />

          {/* Main Content Area (automatically offsets by 18rem in LTR or RTL) */}
          <div className="flex-1 flex flex-col min-w-0 lg:ms-72 transition-all duration-200">
            {/* Top Navigation Bar with Public Catalog Return Trigger */}
            <TopHeader
              currentCompany={displayCompany}
              currentUser={currentUser}
              allCompanies={allCompanies}
              onSelectCompany={handleSelectCompany}
              onSwitchUserRole={handleSwitchUserRole}
              currentLang={currentLang}
              onLanguageChange={setCurrentLang}
              onToggleMobileSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
              isPublicView={false}
              onTogglePublicView={() => navigateToRoute('public')}
              onOpenOnboarding={() => {
                if (currentUser.role === 'platform_owner') {
                  setIsOnboardingOpen(true);
                }
              }}
              onOpenSecurityAudit={() => setIsSecurityAuditOpen(true)}
              notifications={notifications}
              onOpenNotifications={() => setIsNotificationsModalOpen(true)}
              products={products}
              orders={orders}
              customers={customers}
              onNavigateTab={(tab) => {
                if (tab === 'security_audit') {
                  setIsSecurityAuditOpen(true);
                } else if (tab === 'onboard_company') {
                  if (currentUser.role === 'platform_owner') {
                    setIsOnboardingOpen(true);
                  }
                } else {
                  setActiveTab(tab);
                }
              }}
            />

            {/* Viewport Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              {/* Restored Enterprise Quick-Access & Company Context Bar */}
              <div className="glass-card p-3.5 rounded-2xl space-y-3 text-xs">
                {/* Row 1: Verified Company Context, Role Badge & Authorized Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/60 dark:border-white/10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        {t.tenantStatusActive || tr(currentLang, 'Authorized Company:', 'شرکت فعال:', 'مجاز شرکت:')}{' '}
                        <strong className="font-extrabold">{displayCompany.name}</strong>{' '}
                        <span className="font-mono text-[10px] opacity-80">({displayCompany.id})</span>
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#101C35]/10 dark:bg-[#C9A96E]/15 text-[#101C35] dark:text-[#C9A96E] border border-[#101C35]/15 dark:border-[#C9A96E]/30 font-bold text-[11px]">
                      <Lock className="w-3 h-3 text-[#C9A96E]" />
                      <span>
                        {currentUser.role === 'company_admin'
                          ? tr(
                              currentLang,
                              `${displayCompany.name} Company Administrator`,
                              `مدیر رسمی ${displayCompany.name}`,
                              `د ${displayCompany.name} رسمي مدیر`
                            )
                          : currentUser.role === 'platform_owner'
                          ? tr(currentLang, 'Multi-Tenant Platform Owner', 'مالک پلتفرم چندمستاجره', 'د څو شرکتونو پلتفرم څښتن')
                          : tr(currentLang, 'Company Sales Staff', 'کارشناس فروش شرکت', 'د شرکت د پلور کارکوونکی')}
                      </span>
                    </span>

                    {/* Multi-Tenant Company Switcher Dropdown — Displayed ONLY for Platform Owner */}
                    {currentUser.role === 'platform_owner' && allCompanies.length > 1 && (
                      <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-white/10">
                        <Building2 className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <label htmlFor="workspace-company-select" className="text-[11px] font-bold text-[#5A657D] dark:text-slate-400">
                          {t.switchCompany || tr(currentLang, 'Inspect Tenant:', 'تغییر مستاجر:', 'د شرکت انتخاب:')}
                        </label>
                        <select
                          id="workspace-company-select"
                          value={displayCompany.id}
                          onChange={(e) => handleSelectCompany(e.target.value)}
                          className="bg-transparent text-[#101C35] dark:text-white font-extrabold text-xs focus:outline-none cursor-pointer"
                        >
                          {allCompanies.map((c) => (
                            <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                              {c.name} ({c.currency})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Administrative Actions & Storefront Trigger */}
                  <div className="flex flex-wrap items-center gap-2">
                    {currentUser.role === 'platform_owner' && (
                      <button
                        type="button"
                        onClick={() => setIsOnboardingOpen(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#101C35] dark:text-slate-200 font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-white/10"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <span>{t.onboardCompanyBtn || tr(currentLang, 'Provision Tenant', 'ثبت شرکت جدید', 'نوی شرکت ثبتول')}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsSecurityAuditOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold transition flex items-center gap-1.5 cursor-pointer border border-rose-500/20"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t.securityAuditBtn || tr(currentLang, 'Security Audit', 'ممیزی امنیت', 'د امنیت پلټنه')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateToRoute('public')}
                      className="px-3 py-1.5 rounded-xl glass-card hover:border-[#C9A96E]/50 text-[#101C35] dark:text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Store className="w-3.5 h-3.5 text-[#C9A96E]" />
                      <span>{tr(currentLang, 'View Public Storefront', 'مشاهده کاتالوگ عمومی', 'عمومي کاتالوګ کتل')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer font-medium"
                    >
                      {tr(currentLang, 'Sign Out', 'خروج از پنل', 'وتل')}
                    </button>
                  </div>
                </div>

                {/* Row 2: Restored Quick-Access Management Tabs Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" role="navigation" aria-label="Quick Access Management Navigation">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === 'dashboard'
                        ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                        : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>{t.tabDashboard || tr(currentLang, 'Dashboard', 'پیشخوان', 'ډشبورډ')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === 'products'
                        ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                        : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{t.tabProducts || tr(currentLang, 'Products & Inventory', 'محصولات و انبار', 'محصولات او انبار')}</span>
                  </button>

                  {(currentUser.role === 'company_admin' || currentUser.role === 'platform_owner') && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('categories')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        activeTab === 'categories'
                          ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                          : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                      }`}
                    >
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>
                        {tr(currentLang, 'Categories & Hierarchy', 'دسته‌بندی‌ها و زیردسته‌ها', 'کټګورۍ او فرعي کټګورۍ')}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab('sales_ai')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === 'sales_ai'
                        ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                        : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.tabSalesAI || tr(currentLang, 'AI Sales Assistant', 'دستیار هوشمند فروش', 'د پلور ځیرک مرستیال')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('inquiries')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === 'inquiries'
                        ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                        : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.tabInquiries || tr(currentLang, 'Quotations & Inquiries', 'استعلام قیمت و پیش‌فاکتور', 'استعلامونه او نرخونه')}</span>
                    {inquiries.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono">
                        {inquiries.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('company_profile')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === 'company_profile'
                        ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                        : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{t.tabCompanyProfile || tr(currentLang, 'Company Profile & Branding', 'پروفایل و برندینگ شرکت', 'د شرکت پروفایل او برانډینګ')}</span>
                  </button>

                  {(currentUser.role === 'company_admin' || currentUser.role === 'platform_owner') && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveTab('product_reviews')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          activeTab === 'product_reviews'
                            ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                            : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {tr(currentLang, 'Product Reviews', 'بررسی محصولات فروشندگان', 'د محصولاتو بیاکتنه')}
                        </span>
                      </button>

                      {(currentUser.role === 'platform_owner' || currentUser.companyId === 'comp_heka_ltd') && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('seller_reviews')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                            activeTab === 'seller_reviews'
                              ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                              : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                          }`}
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>
                            {tr(currentLang, 'Seller Approvals', 'تأیید فروشندگان', 'د پلورونکو غوښتنلیکونه')}
                          </span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === 'orders'
                        ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                        : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>{t.tabOrders || tr(currentLang, 'Orders', 'سفارشات', 'فرمایشونه')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('customers')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTab === 'customers'
                        ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                        : 'text-[#101C35] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{t.tabCustomers || tr(currentLang, 'Customers', 'مشتریان', 'پېرودونکي')}</span>
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="py-24 text-center text-[#687386]">
                  {tr(currentLang, 'Loading operations hub...', 'در حال بارگذاری اطلاعات پیشخوان...', 'د معلوماتو په بارولو کې...')}
                </div>
              ) : (
                <>
                  {/* 1. Dashboard View */}
                  {activeTab === 'dashboard' && (
                    <DashboardView
                      company={displayCompany}
                      products={products}
                      orders={orders}
                      customers={customers}
                      activities={activities}
                      salesTrend={salesTrend}
                      currentLang={currentLang}
                      onNavigateTab={(tab) => {
                        if (tab === 'security_audit') {
                          setIsSecurityAuditOpen(true);
                        } else if (tab === 'onboard_company') {
                          setIsOnboardingOpen(true);
                        } else {
                          setActiveTab(tab);
                        }
                      }}
                      onOpenAddProduct={() => {
                        setIsAddingProduct(true);
                        setActiveTab('products');
                      }}
                      onTogglePublicView={() => navigateToRoute('public')}
                      onSelectOrderDetails={(ord) => setSelectedOrderForModal(ord)}
                    />
                  )}

                  {/* 2. Company Profile View */}
                  {activeTab === 'company_profile' && (
                    <CompanyProfileView
                      company={displayCompany}
                      currentUser={currentUser}
                      onRefresh={() => loadTenantData(displayCompany.id)}
                      currentLang={currentLang}
                    />
                  )}

                  {/* 3. Products Management View */}
                  {activeTab === 'products' && (
                    <ProductManagement
                      company={displayCompany}
                      products={products}
                      categories={categories}
                      onRefresh={() => {
                        setIsAddingProduct(false);
                        loadTenantData(displayCompany.id);
                      }}
                      currentLang={currentLang}
                      initialIsAdding={isAddingProduct}
                    />
                  )}

                  {/* 3b. Dynamic Categories & Subcategories Hierarchy Management View */}
                  {activeTab === 'categories' && (
                    <CategoryManagement
                      categories={categories}
                      products={products}
                      companyId={displayCompany.id}
                      lang={currentLang}
                      onRefreshData={() => loadTenantData(displayCompany.id)}
                    />
                  )}

                  {/* 3c. Seller Product Submissions Review View */}
                  {activeTab === 'product_reviews' && (
                    <AdminProductReview
                      currentLang={currentLang}
                      categories={categories}
                      onRefreshCatalog={() => loadTenantData(displayCompany.id)}
                    />
                  )}

                  {/* 3d. Seller Applications Review View */}
                  {activeTab === 'seller_reviews' && (
                    <AdminSellerReview currentLang={currentLang} />
                  )}

                  {/* 4. Orders View */}
                  {activeTab === 'orders' && (
                    <OrdersView
                      company={displayCompany}
                      orders={orders}
                      currentLang={currentLang}
                      onSelectOrder={(ord) => setSelectedOrderForModal(ord)}
                    />
                  )}

                  {/* 5. Customers Directory View */}
                  {activeTab === 'customers' && (
                    <CustomersView
                      company={displayCompany}
                      customers={customers}
                      currentLang={currentLang}
                    />
                  )}

                  {/* 6. Analytics View */}
                  {activeTab === 'analytics' && (
                    <AnalyticsView
                      company={displayCompany}
                      products={products}
                      orders={orders}
                      salesTrend={salesTrend}
                      currentLang={currentLang}
                    />
                  )}

                  {/* 7. Notifications View */}
                  {activeTab === 'notifications' && (
                    <div className="glass-card p-6 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Bell className="w-5 h-5 text-[#101C35] dark:text-[#C9A96E]" />
                          <h2 className="text-lg font-extrabold text-[#101C35] dark:text-slate-100">
                            {t.tabNotifications || tr(currentLang, 'Notifications & System Logs', 'اعلان‌ها و رویدادهای سیستم', 'خبرتیاوې او د سیسټم پېښې')}
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={handleMarkAllNotificationsRead}
                          className="text-xs font-bold text-[#101C35] dark:text-[#C9A96E] hover:text-[#C9A96E] dark:hover:text-white cursor-pointer transition-colors"
                        >
                          {tr(currentLang, 'Mark all read', 'علامت‌گذاری همه به عنوان خوانده‌شده', 'ټول د لوستل شوي په توګه نښه کړئ')}
                        </button>
                      </div>

                      <div className="divide-y divide-slate-200/60 dark:divide-white/10">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleSelectNotification(notif)}
                            className="py-3.5 flex items-start gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer px-3 rounded-xl text-start"
                          >
                            <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 text-[#101C35] dark:text-slate-200 flex items-center justify-center shrink-0">
                              <Bell className="w-4 h-4 text-[#C9A96E]" />
                            </div>
                            <div className="flex-1 text-xs">
                              <div className="flex items-center justify-between">
                                <strong className="font-bold text-[#101C35] dark:text-slate-100">{notif.title}</strong>
                                <span className="text-[10px] text-[#5A657D] dark:text-slate-400 font-mono">{notif.timestamp}</span>
                              </div>
                              <p className="text-[#5A657D] dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 8. Settings View */}
                  {activeTab === 'settings' && (
                    <SettingsView
                      company={displayCompany}
                      currentUser={currentUser}
                      onRefresh={() => loadTenantData(displayCompany.id)}
                      currentLang={currentLang}
                    />
                  )}

                  {/* 9. AI Sales Assistant */}
                  {activeTab === 'sales_ai' && (
                    <SalesAIView
                      company={displayCompany}
                      products={products}
                      currentLang={currentLang}
                      initialInquiryMessage={inquiryForAI?.message}
                      initialProductId={inquiryForAI?.productId}
                    />
                  )}

                  {/* 10. Inquiries & Quote Requests */}
                  {activeTab === 'inquiries' && (
                    <InquiryManagement
                      inquiries={inquiries}
                      onSelectForAIReply={handleSelectInquiryForAI}
                      currentLang={currentLang}
                      companyId={displayCompany.id}
                      onRefreshInquiries={() => loadTenantData(displayCompany.id)}
                    />
                  )}

                  {/* 11. Support & Corporate Ticket Desk */}
                  {activeTab === 'support' && (
                    <SupportView
                      company={displayCompany}
                      tickets={supportTickets}
                      currentLang={currentLang}
                      onRefresh={() => loadTenantData(displayCompany.id)}
                    />
                  )}
                </>
              )}
            </main>

            {/* Quiet Corporate Frosted Footer */}
            <footer className="border-t border-slate-200/60 dark:border-white/10 glass-panel py-4 mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#5A657D] dark:text-slate-400 gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#101C35] dark:text-slate-100">
                    {displayCompany.name}
                  </span>
                  <span>·</span>
                  <span>
                    {displayCompany.id === 'comp_heka_ltd'
                      ? tr(currentLang, '100 Bishopsgate, London', 'دفتر مرکزی لندن', 'د لندن مرکزي دفتر')
                      : displayCompany.country}
                  </span>
                  <span>·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{tr(currentLang, 'Isolated Tenant Domain', 'دامنه سازمانی ایزوله', 'خوندي جلا شوی ډومین')}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSecurityAuditOpen(true)}
                    className="text-[#101C35] dark:text-slate-200 hover:text-[#C9A96E] dark:hover:text-[#C9A96E] underline cursor-pointer transition-colors"
                  >
                    {tr(currentLang, 'Security Audit', 'گزارش ممیزی امنیت', 'د امنیت راپور')}
                  </button>
                  <span>·</span>
                  <span>{tr(currentLang, 'Multi-Tenant Architecture', 'معماری چندمستاجره سازمانی', 'څو شرکتیز سیسټم')}</span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        currentLang={currentLang}
      />

      <OrderDetailModal
        order={selectedOrderForModal}
        company={displayCompany}
        onClose={() => setSelectedOrderForModal(null)}
        isRtl={isRtl}
      />

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onSelectNotification={handleSelectNotification}
        isRtl={isRtl}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCompanyCreated={handleCompanyCreated}
        currentLang={currentLang}
      />

      <SecurityAuditModal
        isOpen={isSecurityAuditOpen}
        onClose={() => setIsSecurityAuditOpen(false)}
        currentLang={currentLang}
      />

      <CustomerAuthModal
        isOpen={isCustomerAuthOpen}
        onClose={() => setIsCustomerAuthOpen(false)}
        onSuccess={(user) => {
          setCustomerUser(user);
          setIsCustomerAuthOpen(false);
          if (user.sellerStatus === 'approved') {
            setCurrentRoute('seller');
          } else {
            setCurrentRoute('customer');
          }
        }}
        currentLang={currentLang}
      />
    </div>
  );
}
