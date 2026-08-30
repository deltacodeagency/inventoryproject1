import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { confirmToast } from '../lib/confirmToast';
import {
  Bell,
  Search,
  WifiOff,
  User,
  Check,
  ChevronDown,
  Trash2,
  Calendar,
  AlertTriangle,
  LogOut,
  Boxes,
  Truck,
  Tags,
  CornerDownRight,
  Info,
  Menu
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    alerts,
    isOffline,
    setIsOffline,
    searchTerm,
    setSearchTerm,
    activeView,
    setActiveView,
    markAlertRead,
    markAllAlertsRead,
    clearAllAlerts,
    currentUser,
    logoutUser,
    products,
    suppliers,
    categories,
    setViewingProduct,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen
  } = useInventory();

  const renderAvatar = (sizeClass: string = "w-7 h-7 text-xs") => {
    const customImage = currentUser?.image || '';
    if (customImage && !customImage.startsWith('preset:')) {
      return (
        <img 
          src={customImage} 
          alt="Profile" 
          className={`${sizeClass} rounded-lg object-cover shadow-sm`}
          referrerPolicy="no-referrer"
        />
      );
    }
    const presetClass = customImage.startsWith('preset:') 
      ? customImage.replace('preset:', '') 
      : 'from-blue-500 to-indigo-600';
    return (
      <div className={`${sizeClass} rounded-lg bg-gradient-to-tr ${presetClass} text-white flex items-center justify-center font-bold shadow-sm uppercase`}>
        {currentUser?.fullName ? currentUser.fullName.slice(0, 2) : 'US'}
      </div>
    );
  };

  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.read);

  // Format active view to human-readable breadcrumb
  const getBreadcrumb = () => {
    if (activeView.startsWith('rep-')) {
      const type = activeView.split('-')[1];
      return `Reports > ${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
    }
    
    switch (activeView) {
      case 'dashboard':
        return 'Main > Dashboard';
      case 'super-admin':
        return 'Main > Admin Console';
      case 'products':
        return 'Inventory > Products';
      case 'create-product':
        return 'Inventory > Create Product';
      case 'category':
        return 'Inventory > Category Management';
      case 'supplier':
        return 'Inventory > Supplier Directory';
      case 'brand':
        return 'Inventory > Brand Management';
      case 'manage-stock':
        return 'Stock > Manage Stock';
      case 'bulk-stock':
        return 'Stock > Bulk Stock Management';
      case 'stock-adjustment':
        return 'Stock > Stock Adjustment';
      case 'invoice':
      case 'sales':
        return 'Sales > Sales & Invoices';
      case 'return':
        return 'Sales > Customer Returns';
      case 'pos':
        return 'Sales > POS Terminal';
      case 'profile':
        return 'System > My Profile';
      default:
        return 'System';
    }
  };

  // Dynamic search data matching
  const matchingProducts = searchTerm.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
    : [];

  const matchingSuppliers = searchTerm.trim()
    ? suppliers.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.phone && s.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 3)
    : [];

  const matchingCategories = searchTerm.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 3)
    : [];

  const allNavShortcuts = [
    { id: 'dashboard', label: 'Dashboard', pathName: 'Main > Dashboard' },
    { id: 'super-admin', label: 'Admin Console', pathName: 'Main > Admin Console', roles: ['Administrator', 'Manager'] },
    { id: 'products', label: 'Products Catalog', pathName: 'Inventory > Products' },
    { id: 'create-product', label: 'Create Product', pathName: 'Inventory > Create Product' },
    { id: 'category', label: 'Category Management', pathName: 'Inventory > Category' },
    { id: 'supplier', label: 'Supplier Directory', pathName: 'Inventory > Supplier' },
    { id: 'brand', label: 'Brand Management', pathName: 'Inventory > Brand' },
    { id: 'manage-stock', label: 'Manage Stock', pathName: 'Stock > Manage Stock' },
    { id: 'bulk-stock', label: 'Bulk Stock Management', pathName: 'Stock > Bulk Stock Management' },
    { id: 'stock-adjustment', label: 'Stock Adjustment', pathName: 'Stock > Stock Adjustment' },
    { id: 'invoice', label: 'Sales & Invoices', pathName: 'Sales > Sales & Invoices' },
    { id: 'return', label: 'Customer Returns', pathName: 'Sales > Return' },
    { id: 'pos', label: 'POS Terminal Sales', pathName: 'Sales > POS Terminal' },
    { id: 'profile', label: 'My Profile Settings', pathName: 'System > My Profile' },
  ];

  const filteredShortcuts = searchTerm.trim()
    ? allNavShortcuts.filter((item) => {
        if (item.roles && currentUser && !item.roles.includes(currentUser.role)) {
          return false;
        }
        if (currentUser?.role === 'Salesman') {
          const salesmanAllowed = ['dashboard', 'pos', 'return', 'invoice', 'products', 'profile'];
          if (!salesmanAllowed.includes(item.id)) return false;
        }
        return (
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.pathName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }).slice(0, 3)
    : [];

  const hasAnyMatches =
    matchingProducts.length > 0 ||
    matchingSuppliers.length > 0 ||
    matchingCategories.length > 0 ||
    filteredShortcuts.length > 0;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 px-4 md:px-6 flex items-center justify-between z-50 shadow-sm select-none">
      {/* Breadcrumbs and search */}
      <div className="flex items-center space-x-3 md:space-x-6 flex-1">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors md:hidden focus:outline-none flex-shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 tracking-tight md:text-sm">{getBreadcrumb()}</h2>
          <span className="hidden text-[10px] text-slate-400 -mt-0.5 md:block">Live Store Workspace</span>
        </div>

        {/* Global Search */}
        <div ref={searchRef} className="relative max-w-xs w-full hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products, SKUs, suppliers..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-300"
          />

          {/* Search Dropdown Results Popover */}
          {isSearchFocused && searchTerm.trim() !== '' && (
            <div className="absolute top-full left-0 mt-2 w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-[480px] overflow-y-auto z-[999] p-3 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Search Results for "{searchTerm}"
                </span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-medium">
                  {hasAnyMatches ? 'Matches found' : 'No results'}
                </span>
              </div>

              {!hasAnyMatches ? (
                <div className="py-6 text-center space-y-2">
                  <Info className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No matching items found</p>
                  <p className="text-[10px] text-slate-400 max-w-[260px] mx-auto">
                    Try searching with another keyword, SKU code, or navigation shortcut.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Category 1: Navigation Shortcuts */}
                  {filteredShortcuts.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase flex items-center space-x-1">
                        <CornerDownRight className="w-3 h-3 text-blue-500" />
                        <span>Navigation Menu ({filteredShortcuts.length})</span>
                      </h4>
                      <div className="space-y-0.5">
                        {filteredShortcuts.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveView(item.id);
                              setSearchTerm('');
                              setIsSearchFocused(false);
                            }}
                            className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between transition-colors text-xs text-slate-700 dark:text-slate-300 group"
                          >
                            <span className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {item.label}
                            </span>
                            <span className="text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 px-2 py-0.5 rounded font-mono">
                              {item.pathName}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 2: Products */}
                  {matchingProducts.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase flex items-center space-x-1 border-t border-slate-50 dark:border-slate-800/30 pt-2">
                        <Boxes className="w-3 h-3 text-amber-500" />
                        <span>Products ({matchingProducts.length})</span>
                      </h4>
                      <div className="space-y-0.5">
                        {matchingProducts.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setViewingProduct(p);
                              setActiveView('view-product');
                              setSearchTerm('');
                              setIsSearchFocused(false);
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between transition-colors text-xs text-slate-700 dark:text-slate-300 group"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-7 h-7 rounded object-cover border border-slate-100 dark:border-slate-800"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-[10px] uppercase">
                                  {p.name.slice(0, 2)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {p.name}
                                </p>
                                <p className="text-[9px] text-slate-400 font-mono">SKU: {p.sku}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="font-bold text-slate-800 dark:text-slate-200">৳{Math.round(p.price)}</p>
                              <p
                                className={`text-[9px] font-bold ${
                                  p.stock <= p.minStockAlert
                                    ? 'text-rose-500'
                                    : 'text-slate-400'
                                }`}
                              >
                                {p.stock} units
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 3: Suppliers */}
                  {matchingSuppliers.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase flex items-center space-x-1 border-t border-slate-50 dark:border-slate-800/30 pt-2">
                        <Truck className="w-3 h-3 text-emerald-500" />
                        <span>Suppliers ({matchingSuppliers.length})</span>
                      </h4>
                      <div className="space-y-0.5">
                        {matchingSuppliers.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setActiveView('supplier');
                              setSearchTerm('');
                              setIsSearchFocused(false);
                            }}
                            className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between transition-colors text-xs text-slate-700 dark:text-slate-300 group"
                          >
                            <div>
                              <p className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {s.name}
                              </p>
                              {s.company && (
                                <p className="text-[9px] text-slate-400">{s.company}</p>
                              )}
                            </div>
                            <div className="text-right text-[9px] text-slate-400">
                              {s.phone && <p>{s.phone}</p>}
                              {s.email && <p className="truncate max-w-[120px]">{s.email}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 4: Categories */}
                  {matchingCategories.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase flex items-center space-x-1 border-t border-slate-50 dark:border-slate-800/30 pt-2">
                        <Tags className="w-3 h-3 text-purple-500" />
                        <span>Categories ({matchingCategories.length})</span>
                      </h4>
                      <div className="space-y-0.5">
                        {matchingCategories.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setActiveView('category');
                              setSearchTerm('');
                              setIsSearchFocused(false);
                            }}
                            className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between transition-colors text-xs text-slate-700 dark:text-slate-300 group"
                          >
                            <div>
                              <p className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {c.name}
                              </p>
                              {c.description && (
                                <p className="text-[9px] text-slate-400 truncate max-w-[200px]">
                                  {c.description}
                                </p>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {c.code}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-4">
        {/* Alerts Notification Drawer Toggle */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className={`w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative ${
              unreadAlerts.length > 0 ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900' : ''
            }`}
          >
            <Bell className={`w-4 h-4 ${unreadAlerts.length > 0 ? 'text-blue-600 animate-swing' : ''}`} />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md shadow-blue-500/20">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Alerts & Notifications</span>
                {unreadAlerts.length > 0 && (
                  <button
                    onClick={() => markAllAlertsRead()}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Read All</span>
                  </button>
                )}
              </div>

              {/* Alerts List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <Check className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs">No active alerts</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Systems are fully operational</span>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        markAlertRead(alert.id);
                        setShowNotificationDropdown(false);
                      }}
                      className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex space-x-3 ${
                        !alert.read ? 'bg-orange-50/15 dark:bg-orange-500/5' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {alert.type === 'low_stock' ? (
                          <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <WifiOff className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold text-slate-800 dark:text-slate-200 truncate`}>{alert.title}</p>
                          <span className="text-[9px] text-slate-400">
                            {new Date(alert.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{alert.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Actions Footer */}
              {alerts.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/20">
                  <button
                    onClick={() => {
                      clearAllAlerts();
                      setShowNotificationDropdown(false);
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear logs</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Account Info Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="w-9 h-9 lg:w-auto lg:h-auto flex items-center justify-center lg:space-x-2 border border-slate-200 dark:border-slate-800 rounded-lg lg:p-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {renderAvatar("w-6 h-6 lg:w-7 lg:h-7 text-[10px] lg:text-xs")}
            <div className="hidden lg:block text-left pr-1">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block -mb-0.5 capitalize">{currentUser?.fullName || 'User'}</span>
              <span className="text-[9px] text-emerald-500 font-bold flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1"></span>
                {currentUser?.role || 'Staff'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {/* Profile Dropdown List */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center text-center bg-slate-50/50 dark:bg-slate-800/10">
                {renderAvatar("w-9 h-9 text-xs mb-1.5")}
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize mt-1">{currentUser?.fullName || 'User'}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate w-full">{currentUser?.email || 'user@dreamspos.com'}</p>
              </div>
              <button
                onClick={() => {
                  setActiveView('profile');
                  setShowProfileDropdown(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeView === 'profile' 
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => {
                  confirmToast('Are you sure you want to logout this session?', () => {
                    logoutUser();
                    setShowProfileDropdown(false);
                  });
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-2 transition-colors border-t border-slate-100 dark:border-slate-800 font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
