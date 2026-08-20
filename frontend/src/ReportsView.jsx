import React, { useState } from 'react';

const MOCK_SALES_HISTORY = [
  { id: 'REC-849102', date: '2026-08-20', revenue: 120.00, profit: 25.00, itemsCount: 10 },
  { id: 'REC-391045', date: '2026-08-20', revenue: 42.50, profit: 17.50, itemsCount: 5 },
  { id: 'REC-110293', date: '2026-08-19', revenue: 210.00, profit: 65.00, itemsCount: 18 },
  { id: 'REC-903124', date: '2026-08-18', revenue: 340.00, profit: 95.00, itemsCount: 22 },
  { id: 'REC-551029', date: '2026-08-14', revenue: 180.00, profit: 45.00, itemsCount: 12 },
  { id: 'REC-441920', date: '2026-08-01', revenue: 800.00, profit: 240.00, itemsCount: 65 }
];

export default function ReportsView() {
  const [period, setPeriod] = useState('TODAY'); // TODAY, WEEKLY, MONTHLY, CUSTOM
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getFilteredSales = () => {
    const today = new Date('2026-08-20');
    return MOCK_SALES_HISTORY.filter(s => {
      const sDate = new Date(s.date);
      if (period === 'TODAY') {
        return s.date === '2026-08-20';
      }
      if (period === 'WEEKLY') {
        const diffDays = (today - sDate) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (period === 'MONTHLY') {
        return sDate.getMonth() === today.getMonth() && sDate.getFullYear() === today.getFullYear();
      }
      if (period === 'CUSTOM' && startDate && endDate) {
        return sDate >= new Date(startDate) && sDate <= new Date(endDate);
      }
      return true;
    });
  };

  const filteredSales = getFilteredSales();

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.revenue, 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
  const totalItemsSold = filteredSales.reduce((sum, s) => sum + s.itemsCount, 0);
  const totalTransactions = filteredSales.length;

  const handlePrintReport = () => {
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html>
        <head>
          <title>Financial Report - ${period}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; }
            h2 { border-bottom: 2px solid #333; pb: 5px; }
            .metric { display: inline-block; width: 45%; margin-bottom: 15px; }
            .label { font-size: 12px; color: #666; font-weight: bold; }
            .val { font-size: 20px; font-weight: bold; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>HardwareDesk Financial Summary (${period})</h2>
          <div>Date Generated: ${new Date().toLocaleString()}</div>
          <br/>
          <div class="metric"><div class="label">TOTAL REVENUE</div><div class="val">$${totalRevenue.toFixed(2)}</div></div>
          <div class="metric"><div class="label">ESTIMATED GROSS PROFIT</div><div class="val">$${totalProfit.toFixed(2)}</div></div>
          <div class="metric"><div class="label">TRANSACTIONS</div><div class="val">${totalTransactions}</div></div>
          <div class="metric"><div class="label">ITEMS SOLD</div><div class="val">${totalItemsSold}</div></div>
          
          <h3>Sales Activity Breakdown</h3>
          <table>
            <thead>
              <tr><th>Receipt #</th><th>Date</th><th>Items</th><th>Revenue</th><th>Est. Profit</th></tr>
            </thead>
            <tbody>
              ${filteredSales.map(s => `
                <tr>
                  <td>${s.id}</td>
                  <td>${s.date}</td>
                  <td>${s.itemsCount}</td>
                  <td>$${s.revenue.toFixed(2)}</td>
                  <td>$${s.profit.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Time Period Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Financial Reports & Analytics</h2>
          <p className="text-xs text-gray-500">Simple, clean breakdown of store sales and estimated gross profit.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['TODAY', 'WEEKLY', 'MONTHLY', 'CUSTOM'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                period === p ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
          <button 
            onClick={handlePrintReport}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded text-xs ml-2"
          >
            Export / Print PDF
          </button>
        </div>
      </div>

      {period === 'CUSTOM' && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center space-x-4 text-xs">
          <span className="font-semibold text-amber-900">Custom Period Range:</span>
          <div className="flex items-center space-x-2">
            <label className="text-amber-800">From:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-2 py-1 bg-white" />
            <label className="text-amber-800">To:</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-2 py-1 bg-white" />
          </div>
        </div>
      )}

      {/* Core Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sales Revenue</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalRevenue.toFixed(2)}</p>
          <span className="text-xs text-gray-400">For selected period</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estimated Gross Profit</span>
          <p className="text-2xl font-bold text-green-600 mt-1">${totalProfit.toFixed(2)}</p>
          <span className="text-xs text-green-600 font-medium">Selling Price - Cost Price</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Transactions</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalTransactions}</p>
          <span className="text-xs text-gray-400">Sales completed</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Items Sold</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totalItemsSold}</p>
          <span className="text-xs text-gray-400">Units moved</span>
        </div>
      </div>

      {/* Detailed Sales Breakdown Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Period Sales Activity Breakdown</h3>
          <span className="text-xs text-gray-500">{filteredSales.length} records</span>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-gray-700 text-xs uppercase border-b">
            <tr>
              <th className="py-3 px-4">Receipt #</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Items Quantity</th>
              <th className="py-3 px-4">Sales Revenue</th>
              <th className="py-3 px-4">Estimated Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-400 text-xs">No financial records found for this period filter.</td>
              </tr>
            ) : (
              filteredSales.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{s.id}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{s.date}</td>
                  <td className="py-3 px-4 text-gray-700">{s.itemsCount} pcs</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">${s.revenue.toFixed(2)}</td>
                  <td className="py-3 px-4 font-bold text-green-600">${s.profit.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
