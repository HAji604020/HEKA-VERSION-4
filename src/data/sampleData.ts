import { Product, Company } from '../types';

export interface CommercialProductInfo {
  name: string;
  weightGrams: string;
  price: string;
  currency: string;
  stock: string;
  packaging: string;
  qualityLabInfo: string;
  shipping: string;
  wholesaleTerms: string;
  isDemo?: boolean;
}

export interface CommercialScenario {
  id: string;
  labelEn: string;
  labelFa: string;
  category: 'preset' | 'test_case';
  product: CommercialProductInfo;
  customerMessageEn: string;
  customerMessageFa: string;
  testDescriptionEn?: string;
  testDescriptionFa?: string;
}

export const defaultDemoProduct: CommercialProductInfo = {
  name: 'HEKA Signature Reserve Luxury Gift Collection',
  weightGrams: 'Standard Set',
  price: '48',
  currency: '$',
  stock: '50',
  packaging: 'Luxury handcrafted velvet-lined executive presentation case featuring airtight crystal vials with tamper-evident seal and precision brass dispenser.',
  qualityLabInfo: 'Confirmed Grade 1 ISO Certified (ISO 9001 / ISO 22000 Batch HEKA-QC-2026-778). Full purity and traceability verified.',
  shipping: 'UK & Europe: Free priority courier within 24-48 hours. International DHL Express export worldwide in 3-5 business days.',
  wholesaleTerms: 'Minimum wholesale order: 10 units. 12% commercial discount on orders of 20+ units.',
  isDemo: true
};

export const sampleScenarios: CommercialScenario[] = [
  {
    id: 'heka_executive_gift',
    labelEn: '🎁 HEKA Executive Gift Set ($48 - DEMO)',
    labelFa: '🎁 بسته لوکس کلکسیون HEKA LTD (۴۸ دالر - آزمایشی)',
    category: 'preset',
    product: defaultDemoProduct,
    customerMessageEn: 'Hello! I am interested in purchasing your HEKA Signature Reserve Gift Collection for our corporate clients. What is the total with express shipping to London?',
    customerMessageFa: 'سلام و احترام، بسته کلکسیون اختصاصی HEKA LTD را برای هدایای شرکتی نیاز داریم. آیا موجود دارید و هزینه نهایی با ارسال چقدر است؟'
  }
];

