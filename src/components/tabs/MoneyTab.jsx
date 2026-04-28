import { useState, useCallback, useEffect } from 'react';
import { queueEvent } from '../../lib/syncClient.js';

const STORAGE_KEY = 'hub_money';

// The whole money state (balance + transactions + savings) is stored as
// one JSON blob in D1, keyed by log_type='money', item_id='state'. Simple
// and atomic — no need to denormalize.
function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.balance === 'number') {
      return {
        balance: saved.balance,
        transactions: Array.isArray(saved.transactions) ? saved.transactions : [],
        savings: Array.isArray(saved.savings) ? saved.savings : [],
      };
    }
  } catch {}
  return { balance: 0, transactions: [], savings: [] };
}

function syncMoneyState(state) {
  const now = Date.now();
  queueEvent({
    log_type: 'money',
    date: '_',
    item_id: 'state',
    value: now,
    ts: now,
    submitted_at: new Date().toISOString(),
    meta: JSON.stringify(state),
  });
}

function fmtMoney(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MoneyTab() {
  const [data, setData] = useState(loadData);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState('subtract');
  const [savingsOpen, setSavingsOpen] = useState(false);

  useEffect(() => {
    const reload = () => setData(loadData());
    window.addEventListener('hub-sync-pull', reload);
    return () => window.removeEventListener('hub-sync-pull', reload);
  }, []);

  const submit = useCallback((e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    const delta = mode === 'add' ? val : -val;
    setData(prev => {
      const next = {
        ...prev,
        balance: Math.round((prev.balance + delta) * 100) / 100,
        transactions: [
          {
            id: Date.now(),
            amount: delta,
            reason: reason.trim() || (mode === 'add' ? 'Added' : 'Spent'),
            date: new Date().toISOString(),
          },
          ...prev.transactions,
        ],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      syncMoneyState(next);
      return next;
    });
    setAmount('');
    setReason('');
  }, [amount, reason, mode]);

  const deleteTransaction = useCallback((id) => {
    setData(prev => {
      const tx = prev.transactions.find(t => t.id === id);
      if (!tx) return prev;
      const next = {
        ...prev,
        balance: Math.round((prev.balance - tx.amount) * 100) / 100,
        transactions: prev.transactions.filter(t => t.id !== id),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      syncMoneyState(next);
      return next;
    });
  }, []);

  const addSavings = useCallback((name, amt) => {
    const trimmed = name.trim();
    const num = parseFloat(amt);
    if (!trimmed || !Number.isFinite(num)) return;
    setData(prev => {
      const next = {
        ...prev,
        savings: [
          ...prev.savings,
          { id: Date.now(), name: trimmed, amount: Math.round(num * 100) / 100 },
        ],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      syncMoneyState(next);
      return next;
    });
  }, []);

  const updateSavings = useCallback((id, patch) => {
    setData(prev => {
      const next = {
        ...prev,
        savings: prev.savings.map(s => s.id === id ? { ...s, ...patch } : s),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      syncMoneyState(next);
      return next;
    });
  }, []);

  const deleteSavings = useCallback((id) => {
    setData(prev => {
      const next = { ...prev, savings: prev.savings.filter(s => s.id !== id) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      syncMoneyState(next);
      return next;
    });
  }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const savingsTotal = data.savings.reduce((s, x) => s + x.amount, 0);
  const netWorth = data.balance + savingsTotal;

  return (
    <div className="money-tab">
      <div className="money-balance-card">
        <div className="money-balance-row">
          <div>
            <div className="money-balance-label">Liquid Balance</div>
            <div className={`money-balance-amount${data.balance < 0 ? ' negative' : ''}`}>
              ${fmtMoney(data.balance)}
            </div>
          </div>
          <button className="money-savings-btn" onClick={() => setSavingsOpen(true)}>
            Savings
            <span className="money-savings-total">${fmtMoney(savingsTotal)}</span>
          </button>
        </div>
        {data.savings.length > 0 && (
          <div className="money-net-worth">Net worth: ${fmtMoney(netWorth)}</div>
        )}
      </div>

      <form className="money-form" onSubmit={submit}>
        <div className="money-toggle">
          <button
            type="button"
            className={`money-toggle-btn${mode === 'subtract' ? ' active subtract' : ''}`}
            onClick={() => setMode('subtract')}
          >- Subtract</button>
          <button
            type="button"
            className={`money-toggle-btn${mode === 'add' ? ' active add' : ''}`}
            onClick={() => setMode('add')}
          >+ Add</button>
        </div>
        <div className="money-inputs">
          <input
            type="number"
            className="money-input"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <input
            type="text"
            className="money-reason"
            placeholder="Reason..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <button type="submit" className={`money-submit ${mode}`}>
            {mode === 'add' ? 'Add' : 'Subtract'}
          </button>
        </div>
      </form>

      <div className="money-history">
        <div className="money-history-title">Transaction History</div>
        {data.transactions.length === 0 && (
          <div className="money-empty">No transactions yet</div>
        )}
        {data.transactions.map(tx => (
          <div key={tx.id} className="money-tx">
            <div className="money-tx-left">
              <span className={`money-tx-amount${tx.amount >= 0 ? ' green' : ' red'}`}>
                {tx.amount >= 0 ? '+' : ''}{fmtMoney(tx.amount)}
              </span>
              <span className="money-tx-reason">{tx.reason}</span>
            </div>
            <div className="money-tx-right">
              <span className="money-tx-date">{formatDate(tx.date)}</span>
              <button className="money-tx-del" onClick={() => deleteTransaction(tx.id)} title="Undo">&times;</button>
            </div>
          </div>
        ))}
      </div>

      {savingsOpen && (
        <SavingsOverlay
          savings={data.savings}
          total={savingsTotal}
          onAdd={addSavings}
          onUpdate={updateSavings}
          onDelete={deleteSavings}
          onClose={() => setSavingsOpen(false)}
        />
      )}
    </div>
  );
}

function SavingsOverlay({ savings, total, onAdd, onUpdate, onDelete, onClose }) {
  const [newName, setNewName] = useState('');
  const [newAmt, setNewAmt] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmt, setEditAmt] = useState('');

  const submitAdd = (e) => {
    e.preventDefault();
    onAdd(newName, newAmt);
    setNewName('');
    setNewAmt('');
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditAmt(String(s.amount));
  };

  const commitEdit = () => {
    const num = parseFloat(editAmt);
    if (!editName.trim() || !Number.isFinite(num)) {
      setEditingId(null);
      return;
    }
    onUpdate(editingId, { name: editName.trim(), amount: Math.round(num * 100) / 100 });
    setEditingId(null);
  };

  return (
    <div className="gym-overlay" onClick={onClose}>
      <div className="savings-modal" onClick={e => e.stopPropagation()}>
        <div className="savings-header">
          <h2>Savings</h2>
          <button className="savings-close" onClick={onClose}>&times;</button>
        </div>

        <div className="savings-total-row">
          <span>Total</span>
          <span className="savings-total-amt">${fmtMoney(total)}</span>
        </div>

        <div className="savings-list">
          {savings.length === 0 && <div className="money-empty">No savings yet</div>}
          {savings.map(s => (
            <div key={s.id} className="savings-row">
              {editingId === s.id ? (
                <>
                  <input
                    className="savings-edit-name"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    autoFocus
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="savings-edit-amt"
                    value={editAmt}
                    onChange={e => setEditAmt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                  />
                  <button className="savings-row-btn" onClick={commitEdit}>Save</button>
                </>
              ) : (
                <>
                  <span className="savings-name" onClick={() => startEdit(s)}>{s.name}</span>
                  <span className="savings-amt" onClick={() => startEdit(s)}>${fmtMoney(s.amount)}</span>
                  <button className="savings-row-del" onClick={() => onDelete(s.id)} title="Delete">&times;</button>
                </>
              )}
            </div>
          ))}
        </div>

        <form className="savings-add-form" onSubmit={submitAdd}>
          <input
            type="text"
            className="savings-input"
            placeholder="Where (e.g., Savings Account)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            className="savings-input savings-input-amt"
            placeholder="Amount"
            value={newAmt}
            onChange={e => setNewAmt(e.target.value)}
          />
          <button type="submit" className="savings-add-btn">Add</button>
        </form>
      </div>
    </div>
  );
}
