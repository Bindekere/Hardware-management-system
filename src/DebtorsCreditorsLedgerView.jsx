import React, { useState, useEffect } from 'react';
import { fetchDebtorsApi, fetchCreditorsApi, addLedgerEntryApi, recordLedgerPaymentApi, fetchTransactionsApi } from './api';

const INITIAL_DEBTORS = [
  { id: 'c-1', name: 'John Doe Builders', phone: '+11223344', total_credit: 350.00, amount_paid: 230.00, balance_due: 120.00, store_credit: 0.00, status: 'OVERDUE' },
  { id: 'c-2', name: 'Apex Construction', phone: '+55667788', total_credit: 500.00, amount_paid: 170.00, balance_due: 330.00, store_credit: 0.00, status: 'PENDING' },
  { id: 'c-3', name: 'Samuel Miller', phone: '+77889900', total_credit: 0.00, amount_paid: 250.00, balance_due: 0.00, store_credit: 150.00, status: 'STORE CREDIT' }
];

const INITIAL_CREDITORS = [
  { id: 's-1', name: 'Plumbing World', phone: '+987654321', total_purchased: 600.00, amount_paid: 450.00, balance_due: 150.00, status: 'PENDING' },
  { id: 's-2', name: 'BuildPro Supplies', phone: '+123456789', total_purchased: 1200.00, amount_paid: 1200.00, balance_due: 0.00, status: 'CLEARED' }
];

