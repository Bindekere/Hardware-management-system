const API_BASE = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (typeof window !== 'undefined' && window.location.port === '5173'
      ? 'http://127.0.0.1:8000/api'
      : '/api');

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products/`);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.warn('Backend offline, using local state:', err);
    return null;
  }
}

export async function createProductApi(product) {
  try {
    const res = await fetch(`${API_BASE}/products/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return await res.json();
  } catch (err) {
    console.warn('Backend offline, saved locally:', err);
    return null;
  }
}

export async function processSaleApi(sale) {
  try {
    const res = await fetch(`${API_BASE}/sales/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale)
    });
    return await res.json();
  } catch (err) {
    console.warn('Backend offline, processed locally:', err);
    return null;
  }
}

export async function fetchDebtorsApi() {
  try {
    const res = await fetch(`${API_BASE}/ledger/debtors`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (err) {
    return null;
  }
}

export async function fetchCreditorsApi() {
  try {
    const res = await fetch(`${API_BASE}/ledger/creditors`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (err) {
    return null;
  }
}

export async function fetchTransactionsApi(entityId) {
  try {
    const res = await fetch(`${API_BASE}/ledger/transactions/${entityId}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function addLedgerEntryApi(entry) {
  try {
    const res = await fetch(`${API_BASE}/ledger/entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function recordLedgerPaymentApi(payment) {
  try {
    const res = await fetch(`${API_BASE}/ledger/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment)
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}
