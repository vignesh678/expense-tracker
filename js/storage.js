/* ============================================================
   storage.js — localStorage CRUD for expenses
   ============================================================ */

const STORAGE_KEY = 'expenseX_data';

const CATEGORIES = [
  { id: 'groceries',    name: 'Groceries',        icon: '🛒', cssClass: 'cat-groceries' },
  { id: 'transport',    name: 'Transport',         icon: '🚗', cssClass: 'cat-transport' },
  { id: 'stocks',       name: 'Stocks',            icon: '📈', cssClass: 'cat-stocks' },
  { id: 'mutual-funds', name: 'Mutual Funds',      icon: '💹', cssClass: 'cat-mutual-funds' },
  { id: 'dining',       name: 'Dining',            icon: '🍽️', cssClass: 'cat-dining' },
  { id: 'entertainment',name: 'Entertainment',     icon: '🎬', cssClass: 'cat-entertainment' },
  { id: 'bills',        name: 'Bills & Utilities', icon: '💡', cssClass: 'cat-bills' },
  { id: 'health',       name: 'Health',            icon: '🏥', cssClass: 'cat-health' },
  { id: 'shopping',     name: 'Shopping',          icon: '🛍️', cssClass: 'cat-shopping' },
  { id: 'other',        name: 'Other',             icon: '📌', cssClass: 'cat-other' },
];

const CATEGORY_COLORS = {
  'groceries':     '#39ff14',
  'transport':     '#00f0ff',
  'stocks':        '#ffd700',
  'mutual-funds':  '#a855f7',
  'dining':        '#ff6b2b',
  'entertainment': '#ff00e5',
  'bills':         '#3b82f6',
  'health':        '#ec4899',
  'shopping':      '#fb923c',
  'other':         '#8888aa',
};

const Storage = {
  _getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  _saveData(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  },

  addExpense({ date, category, amount, note }) {
    const expenses = this._getData();
    const expense = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      date,
      category,
      amount: parseFloat(amount),
      note: note || '',
      createdAt: new Date().toISOString(),
    };
    expenses.push(expense);
    this._saveData(expenses);
    return expense;
  },

  getExpenses(month, year) {
    const all = this._getData();
    return all.filter(exp => {
      const d = new Date(exp.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getAllExpenses() {
    return this._getData().sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  deleteExpense(id) {
    const expenses = this._getData().filter(exp => exp.id !== id);
    this._saveData(expenses);
  },

  editExpense(id, updates) {
    const expenses = this._getData();
    const idx = expenses.findIndex(exp => exp.id === id);
    if (idx !== -1) {
      expenses[idx] = { ...expenses[idx], ...updates, amount: parseFloat(updates.amount) };
      this._saveData(expenses);
      return expenses[idx];
    }
    return null;
  },

  getCategories() {
    return CATEGORIES;
  },

  getCategoryById(id) {
    return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
  },

  getCategoryColor(id) {
    return CATEGORY_COLORS[id] || '#8888aa';
  },

  getMonthlySummary(month, year) {
    const expenses = this.getExpenses(month, year);
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;

    const byCategory = {};
    expenses.forEach(e => {
      if (!byCategory[e.category]) byCategory[e.category] = 0;
      byCategory[e.category] += e.amount;
    });

    let topCategory = null;
    let topAmount = 0;
    Object.entries(byCategory).forEach(([cat, amt]) => {
      if (amt > topAmount) { topCategory = cat; topAmount = amt; }
    });

    const byDay = {};
    expenses.forEach(e => {
      const day = new Date(e.date).getDate();
      if (!byDay[day]) byDay[day] = 0;
      byDay[day] += e.amount;
    });

    return { total, count, byCategory, topCategory, topAmount, byDay, expenses };
  },
};
