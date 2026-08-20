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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Purchases & Suppliers</h2>
        <button onClick={() => setShowNewOrder(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 py-1.5 rounded font-semibold text-sm">
          + Record Stock Purchase
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Suppliers List */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Suppliers & Creditors</h3>
          <ul className="divide-y text-sm">
            {suppliers.map(s => (
              <li key={s.id} className="py-2 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Balance Owed</div>
                  <div className={`font-bold ${s.balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>${s.balance.toFixed(2)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Purchase History</h3>
          <ul className="divide-y text-sm">
            {purchases.map(p => (
              <li key={p.id} className="py-2 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">{p.id} - {p.supplier}</div>
                  <div className="text-xs text-gray-500">Paid: ${p.paid.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">${p.total.toFixed(2)}</div>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">{p.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