export const sampleOrders: Record<string, import('../types').Order[]> = {
  comp_heka_ltd: [
    {
      id: 'ord_heka_1042',
      companyId: 'comp_heka_ltd',
      orderNumber: 'ORD-2026-1042',
      customerName: 'Marcus Sterling',
      customerEmail: 'm.sterling@auraglobal.co.uk',
      customerPhone: '+44 20 7946 0812',
      customerLocation: 'London / Dubai Hub',
      clientCompany: 'Aura Global Trading Ltd',
      items: [
        {
          productId: 'prod_heka_2',
          productName: 'HEKA Industrial Commercial Grade Bulk Canister',
          quantity: 5,
          unitPrice: 1850,
          totalPrice: 9250
        }
      ],
      totalAmount: 9250,
      currency: '$',
      status: 'shipped',
      paymentStatus: 'paid',
      shippingMethod: 'DHL Priority Express (CIP Dubai)',
      trackingNumber: 'DHL-UK-889210-EXP',
      notes: 'Scheduled for direct customs clearance at Dubai World Central Hub.',
      createdAt: '2026-03-02T11:45:00Z',
      isDemo: true
    },
    {
      id: 'ord_heka_1041',
      companyId: 'comp_heka_ltd',
      orderNumber: 'ORD-2026-1041',
      customerName: 'David Van Der Berg',
      customerEmail: 'david@nordicbotanicals.nl',
      customerPhone: '+31 20 555 0199',
      customerLocation: 'Amsterdam, Netherlands',
      clientCompany: 'Nordic Botanical Imports B.V.',
      items: [
        {
          productId: 'prod_heka_1',
          productName: 'HEKA Signature Reserve Luxury Gift Collection',
          quantity: 25,
          unitPrice: 48,
          totalPrice: 1056 // 12% wholesale tier applied
        }
      ],
      totalAmount: 1056,
      currency: '$',
      status: 'delivered',
      paymentStatus: 'paid',
      shippingMethod: 'Priority Ground Freight (EU Express)',
      trackingNumber: 'DPD-EU-773910',
      notes: 'Custom executive gift presentation cases delivered and signed.',
      createdAt: '2026-02-28T09:15:00Z',
      isDemo: true
    },
    {
      id: 'ord_heka_1040',
      companyId: 'comp_heka_ltd',
      orderNumber: 'ORD-2026-1040',
      customerName: 'Tariq Al-Mansoor',
      customerEmail: 'procurement@emiratesluxury.ae',
      customerPhone: '+971 4 812 3456',
      customerLocation: 'DIFC, Dubai, UAE',
      clientCompany: 'Emirates Hospitality & Resorts Group',
      items: [
        {
          productId: 'prod_heka_2',
          productName: 'HEKA Industrial Commercial Grade Bulk Canister',
          quantity: 12,
          unitPrice: 1650, // bulk tier
          totalPrice: 19800
        }
      ],
      totalAmount: 19800,
      currency: '$',
      status: 'processing',
      paymentStatus: 'paid',
      shippingMethod: 'Emirates SkyCargo Priority CIP',
      trackingNumber: 'EK-CARGO-2026-091',
      notes: 'Awaiting phytosanitary batch certificate attachment.',
      createdAt: '2026-03-01T14:30:00Z',
      isDemo: true
    },
    {
      id: 'ord_heka_1039',
      companyId: 'comp_heka_ltd',
      orderNumber: 'ORD-2026-1039',
      customerName: 'Elena Rostova',
      customerEmail: 'e.rostova@genevahealth.ch',
      customerPhone: '+41 22 712 8899',
      customerLocation: 'Geneva, Switzerland',
      clientCompany: 'Geneva Bioceuticals SA',
      items: [
        {
          productId: 'prod_heka_1',
          productName: 'HEKA Signature Reserve Luxury Gift Collection',
          quantity: 40,
          unitPrice: 48,
          totalPrice: 1690
        }
      ],
      totalAmount: 1690,
      currency: '$',
      status: 'processing',
      paymentStatus: 'invoiced',
      shippingMethod: 'Swiss Post Express International',
      trackingNumber: 'CH-EXP-440192',
      notes: 'Corporate incentive batch with bespoke engraving requested.',
      createdAt: '2026-03-02T16:20:00Z',
      isDemo: true
    },
    {
      id: 'ord_heka_1038',
      companyId: 'comp_heka_ltd',
      orderNumber: 'ORD-2026-1038',
      customerName: 'James Hawthorne',
      customerEmail: 'steward@mayfairclub.co.uk',
      customerPhone: '+44 20 7493 0021',
      customerLocation: 'Mayfair, London, UK',
      clientCompany: 'The Mayfair Private Club',
      items: [
        {
          productId: 'prod_heka_1',
          productName: 'HEKA Signature Reserve Deluxe Grand Edition',
          quantity: 15,
          unitPrice: 95,
          totalPrice: 1280
        }
      ],
      totalAmount: 1280,
      currency: '$',
      status: 'delivered',
      paymentStatus: 'paid',
      shippingMethod: 'London Same-Day White Glove Courier',
      trackingNumber: 'LDN-WG-55102',
      notes: 'Delivered to reception at Curzon Street.',
      createdAt: '2026-02-24T15:00:00Z',
      isDemo: true
    },
    {
      id: 'ord_heka_1037',
      companyId: 'comp_heka_ltd',
      orderNumber: 'ORD-2026-1037',
      customerName: 'Kenji Sato',
      customerEmail: 'k.sato@tokyobotanics.jp',
      customerPhone: '+81 3 5555 0142',
      customerLocation: 'Ginza, Tokyo, Japan',
      clientCompany: 'Tokyo Specialty Exports K.K.',
      items: [
        {
          productId: 'prod_heka_2',
          productName: 'HEKA Industrial Commercial Grade Bulk Canister',
          quantity: 3,
          unitPrice: 1850,
          totalPrice: 5550
        }
      ],
      totalAmount: 5550,
      currency: '$',
      status: 'pending',
      paymentStatus: 'invoiced',
      shippingMethod: 'Air Cargo Japan Express',
      notes: 'Invoice issued with Letter of Credit verification pending.',
      createdAt: '2026-03-03T08:10:00Z',
      isDemo: true
    }
  ],
  comp_ziba_fashion: [
    {
      id: 'ord_ziba_2001',
      companyId: 'comp_ziba_fashion',
      orderNumber: 'ORD-2026-2001',
      customerName: 'Fatima Sultani',
      customerEmail: 'fatima.s@outlook.com',
      customerPhone: '+93788998877',
      customerLocation: 'Shahr-e Naw, Kabul',
      clientCompany: 'Private Buyer',
      items: [
        {
          productId: 'prod_ziba_1',
          productName: 'Handcrafted Afghan Silk Chapan Robe (Size M)',
          quantity: 2,
          unitPrice: 120,
          totalPrice: 240
        }
      ],
      totalAmount: 240,
      currency: '$',
      status: 'shipped',
      paymentStatus: 'paid',
      shippingMethod: 'Kabul Local Express Courier',
      trackingNumber: 'KBL-EXP-1102',
      notes: 'Hand delivered to Zarghoona Street.',
      createdAt: '2026-03-03T09:30:00Z',
      isDemo: true
    },
    {
      id: 'ord_ziba_2002',
      companyId: 'comp_ziba_fashion',
      orderNumber: 'ORD-2026-2002',
      customerName: 'Zahra Wahidi',
      customerEmail: 'info@wahidiboutique.com',
      customerPhone: '+93700112233',
      customerLocation: 'Herat, Afghanistan',
      clientCompany: 'Wahidi Silk Boutique',
      items: [
        {
          productId: 'prod_ziba_1',
          productName: 'Handcrafted Afghan Silk Chapan Robe',
          quantity: 12,
          unitPrice: 120,
          totalPrice: 1224 // 15% boutique wholesale discount
        }
      ],
      totalAmount: 1224,
      currency: '$',
      status: 'processing',
      paymentStatus: 'paid',
      shippingMethod: 'Provincial Transport Service',
      trackingNumber: 'HRT-PRV-993',
      notes: 'Boutique order with assorted sizes (S, M, L).',
      createdAt: '2026-03-01T11:00:00Z',
      isDemo: true
    }
  ]
};

