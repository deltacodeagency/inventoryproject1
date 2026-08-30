import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import {
  LayoutDashboard,
  Boxes,
  MonitorCheck,
  Layers,
  User,
  LogOut,
  ChevronUp
} from 'lucide-react';
import { TakaIcon } from './components/TakaIcon';
import { HomeView } from './views/HomeView';
import { DashboardView } from './views/DashboardView';
import { SuperAdminView } from './views/SuperAdminView';
import { ProductsView } from './views/ProductsView';
import { CreateProductView } from './views/CreateProductView';
import { ProductDetailView } from './views/ProductDetailView';
import { CategoryView, BrandView, SupplierView } from './views/CategorySupplierBrandView';
import { POSView } from './views/POSView';
import { InvoiceView, ReturnView } from './views/InvoiceSalesReturnView';
import { ReportsView } from './views/ReportsView';
import { ManageStockView } from './views/ManageStockView';
import { BulkStockManagementView } from './views/BulkStockManagementView';
import { StockAdjustmentView } from './views/StockAdjustmentView';
import { LoginView } from './views/LoginView';
import { ProfileView } from './views/ProfileView';
import { ResetPasswordView } from './views/ResetPasswordView';

const MainAppContent: React.FC = () => {
  const { activeView, setActiveView, currentUser, isAuthLoading, logoutUser, setEditingProduct, setViewingProduct } = useInventory();
  
  const mainRef = useRef<HTMLElement>(null);

  // Real URL path state (`/`, `/login`, `/dashboard`, etc.)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollTop(scrollTop > 100);
    
    const scrollableHeight = scrollHeight - clientHeight;
    if (scrollableHeight > 0) {
      setScrollProgress((scrollTop / scrollableHeight) * 100);
    } else {
      setScrollProgress(0);
    }
  };

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Scroll to top on route change
  useEffect(() => {
    try {
      if (mainRef.current && typeof mainRef.current.scrollTo === 'function') {
        mainRef.current.scrollTo(0, 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeView, currentPath]);

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keep the workspace view in sync when a sidebar URL is opened directly
  // or when the browser back/forward buttons are used.
  useEffect(() => {
    const viewByPath: Record<string, string> = {
      '/dashboard': 'dashboard',
      '/pos': 'pos',
      '/products': 'products',
      '/create-product': 'create-product',
      '/view-product': 'view-product',
      '/category': 'category',
      '/supplier': 'supplier',
      '/brand': 'brand',
      '/manage-stock': 'manage-stock',
      '/bulk-stock': 'bulk-stock',
      '/stock-adjustment': 'stock-adjustment',
      '/admin-console': 'super-admin',
      '/invoice': 'invoice',
      '/sales': 'sales',
      '/return': 'return',
    };

    const view = currentPath.startsWith('/rep-') ? currentPath.slice(1) : viewByPath[currentPath];
    if (view) setActiveView(view);
  }, [currentPath, setActiveView]);

  // Navigation router helper
  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);

    // Map URL path to activeView if workspace path
    if (path === '/pos') setActiveView('pos');
    else if (path === '/products') setActiveView('products');
    else if (path === '/sales') setActiveView('sales');
    else if (path === '/dashboard') setActiveView('dashboard');
    else if (path === '/manage-stock') setActiveView('manage-stock');
    else if (path === '/bulk-stock') setActiveView('bulk-stock');
    else if (path === '/admin-console') setActiveView('super-admin');
    else if (path === '/create-product') setActiveView('create-product');
    else if (path === '/view-product') setActiveView('view-product');
    else if (path === '/stock-adjustment') setActiveView('stock-adjustment');
    else if (path === '/category') setActiveView('category');
    else if (path === '/supplier') setActiveView('supplier');
    else if (path === '/brand') setActiveView('brand');
    else if (path === '/invoice') setActiveView('invoice');
    else if (path === '/return') setActiveView('return');
    else if (path.startsWith('/rep-')) setActiveView(path.slice(1));
  };

  // Redirection logic for Home page based on auth state and screen size
  useEffect(() => {
    if (!isAuthLoading && (currentPath === '/' || currentPath === '/home')) {
      const isMobile = window.innerWidth < 768;
      
      if (currentUser) {
        navigate('/dashboard');
      } else if (isMobile) {
        navigate('/login');
      }
    }
  }, [currentPath, currentUser, isAuthLoading]);

  // Keep the login fallback from flashing while Better Auth restores an OAuth session.
  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  // Route 1: Homepage at `/`
  if (currentPath === '/' || currentPath === '/home') {
    return <HomeView onNavigate={navigate} currentUser={currentUser} />;
  }

  // Route 2: Login Page at `/login`
  if (currentPath === '/login' && !currentUser) {
    return <LoginView onNavigate={navigate} />;
  }

  if (currentPath === '/reset-password' && !currentUser) {
    return <ResetPasswordView onNavigate={navigate} />;
  }

  // If visiting workspace without session, present LoginView at `/login`
  if (!currentUser) {
    return <LoginView onNavigate={navigate} />;
  }

  // Route Selector inside App Workspace
  const renderView = () => {
    if (activeView.startsWith('rep-')) {
      return <ReportsView />;
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'super-admin':
        return <SuperAdminView />;
      case 'products':
        return <ProductsView />;
      case 'create-product':
        return <CreateProductView />;
      case 'view-product':
        return <ProductDetailView />;
      case 'manage-stock':
        return <ManageStockView />;
      case 'bulk-stock':
        return <BulkStockManagementView />;
      case 'stock-adjustment':
        return <StockAdjustmentView />;
      case 'category':
        return <CategoryView />;
      case 'brand':
        return <BrandView />;
      case 'supplier':
        return <SupplierView />;
      case 'invoice':
        return <InvoiceView />;
      case 'sales':
        return <InvoiceView />;
      case 'return':
        return <ReturnView />;
      case 'pos':
        return <POSView />;
      case 'profile':
        return <ProfileView />;
      case 'rep-sales':
      case 'rep-purchase':
      case 'rep-inventory':
      case 'rep-supplier':
      case 'rep-product':
      case 'rep-income':
      case 'rep-expense':
      case 'rep-annual':
        return <ReportsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          className: 'rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xl'
        }}
      />
      <div className="flex h-[100dvh] bg-[#f4f7fb] dark:bg-[#f4f7fb] font-sans text-[#334155] dark:text-slate-100 overflow-hidden">
        {/* Drawer Sidebar */}
        <Sidebar onNavigate={navigate} />

      {/* Primary Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Area */}
        <Header />

        {/* Content View Body */}
        <main ref={mainRef} onScroll={handleScroll} className={`flex-1 ${activeView === 'pos' ? 'lg:h-[calc(100dvh-96px)] lg:max-h-[calc(100dvh-96px)] overflow-y-auto lg:overflow-hidden lg:flex lg:flex-col lg:min-h-0 p-4 md:p-6' : 'overflow-y-auto p-4 md:p-8'}`}>
          <div className={`max-w-7xl mx-auto w-full ${activeView === 'pos' ? 'lg:flex-1 lg:flex lg:flex-col lg:min-h-0 lg:h-full pb-16 lg:pb-0' : 'pb-16 md:pb-0'}`}>
            {renderView()}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-around py-1.5 px-2 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] sticky bottom-0 w-full flex-shrink-0 select-none">
          <button
            onClick={() => {
              setEditingProduct(null);
              setViewingProduct(null);
              setActiveView('dashboard');
              navigate('/dashboard');
            }}
            className={`flex flex-col items-center space-y-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              activeView === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px]">Dashboard</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setViewingProduct(null);
              setActiveView('products');
              navigate('/products');
            }}
            className={`flex flex-col items-center space-y-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              activeView === 'products' || activeView === 'view-product' || activeView === 'create-product' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Boxes className="w-5 h-5" />
            <span className="text-[9px]">Products</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setViewingProduct(null);
              setActiveView('pos');
              navigate('/pos');
            }}
            className={`flex flex-col items-center space-y-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              activeView === 'pos' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <MonitorCheck className="w-5 h-5" />
            <span className="text-[9px]">POS Terminal</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setViewingProduct(null);
              setActiveView('manage-stock');
              navigate('/manage-stock');
            }}
            className={`flex flex-col items-center space-y-0.5 rounded-lg px-2.5 py-1 transition-colors ${
              activeView === 'manage-stock' ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="h-5 w-5" />
            <span className="text-[9px]">Manage Stock</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setViewingProduct(null);
              setActiveView('profile');
              navigate('/profile');
            }}
            className={`flex flex-col items-center space-y-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              activeView === 'profile' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px]">Profile</span>
          </button>
        </nav>
      </div>

      {/* Scroll to top FAB */}
      <button
        onClick={scrollToTop}
        className={`fixed z-50 flex items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/30 transition-all duration-300 md:bottom-8 md:right-8 bottom-20 right-4 w-12 h-12 hover:scale-105 active:scale-95 ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
          <circle
            cx="24" cy="24" r="22" fill="none"
            stroke="#3b82f6" strokeWidth="3"
            strokeDasharray={138.23}
            strokeDashoffset={138.23 - (scrollProgress / 100) * 138.23}
            className="transition-all duration-150 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <ChevronUp className="w-5 h-5 relative z-10" strokeWidth={3} />
      </button>

    </div>
    </>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainAppContent />
    </InventoryProvider>
  );
}
