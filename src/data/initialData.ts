import { Category, Brand, Supplier, Product, Sale, Purchase, Expense, Income } from '../types';

export const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Smartphones', description: 'Mobile phones and high-end handhelds', code: 'SP' },
  { id: 'cat-2', name: 'Laptops', description: 'Portable computers, notebooks, and ultrabooks', code: 'LT' },
  { id: 'cat-3', name: 'Peripherals', description: 'Mice, keyboards, webcams, and docking stations', code: 'PE' },
  { id: 'cat-4', name: 'Audio Devices', description: 'Headphones, earbuds, speakers, and amplifiers', code: 'AU' },
  { id: 'cat-5', name: 'Storage Solutions', description: 'External SSDs, internal NVMe drives, and flash drives', code: 'ST' },
  { id: 'cat-6', name: 'Monitors & Displays', description: 'High-resolution monitors, screens, and project setups', code: 'MO' }
];

export const initialBrands: Brand[] = [
  { id: 'br-1', name: 'Apple', description: 'Premium computing devices and hardware', logo: '🍎' },
  { id: 'br-2', name: 'Samsung', description: 'Cutting-edge consumer electronics', logo: '🪐' },
  { id: 'br-3', name: 'Logitech', description: 'World-class input and peripheral products', logo: '⌨️' },
  { id: 'br-4', name: 'Sony', description: 'Industry-standard audio and displays', logo: '🎵' },
  { id: 'br-5', name: 'Kingston', description: 'High-performance flash and RAM memories', logo: '💾' },
  { id: 'br-6', name: 'Dell', description: 'Enterprise and consumer workstation hardware', logo: '💻' }
];

export const initialSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'Apex Distributors', email: 'sales@apexdist.com', phone: '+1 (555) 123-4567', company: 'Apex Distribution Inc.', taxId: '', address: '404 Logistics Pkwy, Dallas, TX' },
  { id: 'sup-2', name: 'Global Tech Wholesale', email: 'orders@globaltech.com', phone: '+1 (555) 234-5678', company: 'Global Tech Logistics Co.', taxId: '', address: '101 Silicon Valley Blvd, San Jose, CA' },
  { id: 'sup-3', name: 'Nexa Wholesale & Supply', email: 'contact@nexasupply.net', phone: '+1 (555) 345-6789', company: 'Nexa Supply Ltd.', taxId: '', address: '88 Commerce St, Chicago, IL' },
  { id: 'sup-4', name: 'ElectroCorp Import', email: 'imports@electrocorp.org', phone: '+1 (555) 456-7890', company: 'ElectroCorp Imports Ltd.', taxId: '', address: '77 Port Authority Rd, Miami, FL' }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    sku: 'SP-APP-001',
    name: 'Apple iPhone 15 Pro (256GB)',
    description: 'Titanium build, A17 Pro chip, outstanding cameras.',
    categoryId: 'cat-1',
    brandId: 'br-1',
    supplierId: 'sup-1',
    price: 1099,
    cost: 750,
    stock: 12,
    minStockAlert: 5,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active'
  },
  {
    id: 'prod-2',
    sku: 'LT-APP-002',
    name: 'Apple MacBook Air M3 (13")',
    description: 'Thinnest, lightest laptop powered by next-gen M3.',
    categoryId: 'cat-2',
    brandId: 'br-1',
    supplierId: 'sup-1',
    price: 1299,
    cost: 900,
    stock: 4,
    minStockAlert: 3,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active'
  },
  {
    id: 'prod-3',
    sku: 'PE-LOG-003',
    name: 'Logitech MX Master 3S',
    description: 'Ergonomic performance mouse, silent clicks, 8K DPI.',
    categoryId: 'cat-3',
    brandId: 'br-3',
    supplierId: 'sup-3',
    price: 99,
    cost: 55,
    stock: 2,
    minStockAlert: 6, // LOW STOCK TRIGGERED
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active'
  },
  {
    id: 'prod-4',
    sku: 'AU-SON-004',
    name: 'Sony WH-1000XM5 ANC Headphones',
    description: 'Industry-leading wireless noise-canceling headphones.',
    categoryId: 'cat-4',
    brandId: 'br-4',
    supplierId: 'sup-4',
    price: 399,
    cost: 260,
    stock: 8,
    minStockAlert: 4,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active'
  },
  {
    id: 'prod-5',
    sku: 'ST-KIN-005',
    name: 'Kingston Renegade 2TB NVMe SSD',
    description: 'Superfast PCIe Gen4 speeds up to 7300MB/s.',
    categoryId: 'cat-5',
    brandId: 'br-5',
    supplierId: 'sup-2',
    price: 159,
    cost: 95,
    stock: 1,
    minStockAlert: 5, // LOW STOCK TRIGGERED
    image: 'https://images.unsplash.com/photo-1597872200969-2b65dffc91ff?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active'
  },
  {
    id: 'prod-6',
    sku: 'MO-DEL-006',
    name: 'Dell UltraSharp 27" 4K Monitor',
    description: 'USB-C hub, IPS panel, 100% sRGB accuracy.',
    categoryId: 'cat-6',
    brandId: 'br-6',
    supplierId: 'sup-2',
    price: 449,
    cost: 310,
    stock: 6,
    minStockAlert: 2,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active'
  },
  {
    id: 'prod-7',
    sku: 'SP-SAM-007',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Built-in S-Pen, Galaxy AI capabilities, 200MP camera.',
    categoryId: 'cat-1',
    brandId: 'br-2',
    supplierId: 'sup-2',
    price: 1199,
    cost: 800,
    stock: 15,
    minStockAlert: 4,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active'
  },
  {
    id: 'prod-8',
    sku: 'PE-LOG-008',
    name: 'Logitech MX Keys S Keyboard',
    description: 'Full-size smart backlighting tactile wireless keyboard.',
    categoryId: 'cat-3',
    brandId: 'br-3',
    supplierId: 'sup-3',
    price: 119,
    cost: 70,
    stock: 18,
    minStockAlert: 5,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active'
  },
  {
    id: 'prod-9',
    sku: 'AU-SAM-009',
    name: 'Samsung Galaxy Buds2 Pro',
    description: 'Hi-Fi 24bit audio, intelligent ANC, custom fit.',
    categoryId: 'cat-4',
    brandId: 'br-2',
    supplierId: 'sup-2',
    price: 189,
    cost: 110,
    stock: 2,
    minStockAlert: 5, // LOW STOCK TRIGGERED
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    status: 'active'
  }
];

