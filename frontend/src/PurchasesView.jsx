import React, { useState } from 'react';

export default function PurchasesView() {
  const [suppliers] = useState([
    { id: 'sup-1', name: 'BuildPro Supplies', phone: '+123456789', balance: 0.0 },
    { id: 'sup-2', name: 'Plumbing World', phone: '+987654321', balance: 150.0 }
  ]);

  const [purchases, setPurchases] = useState([
    { id: 'PUR-101', supplier: 'Plumbing World', total: 450.0, paid: 300.0, status: 'PARTIAL' }
  ]);

  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    supplier: 'BuildPro Supplies',
    total: '',
    paid: ''
  });

  const handleCreatePurchase = (e) => {
    e.preventDefault();
    const totalVal = parseFloat(newPurchase.total) || 0;
    const paidVal = parseFloat(newPurchase.paid) || 0;
    const status = paidVal >= totalVal ? 'PAID' : paidVal > 0 ? 'PARTIAL' : 'UNPAID';

    const created = {
      id: `PUR-${Math.floor(100 + Math.random() * 900)}`,
      supplier: newPurchase.supplier,
      total: totalVal,
      paid: paidVal,
      status
    };

    setPurchases([created, ...purchases]);
    setShowNewOrder(false);
    setNewPurchase({ supplier: 'BuildPro Supplies', total: '', paid: '' });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Purchases & Suppliers</h2>
          <p className="text-xs text-gray-500">Track supplier inventory purchases and payments.</p>
        </div>
        <button 
          onClick={() => setShowNewOrder(true)} 
          className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900 px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition shadow-sm self-start sm:self-auto whitespace-nowrap"
        >
          + Record Stock Purchase
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Suppliers List */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Suppliers & Creditors</h3>
          <ul className="divide-y divide-gray-100 text-xs sm:text-sm">
            {suppliers.map(s => (
              <li key={s.id} className="py-2.5 sm:py-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{s.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-400">Balance Owed</div>
                  <div className={`font-bold ${s.balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>${s.balance.toFixed(2)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Purchase History</h3>
          <ul className="divide-y divide-gray-100 text-xs sm:text-sm">
            {purchases.map(p => (
              <li key={p.id} className="py-2.5 sm:py-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">{p.id} - {p.supplier}</div>
                  <div className="text-xs text-gray-500">Paid: ${p.paid.toFixed(2)}</div>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="font-bold text-gray-900">${p.total.toFixed(2)}</div>
                  <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded font-bold inline-block ${
                    p.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    p.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* New Purchase Modal */}
      {showNewOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-4 sm:p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 border-b pb-2">Record Stock Purchase</h3>
            <form onSubmit={handleCreatePurchase} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm"
                  value={newPurchase.supplier}
                  onChange={e => setNewPurchase({ ...newPurchase, supplier: e.target.value })}
                >
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Total Invoiced Amount ($)</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm font-bold" 
                  value={newPurchase.total} 
                  onChange={e => setNewPurchase({ ...newPurchase, total: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount Paid Immediately ($)</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm" 
                  value={newPurchase.paid} 
                  onChange={e => setNewPurchase({ ...newPurchase, paid: e.target.value })} 
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowNewOrder(false)} 
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg shadow-sm"
                >
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
