import React, { useState } from 'react';

const MOCK_PRODUCTS = [
  { id: 'prod-1', sku: 'CEM-001', barcode: '8901234567890', name: 'Portland Cement 50kg', selling_price: 12.00, stock_quantity: 120 },
  { id: 'prod-2', sku: 'PVC-002', barcode: '8901234567891', name: 'PVC Pipe 2 inch (3m)', selling_price: 8.50, stock_quantity: 4 },
  { id: 'prod-3', sku: 'NAL-003', barcode: '8901234567892', name: 'Steel Nails 3 inch (kg)', selling_price: 2.50, stock_quantity: 25 }
];

export default function SalesView({ onSaleComplete }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [completedSale, setCompletedSale] = useState(null);


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
          <div class="border"></div>
          ${receipt.items.map(i => `
            <div class="item">
              <span>${i.quantity}x ${i.name}</span>
              <span>$${(i.selling_price * i.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="border"></div>
          <div class="item bold">
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

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const saleRecord = {
      id: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      total: totalAmount,
      payment_method: paymentMethod,
      timestamp: new Date().toISOString(),
      items: cart
    };
    setCompletedSale(saleRecord);
    if (onSaleComplete) {
      onSaleComplete(saleRecord);
    }
    setCart([]);
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection Panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <input 
            type="text" 
            placeholder="Scan Barcode or Search product..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredProducts.map(p => (
            <div 
              key={p.id} 
              onClick={() => addToCart(p)}
              className={`p-3 bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-amber-500 transition ${p.stock_quantity === 0 ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">{p.name}</h4>
                  <span className="text-xs text-gray-400 font-mono">{p.sku}</span>
                </div>
                <span className="font-bold text-amber-600">${p.selling_price.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between items-center text-xs">
                <span className={`font-semibold ${p.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Stock: {p.stock_quantity}
                </span>
                <button className="bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded hover:bg-amber-200">
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart & Checkout Panel */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between h-[500px]">
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b pb-2 mb-3">Quick Sale Terminal</h2>
          
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Cart is empty. Select products on the left.</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm border border-gray-100">
                  <div>
                    <div className="font-medium text-gray-800 text-xs">{item.name}</div>
                    <div className="text-xs text-gray-500">${item.selling_price.toFixed(2)} each</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-0.5 bg-gray-200 rounded font-bold text-xs">-</button>
                    <span className="font-bold text-xs">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-0.5 bg-gray-200 rounded font-bold text-xs">+</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t pt-3 space-y-3">
          <div className="flex justify-between items-center font-bold text-lg text-gray-900">
            <span>Total:</span>
            <span className="text-amber-600">${totalAmount.toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
            <select 
              value={paymentMethod} 
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm"
            >
              <option value="Cash">Cash</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Credit">Customer Credit</option>
            </select>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-2.5 rounded font-bold text-sm transition ${cart.length > 0 ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Complete Sale
          </button>
        </div>
      </div>

      {/* Sale Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xs w-full p-5 space-y-3 text-center">
            <h3 className="text-lg font-bold text-green-600">Sale Complete!</h3>
            <p className="text-xs text-gray-500">Ref: {completedSale.id}</p>
            <div className="bg-gray-50 p-3 rounded text-left space-y-1 text-xs">
              <div className="font-semibold text-gray-700">Receipt Details:</div>
              {completedSale.items.map(i => (
                <div key={i.id} className="flex justify-between">
                  <span>{i.quantity}x {i.name}</span>
                  <span>${(i.selling_price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-1 flex justify-between font-bold text-gray-900">
                <span>Total:</span>
                <span>${completedSale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Payment:</span>
                <span>{completedSale.payment_method}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => handlePrint(completedSale)}
                className="w-1/2 py-1.5 bg-amber-500 text-slate-900 rounded text-xs font-semibold hover:bg-amber-600"
              >
                Print Receipt
              </button>
              <button 
                onClick={() => setCompletedSale(null)}
                className="w-1/2 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
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
