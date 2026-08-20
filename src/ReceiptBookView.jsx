import React, { useState } from 'react';

export default function ReceiptBookView({ receipts }) {
  const [filterPeriod, setFilterPeriod] = useState('ALL'); // ALL, TODAY, CUSTOM
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const filteredReceipts = receipts.filter(r => {
    // Search filter
    const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.customer_name && r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          r.payment_method.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Date range filter
    const receiptDate = new Date(r.timestamp);
    if (filterPeriod === 'TODAY') {
      const today = new Date().toDateString();
      return receiptDate.toDateString() === today;
    }
    if (filterPeriod === 'CUSTOM' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      return receiptDate >= start && receiptDate <= end;
    }

    return true;
  });

  const handlePrint = (receipt) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 300px; }
            h2 { text-align: center; margin-bottom: 5px; }
            .center { text-align: center; }
            .border { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; font-size: 12px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>HardwareDesk</h2>
          <div class="center" style="font-size:11px;">Hardware Store Management</div>
          <div class="border"></div>
          <div><strong>Receipt #:</strong> ${receipt.id}</div>
          <div><strong>Date:</strong> ${new Date(receipt.timestamp).toLocaleString()}</div>
          <div><strong>Payment:</strong> ${receipt.payment_method}</div>
          ${receipt.customer_name ? `<div><strong>Customer:</strong> ${receipt.customer_name}</div>` : ''}
          <div class="border"></div>
          ${receipt.items.map(i => `
            <div class="item">
              <span>${i.quantity}x ${i.name}</span>
              <span>$${(i.selling_price * i.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="border"></div>
          <div class="item bold font-size: 14px;">
            <span>TOTAL:</span>
            <span>$${receipt.total.toFixed(2)}</span>
          </div>
          <div class="border"></div>
          <div class="center" style="font-size:10px; margin-top:15px;">Thank you for your business!</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search Receipt # or Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <select 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="CUSTOM">Custom Range</option>
          </select>
        </div>

        {filterPeriod === 'CUSTOM' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            <div className="flex items-center space-x-2">
              <span className="text-amber-800">From:</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded-lg px-2 py-1 bg-white text-xs" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-amber-800">To:</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded-lg px-2 py-1 bg-white text-xs" />
            </div>
          </div>
        )}
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-xs sm:text-sm text-left">
          <thead className="bg-slate-100 text-gray-700 text-[11px] sm:text-xs uppercase border-b">
            <tr>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Receipt #</th>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Date & Time</th>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Payment</th>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Items</th>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Total Amount</th>
              <th className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReceipts.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-400 text-xs">No receipts found in this time range.</td>
              </tr>
            ) : (
              filteredReceipts.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-3 px-3 sm:px-4 font-mono font-bold text-gray-900 whitespace-nowrap">{r.id}</td>
                  <td className="py-3 px-3 sm:px-4 text-xs text-gray-600 whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-800 text-[10px] sm:text-xs px-2 py-0.5 rounded border border-slate-200 font-medium">
                      {r.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-gray-700 whitespace-nowrap">{r.items.reduce((s, i) => s + i.quantity, 0)} items</td>
                  <td className="py-3 px-3 sm:px-4 font-bold text-amber-600 whitespace-nowrap">${r.total.toFixed(2)}</td>
                  <td className="py-3 px-3 sm:px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button 
                      onClick={() => setSelectedReceipt(r)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 font-semibold transition"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handlePrint(r)}
                      className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-2.5 py-1 rounded-lg transition shadow-xs"
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-4 sm:p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Receipt Details</h3>
              <span className="font-mono text-xs text-gray-500">{selectedReceipt.id}</span>
            </div>
            <div className="text-xs space-y-1 text-gray-600">
              <div><strong>Date:</strong> {new Date(selectedReceipt.timestamp).toLocaleString()}</div>
              <div><strong>Payment:</strong> {selectedReceipt.payment_method}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-2 border max-h-48 overflow-y-auto">
              {selectedReceipt.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-gray-700">{i.quantity}x {i.name}</span>
                  <span className="font-semibold text-gray-900">${(i.selling_price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-gray-900">
                <span>TOTAL:</span>
                <span className="text-amber-600 font-bold">${selectedReceipt.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
              <button 
                onClick={() => handlePrint(selectedReceipt)}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg shadow-sm"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
