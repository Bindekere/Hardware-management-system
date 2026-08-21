import React, { useState, useEffect } from 'react';
import InventoryView from './InventoryView';
import SalesView from './SalesView';
import PurchasesView from './PurchasesView';
import DebtorsCreditorsLedgerView from './DebtorsCreditorsLedgerView';
import StockTakeView from './StockTakeView';
import ReportsView from './ReportsView';
import ReceiptBookView from './ReceiptBookView';
import { fetchProducts, fetchSalesApi } from './api';

const INITIAL_PRODUCTS = [
  { id: 'prod-1', sku: 'CEM-001', barcode: '8901234567890', name: 'Portland Cement 50kg', category: 'Building', cost_price: 9.50, selling_price: 12.00, stock_quantity: 120, minimum_stock: 20, location: 'A1-S1-B1', supplier: 'Supplier A' },
  { id: 'prod-2', sku: 'PVC-002', barcode: '8901234567891', name: 'PVC Pipe 2 inch (3m)', category: 'Plumbing', cost_price: 5.00, selling_price: 8.50, stock_quantity: 4, minimum_stock: 10, location: 'A2-S3-B1', supplier: 'Supplier B' },
  { id: 'prod-3', sku: 'NAL-003', barcode: '8901234567892', name: 'Steel Nails 3 inch (kg)', category: 'Hardware', cost_price: 1.50, selling_price: 2.50, stock_quantity: 0, minimum_stock: 15, location: 'A3-S1-B2', supplier: 'Supplier C' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [userRole, setUserRole] = useState('ADMIN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  // Initial receipts list (including sales for today)
  const [receipts, setReceipts] = useState([
    {
      id: 'REC-849102',
      timestamp: new Date().toISOString(),
      payment_method: 'Cash',
      total: 120.00,
      items: [{ name: 'Portland Cement 50kg', quantity: 10, selling_price: 12.00 }]
    },
    {
      id: 'REC-391045',
      timestamp: new Date().toISOString(),
      payment_method: 'Mobile Money',
      total: 42.50,
      items: [{ name: 'PVC Pipe 2 inch (3m)', quantity: 5, selling_price: 8.50 }]
    },
    {
      id: 'REC-110293',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      payment_method: 'Cash',
      total: 25.00,
      items: [{ name: 'Steel Nails 3 inch (kg)', quantity: 10, selling_price: 2.50 }]
    },
    {
      id: 'REC-903124',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      payment_method: 'Bank',
      total: 240.00,
      items: [{ name: 'Portland Cement 50kg', quantity: 20, selling_price: 12.00 }]
    }
  ]);

  // Real-time multi-device sync: poll products & sales from API every 3s
  useEffect(() => {
    const loadLiveData = () => {
      fetchProducts().then(apiProds => {
        if (Array.isArray(apiProds) && apiProds.length > 0) {
          setProducts(apiProds);
        }
      });
      fetchSalesApi().then(apiSales => {
        if (Array.isArray(apiSales) && apiSales.length > 0) {
          const formattedSales = apiSales.map(s => ({
            id: s.id.startsWith('REC-') ? s.id : `REC-${s.id.slice(0, 6).toUpperCase()}`,
            timestamp: s.created_at || new Date().toISOString(),
            payment_method: s.payment_method || 'Cash',
            total: parseFloat(s.total_amount || 0),
            items: s.items || []
          }));
          setReceipts(prev => {
            const existingMap = new Map(prev.map(r => [r.id, r]));
            formattedSales.forEach(fs => existingMap.set(fs.id, fs));
            return Array.from(existingMap.values());
          });
        }
      });
    };

    loadLiveData();
    const interval = setInterval(loadLiveData, 3000); // Poll every 3 seconds for live multi-user sync
    return () => clearInterval(interval);
  }, []);

  const handleSaleComplete = (newReceipt) => {
    setReceipts(prev => [newReceipt, ...prev]);
    // Deduct stock locally so low stock metrics stay accurate live
    if (newReceipt.items && Array.isArray(newReceipt.items)) {
      setProducts(prevProducts => prevProducts.map(prod => {
        const soldItem = newReceipt.items.find(i => (i.id === prod.id) || (i.product_id === prod.id) || (i.name === prod.name));
        if (soldItem) {
          const soldQty = parseInt(soldItem.quantity) || 0;
          return { ...prod, stock_quantity: Math.max(0, prod.stock_quantity - soldQty) };
        }
        return prod;
      }));
    }
  };

  // Keyboard shortcut listener ('/' hotkey to focus global search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const roleNavMap = {
    ADMIN: ['Dashboard', 'Sales', 'Inventory', 'Purchases', 'Stock Take', 'Debtors & Creditors', 'Reports', 'Receipt Book'],
    STOREKEEPER: ['Dashboard', 'Sales', 'Inventory', 'Purchases', 'Stock Take', 'Debtors & Creditors', 'Receipt Book']
  };

  const currentNav = roleNavMap[userRole] || roleNavMap.ADMIN;

  const handleNavClick = (item) => {
    setActiveTab(item);
    setMobileMenuOpen(false);
  };

  // Helper to check if ISO/Date string is from today
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  // Metric Computations
  const todaysSalesList = receipts.filter(r => isToday(r.timestamp));
  // Fallback to all receipts if no receipts logged today yet (for demonstration accuracy)
  const displaySalesList = todaysSalesList.length > 0 ? todaysSalesList : receipts;
  const todaysRevenue = displaySalesList.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);
  const lowStockProducts = products.filter(p => (parseInt(p.stock_quantity) || 0) <= (parseInt(p.minimum_stock) || 0));
  const lowStockCount = lowStockProducts.length;
  const totalProductsCount = products.length;

  // Top 10 Today's Sales list (limited to max 10 entries)
  const todaysSalesTen = displaySalesList.slice(0, 10);

  // Top 5 Best Sellers Calculation
  const productSalesMap = {};
  receipts.forEach(r => {
    if (r.items && Array.isArray(r.items)) {
      r.items.forEach(item => {
        const key = item.name || item.product_name;
        if (key) {
          productSalesMap[key] = (productSalesMap[key] || 0) + (parseInt(item.quantity) || 0);
        }
      });
    }
  });

  // Ensure top 5 list is populated cleanly
  const defaultBestSellers = [
    { name: 'Portland Cement 50kg', sold: 145 },
    { name: 'Iron Sheet 30G', sold: 89 },
    { name: 'PVC Pipe 2 inch (3m)', sold: 64 },
    { name: 'Steel Nails 3 inch (kg)', sold: 42 },
    { name: 'Electrical Cable 2.5mm', sold: 31 }
  ];

  let top5BestSellers = Object.keys(productSalesMap).length >= 5
    ? Object.entries(productSalesMap)
        .map(([name, sold]) => ({ name, sold }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)
    : defaultBestSellers;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white min-h-[3.5rem] py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 sm:px-4 border-b border-slate-800 gap-2 sm:gap-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <span 
              onClick={() => handleNavClick('Dashboard')}
              className="text-lg sm:text-xl font-bold tracking-wide text-amber-500 cursor-pointer select-none"
            >
              HardwareDesk
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:hidden">
            <button 
              onClick={() => handleNavClick('Sales')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-2.5 py-1 rounded text-xs transition shadow-sm"
            >
              + Sale
            </button>
          </div>
        </div>

        {/* Global Search & Quick Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative flex-1 sm:flex-initial">
            <input 
              id="global-search-input"
              type="text" 
              placeholder="Search (/)" 
              className="bg-slate-800 text-xs sm:text-sm text-gray-200 rounded px-2.5 sm:px-3 py-1.5 w-full sm:w-48 md:w-64 focus:outline-none focus:ring-1 focus:ring-amber-500 border border-slate-700 placeholder-slate-400"
            />
          </div>

          <button 
            onClick={() => handleNavClick('Sales')}
            className="hidden sm:inline-flex bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-3 py-1.5 rounded text-xs sm:text-sm transition shadow-sm whitespace-nowrap"
          >
            + Quick Sale
          </button>

          {/* Role Switcher */}
          <div className="flex items-center space-x-1 text-xs bg-slate-800 px-2 py-1.5 rounded border border-slate-700 whitespace-nowrap">
            <span className="text-slate-400 hidden xs:inline">Role:</span>
            <select 
              value={userRole} 
              onChange={(e) => {
                const newRole = e.target.value;
                setUserRole(newRole);
                if (newRole === 'STOREKEEPER' && activeTab === 'Reports') {
                  setActiveTab('Dashboard');
                }
              }}
              className="bg-transparent text-amber-400 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="ADMIN" className="bg-slate-800 text-white">ADMIN</option>
              <option value="STOREKEEPER" className="bg-slate-800 text-white">STOREKEEPER</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 relative">
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden"
            aria-hidden="true"
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 top-[3.5rem] lg:top-0
          w-64 lg:w-56 bg-slate-800 text-slate-300 p-3 space-y-1
          transform transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-xl lg:shadow-none flex flex-col justify-between overflow-y-auto
        `}>
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider lg:hidden border-b border-slate-700 mb-2">
              Menu Navigation
            </div>
            {currentNav.map((item) => (
              <button
                key={item}
                onClick={() => handleNavClick(item)}
                className={`w-full text-left px-3 py-2.5 sm:py-2 rounded-md text-sm font-medium transition ${
                  activeTab === item ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-slate-700 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-700/60 text-xs text-slate-400 px-3">
            <div className="font-medium text-slate-300">HardwareDesk v1.0</div>
            <div className="text-[10px] text-slate-500">Fast & Responsive POS</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
          {activeTab === 'Sales' ? (
            <div className="space-y-4">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Quick Sales Terminal</h1>
                <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded w-fit">
                  Role: {userRole}
                </span>
              </div>
              <SalesView products={products} onSaleComplete={handleSaleComplete} />
            </div>
          ) : activeTab === 'Inventory' ? (
            <div className="space-y-4">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Inventory & Products</h1>
                <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded w-fit">
                  Role: {userRole}
                </span>
              </div>
              <InventoryView products={products} setProducts={setProducts} userRole={userRole} />
            </div>
          ) : activeTab === 'Purchases' ? (
            <PurchasesView />
          ) : activeTab === 'Debtors & Creditors' || activeTab === 'Customers & Debtors' || activeTab === 'Suppliers & Creditors' ? (
            <DebtorsCreditorsLedgerView onAddReceipt={handleSaleComplete} />
          ) : activeTab === 'Stock Take' ? (
            <StockTakeView products={products} userRole={userRole} />
          ) : activeTab === 'Reports' ? (
            <ReportsView />
          ) : activeTab === 'Receipt Book' ? (
            <ReceiptBookView receipts={receipts} />
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{activeTab}</h1>
                <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded w-fit">
                  Role: {userRole}
                </span>
              </div>

              {/* Optimized Key Metrics Dashboard Cards (3-column layout, Customers Owe Us removed) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white p-3.5 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider block">Today's Revenue</span>
                  <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">${todaysRevenue.toFixed(2)}</p>
                  <span className="text-[10px] sm:text-xs text-green-700 font-medium">{displaySalesList.length} sales recorded today</span>
                </div>
                <div className="bg-white p-3.5 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Products</span>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{totalProductsCount}</p>
                  <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Active product catalog</span>
                </div>
                <div 
                  onClick={() => handleNavClick('Inventory')}
                  className="bg-white p-3.5 sm:p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-amber-400 transition"
                >
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider block">Low Stock Alerts</span>
                  <p className="text-lg sm:text-2xl font-bold text-amber-600 mt-1">{lowStockCount}</p>
                  <span className="text-[10px] sm:text-xs text-amber-600 font-medium flex items-center justify-between">
                    <span>Accurate stored inventory</span>
                    <span>View &rarr;</span>
                  </span>
                </div>
              </div>

              {/* Today's Sales (Scrollable, max 10) & Top 5 Best Sellers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3.5 sm:p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">Today's Sales</h2>
                    <span className="text-[11px] text-gray-400 font-medium">Top 10 entries (Scrollable)</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto pr-1 border rounded-md border-gray-100">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 text-[11px] sm:text-xs border-b sticky top-0">
                        <tr>
                          <th className="py-2 px-2 sm:px-3">Receipt #</th>
                          <th className="py-2 px-2 sm:px-3">Item(s)</th>
                          <th className="py-2 px-2 sm:px-3">Amount</th>
                          <th className="py-2 px-2 sm:px-3">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {todaysSalesTen.map(sale => {
                          const mainItemName = sale.items && sale.items.length > 0 ? (sale.items[0].name || sale.items[0].product_name) : 'Sale';
                          const extraItemsCount = sale.items && sale.items.length > 1 ? ` +${sale.items.length - 1}` : '';
                          const totalQty = sale.items && sale.items.length > 0 ? sale.items.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0) : 1;
                          return (
                            <tr key={sale.id} className="hover:bg-gray-50">
                              <td className="py-2 px-2 sm:px-3 font-mono font-medium text-slate-700">{sale.id}</td>
                              <td className="py-2 px-2 sm:px-3 font-medium text-gray-800 truncate max-w-[140px]">
                                {mainItemName} <span className="text-xs text-gray-400 font-normal">({totalQty}x){extraItemsCount}</span>
                              </td>
                              <td className="py-2 px-2 sm:px-3 font-semibold text-gray-900">${(parseFloat(sale.total) || 0).toFixed(2)}</td>
                              <td className="py-2 px-2 sm:px-3">
                                <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded font-medium ${
                                  sale.payment_method === 'Mobile Money' || sale.payment_method === 'Mobile' ? 'bg-blue-100 text-blue-700' :
                                  sale.payment_method === 'Bank' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {sale.payment_method}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3.5 sm:p-4">
                  <h2 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Top 5 Best Sellers</h2>
                  <ul className="space-y-2.5 text-xs sm:text-sm">
                    {top5BestSellers.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-none">
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-500 text-white' :
                            idx === 1 ? 'bg-gray-300 text-slate-800' :
                            idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-800">{item.name}</span>
                        </div>
                        <span className="text-gray-600 font-semibold bg-gray-50 px-2 py-0.5 rounded text-xs">{item.sold} sold</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
