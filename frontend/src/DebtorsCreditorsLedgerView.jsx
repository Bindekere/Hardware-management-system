import React, { useState } from 'react';

export default function DebtorsCreditorsLedgerView() {
  const [activeTab, setActiveTab] = useState('DEBTORS'); // DEBTORS (Customers Owe Us), CREDITORS (We Owe Suppliers)
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Unified State for Debtors and Creditors
  const [debtors, setDebtors] = useState([
    { id: 'c-1', name: 'John Doe Builders', phone: '+11223344', total_credit: 350.00, amount_paid: 230.00, balance_due: 120.00, status: 'OVERDUE' },
    { id: 'c-2', name: 'Apex Construction', phone: '+55667788', total_credit: 500.00, amount_paid: 170.00, balance_due: 330.00, status: 'PENDING' }
  ]);

  const [creditors, setCreditors] = useState([
    { id: 's-1', name: 'Plumbing World', phone: '+987654321', total_purchased: 600.00, amount_paid: 450.00, balance_due: 150.00, status: 'PENDING' },
    { id: 's-2', name: 'BuildPro Supplies', phone: '+123456789', total_purchased: 1200.00, amount_paid: 1200.00, balance_due: 0.00, status: 'CLEARED' }
  ]);

  const currentList = activeTab === 'DEBTORS' ? debtors : creditors;

  const filteredList = currentList.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.phone.includes(searchTerm)
  );

  const totalDebtorsBalance = debtors.reduce((sum, d) => sum + d.balance_due, 0);
  const totalCreditorsBalance = creditors.reduce((sum, c) => sum + c.balance_due, 0);

  const handleRecordPayment = (e) => {
    e.preventDefault();
    const pay = parseFloat(paymentAmount) || 0;
    if (activeTab === 'DEBTORS') {
      setDebtors(debtors.map(d => {
        if (d.id === showPaymentModal.id) {
          const newBal = Math.max(0, d.balance_due - pay);
          return { ...d, amount_paid: d.amount_paid + pay, balance_due: newBal, status: newBal === 0 ? 'CLEARED' : d.status };
        }
        return d;
      }));
    } else {
      setCreditors(creditors.map(c => {
        if (c.id === showPaymentModal.id) {
          const newBal = Math.max(0, c.balance_due - pay);
          return { ...c, amount_paid: c.amount_paid + pay, balance_due: newBal, status: newBal === 0 ? 'CLEARED' : c.status };
        }
        return c;
      }));
    }
    setShowPaymentModal(null);
    setPaymentAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => setActiveTab('DEBTORS')}
          className={`p-4 rounded-lg shadow-sm border cursor-pointer transition ${activeTab === 'DEBTORS' ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400' : 'bg-white border-gray-200'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-900 uppercase">Customers Owe Us (Debtors)</span>
            <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-semibold">{debtors.length} Accounts</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">${totalDebtorsBalance.toFixed(2)}</p>
          <span className="text-xs text-gray-500">Uncollected customer credit sales</span>
        </div>

        <div 
          onClick={() => setActiveTab('CREDITORS')}
          className={`p-4 rounded-lg shadow-sm border cursor-pointer transition ${activeTab === 'CREDITORS' ? 'bg-slate-100 border-slate-700 ring-1 ring-slate-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800 uppercase">We Owe Suppliers (Creditors)</span>
            <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-semibold">{creditors.length} Accounts</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">${totalCreditorsBalance.toFixed(2)}</p>
          <span className="text-xs text-gray-500">Unpaid supplier stock purchases</span>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Controls & Search */}
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveTab('DEBTORS')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition ${activeTab === 'DEBTORS' ? 'bg-amber-500 text-slate-900 shadow' : 'bg-white border text-gray-700'}`}
            >
              Debtors Ledger (Customers)
            </button>
            <button 
              onClick={() => setActiveTab('CREDITORS')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition ${activeTab === 'CREDITORS' ? 'bg-slate-900 text-white shadow' : 'bg-white border text-gray-700'}`}
            >
              Creditors Ledger (Suppliers)
            </button>
          </div>

          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'DEBTORS' ? 'Customer' : 'Supplier'} Name or Phone...`} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-xs w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
          />
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-gray-700 text-xs uppercase border-b">
              <tr>
                <th className="py-3 px-4">{activeTab === 'DEBTORS' ? 'Customer Name' : 'Supplier Name'}</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">{activeTab === 'DEBTORS' ? 'Total Credit' : 'Total Invoiced'}</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-900">{item.name}</td>
                  <td className="py-3 px-4 text-xs text-gray-600 font-mono">{item.phone}</td>
                  <td className="py-3 px-4 text-gray-700">${(item.total_credit || item.total_purchased).toFixed(2)}</td>
                  <td className="py-3 px-4 text-green-600 font-medium">${item.amount_paid.toFixed(2)}</td>
                  <td className={`py-3 px-4 font-bold ${item.balance_due > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    ${item.balance_due.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      item.status === 'CLEARED' ? 'bg-green-100 text-green-800' :
                      item.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.balance_due > 0 && (
                      <button 
                        onClick={() => setShowPaymentModal(item)}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-2.5 py-1 rounded transition shadow-sm"
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

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">
              Record Payment: {showPaymentModal.name}
            </h3>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Balance Due</label>
                <div className="font-bold text-red-600 text-lg">${showPaymentModal.balance_due.toFixed(2)}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Amount ($)</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  placeholder="e.g. 50.00" 
                  className="w-full border rounded px-3 py-1.5" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                <select 
                  className="w-full border rounded px-3 py-1.5" 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowPaymentModal(null)} 
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
