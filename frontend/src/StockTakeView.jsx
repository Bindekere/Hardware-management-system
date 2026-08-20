import React, { useState } from 'react';

export default function StockTakeView() {
  const [counts, setCounts] = useState([
    { id: 'prod-1', name: 'Portland Cement 50kg', location: 'A1-S1-B1', physical: '' },
    { id: 'prod-2', name: 'PVC Pipe 2 inch (3m)', location: 'A2-S3-B1', physical: '' }
  ]);

  const [submittedResult, setSubmittedResult] = useState(null);

  const handleSubmit = () => {
    setSubmittedResult([
      { name: 'Portland Cement 50kg', system: 120, physical: parseInt(counts[0].physical) || 120, variance: (parseInt(counts[0].physical) || 120) - 120, reason: 'Damaged' },
      { name: 'PVC Pipe 2 inch (3m)', system: 4, physical: parseInt(counts[1].physical) || 4, variance: (parseInt(counts[1].physical) || 4) - 4, reason: 'Lost' }
    ]);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-bold text-gray-800">Blind Stock Take Entry</h2>
      
      {!submittedResult ? (
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
          <p className="text-xs text-gray-500">Enter physical counts observed on shelves without seeing system quantity.</p>
          <div className="space-y-2">
            {counts.map((item, idx) => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded border text-sm">
                <div>
                  <div className="font-semibold text-gray-800">{item.name}</div>
                  <div className="text-xs text-gray-400 font-mono">Location: {item.location}</div>
                </div>
                <input 
                  type="number" 
                  placeholder="Physical Qty" 
                  value={item.physical}
                  onChange={e => {
                    const newCounts = [...counts];
                    newCounts[idx].physical = e.target.value;
                    setCounts(newCounts);
                  }}
                  className="w-28 border rounded px-2 py-1 text-sm font-bold text-center"
                />
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 rounded text-sm">
            Submit & Calculate Variance
          </button>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
          <h3 className="font-bold text-sm text-gray-800 border-b pb-2">Stock Take Variance Audit</h3>
          <div className="space-y-2 text-sm">
            {submittedResult.map((res, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 rounded bg-gray-50 border">
                <div>
                  <div className="font-semibold">{res.name}</div>
                  <div className="text-xs text-gray-500">System: {res.system} | Physical: {res.physical}</div>
                </div>
                <div className={`font-bold text-sm ${res.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Variance: {res.variance > 0 ? `+${res.variance}` : res.variance}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setSubmittedResult(null)} className="w-full bg-slate-800 text-white font-semibold py-1.5 rounded text-xs">
            Start New Stock Take
          </button>
        </div>
      )}
    </div>
  );
}
