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
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <input 
            type="text" 
            placeholder="Search Receipt # or Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <select 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="CUSTOM">Custom Date Range</option>
          </select>
        </div>

        {filterPeriod === 'CUSTOM' && (
          <div className="flex items-center space-x-2 text-xs">
            <span>From:</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
            <span>To:</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
          </div>
        )}
      </div>

      {/* Receipts Table (Most Recent First) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-gray-700 text-xs uppercase border-b">
            <tr>
              <th className="py-3 px-4">Receipt #</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4">Items Count</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
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
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{r.id}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded border border-slate-200">
                      {r.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{r.items.reduce((s, i) => s + i.quantity, 0)} items</td>
                  <td className="py-3 px-4 font-bold text-amber-600">${r.total.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button 
                      onClick={() => setSelectedReceipt(r)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded border border-slate-300"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handlePrint(r)}
                      className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-2 py-1 rounded"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-900">Receipt Details</h3>
              <span className="font-mono text-xs text-gray-500">{selectedReceipt.id}</span>
            </div>
            <div className="text-xs space-y-1 text-gray-600">
              <div><strong>Date:</strong> {new Date(selectedReceipt.timestamp).toLocaleString()}</div>
              <div><strong>Payment:</strong> {selectedReceipt.payment_method}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded text-xs space-y-2 border">
              {selectedReceipt.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{i.quantity}x {i.name}</span>
                  <span className="font-semibold">${(i.selling_price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-1 flex justify-between font-bold text-sm text-gray-900">
                <span>TOTAL:</span>
                <span className="text-amber-600">${selectedReceipt.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Close
              </button>
              <button 
                onClick={() => handlePrint(selectedReceipt)}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded"
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
