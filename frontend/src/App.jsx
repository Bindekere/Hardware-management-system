import React, { useState, useEffect } from 'react';
import InventoryView from './InventoryView';
import SalesView from './SalesView';
import PurchasesView from './PurchasesView';
import DebtorsCreditorsLedgerView from './DebtorsCreditorsLedgerView';
import StockTakeView from './StockTakeView';
import ReportsView from './ReportsView';
import ReceiptBookView from './ReceiptBookView';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [userRole, setUserRole] = useState('ADMIN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [receipts, setReceipts] = useState([
    {
      id: 'REC-849102',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      payment_method: 'Cash',
      total: 120.00,
      items: [{ name: 'Portland Cement 50kg', quantity: 10, selling_price: 12.00 }]
    },
    {
      id: 'REC-391045',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      payment_method: 'Mobile Money',
      total: 42.50,
      items: [{ name: 'PVC Pipe 2 inch (3m)', quantity: 5, selling_price: 8.50 }]
    }
  ]);

  const handleSaleComplete = (newReceipt) => {
    setReceipts([newReceipt, ...receipts]);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white min-h-[3.5rem] py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 sm:px-4 border-b border-slate-800 gap-2 sm:gap-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {/* Hamburger Button for Mobile */}
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

          {/* Quick Sale button on mobile */}
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
        {/* Mobile Navigation Backdrop */}
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
              <SalesView onSaleComplete={handleSaleComplete} />
            </div>
          ) : activeTab === 'Inventory' ? (
            <div className="space-y-4">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Inventory & Products</h1>
                <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded w-fit">
                  Role: {userRole}
                </span>
              </div>
              <InventoryView userRole={userRole} />
            </div>
          ) : activeTab === 'Purchases' ? (
            <PurchasesView />
          ) : activeTab === 'Debtors & Creditors' || activeTab === 'Customers & Debtors' || activeTab === 'Suppliers & Creditors' ? (
            <DebtorsCreditorsLedgerView onAddReceipt={handleSaleComplete} />
          ) : activeTab === 'Stock Take' ? (
            <StockTakeView userRole={userRole} />
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

              {/* Key Metrics Dashboard Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-3.5 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider block">Today's Sales</span>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">$1,245.50</p>
                  <span className="text-[10px] sm:text-xs text-green-600 font-medium">+12% vs yesterday</span>
                </div>
                <div className="bg-white p-3.5 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Products</span>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">142</p>
                  <span className="text-[10px] sm:text-xs text-gray-500 font-medium">12 Categories</span>
                </div>
                <div className="bg-white p-3.5 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider block">Low Stock Alerts</span>
                  <p className="text-lg sm:text-2xl font-bold text-amber-600 mt-1">5</p>
                  <span className="text-[10px] sm:text-xs text-amber-600 font-medium">Requires reorder</span>
                </div>
                <div className="bg-white p-3.5 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider block">Customers Owe Us</span>
                  <p className="text-lg sm:text-2xl font-bold text-red-600 mt-1">$450.00</p>
                  <span className="text-[10px] sm:text-xs text-red-500 font-medium">3 Unpaid credit sales</span>
                </div>
              </div>

              {/* Recent Operations & Best Sellers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3.5 sm:p-4 overflow-x-auto">
                  <h2 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Recent Sales</h2>
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 text-[11px] sm:text-xs border-b">
                      <tr>
                        <th className="py-2 px-2 sm:px-3">Item</th>
                        <th className="py-2 px-2 sm:px-3">Qty</th>
                        <th className="py-2 px-2 sm:px-3">Amount</th>
                        <th className="py-2 px-2 sm:px-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-2 px-2 sm:px-3 font-medium">Cement 50kg</td>
                        <td className="py-2 px-2 sm:px-3">10</td>
                        <td className="py-2 px-2 sm:px-3">$120.00</td>
                        <td className="py-2 px-2 sm:px-3"><span className="bg-green-100 text-green-700 text-[10px] sm:text-xs px-2 py-0.5 rounded font-medium">Cash</span></td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 sm:px-3 font-medium">PVC Pipe 2"</td>
                        <td className="py-2 px-2 sm:px-3">5</td>
                        <td className="py-2 px-2 sm:px-3">$45.00</td>
                        <td className="py-2 px-2 sm:px-3"><span className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs px-2 py-0.5 rounded font-medium">Mobile</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3.5 sm:p-4">
                  <h2 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Top 5 Best Sellers</h2>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    <li className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="font-medium text-gray-800">1. Cement 50kg</span>
                      <span className="text-gray-500 font-semibold">145 sold</span>
                    </li>
                    <li className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="font-medium text-gray-800">2. Iron Sheet 30G</span>
                      <span className="text-gray-500 font-semibold">89 sold</span>
                    </li>
                    <li className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="font-medium text-gray-800">3. PVC Pipe 2"</span>
                      <span className="text-gray-500 font-semibold">64 sold</span>
                    </li>
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
