/* app.js
   Minimal, robust PF Dashboard behavior (vanilla JS).
   Features: add/edit transactions, accounts, budgets, export/import JSON, basic CSV import preview,
   modal system, toasts with undo support, tabs.
*/

(function () {
  const LS_KEY = 'pf-dashboard-v1';

  // Defaults
  const DEFAULTS = {
    settings: { currency: 'PHP', currencySymbol: '₱', firstDay: 1, theme: 'light', dateFormat: 'YYYY-MM-DD' },
    accounts: [{ id: genId('acc'), name: 'Checking', type: 'asset', balance: 0 }],
    transactions: [],
    budgets: [],
    net: []
  };

  let state = {};
  let undoStack = [];

  // ---------- Helpers ----------
  function genId(prefix = 'id') { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }
  function nowISO() { return new Date().toISOString(); }
  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Save failed', e);
      showToast('Unable to save to localStorage. Export your data.', { danger: true });
    }
  }
  function load() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      state = JSON.parse(JSON.stringify(DEFAULTS));
      save();
    } else {
      try {
        state = JSON.parse(raw);
        state.accounts = state.accounts || [];
        state.transactions = state.transactions || [];
        state.budgets = state.budgets || [];
        state.net = state.net || [];
      } catch (e) {
        console.error('Load parse failed', e);
        state = JSON.parse(JSON.stringify(DEFAULTS));
        save();
      }
    }
  }

  function formatCurrency(amount) {
    const s = (state.settings && state.settings.currencySymbol) || '₱';
    const n = Number(amount) || 0;
    return s + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ---------- CRUD ----------
  function createTransaction(data) {
    const txn = Object.assign({
      id: genId('txn'),
      date: nowISO(),
      accountId: (state.accounts[0] && state.accounts[0].id) || null,
      category: 'Uncategorized',
      description: '',
      amount: 0,
      type: 'expense',
      createdAt: nowISO()
    }, data);
    state.transactions.push(txn);
    // update account balance
    const acc = state.accounts.find(a => a.id === txn.accountId);
    if (acc) acc.balance += (txn.type === 'income' ? Number(txn.amount) : -Number(txn.amount));
    save();
    renderAll();
    return txn;
  }

  function updateTransaction(id, patch) {
    const idx = state.transactions.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const old = state.transactions[idx];
    const oldAcc = state.accounts.find(a => a.id === old.accountId);
    if (oldAcc) oldAcc.balance -= (old.type === 'income' ? Number(old.amount) : -Number(old.amount));
    const updated = Object.assign({}, old, patch);
    state.transactions[idx] = updated;
    const newAcc = state.accounts.find(a => a.id === updated.accountId);
    if (newAcc) newAcc.balance += (updated.type === 'income' ? Number(updated.amount) : -Number(updated.amount));
    save();
    renderAll();
    return updated;
  }

  function deleteTransaction(id) {
    const idx = state.transactions.findIndex(t => t.id === id);
    if (idx === -1) return false;
    const t = state.transactions[idx];
    // push undo
    undoStack.push({ action: 'deleteTransaction', payload: JSON.parse(JSON.stringify(t)) });
    state.transactions.splice(idx, 1);
    const acc = state.accounts.find(a => a.id === t.accountId);
    if (acc) acc.balance -= (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
    save();
    renderAll();
    showUndoToast('Transaction deleted', undo);
    return true;
  }

  function undo() {
    const u = undoStack.pop();
    if (!u) return;
    if (u.action === 'deleteTransaction') {
      state.transactions.push(u.payload);
      const acc = state.accounts.find(a => a.id === u.payload.accountId);
      if (acc) acc.balance += (u.payload.type === 'income' ? Number(u.payload.amount) : -Number(u.payload.amount));
      save();
      renderAll();
      showToast('Undo complete');
    }
  }

  // Accounts
  function createAccount(data) {
    const acc = Object.assign({ id: genId('acc'), name: 'New Account', type: 'asset', balance: Number(data?.balance || 0) }, data);
    state.accounts.push(acc);
    save();
    renderAll();
    return acc;
  }
  function updateAccount(id, patch) {
    const idx = state.accounts.findIndex(a => a.id === id);
    if (idx === -1) return null;
    state.accounts[idx] = Object.assign({}, state.accounts[idx], patch);
    save();
    renderAll();
    return state.accounts[idx];
  }
  function deleteAccount(id) {
    if (state.transactions.some(t => t.accountId === id)) { showToast('Cannot delete: account has transactions', { danger: true }); return false; }
    const idx = state.accounts.findIndex(a => a.id === id);
    if (idx === -1) return false;
    state.accounts.splice(idx, 1);
    save(); renderAll(); return true;
  }

  // Budgets
  function setBudget(category, amount, cycle = 'monthly') {
    let b = state.budgets.find(x => x.category === category);
    if (b) { b.amount = Number(amount); b.cycle = cycle; }
    else state.budgets.push({ id: genId('bud'), category, amount: Number(amount), cycle });
    save(); renderAll();
  }
  function getBudgetStatus(category) {
    const b = state.budgets.find(x => x.category === category);
    if (!b) return null;
    const spent = state.transactions.filter(t => t.category === category && t.type === 'expense').reduce((s, x) => s + Number(x.amount), 0);
    return { budget: b.amount, spent, percent: b.amount ? Math.round(spent / b.amount * 100) : 0 };
  }

  // ---------- Import / Export ----------
  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pf-dashboard-backup.json'; document.body.appendChild(a);
    a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function importJSONFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.transactions) throw new Error('Invalid file: missing transactions');
        state = parsed;
        save(); renderAll(); showToast('Import successful');
      } catch (e) {
        console.error(e); showToast('Import failed: ' + e.message, { danger: true });
      }
    };
    reader.readAsText(file);
  }

  // Basic CSV preview/import (NOTE: simple CSV splitter; not full RFC parser)
  function importCSVFile(file, onPreview) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (!lines.length) return onPreview({ header: [], sample: [], rows: [] });
      const header = lines.shift().split(',').map(h => h.trim());
      const sample = lines.slice(0, 5).map(r => r.split(',').map(c => c.trim()));
      onPreview({ header, sample, rows: lines });
    };
    reader.readAsText(file);
  }

  function finalizeCSVImport(mapping, rows) {
    rows.forEach(r => {
      const cols = r.split(',');
      const t = {
        date: parseDate(cols[mapping.date]),
        amount: Number((cols[mapping.amount] || '0').replace(/[^0-9.-]/g, '')) || 0,
        type: (cols[mapping.type] || 'expense').toLowerCase().includes('inc') ? 'income' : 'expense',
        description: cols[mapping.description] || '',
        category: cols[mapping.category] || 'Imported',
        accountId: (state.accounts.find(a => a.name === (cols[mapping.account] || '')) || state.accounts[0]).id
      };
      createTransaction(t);
    });
    showToast('CSV imported');
  }

  function parseDate(str) {
    if (!str) return nowISO();
    const d = Date.parse(str);
    if (!isNaN(d)) return new Date(d).toISOString();
    try { return dayjs(str).toISOString(); } catch (e) { return nowISO(); }
  }

  // ---------- Rendering ----------
  function renderAll() {
    renderKPIs(); renderRecent(); renderTransactions(); renderAccounts(); renderBudgets(); renderCharts(); renderNetworth();
  }

  function renderKPIs() {
    const balance = state.accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
    const nowMonth = dayjs().month();
    const monthlyIncome = state.transactions.filter(t => t.type === 'income' && dayjs(t.date).month() === nowMonth).reduce((s, x) => s + Number(x.amount), 0);
    const monthlyExpenses = state.transactions.filter(t => t.type === 'expense' && dayjs(t.date).month() === nowMonth).reduce((s, x) => s + Number(x.amount), 0);
    const savingsRate = monthlyIncome ? Math.round((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;
    const totalBudget = state.budgets.reduce((s, b) => s + Number(b.amount || 0), 0);
    const spent = state.transactions.filter(t => t.type === 'expense').reduce((s, x) => s + Number(x.amount), 0);

    const nodes = {
      balance: document.getElementById('kpi-balance'),
      income: document.getElementById('kpi-income'),
      expenses: document.getElementById('kpi-expenses'),
      savings: document.getElementById('kpi-savings-rate'),
      budgetRem: document.getElementById('kpi-budget-remaining')
    };
    if (nodes.balance) nodes.balance.textContent = formatCurrency(balance);
    if (nodes.income) nodes.income.textContent = formatCurrency(monthlyIncome);
    if (nodes.expenses) nodes.expenses.textContent = formatCurrency(monthlyExpenses);
    if (nodes.savings) nodes.savings.textContent = `${savingsRate}%`;
    if (nodes.budgetRem) nodes.budgetRem.textContent = formatCurrency(Math.max(0, totalBudget - spent));
  }

  function renderRecent() {
    const list = document.getElementById('recent-list');
    if (!list) return;
    list.innerHTML = '';
    const recent = state.transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
    recent.forEach(t => {
      const li = document.createElement('li');
      const acc = (state.accounts.find(a => a.id === t.accountId) || {}).name || '';
      li.innerHTML = `<div style="display:flex;justify-content:space-between">
        <div><strong>${escapeHtml(t.category)}</strong><div style="color:var(--muted);font-size:13px">${dayjs(t.date).format('YYYY-MM-DD')} · ${escapeHtml(t.description || '')} · ${escapeHtml(acc)}</div></div>
        <div class="amount">${formatCurrency(t.type === 'expense' ? -t.amount : t.amount)}</div>
      </div>`;
      list.appendChild(li);
    });
  }

  function renderTransactions() {
    const container = document.getElementById('transactions-list');
    if (!container) return;
    container.innerHTML = '';
    const list = state.transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    list.forEach(t => {
      const el = document.createElement('div');
      el.className = 'tx';
      const acc = (state.accounts.find(a => a.id === t.accountId) || {}).name || '';
      el.innerHTML = `<div class="meta"><div><strong>${escapeHtml(t.description || t.category)}</strong><div class="muted">${dayjs(t.date).format('YYYY-MM-DD')} · ${escapeHtml(acc)}</div></div></div><div class="amount">${formatCurrency(t.type === 'expense' ? -t.amount : t.amount)}</div>`;
      el.addEventListener('click', () => openTransactionModal(t));
      container.appendChild(el);
    });
  }

  function renderAccounts() {
    const el = document.getElementById('accounts-list');
    if (!el) return;
    el.innerHTML = '';
    state.accounts.forEach(a => {
      const row = document.createElement('div');
      row.innerHTML = `<div style="display:flex;justify-content:space-between;padding:8px 0"><div><strong>${escapeHtml(a.name)}</strong><div class="muted">${escapeHtml(a.type)}</div></div><div>${formatCurrency(a.balance)}</div></div>`;
      el.appendChild(row);
    });
  }

  function renderBudgets() {
    const el = document.getElementById('budgets-list');
    if (!el) return;
    el.innerHTML = '';
    state.budgets.forEach(b => {
      const status = getBudgetStatus(b.category) || { spent: 0, budget: b.amount || 0 };
      const percent = status.budget ? Math.round(status.spent / status.budget * 100) : 0;
      const color = percent >= 100 ? 'var(--danger)' : percent >= 80 ? 'orange' : 'var(--accent)';
      const div = document.createElement('div');
      div.innerHTML = `<div style="padding:8px 0"><div style="display:flex;justify-content:space-between"><div><strong>${escapeHtml(b.category)}</strong><div class="muted">${escapeHtml(b.cycle || 'monthly')}</div></div><div>${formatCurrency(status.spent)} / ${formatCurrency(b.amount)}</div></div><div style="height:8px;background:#f1f1f1;border-radius:8px;margin-top:6px"><div style="width:${Math.min(100, percent)}%;height:100%;background:${color};border-radius:8px"></div></div></div>`;
      el.appendChild(div);
    });
  }

  // Charts (safe: only if Chart exists)
  let charts = {};
  function renderCharts() {
    if (typeof Chart === 'undefined') return;
    // simple charts, safe to re-create
    try {
      // income/expenses last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) months.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
      const income = months.map(m => state.transactions.filter(t => t.type === 'income' && dayjs(t.date).format('YYYY-MM') === m).reduce((s, x) => s + Number(x.amount), 0));
      const expense = months.map(m => state.transactions.filter(t => t.type === 'expense' && dayjs(t.date).format('YYYY-MM') === m).reduce((s, x) => s + Number(x.amount), 0));
      const ctx = document.getElementById('chart-income-expenses');
      if (ctx) {
        if (charts.incomeExpenses) charts.incomeExpenses.destroy();
        charts.incomeExpenses = new Chart(ctx, { type: 'bar', data: { labels: months, datasets: [{ label: 'Income', data: income }, { label: 'Expenses', data: expense }] }, options: { responsive: true, maintainAspectRatio: false } });
      }

      const categories = [...new Set(state.transactions.map(t => t.category).filter(Boolean))].slice(0, 8);
      const catSums = categories.map(c => state.transactions.filter(t => t.category === c && t.type === 'expense').reduce((s, x) => s + Number(x.amount), 0));
      const ctx2 = document.getElementById('chart-expense-pie');
      if (ctx2) {
        if (charts.pie) charts.pie.destroy();
        charts.pie = new Chart(ctx2, { type: 'doughnut', data: { labels: categories, datasets: [{ data: catSums }] }, options: { responsive: true, maintainAspectRatio: false } });
      }

      const ctx3 = document.getElementById('chart-networth');
      if (ctx3) {
        if (charts.networth) charts.networth.destroy();
        const netValues = [];
        const labels = months.slice();
        for (let i = 0; i < labels.length; i++) netValues.push(state.accounts.reduce((s, a) => s + Number(a.balance || 0), 0));
        charts.networth = new Chart(ctx3, { type: 'line', data: { labels, datasets: [{ label: 'Net worth', data: netValues, fill: false }] }, options: { responsive: true, maintainAspectRatio: false } });
      }
    } catch (e) { console.warn('chart error', e); }
  }

  function renderNetworth() {
    const el = document.getElementById('networth-list');
    if (!el) return;
    el.innerHTML = '';
    state.net.forEach(n => {
      const div = document.createElement('div');
      div.innerHTML = `<div style="display:flex;justify-content:space-between;padding:8px 0"><div><strong>${escapeHtml(n.name)}</strong><div class="muted">${escapeHtml(n.type)}</div></div><div>${formatCurrency(n.amount)}</div></div>`;
      el.appendChild(div);
    });
  }

  // ---------- UI helpers ----------
  function showToast(msg, opts = {}) {
    const area = document.getElementById('toasts');
    if (!area) return;
    const t = document.createElement('div'); t.className = 'toast';
    t.textContent = msg;
    if (opts.danger) t.style.borderLeft = '4px solid var(--danger)';
    area.appendChild(t);
    setTimeout(() => t.remove(), 4500);
  }

  function showUndoToast(msg, onUndo) {
    const area = document.getElementById('toasts');
    if (!area) return;
    const t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = `<span>${escapeHtml(msg)}</span>`;
    const btn = document.createElement('button'); btn.className = 'btn'; btn.style.marginLeft = '8px'; btn.textContent = 'Undo';
    t.appendChild(btn);
    area.appendChild(t);
    const timer = setTimeout(() => t.remove(), 7000);
    btn.addEventListener('click', () => { clearTimeout(timer); t.remove(); onUndo(); });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]); });
  }

  // ---------- Modals ----------
  function openTransactionModal(tx) {
    const modal = document.getElementById('modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const accountOptions = state.accounts.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');
    const html = [
      '<div class="dialog card">',
      `<h3>${tx ? 'Edit Transaction' : 'New Transaction'}</h3>`,
      '<label>Type: <select id="m-type"><option value="expense">Expense</option><option value="income">Income</option></select></label>',
      '<label>Date: <input id="m-date" type="date" /></label>',
      `<label>Account: <select id="m-account">${accountOptions}</select></label>`,
      '<label>Category: <input id="m-category" /></label>',
      '<label>Description: <input id="m-desc" /></label>',
      '<label>Amount: <input id="m-amount" type="number" step="0.01" /></label>',
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px"><button id="m-cancel" class="btn">Cancel</button><button id="m-save" class="btn primary">Save</button></div>',
      '</div>'
    ].join('');
    modal.innerHTML = html;

    document.getElementById('m-cancel').addEventListener('click', closeModal);
    document.getElementById('m-save').addEventListener('click', () => {
      const dateVal = document.getElementById('m-date').value;
      const data = {
        type: document.getElementById('m-type').value,
        date: dateVal ? new Date(dateVal).toISOString() : nowISO(),
        accountId: document.getElementById('m-account').value || (state.accounts[0] && state.accounts[0].id),
        category: document.getElementById('m-category').value || 'Uncategorized',
        description: document.getElementById('m-desc').value || '',
        amount: Number(document.getElementById('m-amount').value) || 0
      };
      if (tx) updateTransaction(tx.id, data); else createTransaction(data);
      closeModal();
    });

    if (tx) {
      document.getElementById('m-type').value = tx.type;
      document.getElementById('m-date').value = dayjs(tx.date).format('YYYY-MM-DD');
      document.getElementById('m-account').value = tx.accountId;
      document.getElementById('m-category').value = tx.category;
      document.getElementById('m-desc').value = tx.description;
      document.getElementById('m-amount').value = tx.amount;
    }
  }

  function openAccountModal(acc) {
    const modal = document.getElementById('modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const html = [
      '<div class="dialog card">',
      `<h3>${acc ? 'Edit Account' : 'Add Account'}</h3>`,
      '<label>Name: <input id="a-name" /></label>',
      '<label>Type: <select id="a-type"><option value="asset">Asset</option><option value="liability">Liability</option></select></label>',
      '<label>Starting balance: <input id="a-balance" type="number" step="0.01" /></label>',
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px"><button id="a-cancel" class="btn">Cancel</button><button id="a-save" class="btn primary">Save</button></div>',
      '</div>'
    ].join('');
    modal.innerHTML = html;
    document.getElementById('a-cancel').addEventListener('click', closeModal);
    document.getElementById('a-save').addEventListener('click', () => {
      const data = { name: document.getElementById('a-name').value || 'New Account', type: document.getElementById('a-type').value || 'asset', balance: Number(document.getElementById('a-balance').value) || 0 };
      if (acc) updateAccount(acc.id, data); else createAccount(data);
      closeModal();
    });
    if (acc) {
      document.getElementById('a-name').value = acc.name;
      document.getElementById('a-type').value = acc.type;
      document.getElementById('a-balance').value = acc.balance;
    }
  }

  function openBudgetModal() {
    const modal = document.getElementById('modal'); if (!modal) return;
    modal.classList.remove('hidden');
    modal.innerHTML = [
      '<div class="dialog card">',
      '<h3>Add Budget</h3>',
      '<label>Category: <input id="b-cat" /></label>',
      '<label>Amount: <input id="b-amt" type="number" /></label>',
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px"><button id="b-cancel" class="btn">Cancel</button><button id="b-save" class="btn primary">Save</button></div>',
      '</div>'
    ].join('');
    document.getElementById('b-cancel').addEventListener('click', closeModal);
    document.getElementById('b-save').addEventListener('click', () => {
      const cat = document.getElementById('b-cat').value || 'Uncategorized';
      const amt = Number(document.getElementById('b-amt').value) || 0;
      setBudget(cat, amt);
      closeModal();
    });
  }

  function handleCSV(file) {
    importCSVFile(file, ({ header, sample, rows }) => {
      const modal = document.getElementById('modal'); if (!modal) return;
      modal.classList.remove('hidden');
      // show header + sample and simple mapping inputs
      const preview = sample.map(r => r.join(' | ')).join('\n');
      modal.innerHTML = [
        '<div class="dialog card">',
        '<h3>CSV Import — Mapping</h3>',
        `<p style="font-size:13px;color:var(--muted);">Header: ${header.join(', ')}</p>`,
        `<pre style="background:#fafafa;padding:8px;border-radius:8px;max-height:160px;overflow:auto">${escapeHtml(preview)}</pre>`,
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">',
        '  <label>Date col index (0-based): <input id="map-date" type="number" value="0" /></label>',
        '  <label>Amount col index: <input id="map-amount" type="number" value="1" /></label>',
        '  <label>Type col index: <input id="map-type" type="number" value="2" /></label>',
        '  <label>Description col index: <input id="map-desc" type="number" value="3" /></label>',
        '  <label>Category col index: <input id="map-cat" type="number" value="4" /></label>',
        '  <label>Account name col index: <input id="map-acc" type="number" value="5" /></label>',
        '</div>',
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px"><button id="map-cancel" class="btn">Cancel</button><button id="map-import" class="btn primary">Import</button></div>',
        '</div>'
      ].join('');
      document.getElementById('map-cancel').addEventListener('click', closeModal);
      document.getElementById('map-import').addEventListener('click', () => {
        const mapping = {
          date: Number(document.getElementById('map-date').value),
          amount: Number(document.getElementById('map-amount').value),
          type: Number(document.getElementById('map-type').value),
          description: Number(document.getElementById('map-desc').value),
          category: Number(document.getElementById('map-cat').value),
          account: Number(document.getElementById('map-acc').value)
        };
        finalizeCSVImport(mapping, rows);
        closeModal();
      });
    });
  }

  function closeModal() {
    const modal = document.getElementById('modal'); if (!modal) return;
    modal.classList.add('hidden'); modal.innerHTML = '';
  }

  // ---------- Init & wiring ----------
  function initApp() {
    load();

    // top buttons
    const addTxnBtn = document.getElementById('btn-add-transaction');
    if (addTxnBtn) addTxnBtn.addEventListener('click', () => openTransactionModal());

    const exportBtn = document.getElementById('btn-export-json');
    if (exportBtn) exportBtn.addEventListener('click', exportJSON);

    const importBtn = document.getElementById('btn-import-json');
    if (importBtn) importBtn.addEventListener('click', () => document.getElementById('file-input-json').click());

    const fileJson = document.getElementById('file-input-json');
    if (fileJson) fileJson.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) importJSONFile(e.target.files[0]);
      e.target.value = '';
    });

    const importCsvBtn = document.getElementById('btn-import-csv');
    if (importCsvBtn) importCsvBtn.addEventListener('click', () => document.getElementById('file-input-csv').click());

    const fileCsv = document.getElementById('file-input-csv');
    if (fileCsv) fileCsv.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleCSV(e.target.files[0]);
      e.target.value = '';
    });

    // tabs
    document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', (ev) => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      ev.currentTarget.classList.add('active');
      document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
      const panelId = 'panel-' + ev.currentTarget.dataset.panel;
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.remove('hidden');
    }));

    // panel buttons
    const addAccBtn = document.getElementById('btn-add-account');
    if (addAccBtn) addAccBtn.addEventListener('click', () => openAccountModal());

    const addBudBtn = document.getElementById('btn-add-budget');
    if (addBudBtn) addBudBtn.addEventListener('click', () => openBudgetModal());

    const addNetBtn = document.getElementById('btn-add-net');
    if (addNetBtn) addNetBtn.addEventListener('click', () => {
      // simple inline add for net items
      const name = prompt('Name of asset/liability:');
      const type = prompt('Type (asset/liability):', 'asset');
      const amount = Number(prompt('Amount:', '0')) || 0;
      state.net.push({ id: genId('net'), name: name || 'Item', type: type || 'asset', amount });
      save(); renderAll();
    });

    // render
    renderAll();
  }

  // ---------- Utilities ----------
  // expose limited API to console for quick testing
  window.PF = { createTransaction, updateTransaction, deleteTransaction, createAccount, updateAccount, setBudget, exportJSON, importJSONFile };

  // ---------- Start ----------
  document.addEventListener('DOMContentLoaded', initApp);
})();
