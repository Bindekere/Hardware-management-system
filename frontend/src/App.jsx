import React, { useState } from 'react';
import InventoryView from './InventoryView';
import SalesView from './SalesView';
import PurchasesView from './PurchasesView';
import CustomersView from './CustomersView';
import StockTakeView from './StockTakeView';
import ReportsView from './ReportsView';




export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [userRole, setUserRole] = useState('ADMIN'); // ADMIN, SALES_STAFF, STOREKEEPER, VIEWER

  // Role-based navigation permissions
  const roleNavMap = {
    ADMIN: ['Dashboard', 'Sales', 'Inventory', 'Purchases', 'Stock Take', 'Customers & Debtors', 'Suppliers & Creditors', 'Reports', 'Settings'],
    SALES_STAFF: ['Dashboard', 'Sales', 'Customers & Debtors'],
    STOREKEEPER: ['Dashboard', 'Inventory', 'Purchases', 'Stock Take', 'Suppliers & Creditors'],
    VIEWER: ['Dashboard', 'Reports']
  };

  const currentNav = roleNavMap[userRole] || roleNavMap.VIEWER;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white h-14 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold tracking-wide text-amber-500">HardwareDesk</span>
        </div>

        {/* Global Search & Quick Actions */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search products, SKU, barcode... (/)" 
              className="bg-slate-800 text-sm text-gray-200 rounded px-3 py-1.5 w-72 focus:outline-none focus:ring-1 focus:ring-amber-500 border border-slate-700"
            />
          </div>
          {(userRole === 'ADMIN' || userRole === 'SALES_STAFF') && (
            <button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-3 py-1.5 rounded text-sm transition shadow-sm">
              + Quick Sale
            </button>
          )}

          {/* Role Switcher for Testing/Demo */}
          <div className="flex items-center space-x-1 text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">
            <span className="text-slate-400">Role:</span>
            <select 
              value={userRole} 
              onChange={(e) => {
                setUserRole(e.target.value);
                setActiveTab('Dashboard');
              }}
              className="bg-transparent text-amber-400 font-medium focus:outline-none"
            >
              <option value="ADMIN" className="bg-slate-800 text-white">ADMIN</option>
              <option value="SALES_STAFF" className="bg-slate-800 text-white">SALES STAFF</option>
              <option value="STOREKEEPER" className="bg-slate-800 text-white">STOREKEEPER</option>
              <option value="VIEWER" className="bg-slate-800 text-white">VIEWER</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-56 bg-slate-800 text-slate-300 p-3 space-y-1">
          {currentNav.map((item) => (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition ${
                activeTab === item ? 'bg-amber-500 text-slate-900 font-bold' : 'hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </aside>

          {/* Main Content Area */}
          {activeTab === 'Sales' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Quick Sales Terminal</h1>
                <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded">
                  Active Role: {userRole}
                </span>
              </div>
              <SalesView />
            </div>
          ) : activeTab === 'Inventory' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Inventory & Products</h1>
                <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded">
                  Active Role: {userRole}
                </span>
              </div>
              <InventoryView userRole={userRole} />
            </div>
          ) : activeTab === 'Purchases' ? (
            <PurchasesView />
          ) : activeTab === 'Customers & Debtors' || activeTab === 'Suppliers & Creditors' ? (
            <CustomersView />
          ) : activeTab === 'Stock Take' ? (
            <StockTakeView />
          ) : activeTab === 'Reports' ? (
            <ReportsView />
          ) : (


            <>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">{activeTab}</h1>
                <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded">
                  Active Role: {userRole}
                </span>
              </div>

              {/* Key Metrics Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Sales</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">$1,245.50</p>
                  <span className="text-xs text-green-600 font-medium">+12% vs yesterday</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Products</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">142</p>
                  <span className="text-xs text-gray-500 font-medium">12 Categories</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock Alerts</span>
                  <p className="text-2xl font-bold text-amber-600 mt-1">5</p>
                  <span className="text-xs text-amber-600 font-medium">Requires reorder</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customers Owe Us</span>
                  <p className="text-2xl font-bold text-red-600 mt-1">$450.00</p>
                  <span className="text-xs text-red-500 font-medium">3 Unpaid credit sales</span>
                </div>
              </div>

              {/* Recent Operations & Best Sellers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Recent Sales</h2>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs border-b">
                      <tr>
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3">Qty</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-2 px-3 font-medium">Cement 50kg</td>
                        <td className="py-2 px-3">10</td>
                        <td className="py-2 px-3">$120.00</td>
                        <td className="py-2 px-3"><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">Cash</span></td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">PVC Pipe 2"</td>
                        <td className="py-2 px-3">5</td>
                        <td className="py-2 px-3">$45.00</td>
                        <td className="py-2 px-3"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">Mobile</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Top 5 Best Sellers</h2>
                  <ul className="space-y-2 text-sm">
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
            </>
          )}

        </main>
      </div>
    </div>
  );
}