export const sampleCustomers: Record<string, import('../types').Customer[]> = {
  comp_heka_ltd: [
    {
      id: 'cust_heka_1',
      companyId: 'comp_heka_ltd',
      name: 'Marcus Sterling',
      email: 'm.sterling@auraglobal.co.uk',
      phone: '+44 20 7946 0812',
      clientCompany: 'Aura Global Trading Ltd',
      location: 'London, United Kingdom',
      type: 'b2b_wholesale',
      totalOrders: 6,
      totalSpent: 42500,
      currency: '$',
      status: 'vip',
      lastActive: '2026-03-02',
      notes: 'Key distributor for UK & GCC luxury hospitality clients.',
      isDemo: true
    },
    {
      id: 'cust_heka_2',
      companyId: 'comp_heka_ltd',
      name: 'Tariq Al-Mansoor',
      email: 'procurement@emiratesluxury.ae',
      phone: '+971 4 812 3456',
      clientCompany: 'Emirates Hospitality & Resorts',
      location: 'Dubai, UAE',
      type: 'corporate_client',
      totalOrders: 4,
      totalSpent: 58200,
      currency: '$',
      status: 'vip',
      lastActive: '2026-03-01',
      notes: 'Annual procurement agreement for executive gifts and botanical supplies.',
      isDemo: true
    },
    {
      id: 'cust_heka_3',
      companyId: 'comp_heka_ltd',
      name: 'David Van Der Berg',
      email: 'david@nordicbotanicals.nl',
      phone: '+31 20 555 0199',
      clientCompany: 'Nordic Botanical Imports B.V.',
      location: 'Amsterdam, Netherlands',
      type: 'b2b_wholesale',
      totalOrders: 3,
      totalSpent: 12400,
      currency: '$',
      status: 'active',
      lastActive: '2026-02-28',
      notes: 'Distributes in Benelux and Scandinavian specialty channels.',
      isDemo: true
    },
    {
      id: 'cust_heka_4',
      companyId: 'comp_heka_ltd',
      name: 'Elena Rostova',
      email: 'e.rostova@genevahealth.ch',
      phone: '+41 22 712 8899',
      clientCompany: 'Geneva Bioceuticals SA',
      location: 'Geneva, Switzerland',
      type: 'corporate_client',
      totalOrders: 2,
      totalSpent: 6850,
      currency: '$',
      status: 'active',
      lastActive: '2026-03-02',
      notes: 'Requires ISO certificates with each delivery shipment.',
      isDemo: true
    },
    {
      id: 'cust_heka_5',
      companyId: 'comp_heka_ltd',
      name: 'James Hawthorne',
      email: 'steward@mayfairclub.co.uk',
      phone: '+44 20 7493 0021',
      clientCompany: 'The Mayfair Private Club',
      location: 'London, UK',
      type: 'corporate_client',
      totalOrders: 5,
      totalSpent: 8900,
      currency: '$',
      status: 'active',
      lastActive: '2026-02-24',
      notes: 'Exclusive supplier for VIP membership hampers.',
      isDemo: true
    },
    {
      id: 'cust_heka_6',
      companyId: 'comp_heka_ltd',
      name: 'Kenji Sato',
      email: 'k.sato@tokyobotanics.jp',
      phone: '+81 3 5555 0142',
      clientCompany: 'Tokyo Specialty Exports K.K.',
      location: 'Tokyo, Japan',
      type: 'b2b_wholesale',
      totalOrders: 1,
      totalSpent: 5550,
      currency: '$',
      status: 'lead',
      lastActive: '2026-03-03',
      notes: 'Evaluating sample shipment for Japan retail chain placement.',
      isDemo: true
    }
  ],
  comp_ziba_fashion: [
    {
      id: 'cust_ziba_1',
      companyId: 'comp_ziba_fashion',
      name: 'Fatima Sultani',
      email: 'fatima.s@outlook.com',
      phone: '+93788998877',
      location: 'Kabul, Afghanistan',
      type: 'retail_buyer',
      totalOrders: 2,
      totalSpent: 360,
      currency: '$',
      status: 'active',
      lastActive: '2026-03-03',
      isDemo: true
    },
    {
      id: 'cust_ziba_2',
      companyId: 'comp_ziba_fashion',
      name: 'Zahra Wahidi',
      email: 'info@wahidiboutique.com',
      phone: '+93700112233',
      clientCompany: 'Wahidi Silk Boutique',
      location: 'Herat, Afghanistan',
      type: 'b2b_wholesale',
      totalOrders: 3,
      totalSpent: 3400,
      currency: '$',
      status: 'vip',
      lastActive: '2026-03-01',
      isDemo: true
    }
  ]
};

