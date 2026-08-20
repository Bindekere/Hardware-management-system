import React, { useState } from 'react';

const VARIANCE_THRESHOLD = 5; // require manager approval if abs variance >= this

export default function StockTakeView({ userRole }) {
  const [counts, setCounts] = useState([
    { id: 'prod-1', name: 'Portland Cement 50kg', location: 'A1-S1-B1', physical: '' },
    { id: 'prod-2', name: 'PVC Pipe 2 inch (3m)', location: 'A2-S3-B1', physical: '' },
    { id: 'prod-3', name: 'Steel Nails 3 inch (kg)', location: 'A3-S1-B2', physical: '' }
  ]);

  const [submittedResult, setSubmittedResult] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState({}); // { idx: 'APPROVED'|'REJECTED' }
  const [approvalNote, setApprovalNote] = useState({});     // { idx: noteText }
  const [finalized, setFinalized] = useState(false);

  const systemQty = { 'prod-1': 120, 'prod-2': 4, 'prod-3': 25 };

  const handleSubmit = () => {
    const results = counts.map(item => {
      const system = systemQty[item.id] || 0;
      const physical = parseInt(item.physical) !== '' && !isNaN(parseInt(item.physical)) ? parseInt(item.physical) : system;
      return {
        id: item.id,
        name: item.name,
        location: item.location,
        system,
        physical,
        variance: physical - system,
        needsApproval: Math.abs(physical - system) >= VARIANCE_THRESHOLD
      };
    });
    setSubmittedResult(results);
    setApprovalStatus({});
    setApprovalNote({});
    setFinalized(false);
  };

  const handleApprove = (idx, status) => {
    setApprovalStatus(prev => ({ ...prev, [idx]: status }));
  };

  const allApproved = submittedResult && submittedResult.every((res, idx) =>
    !res.needsApproval || approvalStatus[idx] === 'APPROVED' || approvalStatus[idx] === 'REJECTED'
  );

  const handleFinalize = () => {
    // In production, this would POST approved adjustments to the backend
    const approved = submittedResult.filter((_, idx) => !submittedResult[idx].needsApproval || approvalStatus[idx] === 'APPROVED');
    console.log('Finalizing stock take. Approved adjustments:', approved);
    setFinalized(true);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Blind Stock Take Entry</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Enter physical counts. System quantities are hidden until after submission.
            Variances ≥ {VARIANCE_THRESHOLD} units require manager approval.
          </p>
        </div>
        {submittedResult && (
          <button onClick={() => { setSubmittedResult(null); setFinalized(false); }}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded transition">
            ↩ New Stock Take
          </button>
        )}
      </div>

      {!submittedResult ? (
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
          <div className="space-y-2">
            {counts.map((item, idx) => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border text-sm">
                <div>
                  <div className="font-semibold text-gray-800">{item.name}</div>
                  <div className="text-xs text-gray-400 font-mono">📍 {item.location}</div>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="Physical Qty"
                  value={item.physical}
                  onChange={e => {
                    const newCounts = [...counts];
                    newCounts[idx].physical = e.target.value;
                    setCounts(newCounts);
                  }}
                  className="w-28 border rounded px-2 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 rounded text-sm transition">
            Submit & Calculate Variance
          </button>
        </div>
      ) : finalized ? (
        <div className="bg-green-50 border border-green-300 p-6 rounded-lg text-center space-y-2">
          <div className="text-3xl">✅</div>
          <h3 className="font-bold text-green-800">Stock Take Finalized</h3>
          <p className="text-xs text-green-700">All approved adjustments have been recorded in the system.</p>
          <button onClick={() => { setSubmittedResult(null); setFinalized(false); setCounts(counts.map(c => ({ ...c, physical: '' }))); }}
            className="mt-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded text-xs">
            Start New Stock Take
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-800">Stock Take Variance Audit</h3>
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                🔴 {submittedResult.filter(r => r.needsApproval).length} need approval
              </span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">
                🟢 {submittedResult.filter(r => !r.needsApproval).length} auto-approved
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {submittedResult.map((res, idx) => {
              const isApproved = approvalStatus[idx] === 'APPROVED';
              const isRejected = approvalStatus[idx] === 'REJECTED';
              const isPending = res.needsApproval && !approvalStatus[idx];
              const canApprove = userRole === 'ADMIN';

              return (
                <div key={idx} className={`p-4 ${res.needsApproval ? 'bg-amber-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{res.name}</div>
                      <div className="text-xs text-gray-500 font-mono">📍 {res.location}</div>
                      <div className="flex items-center space-x-4 mt-1.5 text-xs text-gray-600">
                        <span>System: <strong>{res.system}</strong></span>
                        <span>Physical: <strong>{res.physical}</strong></span>
                        <span className={`font-bold ${res.variance < 0 ? 'text-red-600' : res.variance > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                          Variance: {res.variance > 0 ? `+${res.variance}` : res.variance}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      {!res.needsApproval && (
                        <span className="text-xs bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded">✓ Auto-Approved</span>
                      )}
                      {isPending && (
                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">⚠ Awaiting Manager</span>
                      )}
                      {isApproved && (
                        <span className="text-xs bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded">✓ Manager Approved</span>
                      )}
                      {isRejected && (
                        <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">✗ Rejected — Recount</span>
                      )}
                    </div>
                  </div>

                  {res.needsApproval && canApprove && !isApproved && !isRejected && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Add a note or reason for this variance (optional)"
                        value={approvalNote[idx] || ''}
                        onChange={e => setApprovalNote(prev => ({ ...prev, [idx]: e.target.value }))}
                        className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <div className="flex space-x-2">
                        <button onClick={() => handleApprove(idx, 'APPROVED')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded text-xs transition">
                          ✓ Approve Adjustment
                        </button>
                        <button onClick={() => handleApprove(idx, 'REJECTED')}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded text-xs transition">
                          ✗ Reject — Recount Required
                        </button>
                      </div>
                    </div>
                  )}
                  {res.needsApproval && !canApprove && !isApproved && !isRejected && (
                    <p className="mt-2 text-xs text-amber-700 italic">Only an Admin / Manager can approve this variance.</p>
                  )}
                  {approvalNote[idx] && (isApproved || isRejected) && (
                    <p className="mt-1 text-xs text-gray-500 italic">Note: {approvalNote[idx]}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t bg-gray-50 flex justify-end">
            <button
              onClick={handleFinalize}
              disabled={!allApproved}
              className={`font-bold px-5 py-2 rounded text-sm transition ${allApproved ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {allApproved ? 'Finalize & Apply Adjustments' : 'Awaiting Approvals...'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