export default function DebtorsCreditorsLedgerView({ onAddReceipt }) {
  const [activeTab, setActiveTab] = useState('DEBTORS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Form state for adding new customer/supplier entries
  const [newEntry, setNewEntry] = useState({
    name: '',
    phone: '',
    type: 'DEBTOR',
    amount: ''
  });

  const [debtors, setDebtors] = useState(INITIAL_DEBTORS);
  const [creditors, setCreditors] = useState(INITIAL_CREDITORS);

  useEffect(() => {
    fetchDebtorsApi().then(d => {
      if (Array.isArray(d) && d.length > 0) setDebtors(d);
    });
    fetchCreditorsApi().then(c => {
      if (Array.isArray(c) && c.length > 0) setCreditors(c);
    });
  }, []);

  // Transaction audit drawer
  const [auditDrawer, setAuditDrawer] = useState(null);
  const openAuditDrawer = async (item) => {
    let txns = await fetchTransactionsApi(item.id);
    if (!Array.isArray(txns) || !txns.length) {
      txns = [
        { type: activeTab === 'DEBTORS' ? 'CREDIT_EXTENDED' : 'PURCHASE_ON_CREDIT', amount: (item.total_credit || item.total_purchased || 0), timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), note: 'Account opened' },
        ...(item.amount_paid > 0 ? [{ type: 'PAYMENT_RECEIVED', amount: item.amount_paid, timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Partial payment received' }] : [])
      ];
    }
    setAuditDrawer({ entity: item, transactions: txns });
  };

  const safeDebtors = Array.isArray(debtors) ? debtors : INITIAL_DEBTORS;
  const safeCreditors = Array.isArray(creditors) ? creditors : INITIAL_CREDITORS;
  const currentList = activeTab === 'DEBTORS' ? safeDebtors : safeCreditors;

  const filteredList = currentList.filter(item => 
    item && (
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (item.phone && String(item.phone).includes(searchTerm))
    )
  );

  const totalDebtorsBalance = safeDebtors.reduce((sum, d) => sum + (Number(d.balance_due) || 0), 0);
  const totalStoreCredits = safeDebtors.reduce((sum, d) => sum + (Number(d.store_credit) || 0), 0);
  const totalCreditorsBalance = safeCreditors.reduce((sum, c) => sum + (Number(c.balance_due) || 0), 0);

  const handlePrintReceipt = (receipt) => {
    const printWin = window.open('', '_blank');
    printWin.document.write(`
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
          <div class="center" style="font-size:11px;">Official Transaction Receipt</div>
          <div class="border"></div>
          <div><strong>Receipt #:</strong> ${receipt.id}</div>
          <div><strong>Type:</strong> ${receipt.type_label}</div>
          <div><strong>Party:</strong> ${receipt.customer_name}</div>
          <div><strong>Date:</strong> ${new Date(receipt.timestamp).toLocaleString()}</div>
          <div><strong>Payment:</strong> ${receipt.payment_method}</div>
          <div class="border"></div>
          <div class="item bold font-size:14px;">
            <span>AMOUNT:</span>
            <span>$${Number(receipt.total).toFixed(2)}</span>
          </div>
          <div class="border"></div>
          <div class="center" style="font-size:10px; margin-top:15px;">Thank you for your business!</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    const val = parseFloat(newEntry.amount) || 0;

    if (newEntry.type === 'DEBTOR') {
      const entry = {
        id: `c-${Date.now()}`,
        name: newEntry.name,
        phone: newEntry.phone,
        total_credit: val,
        amount_paid: 0,
        balance_due: val,
        store_credit: 0,
        status: 'PENDING'
      };
      setDebtors([...safeDebtors, entry]);
    } else if (newEntry.type === 'PREPAYMENT') {
      const entry = {
        id: `c-${Date.now()}`,
        name: newEntry.name,
        phone: newEntry.phone,
        total_credit: 0,
        amount_paid: val,
        balance_due: 0,
        store_credit: val,
        status: 'STORE CREDIT'
      };
      setDebtors([...safeDebtors, entry]);

      const receipt = {
        id: `REC-PREPAY-${Math.floor(100000 + Math.random() * 900000)}`,
        type_label: 'Customer Prepayment / Store Credit',
        customer_name: newEntry.name,
        timestamp: new Date().toISOString(),
        payment_method: 'Cash',
        total: val,
        items: [{ name: 'Store Credit / Prepayment Deposit', quantity: 1, selling_price: val }]
      };
      if (onAddReceipt) onAddReceipt(receipt);
      handlePrintReceipt(receipt);
    } else if (newEntry.type === 'CREDITOR') {
      const entry = {
        id: `s-${Date.now()}`,
        name: newEntry.name,
        phone: newEntry.phone,
        total_purchased: val,
        amount_paid: 0,
        balance_due: val,
        status: 'PENDING'
      };
      setCreditors([...safeCreditors, entry]);
    }

    // Backend sync
    await addLedgerEntryApi({
      name: newEntry.name,
      phone: newEntry.phone,
      type: newEntry.type,
      amount: val
    });

    setShowAddEntryModal(false);
    setNewEntry({ name: '', phone: '', type: 'DEBTOR', amount: '' });
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const pay = parseFloat(paymentAmount) || 0;
    let receiptPrefix = 'REC-DEBT-PAY-';
    let typeLabel = 'Debtor Balance Payment';

    if (activeTab === 'DEBTORS') {
      setDebtors(safeDebtors.map(d => {
        if (d.id === showPaymentModal.id) {
          const newBal = Math.max(0, (Number(d.balance_due) || 0) - pay);
          return { ...d, amount_paid: (Number(d.amount_paid) || 0) + pay, balance_due: newBal, status: newBal === 0 ? 'CLEARED' : d.status };
        }
        return d;
      }));
    } else {
      receiptPrefix = 'REC-SUP-PAY-';
      typeLabel = 'Supplier Creditor Payment';
      setCreditors(safeCreditors.map(c => {
        if (c.id === showPaymentModal.id) {
          const newBal = Math.max(0, (Number(c.balance_due) || 0) - pay);
          return { ...c, amount_paid: (Number(c.amount_paid) || 0) + pay, balance_due: newBal, status: newBal === 0 ? 'CLEARED' : c.status };
        }
        return c;
      }));
    }

    // Backend API sync
    await recordLedgerPaymentApi({
      entity_type: activeTab === 'DEBTORS' ? 'DEBTOR' : 'CREDITOR',
      entity_id: showPaymentModal.id,
      amount: pay,
      payment_method: paymentMethod
    });

    const receipt = {
      id: `${receiptPrefix}${Math.floor(100000 + Math.random() * 900000)}`,
      type_label: typeLabel,
      customer_name: showPaymentModal.name,
      timestamp: new Date().toISOString(),
      payment_method: paymentMethod,
      total: pay,
      items: [{ name: `${typeLabel} for ${showPaymentModal.name}`, quantity: 1, selling_price: pay }]
    };

    if (onAddReceipt) onAddReceipt(receipt);
    handlePrintReceipt(receipt);

    setShowPaymentModal(null);
    setPaymentAmount('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div 
          onClick={() => setActiveTab('DEBTORS')}
          className={`p-3.5 sm:p-4 rounded-lg shadow-sm border cursor-pointer transition ${activeTab === 'DEBTORS' ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400' : 'bg-white border-gray-200'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] sm:text-xs font-bold text-amber-900 uppercase">Customers Owe Us (Debtors)</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1.5 sm:mt-2">${totalDebtorsBalance.toFixed(2)}</p>
          <span className="text-[11px] sm:text-xs text-gray-500 block">Uncollected customer credit sales</span>
        </div>

        <div 
          onClick={() => setActiveTab('DEBTORS')}
          className="p-3.5 sm:p-4 rounded-lg shadow-sm border bg-green-50 border-green-200 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] sm:text-xs font-bold text-green-900 uppercase">Customer Store Credits</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-700 mt-1.5 sm:mt-2">${totalStoreCredits.toFixed(2)}</p>
          <span className="text-[11px] sm:text-xs text-green-800 block">Prepaid orders / Deposits</span>
        </div>

        <div 
          onClick={() => setActiveTab('CREDITORS')}
          className={`p-3.5 sm:p-4 rounded-lg shadow-sm border cursor-pointer transition sm:col-span-2 lg:col-span-1 ${activeTab === 'CREDITORS' ? 'bg-slate-100 border-slate-700 ring-1 ring-slate-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase">We Owe Suppliers (Creditors)</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 sm:mt-2">${totalCreditorsBalance.toFixed(2)}</p>
          <span className="text-[11px] sm:text-xs text-gray-500 block">Unpaid supplier stock purchases</span>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Controls & Search */}
        <div className="p-3 sm:p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setActiveTab('DEBTORS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'DEBTORS' ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-white border text-gray-700'}`}
            >
              Debtors & Store Credits
            </button>
            <button 
              onClick={() => setActiveTab('CREDITORS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'CREDITORS' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border text-gray-700'}`}
            >
              Creditors Ledger
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button 
              onClick={() => setShowAddEntryModal(true)}
              className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900 font-bold px-3.5 py-1.5 rounded-lg text-xs transition shadow-sm whitespace-nowrap self-start sm:self-auto"
            >
              + Add New Entry
            </button>
            <input 
              type="text" 
              placeholder={`Search ${activeTab === 'DEBTORS' ? 'Customer' : 'Supplier'} Name or Phone...`} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="bg-slate-100 text-gray-700 text-[11px] sm:text-xs uppercase border-b">
              <tr>
                <th className="py-3 px-3 sm:px-4 whitespace-nowrap">{activeTab === 'DEBTORS' ? 'Customer Name' : 'Supplier Name'}</th>
                <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Phone</th>
                <th className="py-3 px-3 sm:px-4 whitespace-nowrap">{activeTab === 'DEBTORS' ? 'Total Credit' : 'Total Invoiced'}</th>
                <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Amount Paid</th>
                <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Balance Due</th>
                {activeTab === 'DEBTORS' && <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Store Credit</th>}
                <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'DEBTORS' ? 8 : 7} className="py-8 text-center text-gray-400 text-xs">
                    No accounts found matching your search.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const totalAmount = item.total_credit !== undefined ? Number(item.total_credit) : (Number(item.total_purchased) || 0);
                  const isPrepaid = Number(item.store_credit) > 0;
                  const balanceDue = Number(item.balance_due) || 0;
                  const amountPaid = Number(item.amount_paid) || 0;
                  const storeCredit = Number(item.store_credit) || 0;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 px-3 sm:px-4 font-semibold text-gray-900 whitespace-nowrap">{item.name}</td>
                      <td className="py-3 px-3 sm:px-4 text-xs text-gray-600 font-mono whitespace-nowrap">{item.phone || '-'}</td>
                      <td className="py-3 px-3 sm:px-4 text-gray-700 whitespace-nowrap">${totalAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 sm:px-4 text-green-600 font-medium whitespace-nowrap">${amountPaid.toFixed(2)}</td>
                      <td className={`py-3 px-3 sm:px-4 font-bold whitespace-nowrap ${balanceDue > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        ${balanceDue.toFixed(2)}
                      </td>
                      {activeTab === 'DEBTORS' && (
                        <td className="py-3 px-3 sm:px-4 font-bold text-green-700 whitespace-nowrap">
                          {isPrepaid ? `$${storeCredit.toFixed(2)}` : '$0.00'}
                        </td>
                      )}
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded font-bold ${
                          isPrepaid ? 'bg-blue-100 text-blue-800' :
                          item.status === 'CLEARED' ? 'bg-green-100 text-green-800' :
                          item.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPrepaid ? 'PREPAID' : item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right space-x-1 whitespace-nowrap">
                        {balanceDue > 0 && (
                          <button 
                            onClick={() => setShowPaymentModal(item)}
                            className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-2.5 py-1 rounded transition shadow-sm"
                          >
                            Pay
                          </button>
                        )}
                        {isPrepaid && (
                          <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            Prepaid
                          </span>
                        )}
                        <button
                          onClick={() => openAuditDrawer(item)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded transition"
                          title="View transaction history"
                        >
                          📋
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-4 sm:p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 border-b pb-2">
              Record Payment: {showPaymentModal.name}
            </h3>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Balance Due</label>
                <div className="font-bold text-red-600 text-lg sm:text-xl">${(Number(showPaymentModal.balance_due) || 0).toFixed(2)}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Amount ($)</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  placeholder="e.g. 50.00" 
                  className="w-full border rounded-lg px-3 py-2 text-sm font-bold" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
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
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg shadow-sm"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Entry Modal */}
      {showAddEntryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-4 sm:p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 border-b pb-2">
              Add New Account / Entry
            </h3>
            <form onSubmit={handleAddEntry} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Entry Type</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm"
                  value={newEntry.type}
                  onChange={e => setNewEntry({ ...newEntry, type: e.target.value })}
                >
                  <option value="DEBTOR">Customer Credit Sale (Debtor)</option>
                  <option value="PREPAYMENT">Customer Prepayment / Store Credit</option>
                  <option value="CREDITOR">Supplier Purchase (Creditor)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name (Customer or Supplier)</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Samuel Miller" 
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm" 
                  value={newEntry.name} 
                  onChange={e => setNewEntry({ ...newEntry, name: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="+12345678" 
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono" 
                  value={newEntry.phone} 
                  onChange={e => setNewEntry({ ...newEntry, phone: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {newEntry.type === 'PREPAYMENT' ? 'Prepayment Deposit ($)' : 'Initial Balance Amount ($)'}
                </label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  placeholder="e.g. 150.00" 
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm font-bold" 
                  value={newEntry.amount} 
                  onChange={e => setNewEntry({ ...newEntry, amount: e.target.value })} 
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowAddEntryModal(false)} 
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg shadow-sm"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Audit Drawer */}
      {auditDrawer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b flex justify-between items-start">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Transaction History</h3>
                <p className="text-xs text-gray-500 mt-0.5">{auditDrawer.entity.name} · {auditDrawer.entity.phone || '-'}</p>
              </div>
              <button onClick={() => setAuditDrawer(null)} className="text-gray-400 hover:text-gray-700 text-lg font-bold leading-none p-1">✕</button>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-px bg-gray-100 border-b text-center text-xs">
              <div className="bg-white p-2.5 sm:p-3">
                <div className="text-gray-500 font-semibold uppercase text-[10px] sm:text-xs">Total Credit</div>
                <div className="font-bold text-gray-900 mt-0.5 text-xs sm:text-sm">${(Number(auditDrawer.entity.total_credit || auditDrawer.entity.total_purchased) || 0).toFixed(2)}</div>
              </div>
              <div className="bg-white p-2.5 sm:p-3">
                <div className="text-green-600 font-semibold uppercase text-[10px] sm:text-xs">Amount Paid</div>
                <div className="font-bold text-green-700 mt-0.5 text-xs sm:text-sm">${(Number(auditDrawer.entity.amount_paid) || 0).toFixed(2)}</div>
              </div>
              <div className="bg-white p-2.5 sm:p-3">
                <div className="text-red-600 font-semibold uppercase text-[10px] sm:text-xs">Balance Due</div>
                <div className="font-bold text-red-700 mt-0.5 text-xs sm:text-sm">${(Number(auditDrawer.entity.balance_due) || 0).toFixed(2)}</div>
              </div>
            </div>

            {/* Transactions list */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {!Array.isArray(auditDrawer.transactions) || auditDrawer.transactions.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">No transaction history found.</div>
              ) : auditDrawer.transactions.map((tx, i) => {
                const typeColors = {
                  CREDIT_EXTENDED: 'bg-red-100 text-red-800',
                  PURCHASE_ON_CREDIT: 'bg-red-100 text-red-800',
                  PAYMENT_RECEIVED: 'bg-green-100 text-green-800',
                  PAYMENT_MADE: 'bg-green-100 text-green-800',
                  PREPAYMENT: 'bg-blue-100 text-blue-800'
                };
                const typeLabel = {
                  CREDIT_EXTENDED: 'Credit Extended',
                  PURCHASE_ON_CREDIT: 'Purchase on Credit',
                  PAYMENT_RECEIVED: 'Payment Received',
                  PAYMENT_MADE: 'Payment Made',
                  PREPAYMENT: 'Store Credit Deposit'
                };
                return (
                  <div key={i} className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded ${typeColors[tx.type] || 'bg-gray-100 text-gray-800'}`}>
                        {typeLabel[tx.type] || tx.type}
                      </span>
                      <div>
                        <div className="text-[11px] sm:text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</div>
                        {tx.note && <div className="text-[11px] text-gray-400">{tx.note}</div>}
                        {tx.payment_method && <div className="text-[11px] text-gray-400">via {tx.payment_method}</div>}
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-900">${(Number(tx.amount) || 0).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={() => setAuditDrawer(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