export const sampleActivities: Record<string, import('../types').ActivityItem[]> = {
  comp_heka_ltd: [
    {
      id: 'act_1',
      companyId: 'comp_heka_ltd',
      user: 'Marcus Sterling (Aura Global)',
      action: 'submitted wholesale inquiry for',
      target: '5 units HEKA Industrial Bulk Canister (CIP Dubai)',
      timestamp: '15 minutes ago',
      type: 'inquiry'
    },
    {
      id: 'act_2',
      companyId: 'comp_heka_ltd',
      user: 'Operations Team',
      action: 'dispatched export shipment',
      target: 'ORD-2026-1042 via DHL Express (Airway Bill #889210)',
      timestamp: '2 hours ago',
      type: 'order'
    },
    {
      id: 'act_3',
      companyId: 'comp_heka_ltd',
      user: 'HEKA Corporate Director',
      action: 'verified lab spectrum certificate',
      target: 'HEKA-QC-2026-778 (ISO 9001 / ISO 22000 Batch)',
      timestamp: '5 hours ago',
      type: 'product'
    },
    {
      id: 'act_4',
      companyId: 'comp_heka_ltd',
      user: 'Emirates Luxury Procurement',
      action: 'confirmed commercial invoice payment',
      target: 'ORD-2026-1040 ($19,800 USD)',
      timestamp: 'Yesterday at 17:30',
      type: 'order'
    },
    {
      id: 'act_5',
      companyId: 'comp_heka_ltd',
      user: 'Automated Security Prober',
      action: 'verified tenant boundary isolation',
      target: 'Cross-Tenant Tampering Check (HTTP 403 passed)',
      timestamp: 'Yesterday at 14:15',
      type: 'security'
    }
  ],
  comp_ziba_fashion: [
    {
      id: 'act_z1',
      companyId: 'comp_ziba_fashion',
      user: 'Fatima Sultani',
      action: 'placed order for',
      target: '2x Handcrafted Afghan Silk Chapan Robe',
      timestamp: '30 minutes ago',
      type: 'order'
    },
    {
      id: 'act_z2',
      companyId: 'comp_ziba_fashion',
      user: 'Ahmad Reshad (Sales Staff)',
      action: 'replied to inquiry via AI assistant',
      target: 'Customer lead #inq_2 (Kabul delivery estimate)',
      timestamp: '3 hours ago',
      type: 'inquiry'
    }
  ]
};

