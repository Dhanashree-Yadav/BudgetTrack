(function () {
  'use strict';

  const USER_ID_KEY = 'budget_user_id';
  const DATA_KEY_PREFIX = 'budget_data_';
  const CONTEXT_KEY = 'budget_context';

  var INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Other'];
  var EXPENSE_CATEGORIES = ['Grocery', 'Rent', 'Bills'];

  var CATEGORY_ICONS = {
    Salary: '💼',
    Freelance: '💻',
    Investment: '📈',
    'Investment Returns': '📈',
    Dividends: '💹',
    Interest: '🏦',
    'Interest From Bank': '🏦',
    Other: '📌',
    Grocery: '🛒',
    Rent: '🏠',
    Bills: '🧾',
    Travel: '✈️',
    Food: '🍽️',
    Entertainment: '🎬',
    Health: '⚕️',
    Education: '📚',
    Transport: '🚗'
  };

  function getCategoryIcon(categoryName) {
    if (!categoryName) return '📋';
    return CATEGORY_ICONS[categoryName] || '📋';
  }
  var editingTransactionId = null;
  var openingForEdit = false;
  var THEME_KEY = 'budget_theme';

  function applyTheme(theme) {
    var html = document.documentElement;
    var meta = document.getElementById('meta-theme-color');
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      if (meta) meta.setAttribute('content', '#0f172a');
    } else {
      html.removeAttribute('data-theme');
      if (meta) meta.setAttribute('content', '#f1f5f9');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  }

  function initTheme() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (e) {}
    if (saved === 'dark') applyTheme('dark');
    else applyTheme('light');
    btn.addEventListener('click', function () {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      applyTheme(isDark ? 'light' : 'dark');
      if (typeof Chart !== 'undefined') {
        var tab = document.querySelector('.chart-tab.active');
        if (tab) renderChart(tab.dataset.period);
      }
    });
  }

  function applyContextUI(ctx) {
    var personalBtn = document.getElementById('context-personal');
    var officeBtn = document.getElementById('context-office');
    if (personalBtn) {
      personalBtn.classList.toggle('active', ctx === 'personal');
      personalBtn.setAttribute('aria-pressed', ctx === 'personal');
    }
    if (officeBtn) {
      officeBtn.classList.toggle('active', ctx === 'office');
      officeBtn.setAttribute('aria-pressed', ctx === 'office');
    }
  }

  function initContext() {
    var personalBtn = document.getElementById('context-personal');
    var officeBtn = document.getElementById('context-office');
    applyContextUI(getContext());
    function switchContext(ctx) {
      if (ctx !== 'personal' && ctx !== 'office') return;
      setContext(ctx);
      applyContextUI(ctx);
      updateSummary();
      renderTransactionList();
      var chartTab = document.querySelector('.chart-tab.active');
      if (typeof Chart !== 'undefined' && chartTab) renderChart(chartTab.dataset.period);
    }
    if (personalBtn) personalBtn.addEventListener('click', function () { switchContext('personal'); });
    if (officeBtn) officeBtn.addEventListener('click', function () { switchContext('office'); });
  }

  function getUserId() {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  }

  function getContext() {
    try {
      var c = localStorage.getItem(CONTEXT_KEY);
      return (c === 'office' || c === 'personal') ? c : 'personal';
    } catch (e) {
      return 'personal';
    }
  }

  function setContext(ctx) {
    try {
      if (ctx === 'office' || ctx === 'personal') {
        localStorage.setItem(CONTEXT_KEY, ctx);
      }
    } catch (e) {}
  }

  function getStorageKey() {
    return DATA_KEY_PREFIX + getUserId() + '_' + getContext();
  }

  function getTransactions() {
    try {
      var key = getStorageKey();
      var raw = localStorage.getItem(key);
      if (getContext() === 'personal' && !raw) {
        var legacyKey = DATA_KEY_PREFIX + getUserId();
        var legacy = localStorage.getItem(legacyKey);
        if (legacy) {
          localStorage.setItem(key, legacy);
          localStorage.removeItem(legacyKey);
          raw = legacy;
        }
      }
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function saveTransactions(list) {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(list));
    } catch (err) {}
  }

  function parseAmount(val) {
    if (val === null || val === undefined) return 0;
    var s = String(val).replace(/,/g, '').trim();
    var n = parseFloat(s, 10);
    return isNaN(n) ? 0 : n;
  }

  function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function updateCategoryRequired() {
    var incomeChecked = document.getElementById('type-income') && document.getElementById('type-income').checked;
    var incomeSelect = document.getElementById('category-income');
    var expenseSelect = document.getElementById('category-expense');
    if (incomeSelect) incomeSelect.required = !!incomeChecked;
    if (expenseSelect) expenseSelect.required = !incomeChecked;
  }

  function getSelectedCategory() {
    var incomeChecked = document.getElementById('type-income') && document.getElementById('type-income').checked;
    var incomeSelect = document.getElementById('category-income');
    var expenseSelect = document.getElementById('category-expense');
    if (incomeChecked && incomeSelect) return incomeSelect.value;
    if (expenseSelect) return expenseSelect.value;
    return '';
  }

  function getFilterParams() {
    var periodEl = document.getElementById('filter-period');
    var typeEl = document.getElementById('filter-type');
    var fromEl = document.getElementById('filter-date-from');
    var toEl = document.getElementById('filter-date-to');
    var period = periodEl ? periodEl.value : 'all';
    var params = {
      period: period,
      type: typeEl ? typeEl.value : 'all'
    };
    if (period === 'custom') {
      params.dateFrom = fromEl && fromEl.value ? fromEl.value : '';
      params.dateTo = toEl && toEl.value ? toEl.value : '';
    }
    return params;
  }

  function filterTransactions(list, params) {
    var out = list.slice();
    var now = new Date();

    if (params.period === 'custom' && (params.dateFrom || params.dateTo)) {
      var fromStr = params.dateFrom;
      var toStr = params.dateTo;
      var startDate = null;
      var endDate = null;
      if (fromStr) {
        startDate = new Date(fromStr);
        startDate.setHours(0, 0, 0, 0);
      }
      if (toStr) {
        endDate = new Date(toStr);
        endDate.setHours(23, 59, 59, 999);
      }
      if (startDate && endDate && startDate > endDate) {
        var swap = fromStr;
        fromStr = toStr;
        toStr = swap;
        startDate = new Date(fromStr);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(toStr);
        endDate.setHours(23, 59, 59, 999);
      }
      out = out.filter(function (t) {
        var d = new Date(t.date);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });
    } else if (params.period !== 'all' && params.period !== 'custom') {
      var start = new Date(now);
      if (params.period === 'week') {
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
      } else if (params.period === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
      } else if (params.period === 'year') {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
      }
      out = out.filter(function (t) { return new Date(t.date) >= start; });
    }

    if (params.type !== 'all') {
      out = out.filter(function (t) { return t.type === params.type; });
    }

    return out.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  }

  function renderTransactionList() {
    const list = getTransactions();
    const params = getFilterParams();
    const filtered = filterTransactions(list, params);
    const container = document.getElementById('transaction-list');
    const emptyEl = document.getElementById('empty-state');

    container.innerHTML = '';
    if (filtered.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    filtered.forEach(function (t) {
      var li = document.createElement('li');
      li.className = 'transaction-item ' + t.type;
      li.dataset.id = t.id;
      li.innerHTML =
        '<div class="left">' +
          '<span class="category"><span class="category-icon" aria-hidden="true">' + getCategoryIcon(t.category) + '</span> ' + escapeHtml(t.category) + '</span>' +
          '<span class="date">' + formatDate(t.date) + (t.mode === 'online' ? ' · Online' : ' · Cash') + '</span>' +
        '</div>' +
        '<span class="amount">' + (t.type === 'income' ? '+' : '-') + formatCurrency(t.amount) + '</span>' +
        '<div class="item-actions">' +
          '<button type="button" class="edit-btn" title="Edit" aria-label="Edit transaction"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
          '<button type="button" class="delete-btn" title="Delete" aria-label="Delete transaction">×</button>' +
        '</div>';
      li.querySelector('.edit-btn').addEventListener('click', function () { openTransactionForEdit(t); });
      li.querySelector('.delete-btn').addEventListener('click', function () { deleteTransaction(t.id); });
      container.appendChild(li);
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function updateSummary() {
    var list = getTransactions();
    var income = 0, expense = 0;
    var incomeCount = 0, expenseCount = 0;
    list.forEach(function (t) {
      var type = (t.type && String(t.type).toLowerCase()) || '';
      var amt = parseAmount(t.amount);
      if (type === 'income') {
        income += amt;
        incomeCount++;
      } else {
        expense += amt;
        expenseCount++;
      }
    });
    var balance = income - expense;

    var totalIncomeEl = document.getElementById('total-income');
    var totalExpenseEl = document.getElementById('total-expense');
    var balanceEl = document.getElementById('balance');
    var incomeCountEl = document.getElementById('income-count');
    var expenseCountEl = document.getElementById('expense-count');
    if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(income);
    if (totalExpenseEl) totalExpenseEl.textContent = formatCurrency(expense);
    if (incomeCountEl) incomeCountEl.textContent = incomeCount;
    if (expenseCountEl) expenseCountEl.textContent = expenseCount;
    if (balanceEl) {
      balanceEl.textContent = formatCurrency(Math.abs(balance));
      balanceEl.classList.remove('positive', 'negative');
      if (balance >= 0) balanceEl.classList.add('positive');
      else balanceEl.classList.add('negative');
    }
  }

  let chartInstance = null;

  function getChartData(period) {
    const list = getTransactions();
    const now = new Date();
    let labels = [];
    let incomeData = [];
    let expenseData = [];

    if (period === 'weekly') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        labels.push(days[d.getDay()] + ' ' + d.getDate());
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);
        incomeData.push(
          list.filter(t => t.type === 'income' && inRange(t.date, dayStart, dayEnd))
            .reduce((s, t) => s + Number(t.amount), 0)
        );
        expenseData.push(
          list.filter(t => t.type === 'expense' && inRange(t.date, dayStart, dayEnd))
            .reduce((s, t) => s + Number(t.amount), 0)
        );
      }
    } else if (period === 'monthly') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        incomeData.push(
          list.filter(t => t.type === 'income' && inRange(t.date, monthStart, monthEnd))
            .reduce((s, t) => s + Number(t.amount), 0)
        );
        expenseData.push(
          list.filter(t => t.type === 'expense' && inRange(t.date, monthStart, monthEnd))
            .reduce((s, t) => s + Number(t.amount), 0)
        );
      }
    } else {
      const startYear = now.getFullYear() - 4;
      for (let y = startYear; y <= now.getFullYear(); y++) {
        labels.push(String(y));
        const yearStart = new Date(y, 0, 1);
        const yearEnd = new Date(y, 11, 31, 23, 59, 59, 999);
        incomeData.push(
          list.filter(t => t.type === 'income' && inRange(t.date, yearStart, yearEnd))
            .reduce((s, t) => s + Number(t.amount), 0)
        );
        expenseData.push(
          list.filter(t => t.type === 'expense' && inRange(t.date, yearStart, yearEnd))
            .reduce((s, t) => s + Number(t.amount), 0)
        );
      }
    }

    return { labels, incomeData, expenseData };
  }

  function inRange(dateStr, start, end) {
    const d = new Date(dateStr);
    return d >= start && d <= end;
  }

  function renderChart(period) {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('chart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { labels, incomeData, expenseData } = getChartData(period);

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: '#22c55e',
            borderWidth: 1
          },
          {
            label: 'Expense',
            data: expenseData,
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: '#ef4444',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.2,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', usePointStyle: true }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#94a3b8', maxRotation: 45, maxTicksLimit: 10 }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#94a3b8', callback: function (v) { return '₹' + v; } }
          }
        }
      }
    });
  }

  function addTransaction(data) {
    try {
      var list = getTransactions();
      var id = 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      var type = (data.type && String(data.type).toLowerCase()) || 'expense';
      var mode = (data.mode && String(data.mode).toLowerCase()) || 'cash';
      list.push({
        id: id,
        type: type,
        amount: parseAmount(data.amount),
        category: data.category || '',
        date: data.date || todayStr(),
        mode: mode === 'online' ? 'online' : 'cash',
        note: (data.note || '').trim()
      });
      saveTransactions(list);
      updateSummary();
      renderTransactionList();
      var chartTab = document.querySelector('.chart-tab.active');
      if (typeof Chart !== 'undefined' && chartTab) renderChart(chartTab.dataset.period);
    } catch (err) {
      updateSummary();
    }
  }

  function deleteTransaction(id) {
    var list = getTransactions().filter(function (t) { return t.id !== id; });
    saveTransactions(list);
    updateSummary();
    renderTransactionList();
    var chartTab = document.querySelector('.chart-tab.active');
    if (typeof Chart !== 'undefined' && chartTab) renderChart(chartTab.dataset.period);
  }

  function updateTransaction(id, data) {
    var list = getTransactions();
    var idx = list.findIndex(function (t) { return t.id === id; });
    if (idx === -1) return;
    var type = (data.type && String(data.type).toLowerCase()) || 'expense';
    var mode = (data.mode && String(data.mode).toLowerCase()) === 'online' ? 'online' : 'cash';
    list[idx] = {
      id: id,
      type: type,
      amount: parseAmount(data.amount),
      category: data.category || '',
      date: data.date || todayStr(),
      mode: mode,
      note: (data.note || '').trim()
    };
    saveTransactions(list);
    updateSummary();
    renderTransactionList();
    var chartTab = document.querySelector('.chart-tab.active');
    if (typeof Chart !== 'undefined' && chartTab) renderChart(chartTab.dataset.period);
  }

  function openTransactionForEdit(t) {
    openingForEdit = true;
    editingTransactionId = t.id;
    var amountEl = document.getElementById('amount');
    var dateEl = document.getElementById('date');
    var noteEl = document.getElementById('note');
    if (amountEl) amountEl.value = String(t.amount);
    if (dateEl) dateEl.value = (t.date || '').slice(0, 10);
    if (noteEl) noteEl.value = t.note || '';
    var incomeRadio = document.getElementById('type-income');
    var expenseRadio = document.getElementById('type-expense');
    if (t.type === 'income') {
      if (incomeRadio) incomeRadio.checked = true;
      var incomeSelect = document.getElementById('category-income');
      if (incomeSelect) incomeSelect.value = t.category || '';
    } else {
      if (expenseRadio) expenseRadio.checked = true;
      var expenseSelect = document.getElementById('category-expense');
      if (expenseSelect) expenseSelect.value = t.category || '';
    }
    var modeOnline = document.getElementById('mode-online');
    var modeCash = document.getElementById('mode-cash');
    if (t.mode === 'online') {
      if (modeOnline) modeOnline.checked = true;
    } else {
      if (modeCash) modeCash.checked = true;
    }
    updateCategoryRequired();
    switchModule('add');
  }

  function formatAmountForPdf(amount, isIncome) {
    var n = parseAmount(amount);
    var s = n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (isIncome ? '+' : '-') + ' Rs ' + s;
  }

  function exportPdf() {
    var list = getTransactions();
    var params = getFilterParams();
    var filtered = filterTransactions(list, params);

    if (typeof jspdf === 'undefined') {
      alert('PDF library not loaded. Please try again (online once to cache).');
      return;
    }

    var now = new Date();
    var pdfDateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    var pdfFileName = pdfDateStr + '_TransactionHistory.pdf';

    var jsPDFLib = jspdf;
    var doc = new jsPDFLib.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var pageW = doc.internal.pageSize.getWidth();
    var y = 20;

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('DhanTrack - Transactions', 14, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Generated: ' + new Date().toLocaleString('en-IN'), 14, y);
    y += 12;

    if (filtered.length === 0) {
      doc.text('No transactions to export.', 14, y);
      doc.save(pdfFileName);
      return;
    }

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    var headers = ['Date', 'Type', 'Mode', 'Category', 'Note', 'Amount'];
    var colW = [24, 18, 18, 32, 42, 28];
    var x = 14;
    headers.forEach(function (h, i) {
      doc.setFont(undefined, 'bold');
      doc.text(h, x, y);
      x += colW[i];
    });
    doc.setFont(undefined, 'normal');
    y += 7;

    var totalIncome = 0, totalExpense = 0;
    filtered.forEach(function (t) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      x = 14;
      doc.text(formatDate(t.date), x, y);
      x += colW[0];
      doc.text(t.type === 'income' ? 'Income' : 'Expense', x, y);
      x += colW[1];
      doc.text((t.mode === 'online' ? 'Online' : 'Cash'), x, y);
      x += colW[2];
      doc.text(String(t.category || '').slice(0, 18), x, y);
      x += colW[3];
      doc.text(String(t.note || '').slice(0, 20), x, y);
      x += colW[4];
      doc.text(formatAmountForPdf(t.amount, t.type === 'income'), x, y);
      if (t.type === 'income') totalIncome += parseAmount(t.amount);
      else totalExpense += parseAmount(t.amount);
      y += 6;
    });

    y += 8;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Summary', 14, y);
    y += 7;
    doc.setFontSize(9);
    doc.text('Total Income:  Rs ' + totalIncome.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','), 14, y);
    y += 6;
    doc.text('Total Expense: Rs ' + totalExpense.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','), 14, y);
    y += 6;
    doc.text('Balance:       Rs ' + (totalIncome - totalExpense).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','), 14, y);

    doc.save(pdfFileName);
  }

  function initForm() {
    var dateEl = document.getElementById('date');
    if (dateEl) dateEl.value = todayStr();

    updateCategoryRequired();

    var form = document.getElementById('transaction-form');
    if (form) {
      form.addEventListener('change', function (e) {
        if (e.target && e.target.getAttribute('name') === 'type') {
          updateCategoryRequired();
        }
      });
    }
    document.addEventListener('budget-add-shown', function () {
      if (!openingForEdit) editingTransactionId = null;
      openingForEdit = false;
      updateCategoryRequired();
    });
    document.addEventListener('budget-overview-shown', function () {
      updateSummary();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') updateSummary();
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        try {
          var typeEl = document.querySelector('input[name="type"]:checked');
          var type = typeEl ? typeEl.value : '';
          var amountInput = document.getElementById('amount') && document.getElementById('amount').value;
          var category = getSelectedCategory();
          var date = document.getElementById('date') && document.getElementById('date').value;
          var note = (document.getElementById('note') && document.getElementById('note').value) || '';
          if (!amountInput || !category || !date) return;
          var amountNum = parseAmount(amountInput);
          if (amountNum <= 0) return;
          var txType = (type && String(type).toLowerCase()) || 'expense';
          var modeEl = document.querySelector('input[name="mode"]:checked');
          var modeVal = modeEl ? modeEl.value : 'cash';
          var payload = { type: txType, amount: amountNum, category: category, date: date, mode: modeVal, note: note };
          if (editingTransactionId) {
            updateTransaction(editingTransactionId, payload);
            editingTransactionId = null;
          } else {
            addTransaction(payload);
          }
          this.reset();
          var d = document.getElementById('date');
          if (d) d.value = todayStr();
          var incomeRadio = document.getElementById('type-income');
          if (incomeRadio) incomeRadio.checked = true;
          var modeCash = document.getElementById('mode-cash');
          if (modeCash) modeCash.checked = true;
          updateCategoryRequired();
          updateSummary();
        } catch (err) {
          updateSummary();
        }
      });
    }
  }

  function initChartTabs() {
    document.querySelectorAll('.chart-tab').forEach(tab => {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        renderChart(this.dataset.period);
      });
    });
  }

  function toggleCustomRangeVisibility() {
    var fp = document.getElementById('filter-period');
    var wrap = document.getElementById('filter-custom-range');
    if (!wrap) return;
    if (fp && fp.value === 'custom') {
      wrap.classList.remove('hidden');
    } else {
      wrap.classList.add('hidden');
    }
  }

  function initFilters() {
    var fp = document.getElementById('filter-period');
    var ft = document.getElementById('filter-type');
    var fromEl = document.getElementById('filter-date-from');
    var toEl = document.getElementById('filter-date-to');
    function refresh() {
      toggleCustomRangeVisibility();
      renderTransactionList();
    }
    if (fp) fp.addEventListener('change', refresh);
    if (ft) ft.addEventListener('change', renderTransactionList);
    if (fromEl) fromEl.addEventListener('change', renderTransactionList);
    if (toEl) toEl.addEventListener('change', renderTransactionList);
    toggleCustomRangeVisibility();
  }

  function initPdf() {
    var btn = document.getElementById('export-pdf');
    if (btn) btn.addEventListener('click', exportPdf);
  }

  function switchModule(moduleId) {
    var nav = document.querySelector('.nav-modules');
    if (!nav) return;
    nav.querySelectorAll('.nav-module').forEach(function (btn) {
      var isActive = btn.getAttribute('data-module') === moduleId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });
    document.querySelectorAll('.module-panel').forEach(function (panel) {
      var isActive = panel.getAttribute('data-module') === moduleId;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    });
    if (moduleId === 'charts') {
      var activeTab = document.querySelector('.chart-tab.active');
      if (typeof Chart !== 'undefined') {
        renderChart(activeTab ? activeTab.dataset.period : 'weekly');
      }
    }
  }

  function initModules() {
    var navContainer = document.querySelector('.nav-modules');
    if (!navContainer) return;
    navContainer.addEventListener('click', function (e) {
      var t = e.target;
      var btn = (t && typeof t.closest === 'function') ? t.closest('.nav-module') : null;
      if (!btn) return;
      var moduleId = btn.getAttribute('data-module');
      if (moduleId) switchModule(moduleId);
    });
  }

  function init() {
    initTheme();
    initContext();
    try {
      getUserId();
    } catch (err) {}
    try {
      initModules();
    } catch (err) {}
    try {
      initForm();
    } catch (err) {}
    try {
      initChartTabs();
    } catch (err) {}
    try {
      initFilters();
    } catch (err) {}
    try {
      initPdf();
    } catch (err) {}
    try {
      updateSummary();
      renderTransactionList();
    } catch (err) {}
    try {
      if (typeof Chart !== 'undefined') {
        renderChart('weekly');
      }
    } catch (err) {}
  }

  function registerSw() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    }
  }

  function updateOfflineBanner() {
    const el = document.getElementById('offline-banner');
    if (el) el.classList.toggle('show', !navigator.onLine);
  }
  window.addEventListener('online', updateOfflineBanner);
  window.addEventListener('offline', updateOfflineBanner);
  updateOfflineBanner();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
      registerSw();
    });
  } else {
    init();
    registerSw();
  }
})();
