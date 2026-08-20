import React from 'react';

export default function ReportsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-800">Business & Financial Reports</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase">Total Revenue</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">$1,695.50</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase">Estimated Gross Profit</span>
          <div className="text-2xl font-bold text-green-600 mt-1">$482.00</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase">Inventory Valuation (Cost)</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">$1,162.50</div>
        </div>
      </div>
    </div>
  );
}