export const sampleNotifications: Record<string, import('../types').AppNotification[]> = {
  comp_heka_ltd: [
    {
      id: 'notif_1',
      companyId: 'comp_heka_ltd',
      title: 'New Wholesale Quote Request',
      message: 'Marcus Sterling from Aura Global requested CIP export quotation for 5x Commercial Canisters.',
      type: 'inquiry',
      read: false,
      timestamp: '15m ago',
      linkTab: 'inquiries'
    },
    {
      id: 'notif_2',
      companyId: 'comp_heka_ltd',
      title: 'High-Value Wire Transfer Cleared',
      message: 'Payment received for Order ORD-2026-1040 ($19,800 USD) from Emirates Hospitality.',
      type: 'order',
      read: false,
      timestamp: '3h ago',
      linkTab: 'orders'
    },
    {
      id: 'notif_3',
      companyId: 'comp_heka_ltd',
      title: 'Shipment Out for Delivery',
      message: 'Order ORD-2026-1042 arrived at Dubai regional distribution hub for dispatch.',
      type: 'order',
      read: true,
      timestamp: '5h ago',
      linkTab: 'orders'
    },
    {
      id: 'notif_4',
      companyId: 'comp_heka_ltd',
      title: 'Security Isolation Verified',
      message: 'Automated cross-tenant audit completed with 100% boundary isolation.',
      type: 'security',
      read: true,
      timestamp: '1d ago',
      linkTab: 'dashboard'
    }
  ],
  comp_ziba_fashion: [
    {
      id: 'notif_z1',
      companyId: 'comp_ziba_fashion',
      title: 'New Customer Order',
      message: 'Fatima Sultani submitted order ORD-2026-2001 for 2x Silk Chapans.',
      type: 'order',
      read: false,
      timestamp: '30m ago',
      linkTab: 'orders'
    }
  ]
};

export const sampleSalesTrend: Record<string, { month: string; revenue: number; orders: number; target: number }[]> = {
  comp_heka_ltd: [
    { month: 'Oct 2025', revenue: 64200, orders: 48, target: 60000 },
    { month: 'Nov 2025', revenue: 78500, orders: 62, target: 70000 },
    { month: 'Dec 2025', revenue: 94100, orders: 74, target: 85000 },
    { month: 'Jan 2026', revenue: 86300, orders: 68, target: 80000 },
    { month: 'Feb 2026', revenue: 112800, orders: 86, target: 95000 },
    { month: 'Mar 2026', revenue: 148650, orders: 114, target: 120000 }
  ],
  comp_ziba_fashion: [
    { month: 'Oct 2025', revenue: 2800, orders: 22, target: 2500 },
    { month: 'Nov 2025', revenue: 3400, orders: 28, target: 3000 },
    { month: 'Dec 2025', revenue: 4100, orders: 35, target: 3800 },
    { month: 'Jan 2026', revenue: 3900, orders: 31, target: 3500 },
    { month: 'Feb 2026', revenue: 4800, orders: 40, target: 4200 },
    { month: 'Mar 2026', revenue: 6200, orders: 51, target: 5000 }
  ]
};

