export interface ProductBatch {
  id: string;
  quantity: number;
  initialQuantity: number;
  cost: number;
  price: number;
  date: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  brandId: string;
  supplierId: string;
  price: number;
  cost: number;
  stock: number;
  minStockAlert: number;
  image: string;
  status: 'active' | 'inactive';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  batches?: ProductBatch[];
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  password?: string; // Opt for security or matching mock flow
  role: 'Administrator' | 'Manager' | 'Salesman';
  createdAt: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  code: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  logo: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  taxId?: string;
  address: string;
}

export interface SalesItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  cost?: number; // actual cost under FIFO at the time of sale
}

export interface Sale {
  id: string;
  invoiceNo: string;
  receiptSerial?: string;
  date: string;
  customerName: string;
  items: SalesItem[];
  subtotal: number;
  discount: number;
  tax?: number;
  total: number;
  paidAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Mobile' | 'bKash' | 'Nagad' | 'Rocket';
  status: 'Paid' | 'Partial' | 'Returned';
  salesperson: string;
  isOffline: boolean;
  costOfGoodsSold?: number; // total purchase cost for the items in this sale under FIFO
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
}

export interface Purchase {
  id: string;
  purchaseNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  status: 'Received' | 'Pending' | 'Ordered';
}

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  refundAmount: number;
}

export interface Return {
  id: string;
  returnNo: string;
  saleId: string;
  invoiceNo: string;
  date: string;
  items: ReturnItem[];
  refundTotal: number;
  reason: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface Income {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'system' | 'sales';
  title: string;
  message: string;
  date: string;
  read: boolean;
  referenceId?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'addition' | 'deduction';
  quantity: number;
  reason: 'Damage' | 'Theft' | 'Inventory Count' | 'Promotional Sample' | 'Other';
  notes?: string;
  date: string;
  adjustedBy: string;
  cost?: number;  // buying price of the added stock
  price?: number; // selling price of the added stock
}

export interface StockTransfer {
  id: string;
  transferNo: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  sourceLocation: 'Main Warehouse' | 'Downtown Store' | 'Uptown Store' | 'Westside Branch';
  destinationLocation: 'Main Warehouse' | 'Downtown Store' | 'Uptown Store' | 'Westside Branch';
  status: 'Pending' | 'Completed' | 'Cancelled';
  date: string;
}
