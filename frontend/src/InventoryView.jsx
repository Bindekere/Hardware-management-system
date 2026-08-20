import React, { useState, useEffect } from 'react';
import { fetchProducts, createProductApi } from './api';

const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    sku: 'CEM-001',
    barcode: '8901234567890',
    name: 'Portland Cement 50kg',
    category: 'Building',
    cost_price: 9.50,
    selling_price: 12.00,
    stock_quantity: 120,
    minimum_stock: 20,
    location: 'A1-S1-B1',
    supplier: 'Supplier A'
  },
  {
    id: 'prod-2',
    sku: 'PVC-002',
    barcode: '8901234567891',
    name: 'PVC Pipe 2 inch (3m)',
    category: 'Plumbing',
    cost_price: 5.00,
    selling_price: 8.50,
    stock_quantity: 4,
    minimum_stock: 10,
    location: 'A2-S3-B1',
    supplier: 'Supplier B'
  },
  {
    id: 'prod-3',
    sku: 'NAL-003',
    barcode: '8901234567892',
    name: 'Steel Nails 3 inch (kg)',
    category: 'Hardware',
    cost_price: 1.50,
    selling_price: 2.50,
    stock_quantity: 0,
    minimum_stock: 15,
    location: 'A3-S1-B2',
    supplier: 'Supplier C'
  }
];

export default function InventoryView({ userRole }) {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(null);

  useEffect(() => {
    fetchProducts().then(apiProds => {
      if (apiProds && apiProds.length > 0) {
        setProducts(apiProds);
      }
    });
  }, []);

  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', barcode: '', category: 'Building', cost_price: '', selling_price: '', stock_quantity: '', minimum_stock: 5, location: 'A1-S1-B1'
  });

  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('DAMAGE');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const getStockBadge = (qty, min) => {
    if (qty === 0) return <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded">OUT OF STOCK</span>;
    if (qty <= min) return <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded">LOW STOCK</span>;
    return <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">IN STOCK</span>;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const created = {
      ...newProduct,
      id: `prod-${Date.now()}`,
      cost_price: parseFloat(newProduct.cost_price) || 0,
      selling_price: parseFloat(newProduct.selling_price) || 0,
      stock_quantity: parseInt(newProduct.stock_quantity) || 0,
      minimum_stock: parseInt(newProduct.minimum_stock) || 5
    };
    
    setProducts([...products, created]);
    await createProductApi(created);

    setShowAddModal(false);
    setNewProduct({ name: '', sku: '', barcode: '', category: 'Building', cost_price: '', selling_price: '', stock_quantity: '', minimum_stock: 5, location: 'A1-S1-B1' });
  };


  const handleAdjustStock = (e) => {
    e.preventDefault();
    const change = parseInt(adjustQty) || 0;
    setProducts(products.map(p => {
      if (p.id === showAdjustModal.id) {
        const newQty = Math.max(0, p.stock_quantity + change);
        return { ...p, stock_quantity: newQty };
      }
      return p;
    }));
    setShowAdjustModal(null);
    setAdjustQty('');
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <input 
          type="text" 
          placeholder="Filter products by Name, SKU, or Barcode..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full sm:w-80 focus:ring-1 focus:ring-amber-500 focus:outline-none"
        />
        {(userRole === 'ADMIN' || userRole === 'STOREKEEPER') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-1.5 rounded text-sm transition"
          >
            + Add New Product
          </button>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-gray-700 text-xs uppercase tracking-wider border-b">
            <tr>
              <th className="py-3 px-4">SKU / Barcode</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Cost Price</th>
              <th className="py-3 px-4">Selling Price</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-mono text-xs text-gray-900 font-bold">{p.sku}</div>
                  <div className="text-xs text-gray-400">{p.barcode || 'No barcode'}</div>
                </td>
                <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
                <td className="py-3 px-4 text-gray-600">{p.category}</td>
                <td className="py-3 px-4 font-bold text-gray-900">{p.stock_quantity}</td>
                <td className="py-3 px-4 text-gray-600">${p.cost_price.toFixed(2)}</td>
                <td className="py-3 px-4 font-medium text-gray-900">${p.selling_price.toFixed(2)}</td>
                <td className="py-3 px-4 font-mono text-xs text-slate-600">{p.location}</td>
                <td className="py-3 px-4">{getStockBadge(p.stock_quantity, p.minimum_stock)}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  {(userRole === 'ADMIN' || userRole === 'STOREKEEPER') && (
                    <button 
                      onClick={() => setShowAdjustModal(p)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded border border-slate-300"
                    >
                      Adjust
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Add New Product</h3>
            <form onSubmit={handleAddProduct} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name</label>
                <input required type="text" className="w-full border rounded px-3 py-1.5" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">SKU</label>
                  <input required type="text" className="w-full border rounded px-3 py-1.5" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Barcode</label>
                  <input type="text" className="w-full border rounded px-3 py-1.5" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cost Price ($)</label>
                  <input required type="number" step="0.01" className="w-full border rounded px-3 py-1.5" value={newProduct.cost_price} onChange={e => setNewProduct({...newProduct, cost_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Selling Price ($)</label>
                  <input required type="number" step="0.01" className="w-full border rounded px-3 py-1.5" value={newProduct.selling_price} onChange={e => setNewProduct({...newProduct, selling_price: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Stock Quantity</label>
                  <input required type="number" className="w-full border rounded px-3 py-1.5" value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Min Stock Alert</label>
                  <input required type="number" className="w-full border rounded px-3 py-1.5" value={newProduct.minimum_stock} onChange={e => setNewProduct({...newProduct, minimum_stock: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-4">
            <h3 className="text-md font-bold text-gray-900 border-b pb-2">Adjust Stock: {showAdjustModal.name}</h3>
            <form onSubmit={handleAdjustStock} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity Change (+ to add, - to subtract)</label>
                <input required type="number" placeholder="e.g. -2 or 10" className="w-full border rounded px-3 py-1.5" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
                <select className="w-full border rounded px-3 py-1.5" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}>
                  <option value="DAMAGE">DAMAGE</option>
                  <option value="LOSS">LOSS</option>
                  <option value="THEFT">THEFT</option>
                  <option value="ADJUSTMENT">MANUAL ADJUSTMENT</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAdjustModal(null)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
