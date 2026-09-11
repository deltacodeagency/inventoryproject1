import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  PlusCircle,
  Tags,
  Truck,
  Sparkles,
  WifiOff,
  FileText,
  Undo2,
  MonitorCheck,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Sliders
} from 'lucide-react';
import { TakaIcon } from './TakaIcon';

interface SidebarSection {
  title: string;
  isOpen: boolean;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

interface SidebarProps {
  onNavigate?: (path: string) => void;
}

const pathByView: Record<string, string> = {
  'super-admin': '/admin-console',
  'create-product': '/create-product',
  'manage-stock': '/manage-stock',
  'bulk-stock': '/bulk-stock',
  'stock-adjustment': '/stock-adjustment',
  'rep-sales': '/rep-sales',
  'rep-purchase': '/rep-purchase',
  'rep-inventory': '/rep-inventory',
  'rep-supplier': '/rep-supplier',
  'rep-product': '/rep-product',
  'rep-income': '/rep-income',
  'rep-expense': '/rep-expense',
  'rep-annual': '/rep-annual',
};

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { activeView, setActiveView, currentUser, setEditingProduct, setViewingProduct, isMobileSidebarOpen, setIsMobileSidebarOpen } = useInventory();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    Main: true,
    Inventory: true,
    Stock: true,
    Sales: true,
    Reports: true,
  });

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const sections: SidebarSection[] = [
    {
      title: 'Main',
      isOpen: collapsedSections['Main'],
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'super-admin', label: 'Admin Console', icon: ShieldCheck },
      ],
    },
    {
      title: 'Inventory',
      isOpen: collapsedSections['Inventory'],
      items: [
        { id: 'products', label: 'Products', icon: Boxes },
        { id: 'create-product', label: 'Create Product', icon: PlusCircle },
        { id: 'category', label: 'Category', icon: Tags },
        { id: 'supplier', label: 'Supplier', icon: Truck },
        { id: 'brand', label: 'Brand', icon: Sparkles },
      ],
    },
    {
      title: 'Stock',
      isOpen: collapsedSections['Stock'],
      items: [
        { id: 'manage-stock', label: 'Manage Stock', icon: Layers },
        { id: 'bulk-stock', label: 'Bulk Stock Management', icon: Layers },
        { id: 'stock-adjustment', label: 'Stock Adjustment', icon: Sliders },
      ],
    },
    {
      title: 'Sales',
      isOpen: collapsedSections['Sales'],
      items: [
        { id: 'pos', label: 'POS Terminal', icon: MonitorCheck },
        { id: 'invoice', label: 'Sales & Invoices', icon: TakaIcon },
        { id: 'return', label: 'Return', icon: Undo2 },
      ],
    },
    {
      title: 'Reports',
      isOpen: collapsedSections['Reports'],
      items: [
        { id: 'rep-sales', label: 'Sales Report', icon: TrendingUp },
        { id: 'rep-purchase', label: 'Purchase Report', icon: BarChart3 },
        { id: 'rep-inventory', label: 'Inventory Report', icon: Layers },
        { id: 'rep-supplier', label: 'Supplier Report', icon: Truck },
        { id: 'rep-product', label: 'Product Report', icon: Boxes },
        { id: 'rep-income', label: 'Income Report', icon: TakaIcon },
        { id: 'rep-annual', label: 'Annual Report', icon: Calendar },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-x-0 top-16 bottom-0 bg-slate-900/60 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-[#101a2d] border-r border-slate-700/60 text-slate-300 h-[calc(100dvh-4rem)] overflow-y-auto flex flex-col z-50 md:inset-y-0 md:h-screen md:z-20 select-none transition-transform duration-300 md:transition-none md:translate-x-0 md:sticky md:top-0 md:flex shrink-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      {/* Brand Header */}
      <div className="hidden p-4 border-b border-slate-700/60 md:flex items-center gap-3 bg-[#0c1527]">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-500/20">
          IT
        </div>
        <div className="min-w-0">
          <h1 className="font-black text-white tracking-tight text-base leading-5 whitespace-nowrap">ISMAIL TRADING</h1>
          <span className="text-[9px] uppercase tracking-[0.12em] text-blue-300/70 font-bold block mt-0.5 whitespace-nowrap">Accessories &amp; Dealership</span>
        </div>
      </div>

      {/* Navigation Groupings */}
      <div className="flex-1 px-3 py-5 space-y-4">
        {sections.map((section) => {
          // Filter items based on current user role
          const filteredItems = section.items.filter((item) => {
            if (!currentUser) return false;
            // Only Administrator & Manager can access admin console
            if (item.id === 'super-admin' && currentUser.role !== 'Administrator' && currentUser.role !== 'Manager') return false;
            
            // Salesman only accesses specific viewpoints (including products list)
            if (currentUser.role === 'Salesman') {
              const allowedIds = ['dashboard', 'pos', 'invoice', 'products'];
              return allowedIds.includes(item.id);
            }
            return true;
          });

          if (filteredItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {/* Group Header */}
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.16em] hover:text-slate-300 transition-colors"
              >
                <span>{section.title}</span>
                {section.isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {/* Group Items */}
              {section.isOpen && (
                <div className="space-y-1 mt-1 pl-1">
                  {filteredItems.map((item) => {
                    const isActive = activeView === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setEditingProduct(null);
                          setViewingProduct(null);
                          setActiveView(item.id);
                          setIsMobileSidebarOpen(false);
                          onNavigate?.(pathByView[item.id] || `/${item.id}`);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 group ${
                          isActive
                            ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-600/20'
                            : 'hover:bg-white/6 hover:text-white text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon
                            className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Profile Shortcut */}
      <div className="p-4 bg-[#0c1527] border-t border-slate-700/60 flex gap-3 items-center">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-white uppercase">
          {currentUser?.username ? currentUser.username.slice(0, 2) : 'US'}
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="text-xs font-bold text-white truncate capitalize">{currentUser?.username || 'User'}</h4>
          <p className="text-[10px] text-slate-500 truncate">{currentUser?.role || 'Staff'}</p>
        </div>
      </div>
    </aside>
  </>
  );
};