export const initialSales: Sale[] = [
  {
    id: 'sale-1',
    invoiceNo: 'INV-2026-001',
    receiptSerial: 'REC-2026-001',
    date: '2026-05-12T14:30:00Z',
    customerName: 'Customer',
    items: [
      { productId: 'prod-1', productName: 'Apple iPhone 15 Pro (256GB)', quantity: 1, price: 1099 },
      { productId: 'prod-3', productName: 'Logitech MX Master 3S', quantity: 2, price: 99 }
    ],
    subtotal: 1297,
    discount: 50,
    tax: 0,
    total: 1247,
    paidAmount: 1247,
    paymentMethod: 'bKash',
    status: 'Paid',
    salesperson: 'Alice Miller',
    isOffline: false
  },
  {
    id: 'sale-2',
    invoiceNo: 'INV-2026-002',
    receiptSerial: 'REC-2026-002',
    date: '2026-05-28T11:15:00Z',
    customerName: 'New Customer',
    items: [
      { productId: 'prod-4', productName: 'Sony WH-1000XM5 ANC Headphones', quantity: 1, price: 399 }
    ],
    subtotal: 399,
    discount: 0,
    tax: 0,
    total: 399,
    paidAmount: 399,
    paymentMethod: 'Cash',
    status: 'Paid',
    salesperson: 'Bob Carter',
    isOffline: false
  },
  {
    id: 'sale-3',
    invoiceNo: 'INV-2026-06-003',
    receiptSerial: 'REC-2026-003',
    date: '2026-06-10T16:45:00Z',
    customerName: 'Old Customer',
    items: [
      { productId: 'prod-2', productName: 'Apple MacBook Air M3 (13")', quantity: 1, price: 1299 },
      { productId: 'prod-8', productName: 'Logitech MX Keys S Keyboard', quantity: 1, price: 119 }
    ],
    subtotal: 1418,
    discount: 100,
    tax: 0,
    total: 1318,
    paidAmount: 1318,
    paymentMethod: 'Nagad',
    status: 'Paid',
    salesperson: 'Alice Miller',
    isOffline: false
  },
  {
    id: 'sale-4',
    invoiceNo: 'INV-2026-06-004',
    receiptSerial: 'REC-2026-004',
    date: '2026-06-25T09:30:00Z',
    customerName: 'Customer',
    items: [
      { productId: 'prod-7', productName: 'Samsung Galaxy S24 Ultra', quantity: 1, price: 1199 },
      { productId: 'prod-9', productName: 'Samsung Galaxy Buds2 Pro', quantity: 1, price: 189 }
    ],
    subtotal: 1388,
    discount: 0,
    tax: 0,
    total: 1388,
    paidAmount: 1388,
    paymentMethod: 'Rocket',
    status: 'Paid',
    salesperson: 'Bob Carter',
    isOffline: false
  },
  {
    id: 'sale-5',
    invoiceNo: 'INV-2026-07-005',
    receiptSerial: 'REC-2026-005',
    date: '2026-07-01T13:20:00Z',
    customerName: 'New Customer',
    items: [
      { productId: 'prod-5', productName: 'Kingston Renegade 2TB NVMe SSD', quantity: 2, price: 159 },
      { productId: 'prod-8', productName: 'Logitech MX Keys S Keyboard', quantity: 1, price: 119 }
    ],
    subtotal: 437,
    discount: 20,
    tax: 0,
    total: 417,
    paidAmount: 417,
    paymentMethod: 'bKash',
    status: 'Paid',
    salesperson: 'Alice Miller',
    isOffline: false
  },
  {
    id: 'sale-6',
    invoiceNo: 'INV-2026-07-006',
    receiptSerial: 'REC-2026-006',
    date: '2026-07-04T10:45:00Z',
    customerName: 'Old Customer',
    items: [
      { productId: 'prod-6', productName: 'Dell UltraSharp 27" 4K Monitor', quantity: 1, price: 449 }
    ],
    subtotal: 449,
    discount: 0,
    tax: 0,
    total: 449,
    paidAmount: 200, // PARTIAL SALE FOR DEMO
    paymentMethod: 'Cash',
    status: 'Partial',
    salesperson: 'Bob Carter',
    isOffline: true
  }
];

