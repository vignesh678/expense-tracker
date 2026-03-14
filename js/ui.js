/* ============================================================
   ui.js — DOM rendering & event handlers
   ============================================================ */

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const UI = {
  /* ── Toast Notifications ── */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  },

  /* ── Populate Category Dropdowns ── */
  populateCategoryDropdowns() {
    const selects = [
      document.getElementById('expense-category'),
      document.getElementById('edit-category'),
    ];
    const cats = Storage.getCategories();
    selects.forEach(sel => {
      if (!sel) return;
      const current = sel.value;
      sel.innerHTML = '<option value="">Select category</option>';
      cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.icon} ${cat.name}`;
        sel.appendChild(opt);
      });
      if (current) sel.value = current;
    });
  },

  /* ── Format currency ── */
  formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  /* ── Summary Cards ── */
  renderSummaryCards(containerId, summary) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const topCat = summary.topCategory
      ? Storage.getCategoryById(summary.topCategory)
      : null;

    const avg = summary.count > 0 ? summary.total / summary.count : 0;

    container.innerHTML = `
      <div class="summary-card total animate-in">
        <div class="card-icon">💰</div>
        <div class="card-label">Total Spent</div>
        <div class="card-value">${this.formatCurrency(summary.total)}</div>
      </div>
      <div class="summary-card top-cat animate-in">
        <div class="card-icon">${topCat ? topCat.icon : '—'}</div>
        <div class="card-label">Top Category</div>
        <div class="card-value">${topCat ? topCat.name : 'None'}</div>
      </div>
      <div class="summary-card transactions animate-in">
        <div class="card-icon">📊</div>
        <div class="card-label">Transactions</div>
        <div class="card-value">${summary.count}</div>
      </div>
      <div class="summary-card avg animate-in">
        <div class="card-icon">⚡</div>
        <div class="card-label">Avg / Transaction</div>
        <div class="card-value">${this.formatCurrency(avg)}</div>
      </div>
    `;
  },

  /* ── Category Badge ── */
  categoryBadge(catId) {
    const cat = Storage.getCategoryById(catId);
    return `<span class="category-badge ${cat.cssClass}">${cat.icon} ${cat.name}</span>`;
  },

  /* ── Expense Table ── */
  renderExpenseTable(containerId, expenses, showActions = true) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (expenses.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-text">No expenses recorded</div>
          <div class="empty-sub">Start adding expenses to see them here</div>
        </div>
      `;
      return;
    }

    const actionsHeader = showActions ? '<th>Actions</th>' : '';
    const rows = expenses.map(e => {
      const date = new Date(e.date);
      const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const actions = showActions
        ? `<td>
            <div class="actions-cell">
              <button class="btn-icon edit-btn" data-id="${e.id}" title="Edit">✎</button>
              <button class="btn-icon delete delete-btn" data-id="${e.id}" title="Delete">✕</button>
            </div>
          </td>`
        : '';
      return `<tr>
        <td>${dateStr}</td>
        <td>${this.categoryBadge(e.category)}</td>
        <td class="amount-cell">${this.formatCurrency(e.amount)}</td>
        <td>${e.note || '—'}</td>
        ${actions}
      </tr>`;
    }).join('');

    container.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Note</th>
              ${actionsHeader}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    if (showActions) {
      container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => UI.openEditModal(btn.dataset.id));
      });
      container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => UI.deleteExpense(btn.dataset.id));
      });
    }
  },

  /* ── Recent Transactions (dashboard, limited) ── */
  renderRecentTransactions(expenses) {
    const recent = expenses.slice(0, 5);
    this.renderExpenseTable('recent-transactions', recent, true);
  },

  /* ── Category Breakdown Table (report) ── */
  renderCategoryBreakdown(containerId, byCategory, total) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-text">No data</div></div>';
      return;
    }

    const rows = entries.map(([catId, amount]) => {
      const cat = Storage.getCategoryById(catId);
      const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
      const barWidth = total > 0 ? (amount / total) * 100 : 0;
      return `<tr>
        <td>${this.categoryBadge(catId)}</td>
        <td class="amount-cell">${this.formatCurrency(amount)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;">
              <div style="width:${barWidth}%;height:100%;background:${Storage.getCategoryColor(catId)};border-radius:3px;transition:width 0.5s ease;"></div>
            </div>
            <span style="font-size:0.82rem;color:var(--text-secondary);min-width:45px;text-align:right;">${pct}%</span>
          </div>
        </td>
      </tr>`;
    }).join('');

    container.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Category</th><th>Amount</th><th>Share</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  /* ── Edit Modal ── */
  openEditModal(id) {
    const expenses = Storage.getAllExpenses();
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    document.getElementById('edit-id').value = expense.id;
    DatePicker.setFromISO('edit-date', expense.date);
    document.getElementById('edit-category').value = expense.category;
    document.getElementById('edit-amount').value = expense.amount;
    document.getElementById('edit-note').value = expense.note || '';

    document.getElementById('edit-modal').classList.add('active');
  },

  closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
  },

  /* ── Delete Expense ── */
  deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    Storage.deleteExpense(id);
    this.showToast('Expense deleted', 'success');
    App.refreshCurrentView();
  },

  /* ── Month label helper ── */
  monthLabel(month, year) {
    return `${MONTH_NAMES[month]} ${year}`;
  },

  /* ── Update all month labels ── */
  updateMonthLabels(month, year) {
    const label = this.monthLabel(month, year);
    ['dash-month-label', 'list-month-label', 'report-month-label'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = label;
    });
  },
};
