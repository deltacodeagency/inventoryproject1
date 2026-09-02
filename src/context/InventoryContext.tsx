import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductBatch, Category, Brand, Supplier, Sale, Purchase, Expense, Income, Alert, Return, ReturnItem, StockAdjustment, StockTransfer, User } from '../types';
import { signOut, useSession } from '../lib/auth-client';
import Swal from 'sweetalert2';
interface CartItem {
  product: Product;
  quantity: number;
}

interface InventoryContextType {
  // Collections
  products: Product[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  incomes: Income[];
  returns: Return[];
  alerts: Alert[];
  adjustments: StockAdjustment[];
  transfers: StockTransfer[];

  // User Authentication & Switcher states
  currentUser: User | null;
  isAuthLoading: boolean;
  users: User[];
  loginUser: (emailOrUsername: string, password?: string) => Promise<boolean>;
  registerUser: (fullName: string, username: string, email: string, password?: string, role?: 'Administrator' | 'Manager' | 'Salesman') => User | null;
  logoutUser: () => void;
  switchUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  updateUserRole: (userId: string, role: 'Administrator' | 'Manager' | 'Salesman') => void;

  // Navigation / UI State
  activeView: string;
  setActiveView: (view: string) => void;
  editingProduct: Product | null;
  setEditingProduct: (p: Product | null) => void;
  viewingProduct: Product | null;
  setViewingProduct: (p: Product | null) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;

  // POS State
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartDiscount: number;
  setCartDiscount: (disc: number) => void;
  cartTaxRate: number; // e.g. 0.08 for 8%
  setCartTaxRate: (rate: number) => void;
  checkoutCart: (customerName: string, paymentMethod: 'Cash' | 'Card' | 'Mobile' | 'bKash' | 'Nagad' | 'Rocket', paidAmount: number) => Sale | null;

  // Mutators
  addProduct: (p: Omit<Product, 'id' | 'sku'>) => void;
  addMultipleProducts: (list: (Omit<Product, 'id' | 'sku'> & { sku?: string })[]) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  deleteProducts: (ids: string[]) => void;

  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addBrand: (b: Omit<Brand, 'id'>) => void;
  updateBrand: (id: string, b: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;

  addSupplier: (s: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addPurchase: (pur: Omit<Purchase, 'id' | 'purchaseNo' | 'date'>) => void;
  addReturn: (ret: Omit<Return, 'id' | 'returnNo' | 'date'>) => void;

  addExpense: (exp: Omit<Expense, 'id' | 'date'>) => void;
  addIncome: (inc: Omit<Income, 'id' | 'date'>) => void;

  addStockAdjustment: (adj: Omit<StockAdjustment, 'id' | 'date'>) => void;
  addStockTransfer: (trans: Omit<StockTransfer, 'id' | 'transferNo' | 'date'>) => void;
  updateStockTransferStatus: (id: string, status: 'Pending' | 'Completed' | 'Cancelled') => void;

  // Alerts
  addAlert: (type: 'low_stock' | 'system' | 'sales', title: string, message: string, referenceId?: string) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  clearAllAlerts: () => void;

  // Profile
  updateProfile: (fullName: string, username: string, email: string, image?: string, newPassword?: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const normalizeUserRole = (role?: string): User['role'] => {
  const normalizedRole = String(role || '').trim().toLowerCase();

  if (normalizedRole === 'admin' || normalizedRole === 'administrator' || normalizedRole === 'super admin' || normalizedRole === 'super-admin' || normalizedRole === 'superadmin') return 'Administrator';
  if (normalizedRole === 'manager' || normalizedRole === 'store manager') return 'Manager';
  if (normalizedRole === 'salesman' || normalizedRole === 'salesperson') return 'Salesman';
  return 'Salesman';
};

const normalizeAuditIdentity = (value?: string): string => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return 'administrator';

  const normalizedRole = normalizedValue.toLowerCase();
  if (normalizedRole === 'admin' || normalizedRole === 'administrator' || normalizedRole === 'super admin' || normalizedRole === 'super-admin' || normalizedRole === 'superadmin') {
    return 'administrator';
  }

  return normalizedValue;
};

const getDefaultUsers = (): User[] => [
  { id: 'u-1', fullName: 'Administrator', username: 'administrator', email: 'admin@dreamspos.com', role: 'Administrator', createdAt: new Date('2026-01-01').toISOString(), password: 'administrator' },
  { id: 'u-2', fullName: 'Emma Manager', username: 'emma', email: 'emma@dreamspos.com', role: 'Manager', createdAt: new Date('2026-02-15').toISOString(), password: 'administrator' },
  { id: 'u-3', fullName: 'David Salesman', username: 'david', email: 'david@dreamspos.com', role: 'Salesman', createdAt: new Date('2026-03-22').toISOString(), password: 'administrator' },
];

const readStoredCollection = <T,>(key: string, fallback: T): T => {
  return fallback;
};

const writeStoredCollection = <T,>(key: string, value: T) => {
  // Persistence is handled by the Neon API, not browser storage.
};

const readStoredCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const match = document.cookie.match(/(?:^|; )ims_current_user=([^;]+)/);
    if (match) {
      return JSON.parse(decodeURIComponent(match[1])) as User;
    }
  } catch {
    return null;
  }
  return null;
};

// Local browser data belonged to the previous storage backend. Clear it once
// after switching to Neon so stale records are not loaded and synced again.
const NEON_STORAGE_VERSION = 'neon-v2';
if (typeof window !== 'undefined' && window.localStorage.getItem('ims_storage_version') !== NEON_STORAGE_VERSION) {
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith('ims_'))
    .forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.setItem('ims_storage_version', NEON_STORAGE_VERSION);
}

const syncQueues = new Map<string, Promise<void>>();

const syncCollectionToServer = async (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;

  const previousSync = syncQueues.get(key) || Promise.resolve();
  const currentSync = previousSync.then(async () => {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: key, records: value }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok === false) {
        throw new Error(result.error || `Sync failed for ${key}`);
      }
    } catch (error) {
      console.error(`Neon sync failed for ${key}:`, error);
    }
  });
  syncQueues.set(key, currentSync);
  await currentSync;
};

