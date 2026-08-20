import React, { useState, useEffect, useRef } from 'react';
import { processSaleApi } from './api';

const MOCK_PRODUCTS = [
  { id: 'prod-1', sku: 'CEM-001', barcode: '8901234567890', name: 'Portland Cement 50kg', selling_price: 12.00, stock_quantity: 120 },
  { id: 'prod-2', sku: 'PVC-002', barcode: '8901234567891', name: 'PVC Pipe 2 inch (3m)', selling_price: 8.50, stock_quantity: 4 },
  { id: 'prod-3', sku: 'NAL-003', barcode: '8901234567892', name: 'Steel Nails 3 inch (kg)', selling_price: 2.50, stock_quantity: 25 }
];

export default function SalesView({ onSaleComplete }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [completedSale, setCompletedSale] = useState(null);
  const [receiptFormat, setReceiptFormat] = useState('thermal'); // 'thermal' | 'a4'
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const searchRef = useRef(null);

  const mockCustomers = [
    { id: 'c-1', name: 'John Doe Builders', store_credit: 0.00 },
    { id: 'c-2', name: 'Apex Construction', store_credit: 0.00 },
    { id: 'c-3', name: 'Samuel Miller', store_credit: 150.00 }
  ];

  const custObj = mockCustomers.find(c => c.id === selectedCustomer);
  const availableCredit = custObj ? custObj.store_credit : 0.00;

  // Global barcode scanner listener — any keystrokes while not in an input auto-focus and fill the search box
  useEffect(() => {
    let buffer = '';
    let timer = null;
    const handleKey = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter') {
        if (buffer.length > 3) {
          setSearch(buffer);
          if (searchRef.current) searchRef.current.focus();
        }
        buffer = '';
        clearTimeout(timer);
        return;
      }
      if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => { buffer = ''; }, 100);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const filteredProducts = MOCK_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search)
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) return;
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.stock_quantity <= 0) return;
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePrint = (receipt) => {
    const isThermal = receiptFormat === 'thermal';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.id}</title>
          <style>
            ${isThermal ? `
              body { font-family: monospace; padding: 10px; width: 300px; font-size: 12px; }
              h2 { text-align: center; font-size: 14px; margin-bottom: 4px; }
              .center { text-align: center; }
              .border { border-top: 1px dashed #000; margin: 8px 0; }
              .item { display: flex; justify-content: space-between; font-size: 11px; }
              .bold { font-weight: bold; }
            ` : `
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; font-size: 13px; color: #111; }
              h2 { font-size: 20px; margin-bottom: 4px; }
              .subtitle { color: #555; font-size: 12px; margin-bottom: 20px; }
              .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 12px; }
              th { background: #f7f7f7; font-weight: bold; }
              .total { font-size: 16px; font-weight: bold; text-align: right; }
              .footer { color: #999; font-size: 11px; margin-top: 30px; text-align: center; }
              .border { border-top: 1px solid #eee; margin: 12px 0; }
            `}
          </style>
        </head>
        <body>
          <h2>HardwareDesk</h2>
          ${isThermal ? `
            <div class="center" style="font-size:11px;">Hardware Store Management</div>
            <div class="border"></div>
            <div><strong>Receipt #:</strong> ${receipt.id}</div>
            <div><strong>Date:</strong> ${new Date(receipt.timestamp).toLocaleString()}</div>
            <div><strong>Payment:</strong> ${receipt.payment_method}</div>
            <div class="border"></div>
            ${receipt.items.map(i => `
              <div class="item">
                <span>${i.quantity}x ${i.name}</span>
                <span>$${(i.selling_price * i.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="border"></div>
            <div class="item bold"><span>TOTAL:</span><span>$${receipt.total.toFixed(2)}</span></div>
            <div class="border"></div>
            <div class="center" style="font-size:10px; margin-top:15px;">Thank you for your business!</div>
          ` : `
            <div class="subtitle">Official Sale Invoice</div>
            <div class="meta">
              <div>
                <div><strong>Receipt #:</strong> ${receipt.id}</div>
                <div><strong>Payment:</strong> ${receipt.payment_method}</div>
              </div>
              <div style="text-align:right;">
                <div><strong>Date:</strong> ${new Date(receipt.timestamp).toLocaleString()}</div>
              </div>
            </div>
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                ${receipt.items.map(i => `
                  <tr>
                    <td>${i.name}</td>
                    <td>${i.quantity}</td>
                    <td>$${i.selling_price.toFixed(2)}</td>
                    <td>$${(i.selling_price * i.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">TOTAL: $${receipt.total.toFixed(2)}</div>
            <div class="footer">HardwareDesk — Thank you for your business!</div>
          `}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const saleRecord = {
      id: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      total: totalAmount,
      payment_method: paymentMethod,
      timestamp: new Date().toISOString(),
      items: cart
    };
    
    setCompletedSale(saleRecord);
    setMobileCartOpen(false);

    // Sync with FastAPI backend
    await processSaleApi({
      items: cart.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.selling_price })),
      payment_method: paymentMethod,
      amount_paid: totalAmount
    });

    if (onSaleComplete) {
      onSaleComplete(saleRecord);
    }
    setCart([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 relative pb-16 lg:pb-0">
      {/* Product Selection Panel */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search & Format Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3">
          <input 
            ref={searchRef}
            type="text" 
            placeholder="🔍 Scan Barcode or Search product..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            autoFocus
          />
          <div className="flex items-center justify-between xs:justify-start space-x-1 bg-slate-100 rounded p-1 self-end xs:self-auto w-full xs:w-auto">
            <span className="text-[11px] text-slate-500 font-medium px-1.5 xs:hidden">Print:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setReceiptFormat('thermal')}
                className={`text-xs font-semibold px-2.5 py-1 rounded transition ${receiptFormat === 'thermal' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                title="80mm Thermal Receipt"
              >
                🧾 80mm
              </button>
              <button
                onClick={() => setReceiptFormat('a4')}
                className={`text-xs font-semibold px-2.5 py-1 rounded transition ${receiptFormat === 'a4' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                title="A4 Invoice"
              >
                📄 A4
              </button>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredProducts.map(p => (
            <div 
              key={p.id} 
              onClick={() => addToCart(p)}
              className={`p-3 bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-amber-500 active:scale-[0.99] transition ${p.stock_quantity === 0 ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="pr-2">
                  <h4 className="font-semibold text-gray-800 text-sm leading-tight">{p.name}</h4>
                  <span className="text-xs text-gray-400 font-mono block mt-0.5">{p.sku}</span>
                </div>
                <span className="font-bold text-amber-600 text-sm sm:text-base">${p.selling_price.toFixed(2)}</span>
              </div>
              <div className="mt-2.5 flex justify-between items-center text-xs">
                <span className={`font-semibold ${p.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Stock: {p.stock_quantity}
                </span>
                <button className="bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded hover:bg-amber-200 transition">
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart & Checkout Panel (Sidebar on Desktop, Drawer/Modal or Bottom on Mobile) */}
      <div className={`
        fixed lg:static inset-x-0 bottom-0 z-40 lg:z-auto
        bg-white rounded-t-2xl lg:rounded-lg shadow-2xl lg:shadow-sm border border-gray-200
        p-4 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${mobileCartOpen ? 'translate-y-0 max-h-[85vh] h-auto' : 'translate-y-full lg:translate-y-0 hidden lg:flex'}
        lg:min-h-[500px]
      `}>
        {/* Mobile drawer handle & close header */}
        <div className="flex lg:hidden items-center justify-between border-b pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-800 text-sm">Active Cart ({totalItemCount} items)</span>
          </div>
          <button 
            onClick={() => setMobileCartOpen(false)}
            className="text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full font-bold"
          >
            ✕ Close
          </button>
        </div>

        <div>
          <h2 className="hidden lg:block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider border-b pb-2 mb-3">
            Quick Sale Terminal
          </h2>
          
          <div className="space-y-2 max-h-52 sm:max-h-60 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Cart is empty. Select products on the left.</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs sm:text-sm border border-gray-100">
                  <div className="pr-2">
                    <div className="font-medium text-gray-800 leading-tight">{item.name}</div>
                    <div className="text-[11px] text-gray-500">${item.selling_price.toFixed(2)} each</div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded font-bold text-xs">-</button>
                    <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded font-bold text-xs">+</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t pt-3 space-y-3 mt-3">
          <div className="flex justify-between items-center font-bold text-base sm:text-lg text-gray-900">
            <span>Total:</span>
            <span className="text-amber-600">${totalAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Customer (Optional)</label>
              <select 
                value={selectedCustomer} 
                onChange={e => setSelectedCustomer(e.target.value)}
                className="w-full border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Walk-in Customer</option>
                {mockCustomers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.store_credit > 0 ? `($${c.store_credit.toFixed(2)} Credit)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Payment Method</label>
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Cash">Cash</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Bank">Bank Transfer</option>
                {availableCredit > 0 && <option value="Store Credit">Use Store Credit (${availableCredit.toFixed(2)})</option>}
                <option value="Credit">Customer Debt Credit</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-2.5 rounded-lg font-bold text-xs sm:text-sm transition shadow-sm ${cart.length > 0 ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Complete Sale (${totalAmount.toFixed(2)})
          </button>
        </div>
      </div>

      {/* Floating Mobile Cart Bar (Visible when cart has items on phone) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900 text-white p-3 z-30 flex items-center justify-between shadow-2xl border-t border-slate-800">
        <div>
          <div className="text-xs text-slate-400 font-medium">{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in Cart</div>
          <div className="text-base font-bold text-amber-400">${totalAmount.toFixed(2)}</div>
        </div>
        <button
          onClick={() => setMobileCartOpen(true)}
          disabled={cart.length === 0}
          className={`px-4 py-2 rounded-lg font-bold text-xs transition ${cart.length > 0 ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
        >
          View Cart & Checkout 🛒
        </button>
      </div>

      {/* Sale Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xs sm:max-w-sm w-full p-4 sm:p-5 space-y-3 text-center shadow-2xl">
            <h3 className="text-base sm:text-lg font-bold text-green-600">Sale Complete!</h3>
            <p className="text-xs text-gray-500 font-mono">Ref: {completedSale.id}</p>
            <div className="bg-gray-50 p-3 rounded-lg text-left space-y-1.5 text-xs max-h-48 overflow-y-auto border">
              <div className="font-semibold text-gray-700">Receipt Details:</div>
              {completedSale.items.map(i => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-gray-700">{i.quantity}x {i.name}</span>
                  <span className="font-semibold text-gray-900">${(i.selling_price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-1.5 flex justify-between font-bold text-gray-900">
                <span>Total:</span>
                <span className="text-amber-600 font-bold">${completedSale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>Payment:</span>
                <span>{completedSale.payment_method}</span>
              </div>
            </div>
            <div className="flex space-x-2 pt-1">
              <button 
                onClick={() => handlePrint(completedSale)}
                className="w-1/2 py-2 bg-amber-500 text-slate-900 rounded-lg text-xs font-bold hover:bg-amber-600 transition"
              >
                Print Receipt
              </button>
              <button 
                onClick={() => setCompletedSale(null)}
                className="w-1/2 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
              >
                Close & Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