export const initialPurchases: Purchase[] = [
  {
    id: 'pur-1',
    purchaseNo: 'PUR-2026-001',
    date: '2026-05-02T10:00:00Z',
    supplierId: 'sup-1',
    supplierName: 'Apex Distribution Inc.',
    items: [
      { productId: 'prod-1', productName: 'Apple iPhone 15 Pro (256GB)', quantity: 15, cost: 750 },
      { productId: 'prod-2', productName: 'Apple MacBook Air M3 (13")', quantity: 5, cost: 900 }
    ],
    total: 15750,
    status: 'Received'
  },
  {
    id: 'pur-2',
    purchaseNo: 'PUR-2026-002',
    date: '2026-06-15T11:00:00Z',
    supplierId: 'sup-2',
    supplierName: 'Global Tech Logistics Co.',
    items: [
      { productId: 'prod-5', productName: 'Kingston Renegade 2TB NVMe SSD', quantity: 10, cost: 95 },
      { productId: 'prod-7', productName: 'Samsung Galaxy S24 Ultra', quantity: 8, cost: 800 }
    ],
    total: 7350,
    status: 'Received'
  },
  {
    id: 'pur-3',
    purchaseNo: 'PUR-2026-003',
    date: '2026-07-05T09:00:00Z',
    supplierId: 'sup-3',
    supplierName: 'Nexa Supply Ltd.',
    items: [
      { productId: 'prod-3', productName: 'Logitech MX Master 3S', quantity: 20, cost: 55 }
    ],
    total: 1100,
    status: 'Ordered'
  }
];

export const initialExpenses: Expense[] = [
  { id: 'exp-1', category: 'Rent', amount: 1500, date: '2026-05-01T00:00:00Z', description: 'Monthly store rental' },
  { id: 'exp-2', category: 'Utilities', amount: 350, date: '2026-05-15T00:00:00Z', description: 'Electricity & internet bill' },
  { id: 'exp-3', category: 'Salaries', amount: 4500, date: '2026-06-01T00:00:00Z', description: 'June staff payroll' },
  { id: 'exp-4', category: 'Marketing', amount: 800, date: '2026-06-20T00:00:00Z', description: 'Social media ads campaign' },
  { id: 'exp-5', category: 'Rent', amount: 1500, date: '2026-07-01T00:00:00Z', description: 'July store rental' },
  { id: 'exp-6', category: 'Packaging', amount: 200, date: '2026-07-03T00:00:00Z', description: 'Branded shipping bags' }
];

export const initialIncomes: Income[] = [
  { id: 'inc-1', category: 'Ad Revenue', amount: 120, date: '2026-05-30T00:00:00Z', description: 'In-store display ad space' },
  { id: 'inc-2', category: 'Recycling', amount: 45, date: '2026-06-12T00:00:00Z', description: 'Cardboard & battery recycle payout' },
  { id: 'inc-3', category: 'Consulting', amount: 500, date: '2026-07-02T00:00:00Z', description: 'Business IT setup setup support' }
];