const fetchCollectionFromNeon = async <T,>(key: string): Promise<T[] | null> => {
  try {
    const response = await fetch(`/api/data/${key}`);
    const result = await response.json();
    if (!response.ok || result.ok === false || !Array.isArray(result.records)) {
      throw new Error(result.error || `Unable to load ${key} from Neon`);
    }
    return result.records as T[];
  } catch (error) {
    console.error(`Neon read failed for ${key}:`, error);
    return null;
  }
};

export const ensureProductBatches = (p: Product): ProductBatch[] => {
  if (p.batches && p.batches.length > 0) {
    return p.batches;
  }
  return [
    {
      id: `batch-initial-${p.id}`,
      quantity: p.stock,
      initialQuantity: p.stock,
      cost: p.cost,
      price: p.price,
      date: p.createdAt || new Date().toISOString()
    }
  ];
};

export const syncBatchesToStock = (
  batches: ProductBatch[],
  targetStock: number,
  defaultCost: number,
  defaultPrice: number,
  date: string
): ProductBatch[] => {
  const currentTotal = batches.reduce((sum, b) => sum + b.quantity, 0);
  if (currentTotal === targetStock) {
    return batches;
  }
  const result = batches.map(b => ({ ...b }));
  if (targetStock > currentTotal) {
    const diff = targetStock - currentTotal;
    result.push({
      id: `batch-sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      quantity: diff,
      initialQuantity: diff,
      cost: defaultCost,
      price: defaultPrice,
      date: date
    });
  } else {
    let diff = currentTotal - targetStock;
    for (let i = 0; i < result.length; i++) {
      if (result[i].quantity <= 0) continue;
      const subtract = Math.min(result[i].quantity, diff);
      result[i].quantity -= subtract;
      diff -= subtract;
      if (diff <= 0) break;
    }
  }
  return result;
};

export const consumeStockFIFO = (product: Product, quantityToSell: number) => {
  const batches = ensureProductBatches(product).map(b => ({ ...b }));
  let remaining = quantityToSell;
  let totalCost = 0;
  let totalPrice = 0;

  for (let i = 0; i < batches.length; i++) {
    const b = batches[i];
    if (b.quantity <= 0) continue;

    const taken = Math.min(b.quantity, remaining);
    b.quantity -= taken;
    totalCost += taken * b.cost;
    totalPrice += taken * b.price;
    remaining -= taken;

    if (remaining <= 0) break;
  }

  if (remaining > 0) {
    totalCost += remaining * product.cost;
    totalPrice += remaining * product.price;
  }

  const firstActiveBatch = batches.find(b => b.quantity > 0);
  const newCost = firstActiveBatch ? firstActiveBatch.cost : product.cost;
  const newPrice = firstActiveBatch ? firstActiveBatch.price : product.price;

  return {
    updatedBatches: batches,
    totalCost,
    totalPrice,
    newCost,
    newPrice,
    newStock: Math.max(0, product.stock - quantityToSell)
  };
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: authSession, isPending: isAuthSessionPending } = useSession();
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // Navigation
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Neon is now the source of truth; do not restore the old browser cache.
  const [products, setProducts] = useState<Product[]>(() => {
    const savedProducts = readStoredCollection<Product[]>('ims_products', []);
    return savedProducts.map((product) => ({
      ...product,
      createdBy: normalizeAuditIdentity(product.createdBy),
    }));
  });

  const [categories, setCategories] = useState<Category[]>(() => readStoredCollection('ims_categories', []));

  const [brands, setBrands] = useState<Brand[]>(() => readStoredCollection('ims_brands', []));

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => readStoredCollection('ims_suppliers', []));

  const [sales, setSales] = useState<Sale[]>(() => {
    const savedSales = readStoredCollection<Sale[]>('ims_sales', []);
    return savedSales.map((sale) => ({
      ...sale,
      salesperson: normalizeAuditIdentity(sale.salesperson),
    }));
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => readStoredCollection('ims_purchases', []));

  const [expenses, setExpenses] = useState<Expense[]>(() => readStoredCollection('ims_expenses', []));

  const [incomes, setIncomes] = useState<Income[]>(() => readStoredCollection('ims_incomes', []));

  const [returns, setReturns] = useState<Return[]>(() => readStoredCollection('ims_returns', []));

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(() => readStoredCollection('ims_adjustments', []));

  const [transfers, setTransfers] = useState<StockTransfer[]>(() => readStoredCollection('ims_transfers', []));

  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = readStoredCollection<User[]>('ims_users', getDefaultUsers());
    if (!Array.isArray(savedUsers) || savedUsers.length === 0) {
      return getDefaultUsers();
    }

    return savedUsers.map((u) => ({
      ...u,
      fullName: u.fullName || u.username || 'User',
      role: normalizeUserRole(u.role),
      username: u.username === 'admin' ? 'administrator' : (u.username || 'user'),
      email: u.email || `${u.username}@dreamspos.local`,
    }));
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedCurrentUser = readStoredCurrentUser();
    if (!savedCurrentUser) return null;

    return {
      ...savedCurrentUser,
      fullName: savedCurrentUser.fullName || savedCurrentUser.username || 'User',
      role: normalizeUserRole(savedCurrentUser.role),
      username: savedCurrentUser.username === 'admin' ? 'administrator' : (savedCurrentUser.username || 'user'),
      email: savedCurrentUser.email || `${savedCurrentUser.username}@dreamspos.local`,
    };
  });

  // Better Auth owns Google sessions. Mirror the authenticated session into
  // the existing inventory user state so protected routes can render the
  // dashboard after the OAuth callback.
  useEffect(() => {
    const authUser = authSession?.user;
    if (!authUser) {
      if (!isAuthSessionPending) setIsAuthInitialized(true);
      return;
    }

    const sessionUser = authUser as typeof authUser & { role?: string; fullName?: string; username?: string };
    const username = sessionUser.username || sessionUser.name || sessionUser.email.split('@')[0] || 'user';
    const signedInUser: User = {
      id: sessionUser.id,
      username,
      fullName: sessionUser.fullName || sessionUser.name || username,
      email: sessionUser.email,
      role: normalizeUserRole(sessionUser.role),
      createdAt: new Date().toISOString(),
      image: sessionUser.image || undefined,
    };

    setCurrentUser((existingUser) => existingUser?.id === signedInUser.id ? existingUser : signedInUser);
    setIsAuthInitialized(true);
  }, [authSession, isAuthSessionPending]);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [neonLoaded, setNeonLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadNeonData = async () => {
      const [neonUsers, neonProducts, neonCategories, neonBrands, neonSuppliers, neonSales, neonPurchases, neonExpenses, neonIncomes, neonReturns, neonAdjustments, neonTransfers] = await Promise.all([
        fetchCollectionFromNeon<User>('users'),
        fetchCollectionFromNeon<Product>('products'),
        fetchCollectionFromNeon<Category>('categories'),
        fetchCollectionFromNeon<Brand>('brands'),
        fetchCollectionFromNeon<Supplier>('suppliers'),
        fetchCollectionFromNeon<Sale>('sales'),
        fetchCollectionFromNeon<Purchase>('purchases'),
        fetchCollectionFromNeon<Expense>('expenses'),
        fetchCollectionFromNeon<Income>('incomes'),
        fetchCollectionFromNeon<Return>('returns'),
        fetchCollectionFromNeon<StockAdjustment>('adjustments'),
        fetchCollectionFromNeon<StockTransfer>('transfers'),
      ]);

      if (cancelled) return;
      if (neonUsers) {
        setUsers(neonUsers.length > 0 ? neonUsers.map((user) => ({
          ...user,
          fullName: user.fullName || (user as User & { name?: string }).name || 'User',
          username: user.username || (user as User & { name?: string }).name || 'user',
          role: normalizeUserRole(user.role),
        })) : getDefaultUsers());
      }
      if (neonProducts) setProducts(neonProducts.map((product) => ({ ...product, createdBy: normalizeAuditIdentity(product.createdBy) })));
      if (neonCategories) setCategories(neonCategories);
      if (neonBrands) setBrands(neonBrands);
      if (neonSuppliers) setSuppliers(neonSuppliers);
      if (neonSales) setSales(neonSales);
      if (neonPurchases) setPurchases(neonPurchases);
      if (neonExpenses) setExpenses(neonExpenses);
      if (neonIncomes) setIncomes(neonIncomes);
      if (neonReturns) setReturns(neonReturns);
      if (neonAdjustments) setAdjustments(neonAdjustments);
      if (neonTransfers) setTransfers(neonTransfers);
      setNeonLoaded(true);
    };

    void loadNeonData();
    return () => { cancelled = true; };
  }, []);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [cartTaxRate, setCartTaxRate] = useState<number>(0); // tax disabled

  // Save to localStorage whenever collections change
  useEffect(() => {
    if (!neonLoaded) return;
    writeStoredCollection('ims_users', users);
    void syncCollectionToServer('users', users);
  }, [users, neonLoaded]);

  useEffect(() => {
    if (currentUser) {
      document.cookie = `ims_current_user=${encodeURIComponent(JSON.stringify(currentUser))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else if (typeof document !== 'undefined') {
      document.cookie = 'ims_current_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }, [currentUser]);

  useEffect(() => {
    if (!neonLoaded) return;
    writeStoredCollection('ims_products', products);
    void syncCollectionToServer('products', products);
  }, [products, neonLoaded]);

  useEffect(() => {
    if (!neonLoaded) return;
    writeStoredCollection('ims_categories', categories);
    void syncCollectionToServer('categories', categories);
  }, [categories, neonLoaded]);

  useEffect(() => {
    if (!neonLoaded) return;
    writeStoredCollection('ims_brands', brands);
    void syncCollectionToServer('brands', brands);
  }, [brands, neonLoaded]);

  useEffect(() => {
    if (!neonLoaded) return;
    writeStoredCollection('ims_suppliers', suppliers);
    void syncCollectionToServer('suppliers', suppliers);
  }, [suppliers, neonLoaded]);

  useEffect(() => {
    if (!neonLoaded) return;
    void syncCollectionToServer('sales', sales);
  }, [sales, neonLoaded]);

  useEffect(() => {
    if (!neonLoaded) return;
    void syncCollectionToServer('purchases', purchases);
  }, [purchases, neonLoaded]);

  useEffect(() => {
    if (!neonLoaded) return;
    void syncCollectionToServer('expenses', expenses);
  }, [expenses, neonLoaded]);

  useEffect(() => {
    if (!neonLoaded) return;
    void syncCollectionToServer('incomes', incomes);
  }, [incomes, neonLoaded]);

  useEffect(() => {
    if (!neonLoaded) return;
    void syncCollectionToServer('returns', returns);
  }, [returns, neonLoaded]);

  useEffect(() => {
    if (!neonLoaded) return;
    void syncCollectionToServer('adjustments', adjustments);
  }, [adjustments, neonLoaded]);

  useEffect(() => {
    if (!neonLoaded) return;
    void syncCollectionToServer('transfers', transfers);
  }, [transfers, neonLoaded]);

  // Compute stock alerts based on current products list
  useEffect(() => {
    const stockAlerts: Alert[] = [];
    products.forEach((prod) => {
      if (prod.stock <= prod.minStockAlert) {
        stockAlerts.push({
          id: `alert-low-${prod.id}`,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${prod.name} has dropped to ${prod.stock} items in stock (Alert threshold: ${prod.minStockAlert}).`,
          date: new Date().toISOString(),
          read: false,
          referenceId: prod.id,
        });
      }
    });

    // Add any existing offline/sync status as system alerts
    if (isOffline) {
      stockAlerts.push({
        id: 'alert-system-offline',
        type: 'system',
        title: 'POS Offline Active',
        message: 'Your system is operating in offline mode. Sales will queue until synced.',
        date: new Date().toISOString(),
        read: false,
      });
    }

    setAlerts(stockAlerts);
  }, [products, isOffline]);

  // Alert Actions
  const addAlert = (type: 'low_stock' | 'system' | 'sales', title: string, message: string, referenceId?: string) => {
    const newAlert: Alert = {
      id: `alert-dyn-${Date.now()}`,
      type,
      title,
      message,
      date: new Date().toISOString(),
      read: false,
      referenceId,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const markAlertRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const markAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const assertNotSalesman = (actionName: string): boolean => {
    if (currentUser?.role === 'Salesman') {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: `Access Denied: Salesmen are not authorized to ${actionName}.`, confirmButtonColor: '#2563eb' });
      return false;
    }
    return true;
  };

  // Product CRUD
  const addProduct = (p: Omit<Product, 'id' | 'sku'>) => {
    if (!assertNotSalesman('add products')) return;
    const category = categories.find((c) => c.id === p.categoryId);
    const brand = brands.find((b) => b.id === p.brandId);
    
    const catCode = category ? category.code : 'GEN';
    const brandCode = brand ? brand.name.substring(0, 3).toUpperCase() : 'GEN';
    const count = products.filter((pr) => pr.categoryId === p.categoryId).length + 1;
    const sku = `${catCode}-${brandCode}-${String(count).padStart(3, '0')}`;

    const id = `prod-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const newProd: Product = {
      ...p,
      id,
      sku,
      createdBy: currentUser?.username || 'administrator',
      createdAt,
      updatedAt: createdAt,
      batches: p.stock > 0 ? [{
        id: `batch-init-${id}-${Date.now()}`,
        quantity: p.stock,
        initialQuantity: p.stock,
        cost: p.cost,
        price: p.price,
        date: createdAt
      }] : []
    };
    setProducts((prev) => [newProd, ...prev]);
    
    addAlert('system', 'New Product Created', `${newProd.name} (SKU: ${newProd.sku}) has been added.`, newProd.id);
  };

  const addMultipleProducts = (list: (Omit<Product, 'id' | 'sku'> & { sku?: string })[]) => {
    if (!assertNotSalesman('add products')) return;
    
    setProducts((prev) => {
      let currentProducts = [...prev];
      const addedProductNames: string[] = [];
      
      list.forEach((p, idx) => {
        const category = categories.find((c) => c.id === p.categoryId);
        const brand = brands.find((b) => b.id === p.brandId);
        
        const catCode = category ? category.code : 'GEN';
        const brandCode = brand ? brand.name.substring(0, 3).toUpperCase() : 'GEN';
        
        const count = currentProducts.filter((pr) => pr.categoryId === p.categoryId).length + 1;
        const generatedSku = `${catCode}-${brandCode}-${String(count).padStart(3, '0')}`;
        const sku = p.sku || generatedSku;
        
        const id = `prod-${Date.now()}-${idx}`;
        const createdAt = new Date().toISOString();
        const newProd: Product = {
          ...p,
          id,
          sku,
          createdBy: currentUser?.username || 'administrator',
          createdAt,
          updatedAt: createdAt,
          batches: p.stock > 0 ? [{
            id: `batch-init-${id}-${Date.now()}`,
            quantity: p.stock,
            initialQuantity: p.stock,
            cost: p.cost,
            price: p.price,
            date: createdAt
          }] : []
        };
        currentProducts = [newProd, ...currentProducts];
        addedProductNames.push(newProd.name);
      });
      
      addAlert(
        'system', 
        'Bulk Import Successful', 
        `Successfully imported ${list.length} products: ${addedProductNames.slice(0, 3).join(', ')}${addedProductNames.length > 3 ? '...' : ''}`
      );
      return currentProducts;
    });
  };

  const updateProduct = (id: string, p: Partial<Product>) => {
    if (!assertNotSalesman('edit products')) return;
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === id) {
          let updatedBatches = prod.batches && prod.batches.length > 0 ? prod.batches.map(b => ({ ...b })) : ensureProductBatches(prod);
          
          if (p.stock !== undefined && p.stock !== prod.stock) {
            updatedBatches = syncBatchesToStock(
              updatedBatches,
              p.stock,
              p.cost !== undefined ? p.cost : prod.cost,
              p.price !== undefined ? p.price : prod.price,
              new Date().toISOString()
            );
          } else {
            if (p.price !== undefined || p.cost !== undefined) {
              updatedBatches = updatedBatches.map(b => {
                if (b.quantity > 0) {
                  return {
                    ...b,
                    ...(p.price !== undefined ? { price: p.price } : {}),
                    ...(p.cost !== undefined ? { cost: p.cost } : {})
                  };
                }
                return b;
              });
            }
          }

          const firstActive = updatedBatches.find(b => b.quantity > 0);
          const finalCost = firstActive ? firstActive.cost : (p.cost !== undefined ? p.cost : prod.cost);
          const finalPrice = firstActive ? firstActive.price : (p.price !== undefined ? p.price : prod.price);

          const updated: Product = { 
            ...prod, 
            ...p,
            cost: finalCost,
            price: finalPrice,
            batches: updatedBatches,
            createdBy: prod.createdBy || 'administrator',
            createdAt: prod.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          if (updated.stock <= updated.minStockAlert && prod.stock > prod.minStockAlert) {
            // Trigger critical notification if it just dropped
            addAlert('low_stock', 'Stock Warning', `${updated.name} has run low (${updated.stock} left).`, id);
          }
          return updated;
        }
        return prod;
      })
    );
  };

  const deleteProduct = (id: string) => {
    if (!assertNotSalesman('delete products')) return;
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    fetch(`/api/data/products/${id}`, { method: 'DELETE' }).catch(console.error);
    if (prod) {
      addAlert('system', 'Product Deleted', `Product ${prod.name} has been removed from inventory.`);
    }
  };

  const deleteProducts = (ids: string[]) => {
    if (!assertNotSalesman('delete products')) return;
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
    ids.forEach(id => fetch(`/api/data/products/${id}`, { method: 'DELETE' }).catch(console.error));
    if (ids.length > 0) {
      addAlert('system', 'Products Deleted', `${ids.length} products have been removed from inventory.`);
    }
  };

  // Category CRUD
  const addCategory = (c: Omit<Category, 'id'>) => {
    if (!assertNotSalesman('add categories')) return;
    const newCat: Category = {
      ...c,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (id: string, c: Partial<Category>) => {
    if (!assertNotSalesman('edit categories')) return;
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...c } : cat)));
  };

  const deleteCategory = (id: string) => {
    if (!assertNotSalesman('delete categories')) return;
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    fetch(`/api/data/categories/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  // Brand CRUD
  const addBrand = (b: Omit<Brand, 'id'>) => {
    if (!assertNotSalesman('add brands')) return;
    const newBrand: Brand = {
      ...b,
      id: `br-${Date.now()}`,
    };
    setBrands((prev) => [...prev, newBrand]);
  };

  const updateBrand = (id: string, b: Partial<Brand>) => {
    if (!assertNotSalesman('edit brands')) return;
    setBrands((prev) => prev.map((br) => (br.id === id ? { ...br, ...b } : br)));
  };

  const deleteBrand = (id: string) => {
    if (!assertNotSalesman('delete brands')) return;
    setBrands((prev) => prev.filter((br) => br.id !== id));
    fetch(`/api/data/brands/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  // Supplier CRUD
  const addSupplier = (s: Omit<Supplier, 'id'>) => {
    if (!assertNotSalesman('add suppliers')) return;
    const newSup: Supplier = {
      ...s,
      id: `sup-${Date.now()}`,
    };
    setSuppliers((prev) => [...prev, newSup]);
  };

  const updateSupplier = (id: string, s: Partial<Supplier>) => {
    if (!assertNotSalesman('edit suppliers')) return;
    setSuppliers((prev) => prev.map((sup) => (sup.id === id ? { ...sup, ...s } : sup)));
  };

  const deleteSupplier = (id: string) => {
    if (!assertNotSalesman('delete suppliers')) return;
    setSuppliers((prev) => prev.filter((sup) => sup.id !== id));
    fetch(`/api/data/suppliers/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  // POS CART ACTIONS
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      addAlert('system', 'Out of Stock Warning', `Cannot add ${product.name} to cart. Item is completely out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          addAlert('system', 'In-Stock Limit Reached', `Available stock for ${product.name} is ${product.stock} units.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (quantity > product.stock) {
      addAlert('system', 'In-Stock Limit Reached', `Only ${product.stock} units of ${product.name} are available.`);
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
  };

  const checkoutCart = (customerName: string, paymentMethod: 'Cash' | 'Card' | 'Mobile' | 'bKash' | 'Nagad' | 'Rocket', paidAmount: number): Sale | null => {
    if (cart.length === 0) return null;

    let totalCOGS = 0;
    const saleItems = cart.map((item) => {
      const p = products.find((prod) => prod.id === item.product.id) || item.product;
      const { totalCost, totalPrice } = consumeStockFIFO(p, item.quantity);
      totalCOGS += totalCost;
      
      return {
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: totalPrice / item.quantity, // actual average FIFO selling price
        cost: totalCost / item.quantity,   // actual average FIFO buying cost
      };
    });

    // Calculate invoice dimensions using FIFO prices
    const subtotal = saleItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discount = cartDiscount;
    const tax = 0;
    const total = Math.max(0, Math.round(subtotal - discount));

    const seqNumber = String(sales.length + 1).padStart(3, '0');
    const invoiceNo = `INV-2026-${seqNumber}`;
    const receiptSerial = `REC-2026-${seqNumber}`;
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNo,
      receiptSerial,
      date: new Date().toISOString(),
      customerName: customerName.trim() || 'Customer',
      items: saleItems,
      subtotal,
      discount,
      tax,
      total,
      paidAmount: paidAmount >= total ? total : paidAmount,
      paymentMethod,
      status: paidAmount >= total ? 'Paid' : 'Partial',
      salesperson: currentUser?.username || 'administrator',
      isOffline,
      costOfGoodsSold: totalCOGS,
    };

    // Deduct stock in real-time and update product batches & current prices
    setProducts((prev) =>
      prev.map((p) => {
        const cartMatch = cart.find((item) => item.product.id === p.id);
        if (cartMatch) {
          const { updatedBatches, newCost, newPrice, newStock } = consumeStockFIFO(p, cartMatch.quantity);
          return {
            ...p,
            stock: newStock,
            cost: newCost,
            price: newPrice,
            batches: updatedBatches,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );

    // Save sale
    setSales((prev) => [newSale, ...prev]);
    clearCart();

    // Trigger purchase orders/notif if a transaction creates a critical stock level
    addAlert('sales', 'Sale Completed', `Invoice ${invoiceNo} generated for ৳${Math.round(total)}.`);

    return newSale;
  };

  // Purchase Order Add
  const addPurchase = (pur: Omit<Purchase, 'id' | 'purchaseNo' | 'date'>) => {
    if (!assertNotSalesman('create purchase orders')) return;
    const purchaseNo = `PUR-2026-${String(purchases.length + 1).padStart(3, '0')}`;
    const newPurchase: Purchase = {
      ...pur,
      id: `pur-${Date.now()}`,
      purchaseNo,
      date: new Date().toISOString(),
    };

    // If purchase is marked as 'Received', add items to inventory in real-time
    if (pur.status === 'Received') {
      setProducts((prev) =>
        prev.map((p) => {
          const receivedMatch = pur.items.find((item) => item.productId === p.id);
          if (receivedMatch) {
            const updatedBatches = ensureProductBatches(p).map(b => ({ ...b }));
            updatedBatches.push({
              id: `batch-pur-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              quantity: receivedMatch.quantity,
              initialQuantity: receivedMatch.quantity,
              cost: receivedMatch.cost,
              price: p.price,
              date: new Date().toISOString()
            });
            const firstActive = updatedBatches.find(b => b.quantity > 0);
            const newCost = firstActive ? firstActive.cost : receivedMatch.cost;
            const newPrice = firstActive ? firstActive.price : p.price;
            return {
              ...p,
              stock: p.stock + receivedMatch.quantity,
              cost: newCost,
              price: newPrice,
              batches: updatedBatches,
              updatedAt: new Date().toISOString()
            };
          }
          return p;
        })
      );
    }

    setPurchases((prev) => [newPurchase, ...prev]);
    addAlert('system', 'Purchase Order Generated', `Purchase order ${purchaseNo} created for supplier ${pur.supplierName}.`);
  };

  // Sales Returns
  const addReturn = (ret: Omit<Return, 'id' | 'returnNo' | 'date'>) => {
    if (!assertNotSalesman('process sales returns')) return;
    const returnNo = `RET-2026-${String(returns.length + 1).padStart(3, '0')}`;
    const newReturn: Return = {
      ...ret,
      id: `ret-${Date.now()}`,
      returnNo,
      date: new Date().toISOString(),
    };

    // Put items back in inventory in real-time
    setProducts((prev) =>
      prev.map((p) => {
        const returnedMatch = ret.items.find((item) => item.productId === p.id);
        if (returnedMatch) {
          return { ...p, stock: p.stock + returnedMatch.quantity };
        }
        return p;
      })
    );

    // Remove a fully returned sale; for partial returns, retain only the
    // remaining items and recalculate its displayed amounts.
    setSales((prev) =>
      prev.flatMap((sale) => {
        if (sale.id !== ret.saleId) return [sale];

        const returnedQuantities = new Map(ret.items.map((item) => [item.productId, item.quantity]));
        const remainingItems = sale.items
          .map((item) => ({
            ...item,
            quantity: Math.max(0, item.quantity - (returnedQuantities.get(item.productId) ?? 0)),
          }))
          .filter((item) => item.quantity > 0);
        const remainingItemQuantity = remainingItems.reduce((sum, item) => sum + item.quantity, 0);

        if (remainingItemQuantity === 0) return [];

        const originalMerchandiseTotal = sale.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const remainingMerchandiseTotal = remainingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const remainingRatio = originalMerchandiseTotal > 0 ? remainingMerchandiseTotal / originalMerchandiseTotal : 0;
        const total = sale.total * remainingRatio;

        return [{
          ...sale,
          items: remainingItems,
          subtotal: sale.subtotal * remainingRatio,
          discount: sale.discount * remainingRatio,
          tax: sale.tax === undefined ? undefined : sale.tax * remainingRatio,
          total,
          paidAmount: Math.min(total, sale.paidAmount * remainingRatio),
        }];
      })
    );

    setReturns((prev) => [newReturn, ...prev]);
    addAlert('system', 'Sales Return Processed', `Return ${returnNo} has been filed for ${ret.invoiceNo}. Stock has been updated.`);
  };

  // Expense Mutator
  const addExpense = (exp: Omit<Expense, 'id' | 'date'>) => {
    if (!assertNotSalesman('record expenses')) return;
    const newExp: Expense = {
      ...exp,
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  // Income Mutator
  const addIncome = (inc: Omit<Income, 'id' | 'date'>) => {
    if (!assertNotSalesman('record incomes')) return;
    const newInc: Income = {
      ...inc,
      id: `inc-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setIncomes((prev) => [newInc, ...prev]);
  };

  const addStockAdjustment = (adj: Omit<StockAdjustment, 'id' | 'date'>) => {
    if (!assertNotSalesman('create stock adjustments')) return;
    const newAdj: StockAdjustment = {
      ...adj,
      id: `adj-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setAdjustments((prev) => [newAdj, ...prev]);

    // Update product stock immediately
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === adj.productId) {
          if (adj.type === 'addition') {
            const updatedBatches = ensureProductBatches(p).map(b => ({ ...b }));
            const costVal = adj.cost !== undefined ? adj.cost : p.cost;
            const priceVal = adj.price !== undefined ? adj.price : p.price;
            updatedBatches.push({
              id: `batch-adj-${Date.now()}`,
              quantity: adj.quantity,
              initialQuantity: adj.quantity,
              cost: costVal,
              price: priceVal,
              date: new Date().toISOString(),
            });
            const firstActive = updatedBatches.find(b => b.quantity > 0);
            const newCost = firstActive ? firstActive.cost : costVal;
            const newPrice = firstActive ? firstActive.price : priceVal;
            return {
              ...p,
              stock: p.stock + adj.quantity,
              cost: newCost,
              price: newPrice,
              batches: updatedBatches,
              updatedAt: new Date().toISOString()
            };
          } else {
            // deduction: FIFO consumption
            const { updatedBatches, newCost, newPrice, newStock } = consumeStockFIFO(p, adj.quantity);
            return {
              ...p,
              stock: newStock,
              cost: newCost,
              price: newPrice,
              batches: updatedBatches,
              updatedAt: new Date().toISOString()
            };
          }
        }
        return p;
      })
    );

    addAlert('system', 'Stock Adjusted', `Stock for ${adj.productName} was adjusted (${adj.type === 'addition' ? '+' : '-'}${adj.quantity}) due to ${adj.reason}.`);
  };

  const applyTransferStockAdjustment = (
    productId: string,
    source: string,
    dest: string,
    qty: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          let diff = 0;
          if (dest === 'Downtown Store') {
            diff += qty;
          }
          if (source === 'Downtown Store') {
            diff -= qty;
          }
          const newStock = Math.max(0, p.stock + diff);
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
  };

  const addStockTransfer = (trans: Omit<StockTransfer, 'id' | 'transferNo' | 'date'>) => {
    if (!assertNotSalesman('create stock transfers')) return;
    const transferNo = `TRF-2026-${String(transfers.length + 1).padStart(3, '0')}`;
    const newTrans: StockTransfer = {
      ...trans,
      id: `trf-${Date.now()}`,
      transferNo,
      date: new Date().toISOString(),
    };
    setTransfers((prev) => [newTrans, ...prev]);

    // If transfer is already Completed, adjust stock immediately
    if (trans.status === 'Completed') {
      applyTransferStockAdjustment(trans.productId, trans.sourceLocation, trans.destinationLocation, trans.quantity);
    }

    addAlert('system', 'Stock Transfer Created', `Transfer ${transferNo} for ${trans.productName} has been created with status ${trans.status}.`);
  };

  const updateStockTransferStatus = (id: string, status: 'Pending' | 'Completed' | 'Cancelled') => {
    if (!assertNotSalesman('update stock transfer status')) return;
    setTransfers((prev) =>
      prev.map((trf) => {
        if (trf.id === id) {
          // If status changes to Completed, apply stock change
          if (status === 'Completed' && trf.status !== 'Completed') {
            applyTransferStockAdjustment(trf.productId, trf.sourceLocation, trf.destinationLocation, trf.quantity);
            addAlert('system', 'Transfer Completed', `Stock transfer ${trf.transferNo} was completed. Stock levels updated.`);
          } else if (status === 'Cancelled' && trf.status === 'Completed') {
            // Revert stock adjustment if it was previously completed
            applyTransferStockAdjustment(trf.productId, trf.destinationLocation, trf.sourceLocation, trf.quantity);
            addAlert('system', 'Transfer Cancelled', `Stock transfer ${trf.transferNo} was cancelled and stock was reverted.`);
          }
          return { ...trf, status };
        }
        return trf;
      })
    );
  };

  const loginUser = async (emailOrUsername: string, password?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/local-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: emailOrUsername, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.ok && result.user) {
        const safeUser = {
          ...result.user,
          fullName: result.user.fullName || result.user.username || 'User',
          role: normalizeUserRole(result.user.role),
        } as User;
        setCurrentUser(safeUser);
        addAlert('system', 'User Logged In', `${safeUser.fullName} (${safeUser.role}) has logged in successfully.`);
        return true;
      }
    } catch (error) {
      console.error('Neon login failed:', error);
    }

    const normalizedEmailOrUsername = emailOrUsername.trim().toLowerCase();
    const found = users.find((u) => {
      const matchesIdentity = u.email.toLowerCase() === normalizedEmailOrUsername || u.username.toLowerCase() === normalizedEmailOrUsername;
      const matchesPassword = !password || u.password === password;
      return matchesIdentity && matchesPassword;
    });

    if (found) {
      const safeUser = { ...found, role: normalizeUserRole(found.role) };
      setCurrentUser(safeUser);
      addAlert('system', 'User Logged In', `${safeUser.username} (${safeUser.role}) has logged in successfully.`);
      return true;
    }
    return false;
  };

  const registerUser = (fullName: string, username: string, email: string, password?: string, role?: 'Administrator' | 'Manager' | 'Salesman'): User | null => {
    if (currentUser?.role === 'Salesman') {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'Salesmen are not authorized to register users.', confirmButtonColor: '#2563eb' });
      return null;
    }
    if (currentUser?.role === 'Manager' && role === 'Administrator') {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'Managers cannot register Administrator accounts.', confirmButtonColor: '#2563eb' });
      return null;
    }

    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase());
    if (exists) return null;

    const newUser: User = {
      id: `u-${Date.now()}`,
      fullName: fullName.trim(),
      username,
      email,
      password: password || 'administrator',
      role: role || 'Salesman',
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    addAlert('system', 'New User Registered', `Account created for ${fullName} as ${newUser.role}.`);
    return newUser;
  };

  const logoutUser = () => {
    if (currentUser) {
      addAlert('system', 'User Logged Out', `${currentUser.username} logged out.`);
    }
    setCurrentUser(null);
    void signOut().catch((error) => {
      console.error('Better Auth sign-out failed:', error);
    });
  };

  const switchUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      addAlert('system', 'Role Switched', `Active session switched to ${found.username} (${found.role}).`);
    }
  };

  const deleteUser = (userId: string) => {    if (currentUser?.id === userId) {
      Swal.fire({ icon: 'error', title: 'Action Denied', text: 'Cannot delete currently logged-in user!', confirmButtonColor: '#2563eb' });
      return;
    }
    if (currentUser?.role === 'Salesman') {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'Salesmen cannot delete users.', confirmButtonColor: '#2563eb' });
      return;
    }
    const userToDelete = users.find(u => u.id === userId);
    if (currentUser?.role === 'Manager' && userToDelete?.role === 'Administrator') {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'Managers cannot delete Administrator accounts.', confirmButtonColor: '#2563eb' });
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    fetch(`/api/data/users/${userId}`, { method: 'DELETE' }).catch(console.error);
    addAlert('system', 'User Deleted', `User record removed from store database.`);
  };

  const updateUserRole = (userId: string, role: 'Administrator' | 'Manager' | 'Salesman') => {
    if (currentUser?.role === 'Salesman') {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'Salesmen cannot modify user roles.', confirmButtonColor: '#2563eb' });
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (currentUser?.role === 'Manager') {
      if (targetUser.role === 'Administrator') {
        Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'Managers cannot change the Administrator role.', confirmButtonColor: '#2563eb' });
        return;
      }
      if (role === 'Administrator') {
        Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'Managers cannot promote accounts to Administrator.', confirmButtonColor: '#2563eb' });
        return;
      }
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, role } : null);
    }
    addAlert('system', 'User Role Updated', `User permissions updated.`);
  };

  const updateProfile = (fullName: string, username: string, email: string, image?: string, newPassword?: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, fullName, username, email, image };
    if (newPassword) {
      updatedUser.password = newPassword;
    }
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, fullName, username, email, image, ...(newPassword ? { password: newPassword } : {}) } : u));
    addAlert('system', 'Profile Updated', `Your profile details have been successfully updated.`);
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        categories,
        brands,
        suppliers,
        sales,
        purchases,
        expenses,
        incomes,
        returns,
        alerts,
        adjustments,
        transfers,
        currentUser,
        isAuthLoading: !isAuthInitialized,
        users,
        loginUser,
        registerUser,
        logoutUser,
        switchUser,
        deleteUser,
        updateUserRole,
        activeView,
        setActiveView,
        editingProduct,
        setEditingProduct,
        viewingProduct,
        setViewingProduct,
        isOffline,
        setIsOffline,
        searchTerm,
        setSearchTerm,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartDiscount,
        setCartDiscount,
        cartTaxRate,
        setCartTaxRate,
        checkoutCart,
        addProduct,
        addMultipleProducts,
        updateProduct,
        deleteProduct,
        deleteProducts,
        addCategory,
        updateCategory,
        deleteCategory,
        addBrand,
        updateBrand,
        deleteBrand,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addPurchase,
        addReturn,
        addExpense,
        addIncome,
        addStockAdjustment,
        addStockTransfer,
        updateStockTransferStatus,
        addAlert,
        markAlertRead,
        markAllAlertsRead,
        clearAllAlerts,
        updateProfile,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
