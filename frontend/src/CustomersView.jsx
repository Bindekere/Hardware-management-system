import React, { useState } from 'react';

export default function CustomersView() {
  const [customers, setCustomers] = useState([
    { id: 'cust-1', name: 'John Doe Builders', phone: '+11223344', credit_balance: 120.00 },
    { id: 'cust-2', name: 'Apex Construction', phone: '+55667788', credit_balance: 330.00 }
  ]);

  const handlePayDebt = (id) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, credit_balance: 0.0 } : c));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Customers & Debtors Ledger</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-gray-700 text-xs uppercase border-b">
            <tr>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Outstanding Credit</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-800">{c.name}</td>
                <td className="py-3 px-4 text-gray-600">{c.phone}</td>
                <td className="py-3 px-4 font-bold text-red-600">${c.credit_balance.toFixed(2)}</td>
                <td className="py-3 px-4 text-right">
                  {c.credit_balance > 0 && (
                    <button 
                      onClick={() => handlePayDebt(c.id)}
                      className="bg-green-600 text-white text-xs font-semibold px-2.5 py-1 rounded hover:bg-green-700"
                    >
                      Record Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
